#!/usr/bin/env node
/**
 * measure-contrast.mjs — 撮った実フレームの「実ピクセル」で文字のコントラストを測る。
 *
 * 3Dの上に文字が乗るので、CSSの色だけを見ても意味がない。背景は毎フレーム
 * 変わる絵で、いちばん明るいところが最悪ケースになる。
 * そこで PNG を Chromium に読ませて canvas から画素を取り、
 * 各テキストの外側 2〜9px の帯を背景とみなし、その明るい側 10% を最悪ケースに採る。
 *
 *   node scripts/measure-contrast.mjs artifacts/rects-desktop.json
 *
 * rects JSON は撮影時に journey.mjs が書く:
 *   [{ shot:'artifacts/j-desktop-01-surface.png', dsf:1,
 *      items:[{ name:'nav', rect:{x,y,w,h}, color:'rgba(...)' }] }]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const src = process.argv[2];
if (!src){ console.error('使い方: node scripts/measure-contrast.mjs <rects.json>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(src, 'utf8'));

const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');

/* sRGB の相対輝度。WCAG の定義そのまま。 */
const relLum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
};
const ratio = (a, b) => (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);

const out = [];
for (const s of spec){
  if (!fs.existsSync(s.shot)){ console.log(`欠番 ${s.shot}`); continue; }
  const b64 = fs.readFileSync(s.shot).toString('base64');
  const px = await page.evaluate(async ({ b64, items, dsf }) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.getElementById('c');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    return items.map(it => {
      const r = it.rect;
      /* ★ 矩形の中の画素を「背景」として使ってはいけない。
         白文字のアンチエイリアスが中間の明るさで残り、それを最悪ケースに
         採ってしまう(実際、地色が暗い場面でも 1.1:1 と出た)。
         文字の外側 3〜13px の帯だけを背景として採る。 */
      const pad = Math.round(9*dsf), inn = Math.round(2*dsf);
      const x0 = Math.max(0, Math.round(r.x*dsf) - pad), y0 = Math.max(0, Math.round(r.y*dsf) - pad);
      const x1 = Math.min(c.width,  Math.round((r.x+r.w)*dsf) + pad);
      const y1 = Math.min(c.height, Math.round((r.y+r.h)*dsf) + pad);
      if (x1 - x0 < 2 || y1 - y0 < 2) return { name: it.name, err: 'rect out of frame' };
      const ix0 = Math.round(r.x*dsf) - inn, iy0 = Math.round(r.y*dsf) - inn;
      const ix1 = Math.round((r.x+r.w)*dsf) + inn, iy1 = Math.round((r.y+r.h)*dsf) + inn;
      const d = g.getImageData(x0, y0, x1-x0, y1-y0).data;
      const arr = [];
      for (let y = y0; y < y1; y++){
        for (let x = x0; x < x1; x++){
          if (x >= ix0 && x < ix1 && y >= iy0 && y < iy1) continue;   // 文字の側は捨てる
          const i = ((y-y0)*(x1-x0) + (x-x0))*4;
          arr.push([d[i], d[i+1], d[i+2]]);
        }
      }
      return { name: it.name, color: it.color, n: arr.length, rgb: arr };
    });
  }, { b64, items: s.items, dsf: s.dsf || 1 });

  for (const p of px){
    if (p.err){ out.push({ shot: s.shot, name: p.name, err: p.err }); continue; }
    /* 文字そのものも矩形に含まれるので、背景の最悪ケースは
       「明るい側の98パーセンタイル」を採る(白文字なら文字自身が最上位に
       来てしまうので、文字色に近い画素は外す)。 */
    const m = /rgba?\(([^)]+)\)/.exec(p.color || '') ;
    const fg = m ? m[1].split(',').map(Number) : [237, 246, 244];
    const fgL = relLum(fg[0], fg[1], fg[2]);
    /* 隣の白い文字が帯に入り込むことがあるので、文字色に近い画素は外す。
       最悪ケースは 98% ではなく 90% を採る(粒子1つで判定が振れないように)。 */
    const lums = p.rgb.map(c => relLum(c[0], c[1], c[2]))
                      .filter(l => Math.abs(l - fgL) > 0.08)
                      .sort((a, b) => a - b);
    if (!lums.length){ out.push({ shot: s.shot, name: p.name, err: '背景の画素が取れない' }); continue; }
    const p98 = lums[Math.min(lums.length-1, Math.floor(lums.length*0.90))];
    const p50 = lums[Math.floor(lums.length*0.50)];
    out.push({ shot: path.basename(s.shot), name: p.name,
               worst: +ratio(fgL, p98).toFixed(2), median: +ratio(fgL, p50).toFixed(2) });
  }
}
await browser.close();

out.sort((a, b) => (a.worst ?? 99) - (b.worst ?? 99));
for (const o of out){
  const mark = o.err ? '  ?' : o.worst < 3 ? ' NG' : o.worst < 4.5 ? ' 低' : ' OK';
  console.log(`${mark} ${String(o.worst ?? '-').padStart(6)} : ${o.name}  (${o.shot}${o.err ? ' / ' + o.err : ` / 中央値 ${o.median}`})`);
}
const bad = out.filter(o => !o.err && o.worst < 4.5);
console.log(bad.length ? `\n4.5:1 未満 ${bad.length} 件` : '\n全て 4.5:1 以上');
