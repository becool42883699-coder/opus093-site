#!/usr/bin/env node
/**
 * koueikasei.jp リファレンス採取ハーネス
 *
 * 元サイトを実ブラウザで開き、再現に必要な一次情報を機械的に吸い出す。
 * 目測を一切挟まないための土台で、出力がそのまま実装の根拠になる。
 *
 *   node scripts/koueikasei/capture-reference.mjs            # 全フェーズ
 *   node scripts/koueikasei/capture-reference.mjs shots dom  # 一部だけ
 *
 * フェーズ:
 *   assets  … 全ネットワーク応答を保存し、実際に使われている素材一覧を確定
 *   dom     … 各ブレークポイントの outerHTML と要素ツリー
 *   styles  … 主要要素の Computed Style + 文書座標での矩形（幅ごと）
 *   shots   … 指定幅のフルページ / ビューポート連続スクショ
 *   motion  … スクロール段階ごとの transform / opacity / clip-path 追跡
 *   hero    … ヒーロー画像の切替周期を時系列バーストで採取
 *   menu    … SP のメニュー開閉（閉→開の連続フレーム）
 *
 * 環境:
 *   KK_TARGET  対象URL（既定 https://koueikasei.jp/）
 *   KK_OUT     出力先（既定 reference/koueikasei）
 *
 * 注意: ヘッドレス Chromium は既定で prefers-reduced-motion: reduce のため、
 *       全コンテキストで reducedMotion:'no-preference' を明示している（CLAUDE.md §3-9）。
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const TARGET = process.env.KK_TARGET || "https://koueikasei.jp/";
const OUT = path.resolve(process.env.KK_OUT || "reference/koueikasei");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** 元サイトの切替点を跨ぐように取る。mobile 幅は実機同等のタッチ/DPR で。 */
const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080, dpr: 1, mobile: false },
  { name: "1440x900",  width: 1440, height: 900,  dpr: 1, mobile: false },
  { name: "1280x800",  width: 1280, height: 800,  dpr: 1, mobile: false },
  { name: "1024x768",  width: 1024, height: 768,  dpr: 1, mobile: false },
  { name: "768x1024",  width: 768,  height: 1024, dpr: 2, mobile: true  },
  { name: "600x800",   width: 600,  height: 800,  dpr: 2, mobile: true  },
  { name: "430x932",   width: 430,  height: 932,  dpr: 3, mobile: true  },
  { name: "390x844",   width: 390,  height: 844,  dpr: 3, mobile: true  },
  { name: "375x812",   width: 375,  height: 812,  dpr: 3, mobile: true  },
];

/** 依頼で列挙された計測項目をそのまま Computed Style として拾う。 */
const STYLE_PROPS = [
  "position","top","right","bottom","left","zIndex","display","boxSizing",
  "width","height","maxWidth","minWidth","maxHeight","minHeight",
  "marginTop","marginRight","marginBottom","marginLeft",
  "paddingTop","paddingRight","paddingBottom","paddingLeft",
  "gap","rowGap","columnGap",
  "flexDirection","flexWrap","justifyContent","alignItems","flexBasis","flexGrow","flexShrink",
  "gridTemplateColumns","gridTemplateRows","gridColumn","gridRow","gridAutoFlow",
  "fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing","textAlign",
  "textTransform","whiteSpace","writingMode","textOrientation","fontFeatureSettings",
  "color","backgroundColor","backgroundImage","backgroundSize","backgroundPosition","backgroundRepeat",
  "borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth",
  "borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","borderStyle","borderRadius",
  "boxShadow","opacity","overflow","overflowX","overflowY",
  "objectFit","objectPosition","aspectRatio",
  "transform","transformOrigin","transition","animation","willChange",
  "clipPath","mixBlendMode","filter","backdropFilter","pointerEvents","visibility",
];

const phases = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const want = (p) => phases.length === 0 || phases.includes(p);

