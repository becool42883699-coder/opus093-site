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
          tint="#3f7fd0"
          tintDensity={1.1}
          ior={1.5}
          thickness={3}
          roughness={mobile ? 0.12 : 0.06}
          dispersion={mobile ? 0.2 : 0.35}
          clearcoat={1}
          depth={0.22}
          bevel={0.35}
          highlight="#5aa2ec"
          environmentIntensity={1.1}
          scale={3.0}
          fov={50}
          cameraDistance={4.2}
          orbit={false}
          zoom={false}
          autoRotate={false}
          floatIntensity={mobile ? 0.35 : 0.5}
          rotationIntensity={mobile ? 0.22 : 0.32}
          floatSpeed={1.1}
          onLoad={() => setLoaded(true)}
          onError={() => setTier(0)}
        />
      )}
      {active && loaded && <HeroRipple ref={rippleRef} />}
    </div>
  );
}
