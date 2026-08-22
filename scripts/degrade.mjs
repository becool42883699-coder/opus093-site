#!/usr/bin/env node
/**
 * degrade.mjs — 退避の3経路を通しで見る
 *
 *   node scripts/degrade.mjs
 *
 * ★ scratch/ に置いていたので、クローンすると存在しないファイルを
 *   README が「必ず通す」と指していた。検証は配られるところに置く。
 */
/* 退避の3経路を通しで見る。
   1) prefers-reduced-motion: reduce … 3秒あけた2枚が完全に一致するか
   2) JS無効 … 本文が全部読めるか / 動かない計器が居座っていないか
   3) WebGL2非対応 … 上端の案内 + 本文 / 620vh の空白を畳んでいるか */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import crypto from 'node:crypto';

/* ★ この環境は1〜4fps。壁時計で待つと、実ブラウザなら0.05〜0.2秒しか
   経っていないところで「止まっているか」を判定することになる。
   スクロールで飛んだ直後の収束(数フレーム)を「動き続けている」と
   誤検出した。待つのは秒ではなくフレーム。 */
const waitFrames = async (page, n, maxMs = 90000) => {
  const f0 = await page.evaluate(() => (window.__diag && window.__diag.frames) || 0);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs){
    await page.waitForTimeout(350);
    const f = await page.evaluate(() => (window.__diag && window.__diag.frames) || 0);
    if (f >= f0 + n) return f;
  }
  return -1;
};

const ROOT = process.cwd();
const SRC = path.resolve(ROOT, 'public/migiwa/index.html');
const MIME = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml','.md':'text/plain' };
const dir = path.dirname(SRC);
const server = http.createServer((req,res)=>{
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'') || 'index.html';
  const f = path.join(dir, rel);
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0,'127.0.0.1',r));
const U = `http://127.0.0.1:${server.address().port}/index.html`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME)?CHROME:undefined,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-lcd-text'] });
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex').slice(0,12);