const ensure = (p) => fs.mkdir(p, { recursive: true });
const writeJSON = (p, v) => fs.writeFile(p, JSON.stringify(v, null, 2));

/** ページが「静止」するまで待つ: ネットワーク・フォント・遅延画像。 */
async function settle(page, { scrollSweep = true } = {}) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  if (scrollSweep) {
    // lazy-load を全部発火させてから先頭へ戻す
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

async function newCtx(browser, vp) {
  return browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: "no-preference", // ヘッドレス既定の reduce を明示的に外す
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    userAgent: vp.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
}

/* ───────────────────────── assets ───────────────────────── */
async function phaseAssets(browser) {
  const dir = path.join(OUT, "assets");
  await ensure(dir);
  const log = [];
  const seen = new Set();

  // PC と SP の両方を踏んで、幅で出し分けている素材を取りこぼさない
  for (const vp of [VIEWPORTS[1], VIEWPORTS[7]]) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();

    page.on("response", async (res) => {
      const url = res.url();
      if (seen.has(url)) return;
      seen.add(url);
      const ct = res.headers()["content-type"] || "";
      let bytes = null;
      try { bytes = await res.body(); } catch { /* リダイレクト等 */ }
      log.push({
        url, status: res.status(), contentType: ct,
        bytes: bytes?.length ?? null, viewport: vp.name,
        type: res.request().resourceType(),
      });
      if (!bytes) return;
      try {
        const u = new URL(url);
        const rel = path.join(u.host, u.pathname.replace(/\/$/, "/index.html"));
        const dest = path.join(dir, rel);
        await ensure(path.dirname(dest));
        await fs.writeFile(dest, bytes);
      } catch { /* 保存できない URL は一覧だけ残す */ }
    });

    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page);
    await ctx.close();
  }

  log.sort((a, b) => a.url.localeCompare(b.url));
  await writeJSON(path.join(OUT, "assets.json"), log);

  const images = log.filter((r) => r.type === "image" || /^image\//.test(r.contentType));
  console.log(`assets: ${log.length} 件 (画像 ${images.length} 件) → ${dir}`);
  for (const i of images) console.log(`  ${String(i.bytes).padStart(9)}  ${i.url}`);
}

/* ───────────────────────── dom ───────────────────────── */
async function phaseDom(browser) {
  const dir = path.join(OUT, "dom");
  await ensure(dir);
  for (const vp of VIEWPORTS) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page);
    await fs.writeFile(
      path.join(dir, `${vp.name}.html`),
      await page.evaluate(() => document.documentElement.outerHTML)
    );
    // 骨格だけの軽い木も残す（差分を読むとき用）
    const tree = await page.evaluate(() => {
      const walk = (el, depth) => {
        if (depth > 6) return null;
        const cs = getComputedStyle(el);
        if (cs.display === "none") return null;
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          cls: el.className && typeof el.className === "string" ? el.className : undefined,
          rect: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)],
          text: el.children.length === 0 ? (el.textContent || "").trim().slice(0, 120) || undefined : undefined,
          kids: [...el.children].map((c) => walk(c, depth + 1)).filter(Boolean),
        };
      };
      return walk(document.body, 0);
    });
    await writeJSON(path.join(dir, `${vp.name}.tree.json`), tree);
    await ctx.close();
    console.log(`dom: ${vp.name}`);
  }
}

