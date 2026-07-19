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

        // --- 初期状態(1枚目=GBキューブを表示、以降は非表示) ---
        gsap.set(q(".stage-img"), { opacity: 0 });
        gsap.set(q(".stage-1"), { opacity: 1 });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });
        gsap.set(q(".stage-stack"), { scale: 0.96 });

        tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });

        // 全体をゆっくり詰めて(scale)、生きた変形感を出す
        tl.to(q(".stage-stack"), { scale: 1, duration: 4.6, ease: "power1.out" }, 0);

        // 1→2→3→4→5 を順にクロスフェード(重なる瞬間だけ両方が半透明)
        const dwell = 0.8;   // 各ステージの滞在
        const xfade = 0.6;   // クロスフェード時間
        let t = 1.05;
        for (let i = 1; i < 5; i++) {
          tl.to(q(`.stage-${i}`), { opacity: 0, duration: xfade }, t);
          tl.to(q(`.stage-${i + 1}`), { opacity: 1, duration: xfade }, t);
          t += dwell;
        }

        // 完成後にタグライン
        tl.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, t + 0.15);

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
