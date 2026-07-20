"use client";

/**
 * GARAGE BeCool ヒーローの水面イントロ(納品仕様書v1.1「俯瞰水面版」)。
 * 5秒・初回1回再生・最終ロゴで停止。タイムライン:
 *   00 0.0-0.5 波紋の発生   / 01 0.5-1.1 浮上開始 / 02 1.1-1.7 組み上げ
 *   03 1.7-2.1 ホールド     / 04 2.1-3.0 線へ分解 / 05 3.0-3.7 再構築A(線描画)
 *   06 3.7-4.5 再構築B(マスク露出) / 07 4.5-5.0 完成・停止 → ワードマーク/タグライン
 *
 * - prefers-reduced-motion / 同一セッション2回目以降: 最終ロゴを即表示
 * - GSAP読み込み失敗・JSエラー時も最終ロゴを表示(data-intro="done")
 * - タブ非表示中は timeline を pause、復帰で resume
 * - アンマウント時に context.revert()
 */

import { useEffect } from "react";

const PLAYED_KEY = "bc-hero-intro-played";

export default function BecoolWaterIntro() {
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
      let gsap: typeof import("gsap")["gsap"];
      try {
        gsap = (await import("gsap")).gsap;
      } catch {
        stage.setAttribute("data-intro", "done"); // GSAP不達でも最終ロゴは出す
        return;
      }
      if (killed) return;

      const ctx = gsap.context(() => {
        const q = gsap.utils.selector(stage);

        /* --- 初期状態 --- */
        gsap.set(q(".wl-water"), { autoAlpha: 0 });
        gsap.set(q(".wl-ring"), { scale: 0.12, opacity: 0, svgOrigin: "800 650" });
        gsap.set(q(".wl-mouth"), { opacity: 0 });
        gsap.set(q(".wl-shadow"), { autoAlpha: 0 });
        gsap.set(q(".wl-cube"), { autoAlpha: 1 });         // 個々のパーツ側で隠す
        gsap.set(q(".wl-mark"), { autoAlpha: 0, y: 90 });
        gsap.set(q(".wl-word-g, .wl-word-b"), { autoAlpha: 0, y: 120 });
        gsap.set(q(".wl-since"), { autoAlpha: 0, y: 110 });
        gsap.set(q(".wl-frag"), { autoAlpha: 0 });
        gsap.set(q(".wl-frag-p"), { strokeDasharray: "0.05 0.08", strokeDashoffset: 0 });
        gsap.set(q(".wl-guides"), { autoAlpha: 0 });
        gsap.set(q(".wl-guide, .wl-cobalt"), { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(q(".wl-final"), { autoAlpha: 0 });
        gsap.set(q(".wl-shine"), { autoAlpha: 0, x: -420 });
        gsap.set(q(".hero-wordmark"), { autoAlpha: 1, clipPath: "inset(-10% 102% -10% -2%)" });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        const timeline = gsap.timeline({ defaults: { ease: "none" } });
        tl = timeline;

        /* ===== 00 波紋の発生 (0.0-0.5) — 同心円は中心から放出され減衰する ===== */
        timeline.to(q(".wl-water"), { autoAlpha: 1, duration: 0.35, ease: "power1.out" }, 0);
        q(".wl-ring").forEach((ring, i) => {
          timeline.fromTo(ring,
            { scale: 0.12, opacity: 0.75 },
            { scale: 1.5, opacity: 0, duration: 1.3, ease: "power1.out", repeat: 1, repeatDelay: 0.05 },
            0.1 + i * 0.28);
        });
        timeline.to(q(".wl-mouth"), { opacity: 0.8, duration: 0.3, ease: "power1.out" }, 0.25);

        /* ===== 01 浮上開始 (0.5-1.1) — 波紋の中心からマークが上昇 ===== */
        timeline.to(q(".wl-shadow"), { autoAlpha: 0.55, duration: 0.3, ease: "power1.out" }, 0.5);
        timeline.to(q(".wl-mark"), { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, 0.55);
        timeline.to(q(".wl-mark"), { y: 0, duration: 0.7, ease: "power2.out" }, 0.5);

        /* ===== 02 組み上げ (1.1-1.7) — 文字ブロックが順に正位置へロック ===== */
        timeline.to(q(".wl-word-g"), { autoAlpha: 1, duration: 0.25 }, 1.1);
        timeline.to(q(".wl-word-g"), { y: 0, duration: 0.45, ease: "back.out(1.4)" }, 1.1);
        timeline.to(q(".wl-word-b"), { autoAlpha: 1, duration: 0.25 }, 1.22);
        timeline.to(q(".wl-word-b"), { y: 0, duration: 0.45, ease: "back.out(1.4)" }, 1.22);
        timeline.to(q(".wl-since"), { autoAlpha: 1, duration: 0.22 }, 1.35);
        timeline.to(q(".wl-since"), { y: 0, duration: 0.4, ease: "back.out(1.3)" }, 1.35);

        /* ===== 03 ホールド (1.7-2.1) — 完成キューブを見せ、波紋と影だけ減衰 ===== */
        timeline.to(q(".wl-shadow"), { autoAlpha: 0.28, duration: 0.4, ease: "power1.out" }, 1.7);
        timeline.to(q(".wl-mouth"), { opacity: 0.3, duration: 0.4 }, 1.7);

        /* ===== 04 線へ分解 (2.1-3.4) — 水面を消しつつ塗りをフェード。
                 エッジ線(ストローク片)は右へ流れながら消えていく ===== */
        timeline.to(q(".wl-water"), { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 2.1);
        timeline.to(q(".wl-shadow"), { autoAlpha: 0, duration: 0.45 }, 2.1);
        timeline.to(q(".wl-frag"), { autoAlpha: 0.9, duration: 0.3 }, 2.1);
        timeline.to(q(".wl-mark, .wl-word-g, .wl-word-b, .wl-since"),
          { autoAlpha: 0, duration: 0.6, ease: "power1.in", stagger: 0.08 }, 2.25);
        timeline.to(q(".wl-frag-p"), { strokeDashoffset: -0.4, duration: 1.3, ease: "power1.inOut" }, 2.1);
        timeline.to(q(".wl-frag"), { x: 110, duration: 1.3, ease: "sine.in" }, 2.2);
        timeline.to(q(".wl-frag"), { autoAlpha: 0, duration: 0.7, ease: "power1.in" }, 2.7);

        /* ===== 05 再構築A (2.95-3.9) — 流れる線の中に車体シルエットと
                 GARAGEボックスが線描画で立ち上がる ===== */
        timeline.to(q(".wl-guides"), { autoAlpha: 1, duration: 0.25 }, 2.95);
        timeline.to(q(".wl-guide-arc"), { strokeDashoffset: 0, duration: 0.7, ease: "power1.inOut" }, 3.0);
        timeline.to(q(".wl-guide-box"), { strokeDashoffset: 0, duration: 0.55, ease: "power1.inOut" }, 3.25);
        timeline.to(q(".wl-guide-base"), { strokeDashoffset: 0, duration: 0.5 }, 3.4);
        timeline.to(q(".wl-cobalt"), { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" }, 3.1);

        /* ===== 06 再構築B (3.9-5.0) — 筆記体を左→右のマスクで露出 ===== */
        timeline.set(q(".wl-final-wrap"), { attr: { mask: "url(#wlReveal)" } }, 3.9);
        timeline.set(q(".wl-reveal"), { scaleX: 0, svgOrigin: "330 430" }, 3.9);
        timeline.set(q(".wl-final"), { autoAlpha: 1 }, 3.9);
        timeline.to(q(".wl-reveal"), { scaleX: 1, duration: 1.05, ease: "power2.inOut" }, 3.92);

        /* ===== 07 完成・停止 (5.0-5.6) — 補助線を消しマスクを外して静的描画へ ===== */
        timeline.set(q(".wl-final-wrap"), { attr: { mask: "none" } }, 5.05);
        timeline.to(q(".wl-cobalt"), { autoAlpha: 0, duration: 0.35 }, 5.0);
        timeline.to(q(".wl-guide"), { autoAlpha: 0, duration: 0.4, stagger: 0.05 }, 5.0);
        timeline.to(q(".wl-shine"), { autoAlpha: 0.2, duration: 0.18 }, 5.1);
        timeline.to(q(".wl-shine"), { x: 900, duration: 0.8, ease: "power2.inOut" }, 5.1);
        timeline.to(q(".wl-shine"), { autoAlpha: 0, duration: 0.22 }, 5.72);

        /* 完成後: ワードマーク(左→右マスク)→タグライン */
        timeline.to(q(".hero-wordmark"), { clipPath: "inset(-10% -2% -10% -2%)", duration: 0.65, ease: "power2.inOut" }, 5.25);
        timeline.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 5.8);

        timeline.add(() => stage.setAttribute("data-intro", "complete"), 6.5);

        /* 全体のテンポ: 仕様書の5秒構成をベースに、ゆったり見せる(約1.35倍尺) */
        timeline.timeScale(0.74);
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