/* ───────────────────────── styles ───────────────────────── */
async function phaseStyles(browser) {
  const dir = path.join(OUT, "styles");
  await ensure(dir);
  for (const vp of VIEWPORTS) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page);

    const data = await page.evaluate((props) => {
      const out = [];
      const significant = (el) => {
        const tag = el.tagName.toLowerCase();
        if (["script","style","noscript","meta","link","br"].includes(tag)) return false;
        if (["img","picture","source","svg","video","canvas","a","button","input","hr"].includes(tag)) return true;
        if (/^h[1-6]$/.test(tag)) return true;
        if (["header","footer","nav","main","section","article","aside","ul","ol","li","figure","figcaption","p","span","em","strong","small","dl","dt","dd"].includes(tag)) return true;
        return !!(el.className && typeof el.className === "string");
      };
      let idx = 0;
      const path_ = (el) => {
        const parts = [];
        for (let n = el; n && n.nodeType === 1 && parts.length < 8; n = n.parentElement) {
          let s = n.tagName.toLowerCase();
          if (n.id) { parts.unshift(`${s}#${n.id}`); break; }
          if (n.className && typeof n.className === "string") {
            s += "." + n.className.trim().split(/\s+/).slice(0, 3).join(".");
          }
          const sibs = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [];
          if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(n) + 1})`;
          parts.unshift(s);
        }
        return parts.join(" > ");
      };
      for (const el of document.querySelectorAll("*")) {
        if (!significant(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const style = {};
        for (const p of props) style[p] = cs[p];
        const rec = {
          i: idx++,
          sel: path_(el),
          tag: el.tagName.toLowerCase(),
          rect: { x: +(r.x).toFixed(2), y: +(r.y + scrollY).toFixed(2), w: +(r.width).toFixed(2), h: +(r.height).toFixed(2) },
          style,
        };
        if (el.tagName === "IMG") {
          rec.img = { src: el.currentSrc || el.src, natural: [el.naturalWidth, el.naturalHeight], alt: el.alt, loading: el.loading, w: el.getAttribute("width"), h: el.getAttribute("height") };
        }
        if (el.tagName === "SOURCE") rec.source = { srcset: el.srcset, media: el.media, type: el.type };
        if (el.tagName === "A") rec.href = el.getAttribute("href");
        const direct = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
        if (direct) rec.text = direct.slice(0, 200);
        out.push(rec);
      }
      return out;
    }, STYLE_PROPS);

    await writeJSON(path.join(dir, `${vp.name}.json`), data);
    await ctx.close();
    console.log(`styles: ${vp.name} — ${data.length} 要素`);
  }

  // CSS カスタムプロパティ（配色トークン）を :root から抜く
  const ctx = await newCtx(browser, VIEWPORTS[1]);
  const page = await ctx.newPage();
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await settle(page, { scrollSweep: false });
  const vars = await page.evaluate(() => {
    const found = {};
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules || []) {
        if (!rule.style) continue;
        for (const p of rule.style) {
          if (p.startsWith("--")) found[p] = rule.style.getPropertyValue(p).trim();
        }
      }
    }
    return found;
  });
  await writeJSON(path.join(OUT, "css-variables.json"), vars);
  console.log(`styles: CSS変数 ${Object.keys(vars).length} 件`);
  await ctx.close();
}

/* ───────────────────────── shots ───────────────────────── */
async function phaseShots(browser) {
  const dir = path.join(OUT, "shots");
  await ensure(dir);
  for (const vp of VIEWPORTS) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page);

    await page.screenshot({ path: path.join(dir, `${vp.name}-full.png`), fullPage: true });

    // 1画面ずつ刻んで撮る（スクロール演出の発火後の状態も含む）
    const vdir = path.join(dir, vp.name);
    await ensure(vdir);
    const total = await page.evaluate(() => document.body.scrollHeight);
    const steps = Math.ceil(total / vp.height);
    for (let s = 0; s < steps; s++) {
      const y = s * vp.height;
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(900); // scrub の追従待ち
      await page.screenshot({ path: path.join(vdir, `y${String(y).padStart(6, "0")}.png`) });
    }
    await ctx.close();
    console.log(`shots: ${vp.name} — full + ${steps} 面 (総高 ${total}px)`);
  }
}

/* ───────────────────────── motion ───────────────────────── */
async function phaseMotion(browser) {
  const dir = path.join(OUT, "motion");
  await ensure(dir);
  for (const vp of [VIEWPORTS[1], VIEWPORTS[7]]) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    // 一度掃いて遅延読込を温めてから reload する。
    // スクロール演出は多くが一度きりの発火なので、掃いたまま追跡すると
    // 「最初から全部出ている」状態しか見えず、開始位置を取り逃す。
    await settle(page);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page, { scrollSweep: false });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    // GSAP / ScrollTrigger が載っているなら設定値を直接吐かせる
    const gsapInfo = await page.evaluate(() => {
      const g = window.gsap, ST = window.ScrollTrigger;
      if (!g) return { gsap: false };
      const triggers = ST?.getAll?.().map((t) => ({
        trigger: t.trigger?.tagName?.toLowerCase() + (t.trigger?.className ? "." + String(t.trigger.className).trim().split(/\s+/).join(".") : ""),
        start: t.vars?.start, end: t.vars?.end, scrub: t.vars?.scrub, pin: !!t.vars?.pin,
        toggleActions: t.vars?.toggleActions,
        startPx: Math.round(t.start), endPx: Math.round(t.end),
      })) || [];
      const tweens = g.globalTimeline?.getChildren?.(true, true, true)?.slice(0, 200).map((t) => ({
        duration: t.duration?.(), delay: t.vars?.delay, ease: String(t.vars?.ease?.name || t.vars?.ease || ""),
        stagger: t.vars?.stagger, targets: t.targets?.().slice(0, 3).map((e) => e.tagName?.toLowerCase?.() + (e.className ? "." + String(e.className).trim().split(/\s+/)[0] : "")),
        vars: Object.fromEntries(Object.entries(t.vars || {}).filter(([k]) => !["scrollTrigger","onComplete","onUpdate","callbackScope"].includes(k)).map(([k, v]) => [k, typeof v === "function" ? "fn" : v])),
      })) || [];
      return { gsap: true, version: g.version, scrollTrigger: !!ST, triggers, tweens };
    });
    await writeJSON(path.join(dir, `${vp.name}.gsap.json`), gsapInfo);

    // スクロール量に対する各要素の状態を追跡し、演出の開始/終了位置を実測する
    const track = [];
    const total = await page.evaluate(() => document.body.scrollHeight);
    const STEPS = 60;
    for (let s = 0; s <= STEPS; s++) {
      const y = Math.round((total - vp.height) * (s / STEPS));
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(260);
      const frame = await page.evaluate(() => {
        const rows = [];
        for (const el of document.querySelectorAll("section, header, footer, [class*=sec], [class*=Sec], h1, h2, h3, img, picture, figure, [class*=marquee], [class*=Marquee], [class*=slide], [class*=Slide]")) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (r.bottom < -600 || r.top > innerHeight + 600) continue;
          rows.push({
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0,2).join(".") : ""),
            top: Math.round(r.top), h: Math.round(r.height),
            opacity: cs.opacity, transform: cs.transform === "none" ? undefined : cs.transform,
            clipPath: cs.clipPath === "none" ? undefined : cs.clipPath,
            filter: cs.filter === "none" ? undefined : cs.filter,
          });
        }
        return { scrollY: Math.round(scrollY), rows };
      });
      track.push(frame);
    }
    await writeJSON(path.join(dir, `${vp.name}.track.json`), track);
    await ctx.close();
    console.log(`motion: ${vp.name} — GSAP=${gsapInfo.gsap} trigger=${gsapInfo.triggers?.length ?? 0} / ${track.length} 断面`);
  }
}

/* ───────────────────────── hero ───────────────────────── */
async function phaseHero(browser) {
  const dir = path.join(OUT, "hero");
  await ensure(dir);
  for (const vp of [VIEWPORTS[1], VIEWPORTS[7]]) {
    const ctx = await newCtx(browser, vp);
    const page = await ctx.newPage();
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page, { scrollSweep: false });
    const vdir = path.join(dir, vp.name);
    await ensure(vdir);

    // 30秒を 0.5秒刻みで。切替の周期・順番・トランジションを後から読む
    const states = [];
    for (let t = 0; t < 60; t++) {
      const ms = t * 500;
      await page.screenshot({ path: path.join(vdir, `t${String(ms).padStart(5, "0")}.png`) });
      states.push(await page.evaluate(() => {
        const rows = [];
        for (const el of document.querySelectorAll("img, picture source, [style*=background-image], [class*=fv], [class*=hero], [class*=Hero], [class*=slide], [class*=Slide]")) {
          const cs = getComputedStyle(el);
          if (cs.display === "none") continue;
          rows.push({
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0,2).join(".") : ""),
            src: el.currentSrc || el.srcset || undefined,
            bg: cs.backgroundImage === "none" ? undefined : cs.backgroundImage,
            opacity: cs.opacity, transform: cs.transform === "none" ? undefined : cs.transform,
            cls: el.className && typeof el.className === "string" ? el.className : undefined,
          });
        }
        return { t: performance.now() | 0, rows };
      }));
      await page.waitForTimeout(500);
    }
    await writeJSON(path.join(dir, `${vp.name}.states.json`), states);
    await ctx.close();
    console.log(`hero: ${vp.name} — 60 フレーム`);
  }
}

/* ───────────────────────── menu ───────────────────────── */
async function phaseMenu(browser) {
  const dir = path.join(OUT, "menu");
  await ensure(dir);
  const vp = VIEWPORTS[7]; // 390x844
  const ctx = await newCtx(browser, vp);
  const page = await ctx.newPage();
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await settle(page, { scrollSweep: false });

  await page.screenshot({ path: path.join(dir, "00-closed.png") });

  // それらしい開閉ボタンを総当たりで探す
  const btn = await page.evaluate(() => {
    const cands = [...document.querySelectorAll("button, a, div, span")].filter((el) => {
      const c = (el.className && typeof el.className === "string" ? el.className : "") + " " + (el.id || "") + " " + (el.getAttribute("aria-label") || "");
      return /menu|hamburger|burger|nav-?toggle|drawer|toggle/i.test(c);
    });
    const el = cands.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight; });
    if (!el) return null;
    el.setAttribute("data-kk-menu-btn", "1");
    const r = el.getBoundingClientRect();
    return { tag: el.tagName.toLowerCase(), cls: el.className, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
  });
  await writeJSON(path.join(dir, "button.json"), btn);

  if (btn) {
    await page.click("[data-kk-menu-btn]");
    for (let f = 0; f < 14; f++) {
      await page.screenshot({ path: path.join(dir, `open-${String(f).padStart(2, "0")}.png`) });
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(dir, "10-open-settled.png") });
    await fs.writeFile(path.join(dir, "open.html"), await page.evaluate(() => document.body.outerHTML));
    console.log(`menu: 開閉ボタン ${btn.tag}.${btn.cls} を検出、連続フレーム取得`);
  } else {
    console.log("menu: 開閉ボタンを自動検出できず。dom/390x844.html を目視して手動指定が必要。");
  }
  await ctx.close();
}

/* ───────────────────────── main ───────────────────────── */
const browser = await chromium.launch({ executablePath: CHROME });
await ensure(OUT);
await writeJSON(path.join(OUT, "capture-meta.json"), {
  target: TARGET, capturedAt: new Date().toISOString(),
  chromium: browser.version(), viewports: VIEWPORTS,
});

try {
  if (want("assets")) await phaseAssets(browser);
  if (want("dom"))    await phaseDom(browser);
  if (want("styles")) await phaseStyles(browser);
  if (want("shots"))  await phaseShots(browser);
  if (want("motion")) await phaseMotion(browser);
  if (want("hero"))   await phaseHero(browser);
  if (want("menu"))   await phaseMenu(browser);
} finally {
  await browser.close();
}
console.log(`\n完了 → ${OUT}`);
