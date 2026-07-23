"use client";

/**
 * ヒーローのロゴを Canvas UI「Particle Object」(公式React版, Three.js/WebGL)で
 * 粒子化して表示する。
 *  - 本物のロゴSVG(public/becool/img/gb-cube.svg)を src に渡して形状化
 *  - 導入: 散布した粒子が約1.8sで中央へ集合しキューブを形成(engineのintro拡張)
 *  - PCホバー: カーソル近傍が反発、離れるとバネで復帰
 *  - スマホ: canvasは pointer-events:none(反応オフ)で縦スクロールを妨げない
 *  - three(重い)は動的import・クライアント限定。SSR/初期は実SVGを表示
 *  - reduced-motion / WebGL非対応 / 画面外・タブ非表示 では粒子を止め実SVGへ
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import styles from "./becool.module.css";
import { CUBE_MARK_D } from "./brandLogo";
import type { ParticleObjectProps } from "./vendor/canvas-ui/ParticleObject";

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

/** 実SVGロゴ(初期表示 / フォールバック)。粒子起動中は透明化 */
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
  const [capable, setCapable] = useState(false); // WebGL可 && not reduced-motion
  const [mobile, setMobile] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(window.matchMedia("(max-width: 700px)").matches);
    setCapable(!reduce && hasWebGL());
  }, []);

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

  // 画面外・タブ非表示では粒子を停止(アンマウントでGPU解放), 復帰で再生
  const active = capable && onScreen && tabVisible;

  return (
    <div ref={wrapRef} className={`${styles.particleWrap} ${mobile ? styles.particleWrapMobile : ""}`}>
      <CubeSvg hidden={active} />
      {active && (
        <ParticleObject
          className={styles.particleCanvas}
          src={`${BASE}/becool/img/gb-cube.svg`}
          background=""
          color=""
          count={mobile ? 4200 : 13000}
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
          strength={mobile ? 0.0 : 1.1}
          swirl={0.7}
          spring={0.8}
          damping={0.32}
          intro
          introSpread={1.7}
          onError={() => setCapable(false)}
        />
      )}
    </div>
  );
}
