"use client";

/**
 * トップのロード画面。公式ロゴが読み込みの進み具合に合わせて左から満ちていき、
 * 100% で幕が上がってヒーロー(V14Hero)の動画が始まる。
 *
 * - 進み具合は本物の読み込み: ヒーロー動画のバッファ(吠える場面まで)・Webフォント・画像。
 *   iPhone のように再生前は動画を先読みしないブラウザでは、動画の分を待たない。
 * - 1セッションに1回だけ(sessionStorage)。reduced-motion では出さない。
 * - 出すかどうかは初回ペイント前のスクリプト(LOADER_PROBE)が html[data-loading] で決める。
 *   JS無効ならそもそも出ない。JS が途中で止まっても CSS の保険で7秒後に消える。
 * - 命綱: ロード中も電話はかけられる(画面下に電話ボタンを置く)。
 * - 最短 2 秒(演出を見せる) / 最長 5 秒(それ以上は待たせない)。
 */

import { useEffect, useRef } from "react";
import { Logo, PhoneGlyph } from "./Icon";
import { TEL, TEL_HREF } from "./site";
import l from "./loader.module.css";

const KEY = "trex-loaded";
const MIN_MS = 2000;
const MAX_MS = 5000;
const ROAR_SEC = 5.5; // この秒数まで動画が溜まれば、吠える場面まで途切れず再生できる

export const LOADER_PROBE = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('${KEY}'))document.documentElement.setAttribute('data-loading','')}catch(e){}`;

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || !html.hasAttribute("data-loading")) return;

    const t0 = performance.now();
    el.dataset.run = "";
    let fonts = 0;
    let loaded = document.readyState === "complete" ? 1 : 0;
    // CSS の creep(2.4秒で20%)がここまで進めた分から引き継ぐ
    let shown = Math.min(0.2, (performance.now() / 2400) * 0.2);
    let frame = 0;
    let done = false;
    let exitTimer = 0;
    document.fonts?.ready.then(() => (fonts = 1)).catch(() => (fonts = 1));
    const onLoad = () => (loaded = 1);
    window.addEventListener("load", onLoad);

    const videoShare = () => {
      const v = document.querySelector<HTMLVideoElement>("[data-hero] video");
      // 動画を使わない(静止画に落ちた・JS判定で不要)なら待たない
      if (!v || !html.hasAttribute("data-hero-video") || !v.src) return 1;
      if (v.readyState >= 4) return 1;
      const b = v.buffered;
      const end = b.length ? b.end(b.length - 1) : 0;
      // 1.5秒たっても1バイトも溜まらない = 再生前は先読みしないブラウザ。待たない
      if (!b.length && performance.now() - t0 > 1500) return 1;
      return Math.min(1, end / ROAR_SEC);
    };

    const finish = () => {
      done = true;
      el.dataset.state = "out";
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* プライベートモード等では毎回出るだけ */
      }
      exitTimer = window.setTimeout(() => {
        html.removeAttribute("data-loading");
        el.dataset.state = "gone";
        window.dispatchEvent(new Event("trex:loaded"));
      }, 900);
    };

    // 時刻はナビゲーション開始からの経過(performance.now)で測る
    const tick = (now: number) => {
      let target = fonts * 0.15 + loaded * 0.2 + videoShare() * 0.65;
      if (now > MAX_MS) target = 1;
      // 最短時間の間は 100 まで行かせない(一瞬で消えると演出が見えない)
      const cap = Math.min(1, now / MIN_MS);
      target = Math.min(target, cap);
      shown += (target - shown) * 0.12;
      if (target >= 1 && shown > 0.995) shown = 1;
      const pct = Math.round(shown * 100);
      if (count.current) count.current.textContent = String(pct).padStart(3, "0");
      if (fill.current) fill.current.style.clipPath = `inset(0 ${100 - shown * 100}% 0 0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (shown >= 1 && !done) finish();
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div ref={root} className={l.loader} role="status" aria-label="読み込み中">
      <div className={l.meta} aria-hidden="true">
        <span>N 33° 53′ 10.7″ E 130° 53′ 42.2″</span>
        <span>LOADING / 001</span>
      </div>
      <div className={l.center} aria-hidden="true">
        <div className={l.logo}>
          <Logo className={l.logoDim} />
          <div ref={fill} className={l.logoFill}><Logo className={l.logoImg} /></div>
        </div>
        <p className={l.tag}>NEVER STOP THE SITE</p>
      </div>
      <div className={l.bottom}>
        <p className={l.count} aria-hidden="true"><span ref={count}>000</span><small>%</small></p>
        <div className={l.bar} aria-hidden="true"><i ref={bar} /></div>
        {/* 命綱: ロード中も電話できる */}
        <a className={l.tel} href={TEL_HREF} aria-label={`電話でお問い合わせ ${TEL}`}>
          <PhoneGlyph className={l.telGlyph} />{TEL}
        </a>
      </div>
    </div>
  );
}
