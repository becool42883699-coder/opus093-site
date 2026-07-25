"use client";

/**
 * ヒーローのロゴを Canvas UI「Glass Object」(公式, Three.js/WebGL)で
 * ガラス質の立体として表示する。SVG(gb-cube)を押し出してガラス素材化し、
 * スタジオ環境の映り込み・屈折・わずかな分散でブランドのキューブを見せる。
 *
 * 状態: svg(準備中の淡い下地) → loaded(Glass読込完了/淡くクロスフェード) → ripple可
 *  - 初期表示は背景写真とコピーが主役。SVGは最終ガラスロゴと同位置・同サイズの
 *    「低い不透明度の下地」に留め、読込後に自然にクロスフェード(切替は見せない)。
 *  - reduced-motion / WebGL非対応 / 低性能・saveData: ガラスを起動せず実SVGを表示
 *  - three は動的import・クライアント限定。画面外/タブ非表示で停止(GPU解放)
 *  - Rippleは loaded 後のみ、ロゴ領域クリック/タップで発生
 */

/* クライアント能力検出後に SVG→ガラスへ切替える性質上、マウント後の同期setStateが
   必要(SSRとのhydration不一致を避けるため初期描画は必ずSVG)。よって
   react-hooks/set-state-in-effect は本ファイルで無効化する(誤検知)。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType, MouseEvent } from "react";
import styles from "./becool.module.css";
import { CUBE_MARK_D } from "./brandLogo";
import type { GlassObjectProps } from "./vendor/canvas-ui/GlassObject";
import HeroRipple, { type RippleHandle } from "./HeroRipple";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// three を含むエンジンはクライアントで必要時のみ遅延読込(初期バンドルに載せない)
const GlassObject = dynamic(
  () => import("./vendor/canvas-ui/GlassObject").then((m) => m.GlassObject),
  { ssr: false },
) as ComponentType<GlassObjectProps>;

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/** ガラス表示の可否/ティア。0 = 通常SVGへフォールバック / 1 = モバイル / 2 = PC */
function pickTier(): 0 | 1 | 2 {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData === true) return 0; // データセーバー: SVG
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  if (cores <= 2 || mem <= 1) return 0; // 低性能端末: SVG(透過ガラスは負荷が高い)
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  return mobile ? 1 : 2;
}

/**
 * 実SVGロゴ。
 *  - placeholder=true(ガラス起動時): 最終ガラスロゴと同位置・同サイズの淡い下地。
 *    読込完了(hidden)で自然にフェードアウトしてガラスへクロスフェード。
 *  - placeholder=false(reduced/非対応/低性能): 通常の実ロゴ(不透明)。
 */
function CubeSvg({ hidden, placeholder }: { hidden: boolean; placeholder: boolean }) {
  return (
    <svg
      className={styles.particleFallback}
      data-placeholder={placeholder ? "true" : undefined}
      data-hidden={hidden ? "true" : undefined}
      viewBox="480 160 480 580"
      role="img"
      aria-label="GARAGE BeCool ロゴ"
      aria-hidden={placeholder ? "true" : undefined}
    >
      <defs>
        <linearGradient id="pfGlassCube" gradientUnits="userSpaceOnUse" x1="532" y1="193" x2="915" y2="691">
          <stop offset="0" stopColor="#1e3252" />
          <stop offset="0.5" stopColor="#2f6bb0" />
          <stop offset="1" stopColor="#5aa2ec" />
        </linearGradient>
      </defs>
      <path d={CUBE_MARK_D} fill="url(#pfGlassCube)" fillRule="evenodd" />
    </svg>
  );
}

export default function HeroGlassLogo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<RippleHandle>(null);
  const [tier, setTier] = useState(0); // 0 = 通常SVG(ガラスを起動しない)
  const [mobile, setMobile] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [loaded, setLoaded] = useState(false); // Glass Object 読込完了
  const [decided, setDecided] = useState(false); // 能力判定の完了

  // 能力判定(reduced-motion / WebGL / 端末性能)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(window.matchMedia("(max-width: 700px)").matches);
    if (reduce || !hasWebGL()) {
      setTier(0);
      setDecided(true);
      return;
    }
    setTier(pickTier());
    setDecided(true);
  }, []);

  // 画面外・タブ非表示で停止(アンマウントでGPU解放), 復帰で再生
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const active = tier > 0 && onScreen && tabVisible;

  // active が落ちたら状態をリセット
  useEffect(() => {
    if (active) return;
    setLoaded(false);
  }, [active]);

  // 回転は使わず、スクロールに合わせて静かに2〜4度だけ傾ける(CSSの3D transform)。
  // reduced-motion では傾けない。1つの scroll ハンドラ + rAF のみ。
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const MAX = 3.5; // 最大傾き(度)
    el.style.willChange = "transform";
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // ロゴ中心が画面中央からどれだけ上下にずれているか(概ね -1..1)
      const off = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / (vh / 2)));
      const rx = (-off * MAX).toFixed(2); // 上に行くほど少し上向き、下がると手前へ
      const ry = (off * (MAX * 0.5)).toFixed(2);
      el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.style.transform = "";
    };
  }, []);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!loaded) return; // 読込完了まで Ripple 無効
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    rippleRef.current?.spawn(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.particleWrap} ${mobile ? styles.particleWrapMobile : ""}`}
      onClick={onClick}
    >
      {/* 判定前 or ガラス起動時: 最終ロゴと同位置・同サイズの淡い下地(loadedでフェード
          アウト)。判定後にガラスなしと確定した時だけ実ロゴ(不透明)。 */}
      <CubeSvg hidden={loaded} placeholder={!decided || tier > 0} />
      {active && (
        <GlassObject
          className={`${styles.particleCanvas} ${loaded ? styles.particleCanvasIn : ""}`}
          src={`${BASE}/becool/img/gb-cube.svg`}
          background=""
          /* ロゴ本来のネイビー〜明るいブルーを保つ。白く抜けないようしっかり色を乗せるが、
             濃い青の“透明ガラス”ではなくマットな模型的ブルーにする(密度で発色) */
          tint="#2f62b0"
          tintDensity={2.6}
          /* 屈折・立体感・厚み(見た目)は最小限。色の濃さ用にthicknessのみ少し持たせる */
          ior={1.26}
          thickness={1.6}
          depth={0.045}
          bevel={0.1}
          /* マットな質感(強い白ハイライト/発光輪郭を出さない)。ただし白飛びしない程度 */
          roughness={mobile ? 0.38 : 0.33}
          dispersion={0}
          clearcoat={0.06}
          /* 輪郭光はくすんだ明るいブルー(白く強く光らせない)。環境光は控えめ */
          highlight="#6aa6e8"
          environmentIntensity={0.6}
          scale={3.0}
          fov={44}
          cameraDistance={4.4}
          orbit={false}
          zoom={false}
          autoRotate={false}
          /* 常時の浮遊・回転は無し(傾きはスクロールでCSS制御) */
          floatIntensity={0}
          rotationIntensity={0}
          floatSpeed={0}
          onLoad={() => setLoaded(true)}
          onError={() => setTier(0)}
        />
      )}
      {active && loaded && <HeroRipple ref={rippleRef} />}
    </div>
  );
}
