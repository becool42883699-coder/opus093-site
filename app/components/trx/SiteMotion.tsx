"use client";

/**
 * 全ページ共通のモーション層。DOM は描かない。
 *
 * Lenis + ScrollTrigger の橋渡しはページにつき**このコンポーネント1つだけ**が持つ。
 * トップの4幕エンジン(EngineScene)は Lenis を作らず、ここが作ったものの上に乗る。
 * 2つ作るとホイール1回で2倍スクロールし、<html> の lenis-* が発振する(CLAUDE.md §7)。
 * スマホ(粗いポインタ)と reduced-motion ではネイティブスクロールのまま。
 */

import { useEffect } from "react";
import { setLenis } from "../lenisBridge";
import { initEffects } from "./effects";

export default function SiteMotion() {
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = reduce || coarse ? null : new Lenis({ duration: 1.2, wheelMultiplier: 0.9 });
      const onLenisScroll = () => ScrollTrigger.update();
      const raf = (time: number) => lenis?.raf(time * 1000);
      let onAnchor: ((event: MouseEvent) => void) | null = null;
      if (lenis) {
        lenis.on("scroll", onLenisScroll);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        setLenis(lenis);
        /* ページ内リンク(#top 等)も Lenis で送る */
        onAnchor = (event: MouseEvent) => {
          const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
          if (!link || !link.hash) return;
          const target = link.hash === "#top" ? 0 : document.querySelector<HTMLElement>(link.hash);
          if (target === null) return;
          event.preventDefault();
          lenis.scrollTo(target, { offset: -80, duration: 1.4 });
        };
        document.addEventListener("click", onAnchor);
      }

      const stopEffects = initEffects(gsap, ScrollTrigger);

      cleanup = () => {
        stopEffects();
        if (onAnchor) document.removeEventListener("click", onAnchor);
        if (lenis) {
          lenis.off("scroll", onLenisScroll);
          gsap.ticker.remove(raf);
          lenis.destroy();
          gsap.ticker.lagSmoothing(1000, 16);
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
