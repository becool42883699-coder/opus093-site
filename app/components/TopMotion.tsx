"use client";

/**
 * TopMotion — トップページのスクロール演出レイヤー。DOMは描画しない。
 *
 * このページには「4幕エンジン体験(EngineScene)」も乗るため、
 * **Lenis と ScrollTrigger の橋渡しはこのコンポーネントが唯一の所有者**とする。
 * EngineScene は Lenis を作らず、ここが作ったものの上でタイムラインを積むだけ。
 * 2つ作るとスクロールが震えて壊れる(CLAUDE.md §3 の Lenis 二重生成)。
 *
 * 演出そのものは差し替え前のトップページから引き継いでいる:
 *  - 見出しの行マスクスライド / [data-reveal] の汎用リビール / グリッドの stagger
 *  - 黒→白のワイプ(sticky + scrub。pinは使わない)
 * ヒーローは体験ページのものへ差し替わったので、そのぶんだけ対象を変えている。
 */

import { useEffect } from "react";
import { setLenis } from "./lenisBridge";

export default function TopMotion() {
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      /* スマホはネイティブスクロールに任せる(タッチへの割り込みが操作感を悪化させるため) */
      const lenis = coarse ? null : new Lenis({ duration: 1.15, wheelMultiplier: 0.88 });
      const onLenisScroll = () => ScrollTrigger.update();
      const raf = (time: number) => lenis?.raf(time * 1000);
      if (lenis) {
        lenis.on("scroll", onLenisScroll);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        setLenis(lenis);
      }

      const ctx = gsap.context(() => {
        /* ヒーローのコピーとCTA: 読み込み直後に一度だけ。
           電話ボタンは命綱なので opacity を触らない(常に押せる状態で出す) */
        gsap.from("[data-hero-rise]", {
          y: 34,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
        });

        /* 見出し: 行マスクスライド(親の overflow:hidden はCSS側) */
        gsap.utils
          .toArray<HTMLElement>(
            ".sectionIntro h2, .aboutCopy h2, .companyHeading h2, .contactSection h2",
          )
          .forEach((heading) => {
            gsap.from(heading, {
              yPercent: 110,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: heading, start: "top 80%", once: true },
            });
          });

        /* 汎用リビール */
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            yPercent: 12,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
        });

        /* グリッド: stagger 0.06 */
        [".serviceGrid", ".workGrid", ".aboutFeatures", ".businessScope"].forEach((sel) => {
          const wrap = document.querySelector(sel);
          if (!wrap) return;
          gsap.from(Array.from(wrap.children), {
            y: 32,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
          });
        });

        /* 黒→白ワイプ(sticky + scrub。pinは使わない) */
        gsap.fromTo(
          ".wipePanel",
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: {
              trigger: ".wipeZone",
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      });

      ScrollTrigger.refresh();
      cleanup = () => {
        ctx.revert();
        if (lenis) {
          lenis.off("scroll", onLenisScroll);
          gsap.ticker.remove(raf);
          lenis.destroy();
          gsap.ticker.lagSmoothing(1000, 16); // 既定へ戻す
          setLenis(null);
        }
      };
      if (cancelled) cleanup();
    };

    void setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
