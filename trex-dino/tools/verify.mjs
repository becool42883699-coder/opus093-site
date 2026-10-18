// 恐竜のページの確認スクリプト。site/ を自前で配信し、Playwright(Chromium)で次を確かめる。
//   1. PC 1440 / スマホ 390: 最後までスクロールして、現れる演出([data-rv] [data-ln] [data-ph])が全部出たか・横にはみ出していないか・コンソールエラー
//   2. JS 無効: 見えない本文(opacity:0 / visibility:hidden)が残っていないか
//   3. 動きを減らす設定(reduced-motion): 動き続けるアニメーションが無いか・見えない本文が無いか
//   4. iPhone SE(375×667): ヒーローのボタンが恐竜(canvas)に重なっていないか
//   5. スマホのタッチ: 縦スワイプでページが動くか・施工実績の写真の帯が横スワイプで動くか
// 撮影した画像は verify-out/ に出る。
//
//   npm install && npx playwright install chromium
//   npm run verify
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("../site/", import.meta.url));
const OUT = fileURLToPath(new URL("../verify-out/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(ROOT, path.endsWith("/") || path === "" ? join(path, "index.html") : path);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });

const PC = { viewport: { width: 1440, height: 900 } };
const SP = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const SE = { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const hiddenText = () => [...document.querySelectorAll("main *")].filter(e => {
  const c = getComputedStyle(e);
  return e.textContent.trim() && (c.opacity === "0" || c.visibility === "hidden");
}).length;

const browser = await chromium.launch();
let failed = 0;
const check = (ok, label, detail = "") => { console.log(`${ok ? "OK  " : "NG  "} ${label}${detail ? "  " + detail : ""}`); if (!ok) failed++; };

// 1. PC / スマホ
for (const [name, opt] of [["pc", PC], ["sp", SP]]) {
  const ctx = await browser.newContext({ ...opt, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(URL_, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, `${name}-hero.png`) });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 400) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(80); }
  await page.waitForTimeout(1200);
  // スマホの写真の帯は、横にめくるまで画面外なので数えない
  const notShown = await page.evaluate(() => [...document.querySelectorAll("[data-rv],[data-ln],[data-ph]")]
    .filter(e => !e.classList.contains("in") && !(e.closest(".steps,.gal") && e.getBoundingClientRect().left >= innerWidth)).length);
  check(notShown === 0, `${name}: 現れる演出が全部出た`, `残り ${notShown}`);
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), `${name}: 横にはみ出していない`);
  for (const sel of ["#service", "#works", ".area", "#company", "#recruit", "#contact"]) {
    await page.evaluate(s => document.querySelector(s).scrollIntoView(), sel); await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT, `${name}-${sel.replace(/\W/g, "")}.png`) });
  }
  check(errors.length === 0, `${name}: コンソールエラーなし`, errors.join(" / "));
  await ctx.close();
}

// 2. JS 無効
{
  const ctx = await browser.newContext({ ...SP, javaScriptEnabled: false });
  const page = await ctx.newPage(); await page.goto(URL_, { waitUntil: "load" }); await page.waitForTimeout(1200);
  const n = await page.evaluate(hiddenText);
  check(n === 0, "JS無効: 見えない本文なし", `${n}件`);
  await page.screenshot({ path: join(OUT, "nojs-sp.png"), fullPage: true });
  await ctx.close();
}

// 3. reduced-motion
{
  const ctx = await browser.newContext({ ...PC, reducedMotion: "reduce" });
  const page = await ctx.newPage(); await page.goto(URL_, { waitUntil: "load" }); await page.waitForTimeout(1500);
  const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length);
  check(running === 0, "reduced-motion: 動き続けるアニメーションなし", `${running}件`);
  check((await page.evaluate(hiddenText)) === 0, "reduced-motion: 見えない本文なし");
  await ctx.close();
}

// 4. iPhone SE
{
  const ctx = await browser.newContext({ ...SE, reducedMotion: "no-preference" });
  const page = await ctx.newPage(); await page.goto(URL_, { waitUntil: "load" }); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({ actions: document.querySelector(".hero .actions").getBoundingClientRect().bottom, dino: document.querySelector(".hero .dino:not([hidden])").getBoundingClientRect().top }));
  check(r.actions <= r.dino, "iPhone SE: ヒーローのボタンが恐竜に重ならない", JSON.stringify(r));
  await page.screenshot({ path: join(OUT, "se-hero.png") });
  await ctx.close();
}

// 5. タッチ
{
  const ctx = await browser.newContext({ ...SP, reducedMotion: "no-preference" });
  const page = await ctx.newPage(); await page.goto(URL_, { waitUntil: "load" }); await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (x0, y0, x1, y1) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y: y0 + (y1 - y0) * i / 8 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(700);
  };
  const y0 = await page.evaluate(() => scrollY);
  await swipe(200, 600, 200, 150);   // ヒーローの恐竜の上から
  check((await page.evaluate(() => scrollY)) > y0 + 100, "タッチ: 恐竜の上でも縦にスクロールできる");
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const e = document.querySelector(".steps"); scrollTo(0, e.getBoundingClientRect().top + scrollY - 200); });
  await page.waitForTimeout(600);
  const b = await page.evaluate(() => { const r = document.querySelector(".steps .shot").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await swipe(b.x + 100, b.y, b.x - 120, b.y);
  check((await page.evaluate(() => document.querySelector(".steps").scrollLeft)) > 50, "タッチ: 施工実績の写真の帯が横に動く");
  const ys = await page.evaluate(() => scrollY);
  await swipe(b.x, b.y + 60, b.x, b.y - 260);
  check((await page.evaluate(() => scrollY)) > ys + 100, "タッチ: 写真の帯の上でも縦にスクロールできる");
  await ctx.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} 件 NG。verify-out/ の画像も見ること。` : "\nすべて OK。verify-out/ の画像も目で見ること(数字だけで合格にしない)。");
process.exit(failed ? 1 : 0);
