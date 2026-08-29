/**
 * 静的書き出し(out/)のGitHub Pages向け後処理。
 * - CSS内の url(/...) 絶対パスに NEXT_PUBLIC_BASE_PATH を付与
 *   (Next.jsのbasePathはCSSファイルの中身までは書き換えないため)
 * - Jekyll処理を無効化する .nojekyll を配置
 * - 旧URL(/engine/)に meta refresh を差し込んで / へ転送
 *   (静的エクスポートでは next.config の redirects が効かないため)
 * - 制作用のファイルを out/ から取り除く(下記)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require("postcss");
const cssnanoSimple = require("next/dist/compiled/cssnano-simple");
const nextSwc = require("next/dist/build/swc");

const OUT = "out";

/* public/migiwa/*.html は Next のコンパイル対象外なので、インラインCSS/JSが
   制作用のコメント・空白・長い識別子を含んだまま out/ へコピーされる。
   元ファイルは調整と検証のため読みやすい状態を保ち、配信物だけを Next が
   既に持つSWC/cssnanoで縮める。新しい依存は追加しない。 */
async function minifyMigiwaHtml(file, { moduleScript = false } = {}) {
  if (!existsSync(file)) return null;

  const before = readFileSync(file, "utf8");
  let after = before;
  const style = after.match(/<style>([\s\S]*?)<\/style>/);
  if (style) {
    const result = await postcss([
      cssnanoSimple({ colormin: false }, postcss),
    ]).process(style[1], { from: undefined });
    after = after.replace(style[0], () => `<style>${result.css}</style>`);
  }

  if (moduleScript) {
    const script = after.match(/<script type="module">([\s\S]*?)<\/script>/);
    if (script) {
      await nextSwc.loadBindings();
      const result = await nextSwc.minify(script[1], {
        compress: true,
        mangle: true,
        module: true,
      });
      after = after.replace(script[0], () => `<script type="module">${result.code}</script>`);
    }
  }

  const saved = Buffer.byteLength(before) - Buffer.byteLength(after);
  /* SWCは既に圧縮済みの入力を再圧縮すると、末尾の改行差などで数byteだけ
     増えることがある。その場合は現状を保つ。大きく増えた時だけ異常とする。 */
  if (saved < -64) {
    throw new Error(`圧縮後のHTMLが増加しました: ${file} (${saved} bytes)`);
  }
  if (saved < 0) return 0;
  writeFileSync(file, after);
  return saved;
}

{
  const files = [
    [join(OUT, "migiwa", "index.html"), { moduleScript: true }],
    [join(OUT, "migiwa", "works", "index.html"), {}],
  ];
  let saved = 0;
  let count = 0;
  for (const [file, options] of files) {
    const bytes = await minifyMigiwaHtml(file, options);
    if (bytes === null) continue;
    saved += bytes;
    count++;
  }
  console.log(`汀ノ庭の配信HTMLを圧縮: ${count}件 / ${saved.toLocaleString()} bytes削減`);
}

/* ★ public/ に置いたものは Next が out/ へ丸ごう写すので、制作用のファイルも
   そのまま公開される。実際、公開URLで次が誰でも読める状態になっていた:
     migiwa/公開前チェック.md … 未確定の約束52件と「仮でいいから草案を」という経緯
     migiwa/copy.json        … 本文の生成元。査読への反論コメントと構成の意図つき
     migiwa/NOTES.md         … 制作メモ
     migiwa/site.config.js   … PENDING(ドメイン・宛先・訪問範囲)の理由つき
   いずれも実行時には1つも読んでいない(ビルド時に fs で読むだけ)ので、
   配信物からは外す。リポジトリ側には残るので作業には影響しない。 */
const BUILD_ONLY = [
  "migiwa/copy.json",
  "migiwa/site.config.js",
  "migiwa/README.md",
  "migiwa/NOTES.md",
  "migiwa/公開前チェック.md",
  "migiwa/.content.html",
  "migiwa/.works.html",
];
{
  let dropped = 0;
  for (const rel of BUILD_ONLY) {
    const f = join(OUT, rel);
    if (!existsSync(f)) continue;
    rmSync(f, { force: true });
    dropped++;
  }
  console.log(`制作用ファイルを配信物から除外: ${dropped}件`);
}
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

if (basePath) {
  let patched = 0;
  for (const file of walk(OUT).filter((f) => f.endsWith(".css"))) {
    const source = readFileSync(file, "utf-8");
    /* 既に basePath が付いているものは飛ばす(このスクリプトを同じ out/ に
       2回かけても二重に付かないようにする。付くと /opus093-site/opus093-site/… で404) */
    const result = source.replaceAll(
      /url\((['"]?)\/(?!$|\/)/g,
      (m, q, offset, str) => (str.startsWith(`${basePath}/`, offset + m.length - 1) ? m : `url(${q}${basePath}/`),
    );
    if (result !== source) {
      writeFileSync(file, result);
      patched += 1;
    }
  }
  console.log(`postprocess-pages: basePath=${basePath} patched ${patched} css file(s)`);
} else {
  console.log("postprocess-pages: no basePath, css untouched");
}

/* 旧 /engine → / の転送。<head> の先頭に meta refresh を入れる。
   JS無効でも転送され、クローラにも canonical(=/) と合わせて意図が伝わる。 */
const movedPage = join(OUT, "engine", "index.html");
if (existsSync(movedPage)) {
  const html = readFileSync(movedPage, "utf-8");
  const refresh = `<meta http-equiv="refresh" content="0; url=${basePath}/">`;
  if (!html.includes("http-equiv=\"refresh\"")) {
    writeFileSync(movedPage, html.replace("<head>", `<head>${refresh}`));
    console.log("postprocess-pages: /engine/ に meta refresh を追加");
  }
} else {
  console.log("postprocess-pages: out/engine/index.html が無いので転送はスキップ");
}

writeFileSync(join(OUT, ".nojekyll"), "");
console.log("postprocess-pages: wrote out/.nojekyll");
