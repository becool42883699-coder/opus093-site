"use client";

/**
 * フッター前のブランドマーク。Canvas UI「Particle Object」でGBキューブを
 * 粒子として静かに形成する締めの意匠。ヒーロー(ガラス)と対になる。
 *  - 画面内に入るとマウント→粒子が周辺から集合してキューブを形成(1回)。
 *    画面外に出ると停止(GPU解放)、再入場で再生。
 *  - reduced-motion / WebGL非対応 / 低性能・saveData: 実SVGを表示。
 *  - 淡いSVG下地→読込後にクロスフェード(切替は見せない)。クリック演出は無し。
 */

/* マウント後の同期setState(能力検出→SVG/粒子切替)のため。SSRとのhydration不一致を
   避けるため初期描画は必ずSVG。react-hooks/set-state-in-effect は誤検知として無効化。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import styles from "./becool.module.css";
import { CUBE_MARK_D } from "./brandLogo";
import type { ParticleObjectProps } from "./vendor/canvas-ui/ParticleObject";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

/** 端末性能から粒子数を決める。0 = SVGフォールバック。フッター用は控えめ。 */
function pickCount(): number {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData === true) return 0;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  if (cores <= 2 || mem <= 1) return 0;
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  if (mobile) return cores >= 8 && mem >= 4 ? 5000 : 4000;
  return cores >= 8 && mem >= 8 ? 11000 : 9000;
}

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
        <linearGradient id="pfFootCube" gradientUnits="userSpaceOnUse" x1="532" y1="193" x2="915" y2="691">
          <stop offset="0" stopColor="#1e3252" />
          <stop offset="0.5" stopColor="#2f6bb0" />
          <stop offset="1" stopColor="#5aa2ec" />
        </linearGradient>
      </defs>
      <path d={CUBE_MARK_D} fill="url(#pfFootCube)" fillRule="evenodd" />
    </svg>
  );
}

export default function FooterParticleMark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [onScreen, setOnScreen] = useState(false); // 初期は非表示(フッター前=下方)
  const [tabVisible, setTabVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(window.matchMedia("(max-width: 700px)").matches);
    if (reduce || !hasWebGL()) {
      setCount(0);
      setDecided(true);
      return;
    }
    setCount(pickCount());
    setDecided(true);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { threshold: 0.2 },
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

  useEffect(() => {
    if (active) return;
    setLoaded(false);
  }, [active]);

  return (
    <div
      ref={wrapRef}
      className={`${styles.particleWrap} ${styles.footMarkWrap} ${mobile ? styles.particleWrapMobile : ""}`}
    >
      <CubeSvg hidden={loaded} placeholder={!decided || count > 0} />
      {active && (
        <ParticleObject
          className={`${styles.particleCanvas} ${loaded ? styles.particleCanvasIn : ""}`}
          src={`${BASE}/becool/img/gb-cube.svg`}
          background=""
          color=""
          count={count}
          size={mobile ? 2.0 : 2.3}
          sizeVariance={0.5}
          scale={3.1}
          cameraDistance={4.2}
          fov={60}
          orbit={false}
          zoom={false}
          autoRotate={false}
          floatIntensity={0.14}
          rotationIntensity={0.1}
          floatSpeed={0.7}
          drift={0.18}
          radius={0}
          strength={0}
          swirl={0.4}
          spring={0.5}
          damping={0.6}
          intro
          introSpread={1.7}
          onLoad={() => setLoaded(true)}
          onError={() => setCount(0)}
        />
      )}
    </div>
  );
}
