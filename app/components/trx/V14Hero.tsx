"use client";

/**
 * トップのヒーロー。ユーザー制作の v14(trex-pendev-preview、2026-09-25)のヒーローを
 * **見た目はそのまま**移植したもの(ユーザー指定「ヒーローはこのままにしたい」)。
 *
 * v14 との違いは作りだけ:
 *  - v14 は幅957pxの絵を画面幅へ縮める(zoom)作りで、スマホでは文字が4〜5pxになっていた。
 *    ここでは各要素を画面幅に合わせて配置し直している。
 *  - 動画は元の4K(14MB)を見た目そのままに 1080p / 720p へ変換(PC / スマホで出し分け)。
 *  - 背面に重なっていた「デザインツールの画面キャプチャ」(v14 の ghost レイヤー)は持ち込まない。
 *
 * 振る舞い(v14 と同じ):
 *  - 動画は1回だけ再生。吠える瞬間(4.75秒)に「T-Rex CO., LTD.」のロックアップが現れる。
 *  - 動画を再生できない・reduced-motion・通信節約では、吠える場面の静止画とロックアップを最初から出す。
 *  - JS が動かない場合も、CSS の保険(9秒後)でロックアップが必ず表示される。
 */

import { useEffect, useRef, useState } from "react";
import { scrollToElement } from "../lenisBridge";
import { asset } from "./site";
import site from "./site.module.css";
import t from "./hero.module.css";

const ROAR_CUE = 4.75;

/* 初回ペイント前に走らせ、演出を出す環境だけロックアップを隠しておく(チラつき防止) */
export const HERO_PROBE = `try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches,c=navigator.connection;if(!r&&!(c&&c.saveData)){var h=document.documentElement;h.setAttribute('data-hero-intro','');h.setAttribute('data-hero-video','')}}catch(e){}`;

export default function V14Hero({ nextId }: { nextId: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [roar, setRoar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const v = video.current;
    const reveal = () => {
      setRoar(true);
      root.removeAttribute("data-hero-intro");
    };
    const toStill = () => {
      setStill(true);
      reveal();
    };
    if (!v || !root.hasAttribute("data-hero-video")) {
      const id = requestAnimationFrame(toStill);
      return () => cancelAnimationFrame(id);
    }
    const src = window.matchMedia("(min-width: 820px)").matches ? "/media/trex-hero-1080.mp4" : "/media/trex-hero-720.mp4";
    v.src = asset(src);
    const onTime = () => {
      if (v.duration) setProgress(Math.min(1, v.currentTime / v.duration));
      if (v.currentTime >= ROAR_CUE) reveal();
    };
    const onEnded = () => {
      setProgress(1);
      reveal();
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    v.addEventListener("error", toStill);
    let guard = 0;
    const start = () => {
      /* 自動再生が拒否された(省電力モード等)ら静止画へ */
      v.play()?.catch(toStill);
      /* 読み込みが遅すぎる場合の保険 */
      guard = window.setTimeout(() => {
        if (v.readyState < 2) toStill();
      }, 6000);
    };
    /* ロード画面(Loader.tsx)が出ている間は再生を待つ。吠える瞬間を幕の裏で消費しないため */
    let loaderGuard = 0;
    if (root.hasAttribute("data-loading")) {
      window.addEventListener("trex:loaded", start, { once: true });
      /* ロード画面が何かで止まっても7.5秒で再生を始める */
      loaderGuard = window.setTimeout(() => {
        window.removeEventListener("trex:loaded", start);
        start();
      }, 7500);
      window.addEventListener("trex:loaded", () => window.clearTimeout(loaderGuard), { once: true });
    } else start();
    return () => {
      window.removeEventListener("trex:loaded", start);
      window.clearTimeout(guard);
      window.clearTimeout(loaderGuard);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("error", toStill);
    };
  }, []);

  const enter = () => {
    const target = document.getElementById(nextId);
    if (target) scrollToElement(target, -60);
  };

  return (
    <section className={t.hero} aria-labelledby="hero-title" data-hero data-still={still ? "true" : undefined}>
      <div className={t.stage} aria-hidden="true">
        <video
          ref={video}
          className={t.video}
          muted playsInline preload="auto"
          poster={asset("/media/trex-hero-poster.webp")}
          tabIndex={-1}
        />
        <div className={t.grid} />
        <div className={t.halo} />
      </div>

      <div className={t.meta} aria-hidden="true">
        <span>N 33° 53′ 10.7″ E 130° 53′ 42.2″</span>
        <span>BRAND / 001</span>
      </div>
      <p className={t.vertical} aria-hidden="true">NEVER STOP THE SITE</p>

      <div className={t.lockup} data-on={roar ? "true" : undefined}>
        <p className={t.eyebrow}>T-REX CO., LTD. / INDUSTRIAL SERVICE</p>
        <h1 id="hero-title" className={t.logo}>
          <span className={t.word}>T-Rex</span>
          <span className={t.co}>CO., LTD.</span>
          <span className={site.srOnly}> — 現場を、止めない。福岡・山口の板金塗装・荷台換装・出張修理・車両陸送</span>
        </h1>
        <p className={t.built}><b>BUILT</b><i aria-hidden="true" /><em>TO REPAIR.</em></p>
        <p className={t.field}>FIELD PARTNER FOR THE NEXT JOB.</p>
      </div>

      <div className={t.bar}>
        <span className={t.idx} aria-hidden="true">
          <b>01</b>
          <i><span style={{ transform: `scaleX(${roar && progress === 0 ? 1 : progress})` }} /></i>
          <span>03</span>
        </span>
        <span className={t.area}>FUKUOKA / YAMAGUCHI</span>
        <button className={t.enter} type="button" onClick={enter}>
          SCROLL TO ENTER<i aria-hidden="true">↓</i>
        </button>
      </div>
    </section>
  );
}
