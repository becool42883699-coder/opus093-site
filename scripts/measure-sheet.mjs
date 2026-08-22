#!/usr/bin/env node
/**
 * measure-sheet.mjs — 本文の地(#content::before)の濃さを決めるための計測
 *
 *   node scripts/measure-sheet.mjs artifacts/sea-desktop.png
 *
 * 地の画像は「記録の1枚だけを撮ったもの」(本文もHUDも消した状態)。
 * 読書中は #stage が position:fixed なので、文字はこの1枚の上を通過していく。
 * 最悪ケースはこの1枚のいちばん明るいところ。
 * ★ #content::before の濃さを動かすときは、見た目で決めずにこれで測り直す。
 */
/* 地(記録の1枚)に対して、シートの透過率ごとの最悪コントラストを出す。
   CSSの合成はガンマ空間なので sRGB のまま線形補間し、そのあと輝度へ直す。 */
import { chromium } from 'playwright'; import fs from 'node:fs';
const CHROME='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:fs.existsSync(CHROME)?CHROME:undefined});
const pg=await b.newPage(); await pg.setContent('<canvas id=c></canvas>');
const SHEET=[3,20,27];
const TEXTS={ '本文 p':[228,243,245,0.92], '一覧 dd':[222,240,242,0.88],
              '見出し h2':[237,246,244,1.0], '極小 eyebrow':[196,224,228,0.80] };
const px=await pg.evaluate(async({b64})=>{
  const i=new Image(); await new Promise(s=>{i.onload=s;i.src='data:image/png;base64,'+b64});
  const c=document.getElementById('c'); c.width=i.width; c.height=i.height;
  const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(i,0,0);
  const d=g.getImageData(0,0,i.width,i.height).data; const out=[];
  for(let p=0;p<d.length;p+=4) out.push([d[p],d[p+1],d[p+2]]);
  return {out, w:i.width, h:i.height};
},{b64:fs.readFileSync(process.argv[2]).toString('base64')});
await b.close();
const f=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
const L=(r,g,bl)=>0.2126*f(r)+0.7152*f(g)+0.0722*f(bl);
const ratio=(a,c)=>(Math.max(a,c)+0.05)/(Math.min(a,c)+0.05);
console.log(`地: ${process.argv[2]} ${px.w}x${px.h} (${px.out.length}画素)`);
console.log('α    ' + Object.keys(TEXTS).map(k=>k.padStart(12)).join(''));
for (const a of [0.945,0.90,0.85,0.80,0.75,0.70,0.60,0.50,0.0]){
  const row=[];
  for (const k in TEXTS){
    const [tr,tg,tb,ta]=TEXTS[k];
    let worst=99;
    /* 地のうち明るい上位を最悪ケースに採る(1画素の外れ値で振れないよう p99.5) */
    const ls=[];
    for (const [r,g,bl] of px.out){
      const br=a*SHEET[0]+(1-a)*r, bg=a*SHEET[1]+(1-a)*g, bb=a*SHEET[2]+(1-a)*bl;
      /* 文字も地の上に ta で乗る */
      const fr=ta*tr+(1-ta)*br, fg=ta*tg+(1-ta)*bg, fb=ta*tb+(1-ta)*bb;
      ls.push(ratio(L(fr,fg,fb), L(br,bg,bb)));
    }
    ls.sort((x,y)=>x-y);
    worst=ls[Math.floor(ls.length*0.005)];   // 下位0.5%
    row.push(worst.toFixed(2).padStart(12));
  }
  console.log(String(a).padEnd(5)+row.join(''));
}
