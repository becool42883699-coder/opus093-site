/* probe.mjs — 汀ノ庭のページを立てて、その場で式を評価する小さな道具。
   verify.mjs の全項目を回すと数分かかるので、実装中の1点確認はこちらを使う。

     node scripts/probe.mjs --view=desktop --script=scratch/foo.mjs
     node scripts/probe.mjs --eval="__diag.seam"

   --script のファイルは default export の async 関数で、(page, helpers) を受ける。 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg  = (k, d) => (argv.find(a => a.startsWith('--' + k + '=')) || ('--' + k + '=' + d)).split('=').slice(1).join('=');
const SRC  = path.resolve(ROOT, arg('src', 'public/migiwa/index.html'));
const VIEW = arg('view', 'desktop');
const TIER = arg('tier', 'high');
const QS   = arg('qs', '');
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const VIEWS = {
  desktop: { w: 1600, h: 900, dsf: 1, mobile: false },
  laptop:  { w: 1280, h: 800, dsf: 1, mobile: false },
  wide:    { w: 1440, h: 900, dsf: 1, mobile: false },
  w1240:   { w: 1240, h: 900, dsf: 1, mobile: false },
  w1239:   { w: 1239, h: 900, dsf: 1, mobile: false },
  w821:    { w: 821,  h: 900, dsf: 1, mobile: false },
  w820:    { w: 820,  h: 900, dsf: 1, mobile: false },
  mobile:  { w: 390,  h: 844, dsf: 2, mobile: true  },
  iphone:  { w: 390,  h: 664, dsf: 3, mobile: true  },
  iphone2: { w: 459,  h: 869, dsf: 3, mobile: true  },
};
const V = VIEWS[VIEW] || VIEWS.desktop;

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8', '.xml':'application/xml', '.md':'text/plain; charset=utf-8' };

const serveDir = path.dirname(SRC);
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(serveDir, rel);
  if (!file.startsWith(serveDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const DIAG = arg('diag', '1');
const URLBASE = `http://127.0.0.1:${server.address().port}/${path.basename(SRC)}`
  + `?diag=${DIAG}&q=full${TIER ? '&tier=' + TIER : ''}${QS ? '&' + QS : ''}`;

const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-lcd-text'],
});
const ctx = await browser.newContext({
  viewport: { width: V.w, height: V.h }, deviceScaleFactor: V.dsf,
  isMobile: V.mobile, hasTouch: V.mobile, reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URLBASE, { waitUntil: 'load' });
await page.waitForFunction(() => window.__diag && window.__diag.ready, null, { timeout: 90000 }).catch(() => {});

/* 潜航は毎フレームの微小な追従なので、この環境(約1fps)では収束に時間がかかる。
   __diag.dive を見て止まるまで待つ。style を読まない(transform 駆動なので空)。 */
const settle = async (target, maxMs = 150000) => {
  const t0 = Date.now();
  let lastV = -1, lastY = -1, lastF = -1, still = 0;
  while (Date.now() - t0 < maxMs){
    const s = await page.evaluate(() => ({ v: (window.__diag && window.__diag.dive) || 0,
                                           y: scrollY, f: (window.__diag && window.__diag.frames) || 0 }));
    if (target != null && Math.abs(s.v - target) < 0.004) return s.v;
    /* ★ この環境は約1fps。800ms 間隔で2回読むと同じフレームを2回見るので、
       値だけで「止まった」と判定すると動き出す前に諦める(実際そうなった)。
       フレームが進んだうえで値が動いていないことを条件にする。 */
    if (s.f !== lastF){
      if (Math.abs(s.v - lastV) < 0.0006 && s.y === lastY){ if (++still >= 4) return s.v; } else still = 0;
      lastV = s.v; lastY = s.y; lastF = s.f;
    }
    await page.waitForTimeout(600);
  }
  return lastV;
};

const helpers = { settle, V, VIEW, errors, URLBASE, ROOT };

const scriptArg = arg('script', '');
const evalArg   = arg('eval', '');
if (scriptArg){
  const mod = await import(path.resolve(ROOT, scriptArg) + '?t=' + Date.now());
  await mod.default(page, helpers);
} else if (evalArg){
  console.log(JSON.stringify(await page.evaluate('(' + `()=>(${evalArg})` + ')()'), null, 2));
}
if (errors.length) console.log('CONSOLE ERRORS:', errors.slice(0, 8));
await browser.close(); server.close();
