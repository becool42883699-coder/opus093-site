#!/usr/bin/env node
/**
 * make-og.mjs — 共有されたときのカード画像を、実際の画面から作る。
 *
 * 1200x630 でページを開き、水面の1枚が落ち着いたところを撮って WebP にする。
 * 別に絵を用意しない ―― カードとサイトが食い違わないのが要。
 *
 *   node scripts/make-og.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR  = path.join(ROOT, 'public/migiwa');
const OUT  = path.join(DIR, 'og.webp');
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const MIME = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml','.md':'text/plain' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const f = path.join(DIR, rel);
  if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/index.html?q=full&tier=high&diag=0`;

const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-lcd-text'],
});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
await page.goto(URL0, { waitUntil: 'load' });
await page.waitForFunction(() => window.__diag && window.__diag.ready, null, { timeout: 120000 }).catch(() => {});
/* 波と光が落ち着くまで数フレーム回す(1フレーム目はまだ暗い) */
{
  const t0 = Date.now();
  const want = await page.evaluate(() => window.__diag.frames) + 14;
  while (Date.now() - t0 < 90000){
    await page.waitForTimeout(500);
    if (await page.evaluate(() => window.__diag.frames) >= want) break;
  }
}
const png = await page.screenshot({ type: 'png' });

/* PNG → WebP はブラウザの canvas で行う(この環境に画像ツールが無い) */
const b64 = png.toString('base64');
const webp = await page.evaluate(async (b64) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/webp', 0.86).split(',')[1];
}, b64);
fs.writeFileSync(OUT, Buffer.from(webp, 'base64'));
console.log(`og.webp ${(fs.statSync(OUT).size/1024).toFixed(0)}KB (1200x630)`);

await browser.close();
server.close();
