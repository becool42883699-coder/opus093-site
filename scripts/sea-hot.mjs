/* sea-hot.mjs — 撮った1枚の「白飛び」を数える。明るくした時の安全弁。
   目で「飛んでいる」と思った所も、測るとたいてい 150 前後しかない。

     node scripts/sea-hot.mjs artifacts/sea-desktop-0_85.png [...]

   PNGを読むライブラリを足したくないので Chromium の canvas に読ませる
   （新規npm依存を入れない方針のため）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const files = process.argv.slice(2);
if (!files.length){ console.error('使い方: node scripts/sea-hot.mjs <png> [...]'); process.exit(2); }

const browser = await chromium.launch({ executablePath: CHROME, args:['--no-sandbox'] });
const page = await browser.newPage();
let bad = 0;
for (const f of files){
  const r = await page.evaluate(async (d) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + d; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const cx = c.getContext('2d'); cx.drawImage(im, 0, 0);
    const D = cx.getImageData(0, 0, c.width, c.height).data;
    const L = []; let clipped = 0;
    for (let i = 0; i < D.length; i += 4){
      L.push(0.2126*D[i] + 0.7152*D[i+1] + 0.0722*D[i+2]);
      if (D[i] >= 250 && D[i+1] >= 250 && D[i+2] >= 250) clipped++;
    }
    L.sort((a, b) => a - b);
    const q = p => L[Math.floor(L.length * p)];
    const r0 = v => Math.round(v);
    return { med: r0(q(0.5)), p99: r0(q(0.99)), p999: r0(q(0.999)), max: r0(L[L.length-1]), clipped, total: L.length };
  }, fs.readFileSync(f).toString('base64'));
  const pct = (r.clipped / r.total * 100).toFixed(3);
  if (r.clipped > 0) bad++;
  console.log(`${path.basename(f).padEnd(28)} 中央値 ${String(r.med).padStart(3)}  p99 ${String(r.p99).padStart(3)}` +
              `  p99.9 ${String(r.p999).padStart(3)}  最大 ${String(r.max).padStart(3)}` +
              `  白飛び ${r.clipped}画素 (${pct}%)` + (r.clipped > 0 ? '  ← 飛んでいる' : ''));
}
await browser.close();
process.exit(bad ? 1 : 0);
