/* three とアドオンを public/lab/vendor/three/ へ複製する。
   -----------------------------------------------------------------
   このページは CDN の importmap で three を読んでいたので、
   CDN が塞がれた回線・社内プロキシ・オフラインでは
   モジュールが1つも読めず、ページが黒いまま何も出なかった。
   自前で配ればその依存が消える。
   examples/jsm は使うものだけを追跡して複製する(丸ごとだと608KB、
   実際に要るのは12ファイル111KB)。
   使い方: node scripts/vendor-three.mjs  (three を上げた時に走らせ直す) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TM   = path.join(ROOT, 'node_modules/three');
const OUT  = path.join(ROOT, 'public/lab/vendor/three');

if (!fs.existsSync(TM)) { console.error('node_modules/three が無い'); process.exit(2); }
const version = JSON.parse(fs.readFileSync(path.join(TM, 'package.json'), 'utf8')).version;

const ENTRIES = [
  'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js',
  'postprocessing/ShaderPass.js',     'postprocessing/UnrealBloomPass.js',
  'postprocessing/OutputPass.js',     'postprocessing/SMAAPass.js',
  'postprocessing/Pass.js',
];

/* 相対 import を辿って実際に要るものだけ集める */
const seen = new Set();
const walk = (rel) => {
  if (seen.has(rel)) return;
  seen.add(rel);
  const src = fs.readFileSync(path.join(TM, 'examples/jsm', rel), 'utf8');
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;      // 'three' は importmap が解決する
    walk(path.normalize(path.join(path.dirname(rel), spec)));
  }
};
ENTRIES.forEach(walk);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'build'), { recursive: true });
for (const f of ['three.module.js', 'three.core.js']) {
  fs.copyFileSync(path.join(TM, 'build', f), path.join(OUT, 'build', f));
}
let bytes = 0;
for (const rel of [...seen].sort()) {
  const dst = path.join(OUT, 'addons', rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(TM, 'examples/jsm', rel), dst);
  bytes += fs.statSync(dst).size;
}
fs.copyFileSync(path.join(TM, 'LICENSE'), path.join(OUT, 'LICENSE'));
fs.writeFileSync(path.join(OUT, 'VERSION'), `three ${version}\naddons: ${[...seen].sort().join(', ')}\n`);

const core = ['three.module.js', 'three.core.js']
  .reduce((n, f) => n + fs.statSync(path.join(OUT, 'build', f)).size, 0);
console.log(`three ${version} を複製: build ${(core/1024|0)}KB + addons ${seen.size}ファイル ${(bytes/1024|0)}KB`);
