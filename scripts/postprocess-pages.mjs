/**
 * 静的書き出し(out/)のGitHub Pages向け後処理。
 * - CSS内の url(/...) 絶対パスに NEXT_PUBLIC_BASE_PATH を付与
 *   (Next.jsのbasePathはCSSファイルの中身までは書き換えないため)
 * - Jekyll処理を無効化する .nojekyll を配置
 * - 旧URL(/engine/)に meta refresh を差し込んで / へ転送
 *   (静的エクスポートでは next.config の redirects が効かないため)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
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
    const result = source.replaceAll(/url\((['"]?)\//g, `url($1${basePath}/`);
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
