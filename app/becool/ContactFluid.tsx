"use client";

/**
 * CONTACT ヒーローの背景シェーダー。
 * ブランドのネイビー〜ブルーの中を、ゆっくりとした流体状のうねりが漂う。
 * ポインタ位置に、押しのけるような柔らかい歪みと薄い光が寄る。
 *
 * 実装方針:
 *  - three(既存依存)の ShaderMaterial + 正射影カメラ + 全画面プレーンだけ。追加依存なし。
 *  - 禁止事項に触れないよう「強い発光・虹色・激しい動き」は出さない。うねりは極めて緩慢。
 *  - reduced-motion: 起動しない(CSSの静的グラデーションのまま)。
 *  - WebGL非対応/低性能/データセーバー: 起動しない。
 *  - 画面外・タブ非表示ではレンダリングを止める。ポインタ操作は奪わない。
 */

/* 能力検出後にマウント可否を決めるため、マウント後の同期setStateが必要。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import styles from "./becool.module.css";

function canRun(): boolean {
  try {
    const nav = navigator as Navigator & {
      hardwareConcurrency?: number; deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData === true) return false;
    if ((nav.hardwareConcurrency ?? 4) <= 2) return false;
    if ((nav.deviceMemory ?? 4) <= 1) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* うねりは値ノイズのFBM。ブランド3色の間だけを行き来させる。 */
const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uPointer;   // 0..1, 画面内のポインタ
  uniform float uPointerOn; // 0..1 フェード

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = vec2(uv.x * aspect, uv.y);

    // ポインタに向かってわずかに引き寄せる(押しのける歪み)
    vec2 pt = vec2(uPointer.x * aspect, uPointer.y);
    float d = distance(p, pt);
    float pull = uPointerOn * exp(-d * 5.0) * 0.06;
    p -= normalize(p - pt + 1e-5) * pull;

    // ごく緩やかに流れるうねり
    float t = uTime * 0.045;
    float n = fbm(p * 2.2 + vec2(t, -t * 0.7));
    n = fbm(p * 2.6 + vec2(n * 1.4 - t * 0.5, n * 1.1 + t * 0.35));

    // ブランド配色: 深いネイビー -> ミッドブルー -> 明るいブルー(ごく一部)
    vec3 deep = vec3(0.031, 0.058, 0.098);
    vec3 mid  = vec3(0.086, 0.204, 0.373);
    vec3 lite = vec3(0.243, 0.478, 0.796);

    float m = smoothstep(0.32, 0.78, n);
    vec3 col = mix(deep, mid, m);
    col = mix(col, lite, smoothstep(0.66, 0.94, n) * 0.5);

    // ポインタ周りをほんのり持ち上げる(強い発光にはしない)
    col += vec3(0.05, 0.09, 0.15) * uPointerOn * exp(-d * 6.5);

    // 周辺減光で中央のタイポを立たせる
    float vig = smoothstep(1.15, 0.25, distance(uv, vec2(0.5)));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function ContactFluid() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!canRun()) return;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: "low-power" });
      renderer.setClearColor(0x080d16, 1);
      // 解像度は抑える(見た目は滑らかなグラデなので低くても破綻しない)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
      const canvas = renderer.domElement;
      canvas.className = styles.contactFluidCanvas;
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const uniforms = {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPointerOn: { value: 0 },
      };
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false }),
      );
      mesh.frustumCulled = false;
      scene.add(mesh);

      const resize = () => {
        const r = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        renderer.setSize(w, h, false);
        uniforms.uRes.value.set(w, h);
      };
      resize();

      // ポインタ(PCのみ)。タッチでは追従させない=スクロールを妨げない
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const targetPtr = new THREE.Vector2(0.5, 0.5);
      let targetOn = 0;
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        targetPtr.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
        targetOn = 1;
      };
      const onLeave = () => { targetOn = 0; };
      if (fine) {
        host.addEventListener("pointermove", onMove, { passive: true });
        host.addEventListener("pointerleave", onLeave, { passive: true });
      }

      let raf: number | null = null;
      let running = true;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        uniforms.uTime.value += dt;
        // ポインタは追従を遅らせて「粘り」を出す
        uniforms.uPointer.value.lerp(targetPtr, 1 - Math.pow(0.001, dt));
        uniforms.uPointerOn.value += (targetOn - uniforms.uPointerOn.value) * (1 - Math.pow(0.02, dt));
        renderer.render(scene, camera);
        if (running) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const stop = () => { running = false; if (raf != null) cancelAnimationFrame(raf); raf = null; };
      const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(host);
      const onVis = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVis);
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      cleanup = () => {
        stop();
        io.disconnect(); ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        if (fine) {
          host.removeEventListener("pointermove", onMove);
          host.removeEventListener("pointerleave", onLeave);
        }
        mesh.geometry.dispose();
        (mesh.material as { dispose(): void }).dispose();
        renderer.dispose();
        canvas.remove();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [on]);

  return <div ref={hostRef} className={styles.contactFluid} aria-hidden="true" />;
}
