"use client";

/**
 * CONTACT系ページの統一スクロール演出。
 *
 * - `.jsReveal`(= data-reveal を持つ要素)を1つの IntersectionObserver で監視し、
 *   交差したら `.isInview` を付けて以後は解除する(再スクロールで再発火しない)。
 * - no-JS安全: 「アニメ前(=非表示)」のCSSは :global([data-anim-ready]) で
 *   ゲートしてある。JS無効・初期化失敗・reduced-motion ではこの属性が付かず、
 *   opacity:0 が残らない。
 * - reduced-motion では監視自体を行わず、進捗バーも描画しない。
 * - スクロール進捗バーは scroll を rAF でスロットルし、scaleX のみ更新する
 *   (レイアウトを起こさない)。
 */

import { useEffect, useRef } from "react";
import styles from "./becool.module.css";

export default function ScrollAnim() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    root.setAttribute("data-anim-ready", "");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add(styles.isInview);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    nodes.forEach((n) => io.observe(n));

    return () => {
      io.disconnect();
      root.removeAttribute("data-anim-ready");
    };
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number | null = null;
    const update = () => {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={barRef} className={styles.scrollProgress} aria-hidden="true" />;
}
