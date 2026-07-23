"use client";

/**
 * ヒーローのロゴを Canvas UI「Particle Object」(公式React版, Three.js/WebGL)で
 * 粒子化して表示する。既存実装は維持し、状態管理・性能ティア・Rippleを追加。
 *
 * 状態: svg(初期/フォールバック) → loaded(Particle Object読込完了/SVGから切替)
 *        → formed(約1.8sで集合完了) → ripple操作可能
 *  - reduced-motion / WebGL非対応 / 低性能・saveData: 粒子を起動せず実SVGを表示
 *  - 読込中はロゴ(実SVG)を消さない。onLoad後にクロスフェードで粒子へ
 *  - three は動的import・クライアント限定。画面外/タブ非表示で停止(GPU解放)
 *  - Rippleは formed 後のみ、ロゴ領域クリック/タップで発生
 */

/* この演出は「クライアント能力検出(WebGL/reduced-motion/端末性能)後に SVG→粒子
   へ切替」という性質上、マウント後の同期setStateが必要(SSRとのhydration不一致を
   避けるため初期描画は必ずSVG)。よって react-hooks/set-state-in-effect は本ファイル
   で無効化する(誤検知)。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType, MouseEvent } from "react";
import styles from "./becool.module.css";
import { CUBE_MARK_D } from "./brandLogo";
import type { ParticleObjectProps } from "./vendor/canvas-ui/ParticleObject";
import HeroRipple, { type RippleHandle } from "./HeroRipple";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// three を含むエンジンはクライアントで必要時のみ遅延読込(初期バンドルに載せない)
const ParticleObject = dynamic(
  () => import("./vendor/canvas-ui/ParticleObject").then((m) => m.ParticleObject),
  { ssr: false },
) as ComponentType<ParticleObjectProps>;

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

/** 端末性能から粒子数(目標/上限)を決める。0 = 通常SVGにフォールバック。 */
function pickCount(): number {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData === true) return 0; // データセーバー: SVG
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4; // GB(Chrome系のみ。他は既定4)
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = window.innerWidth;
  const mobile = window.matchMedia("(max-width: 700px)").matches;

  if (cores <= 2 || mem <= 1) return 0; // 低性能端末: SVG

  if (mobile) {
    let c = 6000; // スマホ既定
    if (cores <= 4 || mem <= 2) c = 5000;
    if (cores >= 8 && mem >= 4) c = 8000;
    if (dpr >= 3) c = Math.min(c, 5500); // 高DPRは負荷増
    return c;
  }
  let c = 14000; // 標準PC
  if (cores <= 4 || mem <= 4) c = 12000;
  if (cores >= 8 && mem >= 8 && w >= 1440) c = 16000;
  if (cores >= 12 && mem >= 8 && w >= 1680) c = 18000; // 高性能
  return c;
}

/** 実SVGロゴ(初期表示 / フォールバック)。粒子読込後は透明化 */
function CubeSvg({ hidden }: { hidden: boolean }) {
  return (
    <svg
      className={styles.particleFallback}
      data-hidden={hidden ? "true" : undefined}
      viewBox="480 160 480 580"
      role="img"
      aria-label="GARAGE BeCool ロゴ"
    >
      <defs>
        <linearGradient id="pfCube" gradientUnits="userSpaceOnUse" x1="532" y1="193" x2="915" y2="691">
          <stop offset="0" stopColor="#1e3252" />
          <stop offset="0.5" stopColor="#2f6bb0" />
          <stop offset="1" stopColor="#5aa2ec" />
        </linearGradient>
      </defs>
      <path d={CUBE_MARK_D} fill="url(#pfCube)" fillRule="evenodd" />
    </svg>
  );
}

export default function HeroParticleLogo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<RippleHandle>(null);
  const [count, setCount] = useState(0); // 0 = 通常SVG(粒子を起動しない)
  const [mobile, setMobile] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [loaded, setLoaded] = useState(false); // Particle Object 読込完了
  const [formed, setFormed] = useState(false); // ロゴ形成完了

  // 能力判定(reduced-motion / WebGL / 端末性能)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(window.matchMedia("(max-width: 700px)").matches);
    if (reduce || !hasWebGL()) {
      setCount(0);
      return;
    }
    setCount(pickCount());
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

  const active = count > 0 && onScreen && tabVisible;

  // active が落ちたら状態をリセット
  useEffect(() => {
    if (active) return;
    setLoaded(false);
    setFormed(false);
  }, [active]);

  // 形成完了: 読込完了(=描画準備完了)から約2.9s(ゆっくり集合に合わせる)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setFormed(true), 2900);
    return () => clearTimeout(t);
  }, [loaded]);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!formed) return; // ロゴ形成完了まで Ripple 無効
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
      {/* 読込完了までロゴ(実SVG)を消さない */}
      <CubeSvg hidden={loaded} />
      {active && (
        <ParticleObject
          className={styles.particleCanvas}
          src={`${BASE}/becool/img/gb-cube.svg`}
          background=""
          color=""
          count={count}
          size={mobile ? 2.0 : 2.4}
          sizeVariance={0.55}
          scale={3.1}
          cameraDistance={4.2}
          fov={60}
          orbit={false}
          zoom={false}
          autoRotate={false}
          floatIntensity={0.5}
          rotationIntensity={0.35}
          floatSpeed={1.2}
          drift={0.5}
          radius={mobile ? 60 : 110}
          strength={mobile ? 0.0 : 1.0}
          swirl={0.6}
          spring={0.42}
          damping={0.3}
          intro
          introSpread={1.95}
          onLoad={() => setLoaded(true)}
          onError={() => setCount(0)}
        />
      )}
      {active && formed && <HeroRipple ref={rippleRef} />}
    </div>
  );
}
