#!/usr/bin/env node
/**
 * shrink-shots.mjs — 実績のスクリーンショットを WebP へ落とす
 *
 * Playwright で撮った PNG は 1枚 3〜5MB あり、そのまま載せると
 * ページが数十MBになる。ImageMagick が無い環境なので、Chromium の
 * canvas で読み直して WebP で書き出す。
 *
 *   node scripts/shrink-shots.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR  = path.join(ROOT, 'public/migiwa/shots');
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* PC は本文の幅(最大860px)の2倍まで。SP は縦長なので幅を抑える。 */
const MAXW = { pc: 1720, sp: 780 };
const Q = 0.82;

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png'));
if (!files.length) { console.log('PNGが無い'); process.exit(0); }

const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
const page = await (await browser.newContext()).newPage();

let before = 0, after = 0;
for (const f of files.sort()) {
  const src = path.join(DIR, f);
  const dev = /-sp\.png$/.test(f) ? 'sp' : 'pc';
  const b64 = fs.readFileSync(src).toString('base64');
  const out = await page.evaluate(async ({ b64, maxw, q }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const s = Math.min(1, maxw / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height };
  }, { b64, maxw: MAXW[dev], q: Q });

  const dst = src.replace(/\.png$/, '.webp');
  fs.writeFileSync(dst, Buffer.from(out.data, 'base64'));
  const sb = fs.statSync(src).size, db = fs.statSync(dst).size;
  before += sb; after += db;
  console.log(`${f.padEnd(16)} ${out.w}x${out.h}  ${(sb/1024|0)}KB → ${(db/1024|0)}KB`);
  fs.unlinkSync(src);
}
console.log(`合計 ${(before/1024/1024).toFixed(1)}MB → ${(after/1024/1024).toFixed(2)}MB`);
await browser.close();
