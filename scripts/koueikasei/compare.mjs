#!/usr/bin/env node
/**
 * 元サイトの採取結果と自作ページを突き合わせる検証ハーネス。
 *
 *   node scripts/koueikasei/compare.mjs http://127.0.0.1:8080/koueikasei/
 *
 * 2種類の差分を出す。
 *   1. 幾何差分 … 主要ブロックの文書座標・寸法・字組みを元サイトと 1:1 で照合し、
 *                 ズレを px で一覧化する（「位置差を数px〜十数px以内」の合否判定用）
 *   2. 画素差分 … 同一スクロール位置のスクショを重ね、不一致率と差分画像を出す
 *
 * 画素比較は Chromium の canvas 上で行うので追加の npm 依存は要らない（CLAUDE.md §4）。
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = process.argv[2];
if (!LOCAL) {
  console.error("使い方: node scripts/koueikasei/compare.mjs <ローカルURL>");
  process.exit(1);
}
const REF = path.resolve(process.env.KK_OUT || "reference/koueikasei");
const OUT = path.resolve(process.env.KK_CMP || "reference/koueikasei-compare");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** 合否を見る幅。依頼で明示された 2 つを主、残りを従とする。 */
const PRIMARY = ["1440x900", "390x844"];
const SECONDARY = ["1920x1080", "768x1024"];

const ensure = (p) => fs.mkdir(p, { recursive: true });
const writeJSON = (p, v) => fs.writeFile(p, JSON.stringify(v, null, 2));
const readJSON = async (p) => JSON.parse(await fs.readFile(p, "utf8"));

const meta = await readJSON(path.join(REF, "capture-meta.json"));
const VP = Object.fromEntries(meta.viewports.map((v) => [v.name, v]));

/** 幾何比較の対象。テキストで同定するので DOM 構造が違っても対応が取れる。 */
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
const keyOf = (r) => `${r.tag}|${norm(r.text).slice(0, 40)}|${r.img?.src?.split("/").pop() || ""}`;

/** 比較したい代表プロパティ（全部出すとノイズになるので絞る） */
const CMP_PROPS = [
  "fontSize","fontWeight","lineHeight","letterSpacing","fontFamily","color",
  "backgroundColor","textAlign","marginTop","marginBottom","paddingTop","paddingBottom",
  "maxWidth","gap","objectFit","objectPosition","borderRadius","zIndex","position",
];

const browser = await chromium.launch({ executablePath: CHROME });
await ensure(OUT);

/* ── 1. 幾何差分 ── */
async function geometry(vpName) {
  const refRows = await readJSON(path.join(REF, "styles", `${vpName}.json`));
  const vp = VP[vpName];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr, isMobile: vp.mobile, hasTouch: vp.mobile,
    reducedMotion: "no-preference", locale: "ja-JP", timezoneId: "Asia/Tokyo",
  });
  const page = await ctx.newPage();
  await page.goto(LOCAL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  });

  const locRows = await page.evaluate((props) => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const tag = el.tagName.toLowerCase();
      if (["script","style","noscript","meta","link","br","head","html"].includes(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const style = {}; for (const p of props) style[p] = cs[p];
      const direct = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(" ").trim();
      const rec = { tag, rect: { x:+r.x.toFixed(2), y:+(r.y+scrollY).toFixed(2), w:+r.width.toFixed(2), h:+r.height.toFixed(2) }, style };
      if (direct) rec.text = direct.slice(0, 200);
      if (el.tagName === "IMG") rec.img = { src: el.currentSrc || el.src };
      out.push(rec);
    }
    return out;
  }, CMP_PROPS);
  await ctx.close();

  const locIndex = new Map();
  for (const r of locRows) {
    const k = keyOf(r);
    if (!locIndex.has(k)) locIndex.set(k, []);
    locIndex.get(k).push(r);
  }

  const rows = [];
  const used = new Set();
  for (const ref of refRows) {
    if (!norm(ref.text) && !ref.img) continue; // 同定できないものは飛ばす
    const k = keyOf(ref);
    const bucket = locIndex.get(k);
    if (!bucket || !bucket.length) { rows.push({ status: "MISSING", key: k, ref: ref.rect, sel: ref.sel }); continue; }
    // まだ使っていない中で最も近い y のものを対応付ける
    let best = null, bestI = -1;
    bucket.forEach((c, i) => {
      if (used.has(`${k}#${i}`)) return;
      const d = Math.abs(c.rect.y - ref.rect.y) + Math.abs(c.rect.x - ref.rect.x);
      if (!best || d < best.d) { best = { d, c }; bestI = i; }
    });
    if (!best) { rows.push({ status: "MISSING", key: k, ref: ref.rect, sel: ref.sel }); continue; }
    used.add(`${k}#${bestI}`);
    const c = best.c;
    const d = { dx: +(c.rect.x - ref.rect.x).toFixed(1), dy: +(c.rect.y - ref.rect.y).toFixed(1), dw: +(c.rect.w - ref.rect.w).toFixed(1), dh: +(c.rect.h - ref.rect.h).toFixed(1) };
    const styleDiff = {};
    for (const p of CMP_PROPS) if (ref.style[p] !== c.style[p]) styleDiff[p] = { ref: ref.style[p], loc: c.style[p] };
    const worst = Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh));
    rows.push({
      status: worst <= 4 ? "OK" : worst <= 16 ? "NEAR" : "OFF",
      worst, key: k, sel: ref.sel, ref: ref.rect, loc: c.rect, delta: d,
      styleDiff: Object.keys(styleDiff).length ? styleDiff : undefined,
    });
  }

  rows.sort((a, b) => (b.worst ?? 9999) - (a.worst ?? 9999));
  const tally = rows.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
  await writeJSON(path.join(OUT, `geometry-${vpName}.json`), { viewport: vpName, tally, rows });
  console.log(`\n幾何 ${vpName}: ` + Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(" "));
  for (const r of rows.filter(r => r.status === "OFF" || r.status === "MISSING").slice(0, 25)) {
    console.log(`  ${r.status.padEnd(7)} ${String(r.worst ?? "").padStart(5)}px  ${r.key.slice(0, 64)}`);
  }
  return tally;
}

