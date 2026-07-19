"use client";

/**
 * GARAGE BeCool ヒーローの「ロゴ変形」イントロ。
 * ユーザー提供の5段階(GBキューブ→車シルエット→完成ロゴ)のメタリック画像を
 * GSAP でクロスフェードして繋ぎ、最終ロゴへ変形させる。
 *
 * - opacity / transform 中心で GPU に優しく動かす
 * - prefers-reduced-motion: 変形を再生せず最終ロゴ(stage 5)を短フェード
 * - sessionStorage: 同一セッション2回目以降は最終ロゴを即表示
 * - タブ非表示中は timeline を pause、復帰で resume
 * - アンマウント時に context.revert()
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
      stage.setAttribute("data-intro", "done"); // 最終ロゴを(短フェードで)表示
      return;
    }

    stage.setAttribute("data-intro", "play");
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

        // --- 初期状態(輪郭は未描画、塗りは非表示) ---
        gsap.set(q(".logo-edge"), { strokeDashoffset: 1, autoAlpha: 1 });
        gsap.set(q(".logo-fill"), { autoAlpha: 0 });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

        // 1) ロゴの輪郭(辺)を光らせながら描く(0.3〜2.4s)
        tl.to(q(".logo-edge"), { strokeDashoffset: 0, duration: 2.1, ease: "power1.inOut" }, 0.3);
        // 2) 描き終わりに合わせて塗り(完成ロゴ)がフェードイン(2.1〜3.0s)
        tl.to(q(".logo-fill"), { autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 2.05);
        // 3) 輪郭の光を消す(2.5〜3.2s)
        tl.to(q(".logo-edge"), { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 2.5);
        // 4) タグライン(2.9〜3.6s)
        tl.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 2.9);

        // 完成状態を確定
        tl.add(() => stage.setAttribute("data-intro", "complete"), ">-0.05");
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
