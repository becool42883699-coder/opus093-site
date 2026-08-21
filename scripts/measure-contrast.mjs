#!/usr/bin/env node
/**
 * measure-contrast.mjs — 撮った実フレームの「実ピクセル」で文字のコントラストを測る。
 *
 * 3Dの上に文字が乗るので、CSSの色だけを見ても意味がない。背景は毎フレーム
 * 変わる絵で、いちばん明るいところが最悪ケースになる。
 * そこで PNG を Chromium に読ませて canvas から画素を取り、
 * 各テキスト矩形の背景輝度の上位2%(98パーセンタイル)を最悪ケースに採る。
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
      const x = Math.max(0, Math.round(r.x*dsf)), y = Math.max(0, Math.round(r.y*dsf));
      const w = Math.min(c.width - x, Math.round(r.w*dsf)), h = Math.min(c.height - y, Math.round(r.h*dsf));
      if (w <= 0 || h <= 0) return { name: it.name, err: 'rect out of frame' };
      const d = g.getImageData(x, y, w, h).data;
      const arr = [];
      for (let i = 0; i < d.length; i += 4) arr.push([d[i], d[i+1], d[i+2]]);
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
    const lums = p.rgb.map(c => relLum(c[0], c[1], c[2]))
                      .filter(l => Math.abs(l - fgL) > 0.06)      // 文字の画素を外す
                      .sort((a, b) => a - b);
    if (!lums.length){ out.push({ shot: s.shot, name: p.name, err: '背景の画素が取れない' }); continue; }
    const p98 = lums[Math.min(lums.length-1, Math.floor(lums.length*0.98))];
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
