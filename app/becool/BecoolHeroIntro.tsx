"use client";

/**
 * GARAGE BeCool ヒーローのイントロ(form-design.jp の構造を踏襲)。
 * 流れ: 組み立てる → 完成 → 透明化 → 再構築 → 完成
 * 1. 各面が「移動+マスク」の複合で経路(屋根→G面→B面→屋根)に沿って敷かれる。
 *    併走して辺の延長線(見当線)が伸びて消える
 * 2. ワードマークが横方向のマスクで左から右へ開く → タグライン
 * 3. 斜めの走査線が通過した部分の塗りが透明化し、輪郭線だけ残って背景が透ける
 * 4. 同じ帯が逆方向に戻り、光の帯を伴って塗りが再構築される
 * 光はネオン発光ではなくマスク・透過・細線・背景色で表現。
 *
 * - prefers-reduced-motion: 演出を再生せず完成ロゴを短フェード
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

        // --- 初期状態 ---
        gsap.set(q(".logo-fill"), { autoAlpha: 1 });          // 塗りは表示(マスクが隠す)
        gsap.set(q(".mask-sweep"), { strokeDashoffset: 1 });  // 組立帯: 未走行
        gsap.set(q(".logo-guide"), { autoAlpha: 1 });
        gsap.set(q(".logo-guide path"), { strokeDashoffset: 1 });
        // 各面は少しずれた位置から移動しながらマスクで現れる(移動+マスクの複合)
        gsap.set(q(".face-top"), { y: -16 });
        gsap.set(q(".face-left"), { x: -16 });
        gsap.set(q(".face-right"), { x: 16 });
        gsap.set(q(".hero-wordmark"), { autoAlpha: 1, clipPath: "inset(-10% 102% -10% -2%)" });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        const timeline = gsap.timeline({ defaults: { ease: "none" } });
        tl = timeline;

        /* ===== フェーズ1: 組立(0.3〜1.85s) =====
           経路: 屋根左半分(頂点→左角) → 左面を下る(G) → 右面を上る(B) → 屋根右で閉じる */
        timeline.to(q(".sweep-roof-l"), { strokeDashoffset: 0, duration: 0.3, ease: "power1.in" }, 0.3);
        timeline.to(q(".face-top"), { y: 0, duration: 0.5, ease: "power2.out" }, 0.3);
        timeline.to(q(".sweep-left"), { strokeDashoffset: 0, duration: 0.55 }, 0.55);
        timeline.to(q(".face-left"), { x: 0, duration: 0.6, ease: "power2.out" }, 0.55);
        timeline.to(q(".sweep-right"), { strokeDashoffset: 0, duration: 0.55 }, 1.05);
        timeline.to(q(".face-right"), { x: 0, duration: 0.6, ease: "power2.out" }, 1.05);
        timeline.to(q(".sweep-roof-r"), { strokeDashoffset: 0, duration: 0.28, ease: "power1.out" }, 1.55);

        // 併走する辺の延長線(見当線): 伸びて、現れた順に消える
        timeline.to(q(".gl-tl"), { strokeDashoffset: 0, duration: 0.3 }, 0.18);
        timeline.to(q(".gl-lv"), { strokeDashoffset: 0, duration: 0.35 }, 0.5);
        timeline.to(q(".gl-lb"), { strokeDashoffset: 0, duration: 0.35 }, 0.95);
        timeline.to(q(".gl-rb"), { strokeDashoffset: 0, duration: 0.35 }, 1.0);
        timeline.to(q(".gl-rv"), { strokeDashoffset: 0, duration: 0.35 }, 1.15);
        timeline.to(q(".gl-tr"), { strokeDashoffset: 0, duration: 0.3 }, 1.5);
        timeline.to(q(".gl-tl"), { autoAlpha: 0, duration: 0.4 }, 1.1);
        timeline.to(q(".gl-lv"), { autoAlpha: 0, duration: 0.4 }, 1.5);
        timeline.to(q(".gl-lb"), { autoAlpha: 0, duration: 0.4 }, 1.7);
        timeline.to(q(".gl-rb"), { autoAlpha: 0, duration: 0.4 }, 1.9);
        timeline.to(q(".gl-rv"), { autoAlpha: 0, duration: 0.4 }, 2.05);
        timeline.to(q(".gl-tr"), { autoAlpha: 0, duration: 0.4 }, 2.15);

        /* ===== フェーズ2: 文字(1.95〜3.2s) =====
           ワードマークは横方向のマスクが左から右へ開く。タグラインは控えめにフェード */
        timeline.to(q(".hero-wordmark"), { clipPath: "inset(-10% -2% -10% -2%)", duration: 0.65, ease: "power1.inOut" }, 1.95);
        timeline.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.7);

        /* ===== フェーズ3: 走査→透明化(3.75〜4.6s) =====
           斜めの走査線が通過した部分から塗りが透明になり、輪郭線だけ残って背景が透ける */
        timeline.to(q(".scan-beam"), { autoAlpha: 0.9, duration: 0.12 }, 3.75);
        timeline.to(q(".scan-hide, .scan-show"), { strokeDashoffset: 0, duration: 0.85, ease: "power1.inOut" }, 3.8);
        timeline.to(q(".scan-beam"), { x: 450, y: 520, duration: 0.85, ease: "power1.inOut" }, 3.8);
        timeline.to(q(".scan-beam"), { autoAlpha: 0, duration: 0.15 }, 4.62);

        /* ===== フェーズ4: 線画状態を一瞬見せてから復元(5.05〜5.95s) =====
           同じ帯が逆方向に戻り、光の帯を伴って塗りが再構築される */
        timeline.to(q(".scan-beam"), { autoAlpha: 0.9, duration: 0.12 }, 5.05);
        timeline.to(q(".scan-hide, .scan-show"), { strokeDashoffset: 1, duration: 0.85, ease: "power1.inOut" }, 5.1);
        timeline.to(q(".scan-beam"), { x: 0, y: 0, duration: 0.85, ease: "power1.inOut" }, 5.1);
        timeline.to(q(".scan-beam"), { autoAlpha: 0, duration: 0.18 }, 5.92);

        /* ===== 完成: 静止してロゴを読ませる ===== */
        timeline.add(() => stage.setAttribute("data-intro", "complete"), 6.15);
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