/* ---- 1) reduced-motion ---- */
{
  const ctx = await browser.newContext({ viewport:{width:1280,height:800}, reducedMotion:'reduce' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(U + '?q=full&tier=high&diag=0', { waitUntil:'load' });
  await page.waitForFunction(() => window.__diag && window.__diag.ready, null, { timeout:120000 }).catch(()=>{});
  /* ★ 起動直後はコスト計測(calibrate)が構成を切り替えながら描くので、
     絵が変わって当たり前。終わるまで待たないと「静止していない」と誤判定する。 */
  await page.waitForFunction(() => window.__diag && window.__diag.cost, null, { timeout:180000 }).catch(()=>{});
  await waitFrames(page, 40);
  const a = await page.screenshot();
  await waitFrames(page, 24);
  const b = await page.screenshot();
  const st = await page.evaluate(() => {
    const s = window.__diag.seam;
    return { ts:s.timeScale, camY:+s.camY.toFixed(2), hpR:s.hpR, anim:document.documentElement.dataset.anim || '',
             blkHidden:[...document.querySelectorAll('#content .blk')].filter(e => +getComputedStyle(e).opacity < 0.5).length };
  });
  fs.writeFileSync('artifacts/reduced-a.png', a);
  fs.writeFileSync('artifacts/reduced-b.png', b);
  /* ★ 一致しない時は「どこが」動いたのかを出す。合否だけだと毎回
     当て推量になる(実際、魚を止めても一致せず2周した)。 */
  const box = await page.evaluate(async ({A,B}) => {
    const ld = async (b64) => { const i = new Image();
      await new Promise(s => { i.onload = s; i.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
      const g = c.getContext('2d', { willReadFrequently:true }); g.drawImage(i,0,0);
      return { d: g.getImageData(0,0,i.width,i.height).data, w:i.width, h:i.height }; };
    const x = await ld(A), y = await ld(B);
    let n=0,mx=0,x0=1e9,y0=1e9,x1=-1,y1=-1;
    for (let p=0;p<x.d.length;p+=4){
      const dd = Math.abs(x.d[p]-y.d[p]) + Math.abs(x.d[p+1]-y.d[p+1]) + Math.abs(x.d[p+2]-y.d[p+2]);
      if (dd > 3){ n++; if (dd>mx) mx=dd;
        const i2=(p/4)|0, px=i2 % x.w, py=(i2/x.w)|0;
        if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py; } }
    return n ? { n, maxDelta:mx, box:[x0,y0,x1-x0+1,y1-y0+1], pct:+(100*n/(x.w*x.h)).toFixed(2) } : { n:0 };
  }, { A: a.toString('base64'), B: b.toString('base64') });
  console.log('REDUCED', JSON.stringify({ same: md5(a) === md5(b), diff: box, ...st, errs: errs.slice(0,3) }));
  /* 汀まで送っても静止しているか */
  const ct = await page.evaluate(() => window.__diag.seam.contentTopDoc);
  await page.evaluate(y => scrollTo(0, y), Math.round(ct - 800*0.5));
  await waitFrames(page, 40);
  const c = await page.screenshot();
  await waitFrames(page, 24);
  const d = await page.screenshot();
  const seam = await page.evaluate(() => {
    const s = window.__diag.seam;
    return { hpR:+s.hpR.toFixed(3), d:+(s.seamPx - s.horizonPx).toFixed(1), th:+s.theta.toFixed(4),
             sd:s.seamDelta, ts:s.timeScale, camY:+s.camY.toFixed(2) };
  });
  fs.writeFileSync('artifacts/reduced-seam.png', c);
  fs.writeFileSync('artifacts/reduced-seam-b.png', d);
  const box2 = await page.evaluate(async ({A,B}) => {
    const ld = async (b64) => { const i = new Image();
      await new Promise(s => { i.onload = s; i.src = 'data:image/png;base64,' + b64; });
      const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height;
      const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(i,0,0);
      return { d: g.getImageData(0,0,i.width,i.height).data, w:i.width, h:i.height }; };
    const x = await ld(A), y = await ld(B);
    let n=0,mx=0,x0=1e9,y0=1e9,x1=-1,y1=-1;
    for (let p=0;p<x.d.length;p+=4){
      const dd = Math.abs(x.d[p]-y.d[p]) + Math.abs(x.d[p+1]-y.d[p+1]) + Math.abs(x.d[p+2]-y.d[p+2]);
      if (dd > 3){ n++; if (dd>mx) mx=dd;
        const i2=(p/4)|0, px=i2 % x.w, py=(i2/x.w)|0;
        if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py; } }
    return n ? { n, maxDelta:mx, box:[x0,y0,x1-x0+1,y1-y0+1] } : { n:0 };
  }, { A: c.toString('base64'), B: d.toString('base64') });
  console.log('REDUCED-SEAM', JSON.stringify({ same: md5(c) === md5(d), diff: box2, ...seam }));
  await ctx.close();
}

/* ---- 2) JS無効 / 3) WebGL2非対応 ---- */
for (const mode of ['nojs','nowebgl2']){
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2,
    isMobile:true, hasTouch:true, reducedMotion:'no-preference', javaScriptEnabled: mode !== 'nojs' });
  const page = await ctx.newPage();
  if (mode === 'nowebgl2'){
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest){
        if (type === 'webgl2') return null;
        return orig.call(this, type, ...rest);
      };
    });
  }
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(U, { waitUntil:'load' });
  await page.waitForTimeout(5000);
  const r = await page.evaluate(() => {
    const c = document.getElementById('content');
    return {
      nogl: document.documentElement.dataset.nogl || '',
      spacerH: document.getElementById('spacer').offsetHeight,
      chars: (c.innerText || '').replace(/\s+/g,'').length,
      h2: c.querySelectorAll('h2').length,
      links: c.querySelectorAll('a[href]').length,
      fallback: getComputedStyle(document.getElementById('fallback')).display,
      hud: getComputedStyle(document.getElementById('hud')).display,
      bodyOpacity: getComputedStyle(document.body).opacity,
      blkHidden: [...c.querySelectorAll('.blk')].filter(e => +getComputedStyle(e).opacity < 0.5).length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  console.log(mode.toUpperCase(), JSON.stringify(r), 'errs', errs.slice(0,3));
  await page.screenshot({ path: `artifacts/deg-${mode}.png` });
  await ctx.close();
}
await browser.close(); server.close();
