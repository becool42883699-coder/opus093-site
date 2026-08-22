/* sea-profile.mjs — sea-shots.mjs が撮った1枚の「縦の輝度・彩度プロファイル」を出す。
   「海が平ら」を目でなく数字で掴むための道具。行ごとの rgb がまったく
   動かない区間があれば、そこは水ではなく色の付いた板になっている。

     node scripts/sea-profile.mjs artifacts/sea-desktop-0_14.png [...]

   PNGを読むライブラリを足したくないので、Chromium の canvas に読ませる
   （新規npm依存を入れない方針のため）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const files = process.argv.slice(2);
if (!files.length){ console.error('使い方: node scripts/sea-profile.mjs <png> [...]'); process.exit(2); }

const browser = await chromium.launch({ executablePath: CHROME, args:['--no-sandbox'] });
const page = await browser.newPage();
for (const f of files){
  const out = await page.evaluate(async (d) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + d;
    await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const cx = c.getContext('2d'); cx.drawImage(im, 0, 0);
    const D = cx.getImageData(0, 0, c.width, c.height).data;
    const rows = [];
    /* 左右の端はビネットが乗るので落とす。7px 飛ばしで足りる（値は平均） */
    for (let y = 10; y < c.height; y += 60){
      let r = 0, g = 0, b = 0, n = 0;
      for (let x = 200; x < c.width - 200; x += 7){
        const i = ((c.width * y + x) << 2);
        r += D[i]; g += D[i+1]; b += D[i+2]; n++;
      }
      rows.push([y, r/n, g/n, b/n]);
    }
    return { w: c.width, h: c.height, rows };
  }, fs.readFileSync(f).toString('base64'));

  console.log(`=== ${path.basename(f)}  ${out.w}x${out.h}`);
  let prev = null, flat = 0, flatWorst = 0;
  for (const [y, R, G, B] of out.rows){
    const L = 0.2126*R + 0.7152*G + 0.0722*B;
    const mx = Math.max(R,G,B), mn = Math.min(R,G,B);
    const sat = mx ? (mx - mn) / mx * 100 : 0;
    if (prev && Math.abs(L - prev) < 0.6){ flat += 60; flatWorst = Math.max(flatWorst, flat); }
    else flat = 0;
    prev = L;
    console.log(String(y).padStart(4) + '  rgb(' + [R,G,B].map(v=>v.toFixed(0).padStart(3)).join(',') +
                ')  L=' + L.toFixed(1).padStart(5) + '  sat=' + sat.toFixed(0).padStart(3) + '%');
  }
  console.log('  → 画素値が動かない最長区間: ' + flatWorst + 'px' +
              (flatWorst >= 120 ? '  ← 平ら。水ではなく板に見える' : ''));
}
await browser.close();
