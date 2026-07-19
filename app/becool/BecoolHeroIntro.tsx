"use client";

/**
 * GARAGE BeCool ヒーローの「設計図で組み上がる」イントロ。
 * 設計図の補助線(アイソメ軸・外周枠)を描いたあと、GBキューブの3面を
 * 外側から定位置へ組み上げて完成ロゴにする(form-design.jp のイントロ質感を踏襲)。
 *
 * - opacity / transform 中心で GPU に優しく動かす
 * - prefers-reduced-motion: 組み上げを再生せず完成ロゴを短フェード
 * - sessionStorage: 同一セッション2回目以降は完成ロゴを即表示
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

        // 各面は外向き(アイソメ)にずらした位置からスタート → 定位置へ組み上がる
        const OFF = 62; // ずらし量(viewBox単位)
        const faces: [string, number, number][] = [
          [".face-top", 0, -OFF],            // 天面: 上から
          [".face-left", -OFF * 0.87, OFF * 0.5], // G面(左下)
          [".face-right", OFF * 0.87, OFF * 0.5], // B面(右下)
        ];

        // --- 初期状態(補助線は未描画、面は外側・透明) ---
        gsap.set(q(".logo-guide"), { autoAlpha: 1 });
        gsap.set(q(".logo-guide path"), { strokeDashoffset: 1 });
        faces.forEach(([sel, dx, dy]) => gsap.set(q(sel), { autoAlpha: 0, x: dx, y: dy, scale: 0.92 }));
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
        tl = timeline;

        // 1) 設計図の補助線を描く(0.2〜1.2s、順に)
        timeline.to(q(".logo-guide path"), { strokeDashoffset: 0, duration: 0.95, ease: "power1.inOut", stagger: 0.1 }, 0.2);
        // 2) 3面が定位置へ組み上がる(0.75〜2.2s、天面→G→Bの順で)
        faces.forEach(([sel], i) => {
          timeline.to(q(sel), { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.72, ease: "power3.out" }, 0.75 + i * 0.28);
        });
        // 3) 組み上がりに合わせて補助線をフェードアウト(1.95〜2.6s)
        timeline.to(q(".logo-guide"), { autoAlpha: 0, duration: 0.65, ease: "power2.inOut" }, 1.95);
        // 4) タグライン(2.4〜3.1s)
        timeline.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 2.4);

        // 完成状態を確定
        timeline.add(() => stage.setAttribute("data-intro", "complete"), ">-0.05");
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
