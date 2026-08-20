#!/usr/bin/env node
/**
 * verify.mjs — public/lab/trexworks_umiatari_v6.html の自動検証
 *
 * 改良ループ(実装 → 検証 → 判定)の「検証」を担う。主観を挟まず、
 * 数値とスクリーンショットだけを artifacts/loop-NN/ に積む。
 *
 *   node scripts/verify.mjs                  # three は CDN から読む(通常)
 *   THREE_LOCAL=1 node scripts/verify.mjs    # node_modules の three を配信する
 *                                            # (CDNが遮断された環境用。差分は
 *                                            #  import map の URL のみ)
 *   node scripts/verify.mjs --view=mobile    # 390x844 で撮る
 *
 * 取得するもの:
 *   - console のエラー・警告を全件(シェーダのコンパイル失敗を含む)
 *   - WebGL context lost の発生有無
 *   - 起動後5秒間の平均FPS・最低FPS・DPR
 *   - 固定カメラ位置3点(水面/中層/最深部)のスクリーンショット
 *   - 各点の縮小ピクセル署名(前ループとの差分判定用)
 *
 * 出力は artifacts/loop-NN/ に連番。既存ディレクトリは上書きしない。
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = path.join(ROOT, 'public/lab/trexworks_umiatari_v6.html');
const ART  = path.join(ROOT, 'artifacts');

const argv     = process.argv.slice(2);
const VIEW     = (argv.find(a => a.startsWith('--view=')) || '--view=desktop').split('=')[1];
const LOCAL3   = process.env.THREE_LOCAL === '1';
/* 降格経路の検証用。--force=ldr / nodepth / both */
const FORCE    = (argv.find(a => a.startsWith('--force=')) || '').split('=')[1] || '';
const CHROME   = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const VIEWS = {
  desktop: { w: 1600, h: 900, dsf: 1, mobile: false },
  laptop:  { w: 1280, h: 800, dsf: 1, mobile: false },
  mobile:  { w: 390,  h: 844, dsf: 2, mobile: true  },
};
const V = VIEWS[VIEW] || VIEWS.desktop;

/* 撮影する3点。スクロール位置は進捗バーが目標値へ収まるまで待ってから撮る
   (減衰が効いているので、位置を代入した直後はまだカメラが動いている)。 */
const STOPS = [
  { name: 'surface', p: 0.00 },
  { name: 'mid',     p: 0.45 },
  { name: 'deep',    p: 0.96 },
];

/* ---------------- 配信ディレクトリを組む ---------------- */
const serveDir = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'verify-'));
let html = fs.readFileSync(SRC, 'utf8');

if (LOCAL3) {
  const tm = path.join(ROOT, 'node_modules/three');
  if (!fs.existsSync(tm)) { console.error('THREE_LOCAL=1 だが node_modules/three が無い'); process.exit(2); }
  const vb = path.join(serveDir, 'vendor/three/build');
  const vj = path.join(serveDir, 'vendor/three/examples/jsm');
  fs.mkdirSync(vb, { recursive: true });
  fs.mkdirSync(vj, { recursive: true });
  for (const f of ['three.module.js', 'three.core.js']) {
    fs.copyFileSync(path.join(tm, 'build', f), path.join(vb, f));
  }
  for (const d of ['postprocessing', 'shaders']) {
    fs.cpSync(path.join(tm, 'examples/jsm', d), path.join(vj, d), { recursive: true });
  }
  html = html
    .replace('https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js', '/vendor/three/build/three.module.js')
    .replace('https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/', '/vendor/three/examples/jsm/');
}
fs.writeFileSync(path.join(serveDir, 'index.html'), html);

