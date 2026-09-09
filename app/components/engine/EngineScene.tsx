"use client";

/**
 * EngineScene — TRX-4 の4幕(鉄の塊 → 透視 → 手組み → 始動)を描くWebGLシーン。
 *
 * t-rex-engine-v3.html の演出をそのまま踏襲する。尺・振り付け・カメラの
 * キーフレーム・クランク機構の物理式・縦画面カメラ補正(dm)は数値ごと同一。
 *
 * このコンポーネントが描くDOMは <canvas> だけ。4幕のコピー・ラベル・諸元は
 * app/engine/page.tsx がサーバー側で出しており、ここからは data-* 属性で拾う
 * (app/components/TrmMotion.tsx と同じ流儀。JS無効でも本文が読める)。
 *
 * Lenis の橋渡しはトップページの TopMotion が唯一の所有者。ここは作らない
 * (2つ作るとスクロールが震えて壊れる。CLAUDE.md §3 の Lenis 二重生成)。
 */

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import type { EngineParts } from "./buildEngine";
import styles from "./engine.module.css";

/** ピン区間の長さ。v3 と同じ */
const PIN_END = "+=460%";

/* pmndrs の ToneMappingEffect は renderer.toneMappingExposure を読まないので、
   v3 の露出 1.18 は光量そのものに畳み込む(トーンマップ前は線形なので等価)。 */
const EXPOSURE = 1.18;
/** HDRIの強度。v3(r128)と各幕の輝度を実測して合わせた値 */
const ENV_INTENSITY = 2.0 * EXPOSURE;

/* ---- 縦画面のフレーミング --------------------------------------------
   v3のカメラのキーフレームは横長(16:10前後)前提。縦画面にそのまま出すと
   エンジンが左右で見切れ、絵が下半分に沈み、その上に本文が重なって読めない。
   下の3つで「カメラを引く」「模型を縮めて幅に収める」「描画を上へ寄せる」。
   カメラを引く分だけフォグ(FOG_NEAR/FOG_FAR)も遠ざけること。
   値はスマホ390x844で4幕とも描画を見ながら決めた(本文は下から約270px使う)。 */
/** 縦画面でカメラを引く強さ(v3と同じ)。これ以上引くとフォグ(9〜22)に沈む */
const PORTRAIT_PULL = 0.95;
/** 縦画面での模型の縮小率。カメラを引くとフォグに沈むので、幅合わせは模型側で行う */
const PORTRAIT_FIT = 0.80;
/** 完全な縦画面で描画を上へ寄せる量(ステージ高さに対する比)。下側を本文に明け渡す */
const PORTRAIT_LIFT = 0.20;

/** WebGL2 のみ。three は r163 で WebGL1 を切ったので webgl1 判定で通すと例外になる */
function hasWebGL2(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * ヒーローが描き終わってから重いアセット(three / postprocessing / glb 2本 / HDRI)を
 * 取りに行くためのゲート。LCP はヒーローの見出しテキストなので、そこへ帯域と
 * メインスレッドを奪わせない。rAF 2回で「初回ペイント済み」を待ち、そのあと
 * アイドル(最長1.5秒で打ち切り)でプリフェッチを始める。
 */
function afterHeroPaint(): Promise<void> {
  return new Promise((resolve) => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (idle) idle(() => resolve(), { timeout: 1500 });
        else setTimeout(resolve, 200);
      }),
    );
  });
}

type Tier = { dpr: number; dust: number; shadows: boolean; ssao: boolean; bloomScale: number };

function pickTier(): Tier {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const mobile = window.matchMedia("(max-width: 819px)").matches;
  const low = cores <= 4 || mem <= 2;
  return {
    dpr: mobile ? 1.5 : 2,
    dust: mobile || low ? 55 : 110,
    shadows: !low,
    ssao: !mobile && !low,
    bloomScale: mobile || low ? 0.5 : 1,
  };
}

const CHAPTER_NAMES = ["01 — 鉄の塊", "02 — 透視", "03 — 手組み", "04 — 始動"];

