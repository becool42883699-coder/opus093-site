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

const OUT = "out";

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
