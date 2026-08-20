#!/usr/bin/env node
/**
 * verify.mjs — public/lab/trexworks_umiatari_v6.html の自動検証
 *
 * 改良ループ(実装 → 検証 → 判定)の「検証」を担う。主観を挟まず、
 * 数値とスクリーンショットだけを artifacts/loop-NN/ に積む。
 *
 *   node scripts/verify.mjs                  # 1600x900
 *   node scripts/verify.mjs --view=mobile    # 390x844 で撮る
 *   node scripts/verify.mjs --view=iphone    # 390x664 dsf3(実機のSafariに近い)
 *   node scripts/verify.mjs --tier=high      # 端末判定を上書きして高品質の経路を通す
 *   node scripts/verify.mjs --force=ldr      # 降格経路(8bit / 深度テクスチャ無し)
 *
 * three はページの隣の vendor/ から読む。検証するファイルと公開する
 * ファイルは完全に同一(以前は import map の URL だけが違っていた)。
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
/* 検証機は hardwareConcurrency が小さく、既定では必ず low ティアになる。
   high 側だけにある経路(水面の映り込み)を確かめるには明示的に上げる。 */
const TIERPIN  = (argv.find(a => a.startsWith('--tier=')) || '').split('=')[1] || '';
/* 降格経路の検証用。--force=ldr / nodepth / both */
const FORCE    = (argv.find(a => a.startsWith('--force=')) || '').split('=')[1] || '';
const CHROME   = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const VIEWS = {
  desktop: { w: 1600, h: 900, dsf: 1, mobile: false },
  laptop:  { w: 1280, h: 800, dsf: 1, mobile: false },
  mobile:  { w: 390,  h: 844, dsf: 2, mobile: true  },
  /* 実機Safariは上下のUIぶん表示領域が低い。844だけで見ると
     HUDと3Dの重なりを見落とす(実際に見落とした)。 */
  iphone:  { w: 390,  h: 664, dsf: 3, mobile: true  },
  /* 利用者の実機の実測値(iOS 18.7 / Safari 26.6 / dPR 3.00)。
     390 より横に70px広く、縦も高い。想定だけで測らずここも通す。 */
  iphone2: { w: 459,  h: 869, dsf: 3, mobile: true  },
  /* 上のURLバーが出ている時の低い方 */
  iphone2s:{ w: 459,  h: 822, dsf: 3, mobile: true  },
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

/* git のコンフリクトマーカーが残ったまま配信・コミットされる事故を止める。
   一度これで公開版を落としている(stash pop の衝突を出力ごと捨てていた)。 */
{
  const bad = html.split('\n')
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(x => /^(<{7}|={7}|>{7})( |$)/.test(x.l));
  if (bad.length){
    console.error('コンフリクトマーカーが残っている:');
    bad.slice(0, 10).forEach(x => console.error(`  ${x.n}: ${x.l.slice(0, 60)}`));
    process.exit(3);
  }
}

/* three は自前配布になったので、URLの書き換えは一切しない。
   ページの隣にある vendor/ をそのまま並べて配る = 検証したものと
   公開するものが同一のファイルになる(以前は importmap だけが違った)。 */
{
  const v = path.join(path.dirname(SRC), 'vendor');
  if (!fs.existsSync(v)) {
    console.error('public/lab/vendor が無い。node scripts/vendor-three.mjs を先に走らせる');
    process.exit(2);
  }
  fs.cpSync(v, path.join(serveDir, 'vendor'), { recursive: true });
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
/* q=full で自動品質調整を止める。遅い環境だと梯子が底まで降りてしまい、
   毎回違う品質の絵を撮ることになって差分判定が意味を失う。 */
const BASE = `http://127.0.0.1:${server.address().port}/index.html?diag=1&q=full`
  + (FORCE ? `&force=${FORCE}` : '')
  + (TIERPIN ? `&tier=${TIERPIN}` : '');

/* ---------------- 出力先 (連番・上書きしない) ---------------- */
fs.mkdirSync(ART, { recursive: true });
const prevLoops = fs.readdirSync(ART)
  .map(n => /^loop-(\d+)$/.exec(n)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
/* 降格検証は本流のループ番号を消費しない(比較対象にもしない) */
const loopNo = (prevLoops.at(-1) ?? 0) + 1;
/* 本流(desktop・降格なし)だけが loop-NN を名乗り、差分比較の対象になる。
   モバイルや降格検証は接尾辞を付けて番号を消費しない。 */
const suffix = [VIEW === 'desktop' ? '' : VIEW, FORCE, TIERPIN && 'tier' + TIERPIN].filter(Boolean).join('-');
/* 接尾辞つきの実行はループ番号を消費しないので、同じ条件で2回走らせると
   同じ名前になる。空いている名前まで送る(上書きはしない)。 */
let outDir = path.join(ART, `loop-${String(loopNo).padStart(2, '0')}${suffix ? '-' + suffix : ''}`);
for (let k = 2; fs.existsSync(outDir); k++) {
  outDir = path.join(ART, `loop-${String(loopNo).padStart(2, '0')}${suffix ? '-' + suffix : ''}-${k}`);
}
fs.mkdirSync(outDir, { recursive: true });

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

/* 診断オーバーレイが「実際に見えているか」まで検証する。
   window.__diag(JSオブジェクト)だけを見ていたため、hidden属性を
   外し忘れてオーバーレイが一度も出ない不具合を見逃した。 */
const overlay = await page.evaluate(() => {
  const el = document.getElementById('diag');
  if (!el) return { exists:false };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { exists:true, display:cs.display, visibility:cs.visibility,
           hidden:el.hasAttribute('hidden'), w:Math.round(r.width), h:Math.round(r.height),
           chars:(el.textContent||'').trim().length };
});

const diag = await page.evaluate(() => ({
  fps: window.__diag.fps, dpr: window.__diag.dpr, frames: window.__diag.frames,
  cost: window.__diag.cost, caps: window.__diag.caps, render: window.__diag.render,
  tier: window.__diag.tier.name, cardRects: window.__diag.cardRects,
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
let hudOverlap = null;
let effects = null;
/* 潜航の進行度はページ側と同じく #spacer の高さで正規化する。
   document 全体の高さで割ると、本文DOMを足した分だけ「深部」が
   本文の途中を指してしまい、深部の絵を一度も撮らないまま通る。 */
const maxScroll = await page.evaluate(() => {
  const sp = document.getElementById('spacer');
  return (sp ? sp.offsetHeight : document.documentElement.scrollHeight) - innerHeight;
});
for (const stop of STOPS) {
  await page.evaluate(y => scrollTo(0, y), Math.round(maxScroll * stop.p));
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(500);
    const w = await page.evaluate(() => parseFloat(document.getElementById('diveFill').style.width) || 0);
    if (Math.abs(w - stop.p * 100) < 1.2) break;
  }
  await page.screenshot({ path: path.join(outDir, `${stop.name}.png`), timeout: 180000 });
  sigs[stop.name] = await signature();

  /* 水面ではヒーローのコピーとCTAが出ている。3Dのカードがそこへ
     食い込んでいないかを、目視ではなく面積で測る。 */
  if (stop.name === 'surface') {
    hudOverlap = await page.evaluate(() => {
      const rect = el => { const b = el.getBoundingClientRect();
        return { x:b.x, y:b.y, w:b.width, h:b.height }; };
      const ov = (a, b) => Math.max(0, Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x))
                         * Math.max(0, Math.min(a.y+a.h, b.y+b.h) - Math.max(a.y, b.y));
      const card = window.__diag.cardRects[0];
      const out = {};
      for (const [k, sel] of [['cta','#cta'], ['lede','#hero p'], ['h1','#hero h1']]) {
        const el = document.querySelector(sel); if (!el) continue;
        const r = rect(el);
        out[k] = { pct: r.w*r.h ? +(ov(card, r) / (r.w*r.h) * 100).toFixed(1) : 0 };
      }
      out.card = { y: Math.round(card.y), h: Math.round(card.h), visible: card.visible };
      return out;
    });
    /* 水面の映り込みとガラスの屈折が水面で実際に効いているか。
       絵だけで見ると、シェーダが黙って落ちても気付けない。 */
    effects = await page.evaluate(() => window.__diag.effects);
  }
}

/* 本文セクション。実テキストが読める状態かを撮って残す */
await page.evaluate(() => document.getElementById('content')?.scrollIntoView());
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outDir, 'content.png'), timeout: 180000 });
const contentInfo = await page.evaluate(() => {
  const el = document.getElementById('content');
  if (!el) return { exists:false };
  return { exists:true, chars:(el.innerText||'').trim().length,
           h2:[...el.querySelectorAll('h2')].map(n=>n.textContent.trim()),
           links:[...el.querySelectorAll('a[href]')].length,
           reading: document.documentElement.dataset.reading };
});

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
const overlayOk = !!(overlay.exists && !overlay.hidden && overlay.display !== 'none'
  && overlay.visibility !== 'hidden' && overlay.w > 0 && overlay.h > 0 && overlay.chars > 50);

/* 文字の上にカードが乗ったら不合格。閾値は「1%でも重なったらアウト」 */
const hudOk = !hudOverlap || ['cta','lede','h1'].every(k => !hudOverlap[k] || hudOverlap[k].pct < 1);

const errors = messages.filter(m => m.type !== 'warning');
const changed = diff === null ? null : Object.values(diff).some(v => v === null || v > 0);
const verdict = {
  'console エラー 0件':      { pass: errors.length === 0, value: `${errors.length} 件 (warning ${messages.length - errors.length} 件)` },
  'context lost 0回':        { pass: ctxLost === 0, value: `${ctxLost} 回` },
  '前ループとの差分 ≠ 0':     { pass: changed === null ? null : changed, value: diff ? JSON.stringify(diff) : '初回(比較対象なし)' },
  'FPS 平均':                { pass: null, value: `${diag.fps.avg.toFixed(1)} (最低 ${diag.fps.min.toFixed(1)}, ${diag.frames} フレーム)` },
  '診断オーバーレイが可視':    { pass: overlayOk, value: JSON.stringify(overlay) },
  'HUDと3Dの重なり無し':      { pass: hudOk, value: hudOverlap ? JSON.stringify(hudOverlap) : 'n/a' },
  '本文が実テキストで存在':    { pass: !!(contentInfo.exists && contentInfo.chars > 300), value: JSON.stringify(contentInfo) },
  /* デスクトップは反射が動いていること。モバイルは"切れていること"が正解なので
     同じ基準では測らない(値だけ残す)。 */
  '水面の映り込みが有効':      { pass: effects ? (effects.reflectAvailable
                                  ? (effects.reflectOn && effects.reflectStrength > 0 && !!effects.reflectSize)
                                  : (!effects.reflectOn && effects.reflectStrength === 0))
                                 : null, value: JSON.stringify(effects) },
  'ガラスの屈折が有効':        { pass: effects ? (effects.glassOn && !!effects.glassRefract
                                  && effects.glassRefract[0] > 2) : null,
                               value: effects ? JSON.stringify(effects.glassRefract) : 'n/a' },
};

const report = { loop: loopNo, view: VIEW, url: BASE, diag, overlay, hudOverlap, effects, contentInfo, ctxLost, messages, diff, verdict };
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

const fxOk = Object.entries(verdict)
  .filter(([k]) => k.endsWith('が有効'))
  .every(([, v]) => v.pass !== false);
process.exit(errors.length === 0 && ctxLost === 0 && overlayOk && hudOk && fxOk ? 0 : 1);