const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(serveDir, rel);
  if (!file.startsWith(serveDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html?diag=1`
  + (FORCE ? `&force=${FORCE}` : '');

/* ---------------- 出力先 (連番・上書きしない) ---------------- */
fs.mkdirSync(ART, { recursive: true });
const prevLoops = fs.readdirSync(ART)
  .map(n => /^loop-(\d+)$/.exec(n)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
/* 降格検証は本流のループ番号を消費しない(比較対象にもしない) */
const loopNo = (prevLoops.at(-1) ?? 0) + 1;
/* 本流(desktop・降格なし)だけが loop-NN を名乗り、差分比較の対象になる。
   モバイルや降格検証は接尾辞を付けて番号を消費しない。 */
const suffix = [VIEW === 'desktop' ? '' : VIEW, FORCE].filter(Boolean).join('-');
const outDir = path.join(ART, `loop-${String(loopNo).padStart(2, '0')}${suffix ? '-' + suffix : ''}`);
fs.mkdirSync(outDir);

/* ---------------- 実行 ---------------- */
const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
});
const ctx = await browser.newContext({
  viewport: { width: V.w, height: V.h },
  deviceScaleFactor: V.dsf,
  isMobile: V.mobile, hasTouch: V.mobile,
  /* ヘッドレスChromiumの既定は reduce。演出が一切動かない状態を
     「正常」と誤判定しないよう、必ず明示する。 */
  reducedMotion: 'no-preference',
});
const page = await ctx.newPage();

const messages = [];
page.on('console', m => {
  const t = m.type();
  if (t === 'error' || t === 'warning') messages.push({ type: t, text: m.text().slice(0, 500) });
});
page.on('pageerror', e => messages.push({ type: 'pageerror', text: String(e.message).slice(0, 500) }));

await page.addInitScript(() => {
  window.__ctxLost = 0;
  addEventListener('webglcontextlost', () => { window.__ctxLost++; }, true);
});

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.classList.contains('ready'), { timeout: 60000 });

/* パス別コストの計測が終わるまで待つ(画面がちらつく区間なので撮影前に済ませる) */
await page.waitForFunction(() => window.__diag && window.__diag.cost, { timeout: 120000 }).catch(() => {});
/* FPSの計測窓(5秒)を満たす */
await page.waitForTimeout(5200);

const diag = await page.evaluate(() => ({
  fps: window.__diag.fps, dpr: window.__diag.dpr, frames: window.__diag.frames,
  cost: window.__diag.cost, caps: window.__diag.caps, render: window.__diag.render,
  tier: window.__diag.tier.name,
}));

/* 撮影中は診断オーバーレイを隠す(絵の判定を邪魔しないため) */
await page.addStyleTag({ content: '#diag{display:none!important}' });

/* 縮小したピクセル署名。PNGを復号せずに差分を取れるようにする。
   canvas の読み出しには preserveDrawingBuffer が要るので ?diag=1 で開いている。 */
const signature = async () => page.evaluate(() => {
  const cv = document.querySelector('#stage canvas');
  const t = document.createElement('canvas'); t.width = 64; t.height = 36;
  const c = t.getContext('2d');
  c.drawImage(cv, 0, 0, 64, 36);
  return Array.from(c.getImageData(0, 0, 64, 36).data);
});

const sigs = {};
const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (const stop of STOPS) {
  await page.evaluate(y => scrollTo(0, y), Math.round(maxScroll * stop.p));
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(500);
    const w = await page.evaluate(() => parseFloat(document.getElementById('diveFill').style.width) || 0);
    if (Math.abs(w - stop.p * 100) < 1.2) break;
  }
  await page.screenshot({ path: path.join(outDir, `${stop.name}.png`), timeout: 180000 });
  sigs[stop.name] = await signature();
}

const ctxLost = await page.evaluate(() => window.__ctxLost || 0);
await browser.close();
server.close();
fs.rmSync(serveDir, { recursive: true, force: true });

/* ---------------- 前ループとのピクセル差分 ---------------- */
fs.writeFileSync(path.join(outDir, 'sig.json'), JSON.stringify(sigs));
let diff = null;
if (prevLoops.length) {
  const prevSig = path.join(ART, `loop-${String(prevLoops.at(-1)).padStart(2, '0')}`, 'sig.json');
  if (fs.existsSync(prevSig)) {
    const prev = JSON.parse(fs.readFileSync(prevSig, 'utf8'));
    diff = {};
    for (const k of Object.keys(sigs)) {
      if (!prev[k]) { diff[k] = null; continue; }
      let d = 0;
      for (let i = 0; i < sigs[k].length; i++) d += Math.abs(sigs[k][i] - prev[k][i]);
      diff[k] = d;
    }
  }
}

/* ---------------- 判定 ---------------- */
const errors = messages.filter(m => m.type !== 'warning');
const changed = diff === null ? null : Object.values(diff).some(v => v === null || v > 0);
const verdict = {
  'console エラー 0件':      { pass: errors.length === 0, value: `${errors.length} 件 (warning ${messages.length - errors.length} 件)` },
  'context lost 0回':        { pass: ctxLost === 0, value: `${ctxLost} 回` },
  '前ループとの差分 ≠ 0':     { pass: changed === null ? null : changed, value: diff ? JSON.stringify(diff) : '初回(比較対象なし)' },
  'FPS 平均':                { pass: null, value: `${diag.fps.avg.toFixed(1)} (最低 ${diag.fps.min.toFixed(1)}, ${diag.frames} フレーム)` },
};

const report = { loop: loopNo, view: VIEW, url: BASE, diag, ctxLost, messages, diff, verdict };
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

console.log(`\n=== loop-${String(loopNo).padStart(2, '0')} (${VIEW} ${V.w}x${V.h}) ===`);
for (const [k, v] of Object.entries(verdict)) {
  const mark = v.pass === null ? '—' : (v.pass ? 'PASS' : 'FAIL');
  console.log(`  [${mark}] ${k}: ${v.value}`);
}
console.log(`  バッファ ${diag.render.hdr ? 'HalfFloat' : 'UnsignedByte(降格)'} / 深度 ${diag.render.depth ? '有効' : '無効(降格)'} / DPR ${diag.dpr}`);
if (diag.cost) console.log(`  コスト: シーン ${diag.cost.scene}ms / Bloom ${diag.cost.bloom}ms / ATMOS ${diag.cost.atmos}ms / その他 ${diag.cost.post}ms / 合計 ${diag.cost.total}ms`);
if (errors.length) { console.log('  --- エラー ---'); errors.slice(0, 10).forEach(m => console.log(`   ${m.type}: ${m.text}`)); }
console.log(`  → ${path.relative(ROOT, outDir)}/`);

process.exit(errors.length === 0 && ctxLost === 0 ? 0 : 1);