/* ── 2. 画素差分 ── */
async function pixels(vpName) {
  const vp = VP[vpName];
  const refDir = path.join(REF, "shots", vpName);
  let refShots = [];
  try { refShots = (await fs.readdir(refDir)).filter(f => f.endsWith(".png")).sort(); } catch { return null; }

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr, isMobile: vp.mobile, hasTouch: vp.mobile,
    reducedMotion: "no-preference", locale: "ja-JP", timezoneId: "Asia/Tokyo",
  });
  const page = await ctx.newPage();
  await page.goto(LOCAL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});

  const dir = path.join(OUT, "shots", vpName);
  await ensure(dir);
  const results = [];
  for (const f of refShots) {
    const y = parseInt(f.replace(/\D/g, ""), 10);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    const localPng = path.join(dir, f);
    await page.screenshot({ path: localPng });
    results.push({ file: f, y, ref: path.join(refDir, f), loc: localPng });
  }
  await ctx.close();

  // canvas 上で重ねて不一致率を出す
  const dctx = await browser.newContext({ viewport: { width: 100, height: 100 } });
  const dpage = await dctx.newPage();
  await dpage.goto("about:blank");
  const stats = [];
  for (const r of results) {
    const [a, b] = await Promise.all([fs.readFile(r.ref), fs.readFile(r.loc)]);
    const s = await dpage.evaluate(async ([a64, b64]) => {
      const load = (b64) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + b64; });
      const [ia, ib] = await Promise.all([load(a64), load(b64)]);
      const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
      const mk = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0,0,w,h); x.drawImage(img,0,0); return x.getImageData(0,0,w,h).data; };
      const da = mk(ia), db = mk(ib);
      const out = new OffscreenCanvas(w, h); const octx = out.getContext("2d");
      const od = octx.createImageData(w, h);
      let bad = 0;
      for (let i = 0; i < da.length; i += 4) {
        const diff = Math.abs(da[i]-db[i]) + Math.abs(da[i+1]-db[i+1]) + Math.abs(da[i+2]-db[i+2]);
        if (diff > 30) { bad++; od.data[i]=255; od.data[i+1]=0; od.data[i+2]=0; od.data[i+3]=255; }
        else { const g = 235; od.data[i]=g; od.data[i+1]=g; od.data[i+2]=g; od.data[i+3]=255; }
      }
      octx.putImageData(od, 0, 0);
      const blob = await out.convertToBlob({ type: "image/png" });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = ""; for (const byte of buf) bin += String.fromCharCode(byte);
      return { w, h, mismatch: +(bad / (w*h) * 100).toFixed(2), sizeMatch: ia.width===ib.width && ia.height===ib.height, diffPng: btoa(bin) };
    }, [a.toString("base64"), b.toString("base64")]);
    const diffPath = path.join(dir, r.file.replace(".png", ".diff.png"));
    await fs.writeFile(diffPath, Buffer.from(s.diffPng, "base64"));
    stats.push({ file: r.file, y: r.y, mismatch: s.mismatch, sizeMatch: s.sizeMatch, diff: diffPath });
    console.log(`  画素 ${vpName} y=${String(r.y).padStart(6)}  不一致 ${String(s.mismatch).padStart(6)}%${s.sizeMatch ? "" : "  ※寸法不一致"}`);
  }
  await dctx.close();
  await writeJSON(path.join(OUT, `pixels-${vpName}.json`), stats);
  const avg = +(stats.reduce((s, r) => s + r.mismatch, 0) / (stats.length || 1)).toFixed(2);
  console.log(`画素 ${vpName}: 平均不一致 ${avg}%`);
  return avg;
}

const summary = {};
for (const v of [...PRIMARY, ...SECONDARY]) {
  try {
    summary[v] = { geometry: await geometry(v), pixelAvg: await pixels(v) };
  } catch (e) {
    summary[v] = { error: e.message };
    console.log(`${v}: スキップ (${e.message})`);
  }
}
await writeJSON(path.join(OUT, "summary.json"), summary);
await browser.close();
console.log(`\n結果 → ${OUT}`);