export default function EngineScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const page = canvas.closest<HTMLElement>("[data-engine-page]");
    const stage = canvas.closest<HTMLElement>("[data-stage]");
    if (!page || !stage) return;

    /* 演出を出さない条件。data-motion を付けないので CSS 側の静的レイアウトが残る */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!hasWebGL2()) return;

    let cancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      await afterHeroPaint();
      if (cancelled) return;
      const [
        THREE,
        { gsap },
        { ScrollTrigger },
        { HDRLoader },
        { GLTFLoader },
        PP,
        { buildEngine, PH, CRANK_CYCLE },
      ] = await Promise.all([
        import("three"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("three/examples/jsm/loaders/HDRLoader.js"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("postprocessing"),
        import("./buildEngine"),
      ]);
      if (cancelled) return;

      const tier = pickTier();

      let renderer: THREE_NS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        delete document.documentElement.dataset.engineMotion; // 静的版へ戻す
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.dpr));
      /* トーンマッピングは Composer の ToneMappingEffect に一本化する。
         three 側を ACES のままにすると最終パスで二重に掛かる。 */
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = tier.shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      /* glb 2本 + HDRI の読み込み進捗。スピナーではなく細いバーで見せる */
      const bar = page.querySelector<HTMLElement>("[data-engine-progress]");
      const manager = new THREE.LoadingManager();
      manager.onProgress = (_url, loaded, total) => {
        if (bar && total > 0) bar.style.transform = `scaleX(${Math.min(1, loaded / total)})`;
      };
      manager.onLoad = () => {
        page.dataset.assets = "ready";
      };

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x05080d);
      /* フォグの距離は v3 のまま。ただし縦画面ではカメラを引くので、
         引いた分だけ霧も遠ざけないとエンジンが霧に沈んで色が抜ける
         (実機で「暗くて何が写っているか分からない」状態になっていた)。
         倍率は resize() で dm に合わせて掛け直す。 */
      const FOG_NEAR = 9;
      const FOG_FAR = 22;
      scene.fog = new THREE.Fog(0x05080d, FOG_NEAR, FOG_FAR);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

      /* ---- 環境マップ(HDRI) --------------------------------------------
         Poly Haven「quarry_01」1K / CC0(屋外・曇天)。EQUIPMENTセクションと
         同じファイルを使い回している(public/assets/hdri/env.hdr)。
         scene.environment にだけ入れる。背景のネイビーとフォグは変更しない。
         強度2.0は v3(r128) と各幕の輝度を実測して合わせた値。
         r185 では material.envMapIntensity は scene.environmentIntensity に
         上書きされるので、調整はこの1箇所に集約する。 */
      let envMap: THREE_NS.Texture | null = null;
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      new HDRLoader(manager)
        .loadAsync(`${base}/assets/hdri/env.hdr`)
        .then((texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          texture.mapping = THREE.EquirectangularReflectionMapping;
          envMap = texture;
          scene.environment = texture;
          scene.environmentIntensity = ENV_INTENSITY;
        })
        .catch(() => {
          console.warn("EngineScene: 環境マップを読み込めなかったため、映り込みなしで表示します");
        });

      /* ---- エンジン本体(ブロックとクランク機構は glTF) ---- */
      const parts: EngineParts = await buildEngine(THREE, new GLTFLoader(manager), scene, {
        dustCount: tier.dust,
        shadows: tier.shadows,
        lightScale: Math.PI * EXPOSURE,
        basePath: base,
      });
      if (cancelled) {
        parts.dispose();
        renderer.dispose();
        return;
      }

      /* ---- ポストプロセス -------------------------------------------
         Bloom は閾値を高めにして、点火の閃光とコイルの発光だけを滲ませる。
         Noise はフィルムの粒子感を薄く足すだけ(0.02)。
         周辺減光は v3 の .vin(CSSのradial-gradient)が既にステージ全面に
         掛かっているので、ここでは掛けない(掛けると二重になる)。
         SSAO は法線パスが増えて重いのでデスクトップのみ。 */
      const composer = new PP.EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
      composer.addPass(new PP.RenderPass(scene, camera));

      const effects: InstanceType<typeof PP.Effect>[] = [];
      let normalPass: InstanceType<typeof PP.NormalPass> | null = null;
      if (tier.ssao) {
        normalPass = new PP.NormalPass(scene, camera);
        normalPass.enabled = true;
        composer.addPass(normalPass);
        effects.push(
          new PP.SSAOEffect(camera, normalPass.texture, {
            worldDistanceThreshold: 20,
            worldDistanceFalloff: 5,
            worldProximityThreshold: 0.4,
            worldProximityFalloff: 0.1,
            luminanceInfluence: 0.6,
            samples: 16,
            rings: 4,
            radius: 0.06,
            intensity: 1.6,
            resolutionScale: 0.5,
          }),
        );
      }
      const bloom = new PP.BloomEffect({
        mipmapBlur: true,
        luminanceThreshold: 0.78,
        luminanceSmoothing: 0.12,
        intensity: 0.55,
        radius: 0.62,
        resolutionScale: tier.bloomScale,
      });
      const noise = new PP.NoiseEffect({ blendFunction: PP.BlendFunction.OVERLAY, premultiply: true });
      noise.blendMode.opacity.value = 0.02;
      effects.push(bloom, noise, new PP.ToneMappingEffect({ mode: PP.ToneMappingMode.ACES_FILMIC }));
      const effectPass = new PP.EffectPass(camera, ...effects);
      composer.addPass(effectPass);

      /* ---- 状態とカメラ(v3と同一の初期値) ---- */
      const state = { theta: 0.7, explode: 0, shell: 1, capSlide: 0, start: 0 };
      const cam = { az: 0.55, el: 0.31, dist: 9.4, ty: 1.25, fov: 38 };
      let dm = 1;
      let aux = 0;
      let lastT = 0;

      const ss = (x: number, a: number, b: number) => {
        const v = (x - a) / (b - a);
        return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v);
      };

      const update = (t: number) => {
        const dt = lastT ? Math.min(t - lastT, 50) : 16;
        lastT = t;

        /* 始動フェーズ: クランキング → 初爆 → 安定回転 */
        const s = state.start;
        const crk = ss(s, 0, 0.45);
        const fireP = ss(s, 0.42, 0.6);
        const run = ss(s, 0.55, 1);
        const spd =
          crk * (1 - fireP) * (0.3 + 0.5 * Math.max(0, Math.sin(t * 0.012))) +
          fireP * (1 - run) * 1.1 +
          run * 2.4;
        aux += dt * 0.0018 * spd;
        const TH = state.theta + aux;

        /* クランク機構(glTF)の駆動。モデルのアニメーション1周＝クランク1回転なので、
           クランク角をそのまま時間へ写像すればスクロールと連動して回る。 */
        const TAU = Math.PI * 2;
        const cycle = ((TH % TAU) + TAU) % TAU;
        parts.crankMixer.setTime((cycle / TAU) * CRANK_CYCLE);
        /* ミキサーが position を書いた後にキャップをずらす(順番が重要) */
        parts.setCapSlide(state.capSlide);

        parts.crankRoot.position.y = -0.7 * state.explode;

        const e = state.explode;
        parts.crankRoot.rotation.z = Math.sin(t * 0.0008) * 0.008 * e;
        parts.headG.rotation.z = Math.sin(t * 0.0009 + 1) * 0.008 * e;
        parts.panG.rotation.z = Math.sin(t * 0.0007 + 2) * 0.01 * e;

        /* 回転中の微振動とエキマニの熱 */
        const vib = fireP * 0.6 + run;
        parts.root.position.x =
          (Math.sin(t * 0.091) * 0.0045 + Math.sin(t * 0.057) * 0.003) * vib;
        parts.root.position.y = Math.sin(t * 0.083) * 0.003 * vib;
        parts.pipeM.emissiveIntensity = run * 0.4;

        /* 上死点の点火と、始動前半の失火のばらつき。閃光は火の色 */
        const gate = (1 - state.shell) * Math.max(0, 1 - e * 2.5);
        for (let i = 0; i < 4; i++) {
          const c = Math.cos(TH + PH[i]);
          const sput =
            crk * (1 - run) * Math.pow(Math.max(0, Math.sin(t * 0.017 + i * 2.3)), 24) * 0.6 *
            (1 - state.shell);
          const f = Math.pow(Math.max(0, c), 12) * gate * (1 + run * 0.6) + sput;
          parts.glowMats[i].opacity = Math.min(1, f * 0.85);
          parts.fires[i].intensity = Math.min(3.2, f * 2.6) * parts.lightScale;
        }

        for (const sp of parts.spin) sp.g.rotation.x = TH * 0.5 + sp.off;
        for (const v of parts.valves) {
          const lift = Math.pow(Math.max(0, Math.sin(TH * 0.5 + v.off + 1.4)), 6) * 0.07;
          v.g.position.y = v.baseY - lift;
        }

        parts.dust.mat.opacity = (1 - state.shell) * 0.3;
        const pos = parts.dust.geo.attributes.position.array as Float32Array;
        for (let d = 0; d < parts.dust.count; d++) {
          pos[d * 3] += Math.sin(t * 0.0002 + d) * 0.0008;
          pos[d * 3 + 1] += 0.0011;
          if (pos[d * 3 + 1] > 3.4) pos[d * 3 + 1] = -1.2;
        }
        parts.dust.geo.attributes.position.needsUpdate = true;

        if (camera.fov !== cam.fov) {
          camera.fov = cam.fov;
          camera.updateProjectionMatrix();
        }
        const sway = Math.sin(t * 0.00025) * 0.04;
        const d = cam.dist * dm;
        camera.position.set(
          Math.sin(cam.az + sway) * Math.cos(cam.el) * d,
          cam.ty + Math.sin(cam.el) * d,
          Math.cos(cam.az + sway) * Math.cos(cam.el) * d,
        );
        camera.lookAt(0, cam.ty, 0);
      };

      const resize = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        composer.setSize(w, h, false);
        camera.aspect = w / h;
        /* 縦画面ほどカメラを引く(v3と同じ係数)。引いた分フォグも遠ざける ――
           これを忘れると、実機で「暗くて何が写っているか分からない」状態になる。 */
        dm = camera.aspect < 1 ? 1 + (1 / camera.aspect - 1) * PORTRAIT_PULL : 1;
        const fog = scene.fog as THREE_NS.Fog;
        fog.near = FOG_NEAR * dm;
        fog.far = FOG_FAR * dm;

        /* 縦画面では絵を上へ寄せて、下側を4幕の本文に明け渡す。
           aspect 1.0(正方形)で0、0.55以下で1になる係数で連続的に効かせる
           ので、端末を回しても絵が飛ばない。横長ではオフセットなし=PCと同一。 */
        const t = Math.min(1, Math.max(0, (1 - camera.aspect) / 0.45));
        parts.root.scale.setScalar(1 - t * (1 - PORTRAIT_FIT));
        if (t > 0) camera.setViewOffset(w, h, 0, h * PORTRAIT_LIFT * t, w, h);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      };

      const loop = (t: number) => {
        update(t);
        composer.render();
      };

      /* Lenis の橋渡しは TopMotion が持つ(2つ作るとスクロールが壊れるため)。
         ここは ScrollTrigger のタイムラインを積むだけ。 */
      gsap.registerPlugin(ScrollTrigger);

      /* 演出用レイアウトへ切り替えてから採寸する(ピン位置がずれないよう順番が重要) */
      page.dataset.motion = "on";
      resize();

      /* 描画は「ステージが画面の近くにある」かつ「タブが見えている」ときだけ回す。
         ヒーローや諸元セクションを見ている間はGPUを遊ばせる。 */
      let onScreen = true;
      const applyLoop = () => {
        renderer.setAnimationLoop(!document.hidden && onScreen ? loop : null);
      };
      const onVisibility = () => applyLoop();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", resize);
      window.addEventListener("orientationchange", resize);
      /* ステージの実寸が変わったら必ず測り直す。
         window の resize だけだと、iOS Safari で初期化時に拾ったサイズが
         レイアウト確定前の値のまま固定されることがある。そうなると
         camera.aspect が実際のcanvasと食い違い、絵が横に伸びて片側が
         見切れる(実機で発生した)。ResizeObserver なら取りこぼさない。 */
      const ro = new ResizeObserver(() => resize());
      ro.observe(stage);
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) onScreen = entry.isIntersecting;
          applyLoop();
        },
        { rootMargin: "200px 0px" },
      );
      io.observe(stage);
      applyLoop();

      /* 章表示の切り替え */
      /* 章インジケータと章ナビは固定ヘッダー側にある(= .page の外)ので document から引く */
      const nowEl = document.querySelector<HTMLElement>("[data-chapnow]");
      const navEls = Array.from(document.querySelectorAll<HTMLElement>("[data-chapnav]"));
      let cur = -1;
      const setChapter = (i: number) => {
        if (i === cur) return;
        cur = i;
        if (nowEl) nowEl.textContent = CHAPTER_NAMES[i];
        navEls.forEach((n, j) => {
          n.dataset.on = j === i ? "true" : "false";
        });
      };
      setChapter(0);

      /* ---- 振り付け(絶対時刻。合計9.4。v3の値をそのまま) ---- */
      const shellProxy = { o: 1 };
      const ctx = gsap.context(() => {
        gsap.to("[data-progress]", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 },
        });
        gsap.set(['[data-ch="2"]', '[data-ch="3"]', '[data-ch="4"]', "[data-lbl]"], { autoAlpha: 0 });
        gsap.set("[data-lbl] i", { scaleX: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: "[data-stage-wrap]",
            start: "top top",
            end: PIN_END,
            scrub: 0.55,
            pin: "[data-stage]",
            anticipatePin: 1,
            onUpdate: (self) => {
              const p = self.progress;
              setChapter(p < 0.2 ? 0 : p < 0.43 ? 1 : p < 0.71 ? 2 : 3);
            },
            /* 章ナビはピン区間にいる間だけ出す(下のセクションでは邪魔になる) */
            onToggle: (self) => {
              document.documentElement.dataset.enginePinned = self.isActive ? "true" : "false";
            },
            onLeave: () => setChapter(3),
            onEnterBack: () => setChapter(3),
          },
        });
        tl.to('[data-ch="1"]', { autoAlpha: 0, y: -56, duration: 0.5 }, 1.05)
          .to(shellProxy, { o: 0.05, duration: 0.6, onUpdate: () => parts.setShell(shellProxy.o) }, 1.3)
          .fromTo('[data-ch="2"]', { y: 64 }, { autoAlpha: 1, y: 0, duration: 0.55 }, 1.85)
          /* 分解: キャップを先に外し、予備動作で一度沈めてから開く */
          .to('[data-ch="2"]', { autoAlpha: 0, y: -56, duration: 0.5 }, 4.05)
          .to(state, { capSlide: 1, duration: 0.25, ease: "power2.out" }, 4.15)
          .to(state, { explode: -0.05, duration: 0.1, ease: "power1.in" }, 4.3)
          .to(parts.headG.position, { y: -0.06, duration: 0.1, ease: "power1.in" }, 4.32)
          .to(state, { explode: 1, duration: 0.8, ease: "power2.inOut" }, 4.42)
          .to(parts.headG.position, { y: 1.5, duration: 0.8, ease: "power2.inOut" }, 4.44)
          .to(parts.panG.position, { y: -0.95, duration: 0.75, ease: "power2.inOut" }, 4.52)
          .fromTo('[data-ch="3"]', { y: 64 }, { autoAlpha: 1, y: 0, duration: 0.55 }, 4.95)
          .to("[data-lbl]", { autoAlpha: 1, duration: 0.35, stagger: 0.14 }, 5.2)
          .to("[data-lbl] i", { scaleX: 1, duration: 0.4, stagger: 0.14 }, 5.2)
          .to("[data-lbl]", { autoAlpha: 0, duration: 0.3 }, 5.75)
          /* 再組立はオーバーシュートで「はまる」感じを出す */
          .to(state, { explode: 0, duration: 0.8, ease: "back.out(1.3)" }, 5.85)
          .to(parts.headG.position, { y: 0, duration: 0.8, ease: "back.out(1.2)" }, 5.85)
          .to(parts.panG.position, { y: 0, duration: 0.75, ease: "back.out(1.2)" }, 5.9)
          .to(state, { capSlide: 0, duration: 0.3, ease: "power2.inOut" }, 6.55)
          .to('[data-ch="3"]', { autoAlpha: 0, y: -46, duration: 0.4 }, 6.6)
          .to(shellProxy, { o: 0.55, duration: 0.5, onUpdate: () => parts.setShell(shellProxy.o) }, 6.7)
          /* 始動 */
          .to(state, { start: 1, duration: 1.3, ease: "none" }, 7.0)
          .fromTo('[data-ch="4"]', { y: 64 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 7.5)
          .to(shellProxy, { o: 1, duration: 0.5, onUpdate: () => parts.setShell(shellProxy.o) }, 8.35)
          .to('[data-ch="4"]', { autoAlpha: 0, y: -46, duration: 0.3 }, 8.8)
          .to({}, { duration: 0.6 }, 8.8);

        /* カメラは緩めのscrubで別タイムライン。4.05でマッチカット */
        const tlCam = gsap.timeline({
          scrollTrigger: { trigger: "[data-stage-wrap]", start: "top top", end: PIN_END, scrub: 1.05 },
        });
        tlCam
          .to(cam, { dist: 6.4, az: 0.12, el: 0.16, fov: 34, duration: 0.95, ease: "power1.inOut" }, 1.05)
          .set(cam, { dist: 9.6, az: -0.5, el: 0.44, ty: 1.55, fov: 38 }, 4.05)
          .to(cam, { dist: 9.0, az: -0.35, duration: 1.4, ease: "none" }, 4.2)
          .to(cam, { dist: 7.4, az: 0.95, el: 0.2, ty: 1.35, duration: 1.2, ease: "power1.inOut" }, 7.0)
          .to(cam, { dist: 9.8, az: 0.5, el: 0.31, ty: 1.25, fov: 40, duration: 0.7, ease: "power1.inOut" }, 8.4)
          .to({}, { duration: 0.3 }, 9.1);

        gsap.to(state, {
          theta: Math.PI * 8 + 0.7,
          ease: "none",
          scrollTrigger: { trigger: "[data-stage-wrap]", start: "top top", end: PIN_END, scrub: 0.5 },
        });
        gsap.from("[data-cell]", {
          y: 44,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: `.${styles.spec}`, start: "top 78%" },
        });
      }, page);

      const onRefresh = () => resize();
      ScrollTrigger.addEventListener("refresh", onRefresh);
      ScrollTrigger.refresh();

      cleanup = () => {
        renderer.setAnimationLoop(null);
        io.disconnect();
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        ctx.revert();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        window.removeEventListener("orientationchange", resize);
        ro.disconnect();
        parts.dispose();
        composer.dispose();
        envMap?.dispose();
        scene.environment = null;
        renderer.dispose();
        renderer.forceContextLoss();
        delete page.dataset.motion;
        delete document.documentElement.dataset.enginePinned;
      };
      if (cancelled) cleanup();
    };

    void setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <canvas className={styles.gl} ref={canvasRef} data-gl aria-hidden="true" />;
}
