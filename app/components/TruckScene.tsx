"use client";

/**
 * TruckScene — EQUIPMENT セクションの 3D 車両ビューア
 * -------------------------------------------------------------
 * クレーン付き特装車(glTF)を Three.js で表示する。サイトの世界観は変えず、
 * 光と映り込みは Poly Haven の屋外HDRI(CC0)から取る。
 *
 * 設計方針(既存の becool 側 WebGL 演出と同じ階層):
 *  - three / loader はすべて動的import。初期バンドルには載せない
 *  - prefers-reduced-motion / WebGL非対応 / 低性能・saveData → 静止画のまま
 *  - IntersectionObserver で画面に近づいたら初期化、離れたら破棄(GPU解放)
 *  - タブ非表示中は描画ループを止める
 *  - canvas は pointer-events:none + touch-action:auto(モバイルの縦スクロールを殺さない)
 *  - 回転はスクロール連動のごく緩やかなヨーのみ。マウス(fine pointer)のときだけ
 *    ドラッグで回せる。タッチではドラッグを取らない
 *  - HDRI は scene.environment にだけ入れる。背景(黒)とフォグは変更しない
 */

import { useEffect, useRef, useState } from "react";
import type { Group, Object3D, PerspectiveCamera, Scene, Texture, WebGLRenderer } from "three";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const MODEL_URL = `${BASE}/models/crane-truck.glb`;
const HDRI_URL = `${BASE}/assets/hdri/env.hdr`;

/** カメラの基準ヨー(正面やや左からの3/4ビュー)とスクロールで動かす幅(ラジアン) */
const YAW_BASE = 4.0;
const YAW_RANGE = 0.9;

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

/** 端末性能から 3D を起動してよいか判定する。false = 静止画のまま。 */
function canRun3D(): boolean {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData === true) return false; // データセーバー
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4; // GB(Chrome系のみ。他は既定4)
  if (cores <= 2 || mem <= 1) return false; // 低性能端末
  return true;
}

export default function TruckScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false); // 3Dの初回描画が出たか(静止画とクロスフェード)

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches || !hasWebGL() || !canRun3D()) return;

    let disposed = false;
    let teardown: (() => void) | null = null;

    /* 画面に近づいてから初期化し、離れたら破棄する(iOS Safari が WebGL コンテキストを
       掴んだままにならないよう、可視範囲の外では確実にアンマウントする) */
    const start = async () => {
      if (teardown || disposed) return;
      const [THREE, { GLTFLoader }, { HDRLoader }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/loaders/HDRLoader.js"),
      ]);
      if (disposed) return;

      const renderer: WebGLRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene: Scene = new THREE.Scene();
      const camera: PerspectiveCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);

      /* 弱いキーライトだけ置く。面の明るさと映り込みの大半は HDRI が担当する */
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(4, 7, 5);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0xffffff, 0.15));

      let envMap: Texture | null = null;
      let model: Group | null = null;
      let radius = 6;

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      /* --- 回転 ---------------------------------------------------------- */
      let dragYaw = 0; // マウスドラッグぶん
      let scrollYaw = 0; // スクロール連動ぶん
      const applyCamera = () => {
        const yaw = YAW_BASE + scrollYaw + dragYaw;
        camera.position.set(
          Math.sin(yaw) * radius * 1.22,
          radius * 0.36,
          Math.cos(yaw) * radius * 1.22,
        );
        camera.lookAt(0, 0, 0);
      };

      const readScroll = () => {
        const rect = host.getBoundingClientRect();
        const span = window.innerHeight + rect.height;
        const p = span > 0 ? (window.innerHeight - rect.top) / span : 0.5;
        scrollYaw = (Math.min(1, Math.max(0, p)) - 0.5) * YAW_RANGE;
      };

      /* --- 描画ループ(必要なフレームだけ回す) ---------------------------- */
      let needsRender = true;
      const invalidate = () => {
        needsRender = true;
      };
      const tick = () => {
        if (!needsRender) return;
        needsRender = false;
        applyCamera();
        renderer.render(scene, camera);
      };

      const onScroll = () => {
        readScroll();
        invalidate();
      };
      const onResize = () => {
        resize();
        invalidate();
      };
      const onVisibility = () => {
        renderer.setAnimationLoop(document.hidden ? null : tick);
        invalidate();
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibility);

      /* マウス(fine pointer)のときだけドラッグ回転。タッチでは縦スクロールを優先する */
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      let dragFrom: number | null = null;
      const onPointerDown = (e: PointerEvent) => {
        if (!finePointer || e.button !== 0) return;
        dragFrom = e.clientX - dragYaw * 260;
        host.setPointerCapture(e.pointerId);
        host.dataset.dragging = "true";
      };
      const onPointerMove = (e: PointerEvent) => {
        if (dragFrom === null) return;
        dragYaw = (e.clientX - dragFrom) / 260;
        invalidate();
      };
      const onPointerUp = (e: PointerEvent) => {
        if (dragFrom === null) return;
        dragFrom = null;
        if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
        delete host.dataset.dragging;
      };
      if (finePointer) {
        host.addEventListener("pointerdown", onPointerDown);
        host.addEventListener("pointermove", onPointerMove);
        host.addEventListener("pointerup", onPointerUp);
        host.addEventListener("pointercancel", onPointerUp);
      }

      teardown = () => {
        renderer.setAnimationLoop(null);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        if (finePointer) {
          host.removeEventListener("pointerdown", onPointerDown);
          host.removeEventListener("pointermove", onPointerMove);
          host.removeEventListener("pointerup", onPointerUp);
          host.removeEventListener("pointercancel", onPointerUp);
        }
        if (model) {
          model.traverse((o: Object3D) => {
            const mesh = o as Object3D & {
              geometry?: { dispose: () => void };
              material?: unknown;
            };
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              if (!m) continue;
              const mat = m as Record<string, unknown> & { dispose: () => void };
              for (const v of Object.values(mat)) {
                if (v && typeof v === "object" && "isTexture" in v) {
                  (v as Texture).dispose();
                }
              }
              mat.dispose();
            }
          });
        }
        scene.clear();
        envMap?.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };

      /* --- 読み込み ------------------------------------------------------ */
      resize();
      readScroll();

      /* HDRI は読めなくても致命傷にしない(映り込みが弱くなるだけ) */
      new HDRLoader().loadAsync(HDRI_URL).then(
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          texture.mapping = THREE.EquirectangularReflectionMapping;
          envMap = texture;
          scene.environment = texture;
          scene.environmentIntensity = 1.0;
          invalidate();
        },
        () => {
          console.warn("TruckScene: 環境マップを読み込めなかったため、映り込みなしで表示します");
        },
      );

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      if (disposed) return;

      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      radius = Math.max(size.x, size.y, size.z);
      scene.add(model);

      resize();
      applyCamera();
      renderer.render(scene, camera);
      renderer.setAnimationLoop(document.hidden ? null : tick);
      setLive(true);
    };

    const stop = () => {
      teardown?.();
      teardown = null;
      setLive(false);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) void start();
          else stop();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(host);

    return () => {
      disposed = true;
      io.disconnect();
      stop();
    };
  }, []);

  return (
    <div className="truckStage" ref={hostRef} data-live={live ? "true" : undefined}>
      {/* 3D を出せない環境(reduced-motion / WebGL非対応 / 低性能 / JS無効)の下地 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="truckStill"
        src={`${BASE}/equipment-crane-truck.webp`}
        alt="クレーン付き特装車の3Dモデル"
        width={1200}
        height={760}
        loading="lazy"
        decoding="async"
      />
      <canvas className="truckCanvas" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
