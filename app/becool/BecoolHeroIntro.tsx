"use client";

/**
 * GARAGE BeCool ヒーローの「設計図→GBキューブ組み立て→車ロゴへ変形」イントロ。
 * GSAP Timeline + flubber(パスモーフ)で、
 *   線を描く → キューブが組み上がる → 発光 → キューブが車ロゴへ変形 →
 *   本物の車ロゴにクロスフェード → タグライン
 * を静かで精密なイージングで再生する。
 *
 * - prefers-reduced-motion: 変形を再生せず最終ロゴを短フェード
 * - sessionStorage: 同一セッション2回目以降は最終ロゴを即表示
 * - タブ非表示中は timeline を pause、復帰で resume
 * - アンマウント時に context.revert()
 */

import { useEffect } from "react";

const PLAYED_KEY = "bc-hero-intro-played";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
/* 車ロゴ viewBox(0 0 1099 412)空間に配置したキューブ外枠六角(モーフ開始形) */
const FROM_HEX = "M550 31 L684 129 L684 296 L549 381 L415 296 L415 129 Z";

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
      // 車ロゴの主要リング(最長サブパス)をモーフ先に使う
      let morphTo = "";
      try {
        const carText = await (await fetch(`${BASE}/becool/img/logo-car.svg`)).text();
        const d = carText.match(/ d="([^"]+)"/)?.[1] ?? "";
        const rings = d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
        morphTo = rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0] ?? "");
      } catch { /* フェッチ失敗時はモーフを省略しクロスフェードのみ */ }

      const [{ gsap }, flubber] = await Promise.all([
        import("gsap"),
        morphTo ? import("flubber") : Promise.resolve(null as unknown as typeof import("flubber")),
      ]);
      if (killed) return;

      const morphEl = stage.querySelector<SVGPathElement>(".logo-morph");
      let interp: ((t: number) => string) | null = null;
      if (morphTo && flubber && morphEl) {
        try { interp = flubber.interpolate(FROM_HEX, morphTo, { maxSegmentLength: 8 }); } catch { interp = null; }
        if (interp) morphEl.setAttribute("d", interp(0));
      }

      const ctx = gsap.context(() => {
        const q = gsap.utils.selector(stage);
        const soft = "power3.out";
        const keyframesOpacity = [{ opacity: 0.25 }, { opacity: 0.7 }, { opacity: 0.35 }, { opacity: 1 }];

        // --- 初期状態 ---
        gsap.set(q(".logo-draw"), { strokeDashoffset: 1 });
        gsap.set(q(".logo-guide, .logo-outline"), { autoAlpha: 1 });
        gsap.set(q(".hero-glow"), { autoAlpha: 0, scale: 0.6 });
        gsap.set(q(".logo-part"), { opacity: 0, "--pblur": "6px" });
        gsap.set(q(".part-top"), { yPercent: -60, rotate: -3 });
        gsap.set(q(".part-left"), { xPercent: -66, yPercent: 12, rotate: -5 });
        gsap.set(q(".part-right"), { xPercent: 66, yPercent: 12, rotate: 5 });
        gsap.set(q(".logo-morphStage"), { autoAlpha: 0, scale: 1.55 });
        gsap.set(q(".logo-car-final"), { autoAlpha: 0, scale: 1.04 });
        gsap.set(q(".hero-tagline"), { autoAlpha: 0, y: 8 });

        tl = gsap.timeline({ defaults: { ease: soft } });

        // 1) 全ての線(製図ガイド＋ロゴ輪郭)を描き切る(0.2〜2.3s)
        tl.to(q(".logo-draw"), { strokeDashoffset: 0, duration: 0.95, stagger: 0.08, ease: "power2.inOut" }, 0.2);

        // 2) キューブの各面が組み上がる(2.5〜3.4s)
        const assemble = (sel: string, at: number) => {
          tl!.to(q(sel), { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, duration: 1.05, ease: "cubic-bezier(0.22,1,0.36,1)" }, at);
          tl!.to(q(sel), { keyframes: keyframesOpacity, duration: 1.05, ease: "none" }, at);
          tl!.to(q(sel), { "--pblur": "0px", duration: 0.85, ease: "power2.out" }, at + 0.12);
        };
        assemble(".part-top", 2.5);
        assemble(".part-left", 2.68);
        assemble(".part-right", 2.86);

        // 3) 発光(この閃光の下でキューブ→モーフ形へ差し替える)
        tl.to(q(".hero-glow"), { autoAlpha: 0.95, scale: 1.1, duration: 0.45, ease: "power2.out" }, 3.55);
        // ガイド線・輪郭線を消す
        tl.to(q(".logo-guide, .logo-outline"), { autoAlpha: 0, duration: 0.5 }, 3.55);
        // 閃光のピークでキューブを隠し、モーフを表示
        tl.set(q(".heroLogo"), { autoAlpha: 0 }, 3.85);
        tl.set(q(".logo-morphStage"), { autoAlpha: 1 }, 3.85);

        // 4) キューブ→車ロゴへ変形(flubberでdを補間)＋ズームアウト(3.9〜5.4s)
        if (interp && morphEl) {
          const proxy = { t: 0 };
          const fn = interp;
          tl.to(proxy, {
            t: 1,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => morphEl.setAttribute("d", fn(proxy.t)),
          }, 3.9);
        }
        tl.to(q(".logo-morphStage"), { scale: 1, duration: 1.5, ease: "power2.inOut" }, 3.9);
        // 発光を落ち着かせる
        tl.to(q(".hero-glow"), { autoAlpha: 0.26, scale: 1, duration: 1.0, ease: "power2.inOut" }, 4.2);

        // 5) 本物の車ロゴにクロスフェード(5.1〜5.7s)
        tl.to(q(".logo-car-final"), { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 5.1);
        tl.to(q(".logo-morphStage"), { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 5.15);

        // 6) タグライン(5.5〜6.2s)
        tl.to(q(".hero-tagline"), { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 5.5);

        // 7) 完成状態を確定
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
