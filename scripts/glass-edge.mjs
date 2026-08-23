/* glass-edge.mjs — ガラス板が「どれだけ色を足しているか」を測る。
   カードの縁をまたぐ水平線を1本引き、外→内で色がどう変わるかを出す。
   同じ景色が続いている所を見るので、差は板が足した色そのもの。

     node scripts/glass-edge.mjs artifacts/hero-desktop.png 420 470 640
                                  (画像)                     y  x開始 x終了

   ★ 「無色にしたのに青い」を目で判断しない。これで10秒で判る。
     実際、色ガラスを抜いてもまだ青く、原因は材質ではなく
     「空気中の板に水中の霧を掛けていた」ことだった。 */
import { chromium } from 'playwright'; import fs from 'node:fs';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const pg=await b.newPage();
const [file, yy, xa, xb] = process.argv.slice(2);
const rows=await pg.evaluate(async ([d,y,x0,x1]) => {
  const im=new Image(); im.src='data:image/png;base64,'+d; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height;
  const x=c.getContext('2d'); x.drawImage(im,0,0);
  const D=x.getImageData(0,0,c.width,c.height).data;
  const out=[];
  for(let px=+x0; px<+x1; px+=6){
    let r=0,g=0,bl=0,n=0;
    for(let yy=+y-6; yy<+y+6; yy++){const i=((c.width*yy+px)<<2);r+=D[i];g+=D[i+1];bl+=D[i+2];n++;}
    out.push([px, r/n, g/n, bl/n]);
  }
  return out;
}, [fs.readFileSync(file).toString('base64'), yy, xa, xb]);
for (const [px,r,g,bl] of rows){
  const mx=Math.max(r,g,bl), mn=Math.min(r,g,bl);
  console.log(String(px).padStart(5), `rgb(${r.toFixed(0).padStart(3)},${g.toFixed(0).padStart(3)},${bl.toFixed(0).padStart(3)})`,
    '彩度'+(mx?((mx-mn)/mx*100):0).toFixed(0).padStart(3)+'%', '青-赤'+(bl-r).toFixed(0).padStart(4));
}
await b.close();
