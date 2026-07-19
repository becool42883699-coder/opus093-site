"use client";

/**
 * GARAGE BeCool ヒーローの「経路に沿って敷かれて組み上がる」イントロ。
 * form-design.jp のイントロを踏襲: ロゴの実体(塗り)がマスク内の太い
 * ストロークの stroke-dash に合わせ、輪郭の経路(屋根→G面→B面→屋根)に
 * 沿って端から現れる。併走して辺の延長線(見当線)が伸びて消え、
 * 完成後にワードマークが1文字ずつ揃う。
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

        // --- 初期状態: 塗りは表示(マスクが隠す)、マスク/見当線は未描画、文字は散らして透明 ---
        gsap.set(q(".logo-fill"), { autoAlpha: 1 });
        gsap.set(q(".mask-sweep"), { strokeDashoffset: 1 });
        gsap.set(q(".logo-guide"), { autoAlpha: 1 });
        gsap.set(q(".logo-guide path"), { strokeDashoffset: 1 });
        gsap.set(q(".hero-letter"), { autoAlpha: 0, y: () => gsap.utils.random(-16, 16) });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        const timeline = gsap.timeline({ defaults: { ease: "none" } });
        tl = timeline;

        // 1) ロゴの実体が経路に沿って敷かれていく:
        //    屋根左半分(頂点→左角) → 左面を下る(G) → 右面を上る(B) → 屋根右半分で閉じる
        timeline.to(q(".sweep-roof-l"), { strokeDashoffset: 0, duration: 0.3, ease: "power1.in" }, 0.3);
        timeline.to(q(".sweep-left"), { strokeDashoffset: 0, duration: 0.55 }, 0.55);
        timeline.to(q(".sweep-right"), { strokeDashoffset: 0, duration: 0.55 }, 1.05);
        timeline.to(q(".sweep-roof-r"), { strokeDashoffset: 0, duration: 0.28, ease: "power1.out" }, 1.55);

        // 2) 併走する辺の延長線(見当線): リボンの通過に合わせて伸びる
        timeline.to(q(".gl-tl"), { strokeDashoffset: 0, duration: 0.3 }, 0.18);
        timeline.to(q(".gl-lv"), { strokeDashoffset: 0, duration: 0.35 }, 0.5);
        timeline.to(q(".gl-lb"), { strokeDashoffset: 0, duration: 0.35 }, 0.95);
        timeline.to(q(".gl-rb"), { strokeDashoffset: 0, duration: 0.35 }, 1.0);
        timeline.to(q(".gl-rv"), { strokeDashoffset: 0, duration: 0.35 }, 1.15);
        timeline.to(q(".gl-tr"), { strokeDashoffset: 0, duration: 0.3 }, 1.5);

        // 3) 見当線は現れた順にすっと消える
        timeline.to(q(".gl-tl"), { autoAlpha: 0, duration: 0.4 }, 1.1);
        timeline.to(q(".gl-lv"), { autoAlpha: 0, duration: 0.4 }, 1.5);
        timeline.to(q(".gl-lb"), { autoAlpha: 0, duration: 0.4 }, 1.7);
        timeline.to(q(".gl-rb"), { autoAlpha: 0, duration: 0.4 }, 1.9);
        timeline.to(q(".gl-rv"), { autoAlpha: 0, duration: 0.4 }, 2.05);
        timeline.to(q(".gl-tr"), { autoAlpha: 0, duration: 0.4 }, 2.15);

        // 4) ワードマークが1文字ずつ(縦にバラついた位置から)揃う
        timeline.to(q(".hero-letter"), { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.055 }, 1.95);
        // 5) タグライン
        timeline.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.85);

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
