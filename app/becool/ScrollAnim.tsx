"use client";

/**
 * 全ページ共通のスクロール演出コントローラ(旧 RevealController を統合)。
 *
 * - `[data-reveal]` を1つの IntersectionObserver で監視し、交差したら
 *   `.isInview` と `.isIn` を付けて以後は解除する(再スクロールで再発火しない)。
 *   - `.isInview` … 統一演出(line/stagger/up/zoom)用
 *   - `.isIn`     … 写真マスク([data-reveal-img])用。旧 RevealController が
 *                    付けていたもので、TOPの clip-path 演出がこれに依存している。
 *   属性も `data-anim-ready` と `data-motion-ready` の両方を立てる。
 * - no-JS安全: 「アニメ前(=非表示)」のCSSは全て上の2属性でゲートしてある。
 *   JS無効・初期化失敗・reduced-motion では属性が付かず opacity:0 が残らない。
 * - reduced-motion では監視自体を行わず、進捗バーも描画しない。
 * - スクロール進捗バーは scroll を rAF でスロットルし、scaleX のみ更新する
 *   (レイアウトを起こさない)。
 *
 * ※ threshold は 0 + rootMargin で判定する。「面積の15%」方式にすると、
 *   ビューポートより遥かに高いセクション(SHOWROOMのスティッキー・スタック等)は
 *   交差比が最大でも viewportH/elementH にしかならず、閾値に届かずに
 *   永久に発火しない事故が起きる。
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
    root.setAttribute("data-motion-ready", "");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add(styles.isInview, styles.isIn);
          io.unobserve(e.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    nodes.forEach((n) => io.observe(n));

    return () => {
      io.disconnect();
      root.removeAttribute("data-anim-ready");
      root.removeAttribute("data-motion-ready");
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
