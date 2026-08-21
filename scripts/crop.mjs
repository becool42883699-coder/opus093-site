#!/usr/bin/env node
/* 撮った PNG の一部を切り出す。画像ツールが無いので Chromium の canvas を使う。
   node scripts/crop.mjs <in.png> <out.png> <x> <y> <w> <h> [zoom] */
import { chromium } from 'playwright';
import fs from 'node:fs';
const [inp, outp, x, y, w, h, zoom = '2'] = process.argv.slice(2);
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');
const b64 = fs.readFileSync(inp).toString('base64');
const out = await page.evaluate(async ({ b64, x, y, w, h, z }) => {
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = 'data:image/png;base64,' + b64; });
  const c = document.getElementById('c');
  c.width = w * z; c.height = h * z;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, x, y, w, h, 0, 0, w * z, h * z);
  return c.toDataURL('image/png').split(',')[1];
}, { b64, x: +x, y: +y, w: +w, h: +h, z: +zoom });
fs.writeFileSync(outp, Buffer.from(out, 'base64'));
console.log(`${outp} ${(+w * +zoom)}x${(+h * +zoom)}`);
await browser.close();
