"use client";

/**
 * GARAGE BeCool ヒーローの「設計図のように組み上がる」ロゴ・イントロ。
 * GSAP Timeline で、ガイド線の製図 → GBキューブ各パーツの組み立て →
 * ワードマーク/タグラインの表示、を静かで精密なイージングで再生する。
 *
 * - transform / opacity / CSS変数(--pblur) 中心で GPU に優しく動かす
 * - prefers-reduced-motion: 組み立てを再生せず完成ロゴを短フェード
 * - sessionStorage: 同一セッション2回目以降は完成状態を即表示
 * - タブ非表示中は timeline を pause、復帰で resume
 * - アンマウント時に context.revert() で確実に kill
 */

import { useEffect } from "react";

const PLAYED_KEY = "bc-hero-intro-played";

export default function BecoolHeroIntro() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
    if (!stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let played = false;
    try { played = !!sessionStorage.getItem(PLAYED_KEY); } catch { /* private mode */ }

    if (reduce || played) {
      stage.setAttribute("data-intro", "done"); // 完成状態を(短フェードで)表示
      return;
    }

    stage.setAttribute("data-intro", "play"); // CSSが各パーツを初期状態(非表示)にする
    try { sessionStorage.setItem(PLAYED_KEY, "1"); } catch { /* ignore */ }

    let killed = false;
    let revert = () => {};
    let tl: GSAPTimeline | null = null;
    const onVisibility = () => { if (tl) (document.hidden ? tl.pause() : tl.resume()); };

    (async () => {
      const { gsap } = await import("gsap");
      if (killed) return;

      const ctx = gsap.context(() => {
        const q = gsap.utils.selector(stage);
        const soft = "power3.out";

        // --- 初期状態(組み上がる前) ---
        gsap.set(q(".logo-draw"), { strokeDashoffset: 1 });
        gsap.set(q(".logo-guide, .logo-outline"), { autoAlpha: 1 });
        gsap.set(q(".hero-glow"), { autoAlpha: 0, scale: 0.6 });
        gsap.set(q(".logo-part"), { opacity: 0, "--pblur": "6px" });
        gsap.set(q(".part-top"), { yPercent: -60, rotate: -3 });
        gsap.set(q(".part-left"), { xPercent: -66, yPercent: 12, rotate: -5 });
        gsap.set(q(".part-right"), { xPercent: 66, yPercent: 12, rotate: 5 });
        gsap.set(q(".hero-wordmark"), { autoAlpha: 0, yPercent: 24, clipPath: "inset(0 100% 0 0)" });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        // 半透明状態を経る crossfade(急な0/1切替にしない)
        const keyframesOpacity = [{ opacity: 0.25 }, { opacity: 0.7 }, { opacity: 0.35 }, { opacity: 1 }];

        tl = gsap.timeline({ defaults: { ease: soft } });

        // 1) まず「全ての線(製図ガイド＋ロゴの輪郭=文字の辺)」を描き切る(0.2〜2.3s)
        tl.to(q(".logo-draw"), { strokeDashoffset: 0, duration: 0.95, stagger: 0.08, ease: "power2.inOut" }, 0.2);

        // 2) 描いた輪郭に沿って各面(屋根/左G/右B)が組み上がる(2.55〜4.2s)
        const assemble = (sel: string, at: number) => {
          tl!.to(q(sel), { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, duration: 1.1, ease: "cubic-bezier(0.22,1,0.36,1)" }, at);
          tl!.to(q(sel), { keyframes: keyframesOpacity, duration: 1.1, ease: "none" }, at);
          tl!.to(q(sel), { "--pblur": "0px", duration: 0.9, ease: "power2.out" }, at + 0.15);
        };
        assemble(".part-top", 2.55);
        assemble(".part-left", 2.75);
        assemble(".part-right", 2.95);

        // 3) 完成の瞬間に発光(派手なアクセント)
        tl.to(q(".hero-glow"), { autoAlpha: 0.9, scale: 1.06, duration: 0.5, ease: "power2.out" }, 3.6);
        tl.to(q(".hero-glow"), { autoAlpha: 0.28, scale: 1, duration: 1.0, ease: "power2.inOut" }, 4.1);

        // 4) ガイド線と輪郭線を消す(3.8〜4.45s)
        tl.to(q(".logo-guide, .logo-outline"), { autoAlpha: 0, filter: "blur(1.5px)", duration: 0.6, ease: "power2.inOut" }, 3.8);

        // 5) ワードマークをマスクで表示(4.1〜4.95s)
        tl.to(q(".hero-wordmark"), { autoAlpha: 1, yPercent: 0, clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power3.out" }, 4.1);

        // 6) タグラインをフェード(4.7〜5.4s)
        tl.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 4.7);

        // 7) 完成状態を確定(scrollCue表示・playの初期非表示CSSを解除)
        tl.add(() => stage.setAttribute("data-intro", "complete"), ">-0.1");
      }, stage);

      revert = () => ctx.revert();
      document.addEventListener("visibilitychange", onVisibility);
    })();

    return () => {
      killed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      revert();
    };
  }, []);

  return null;
}
