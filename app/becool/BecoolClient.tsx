"use client";

/**
 * Be Cool — client behaviour (menu + on-scroll reveal + back-to-top).
 * The hero logo line-draw is pure CSS; this only handles interaction.
 * Everything is progressive: with JS off, all content is fully visible.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./becool.module.css";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // The header uses backdrop-filter, which would trap a fixed-position drawer
  // inside the header box — so the drawer is portalled to <body>. The `becool`
  // wrapper keeps the design tokens (--bc-*) resolvable outside the page tree.
  const drawer = (
    <div className="becool">
      <nav className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`} aria-hidden={!open}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined} />
        <span style={open ? { opacity: 0 } : undefined} />
        <span style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined} />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}

/**
 * スクロール表示演出。セクション([data-reveal])と写真マスク([data-reveal-img])を
 * 1つの IntersectionObserver で一度だけ表示。
 * no-JS安全: ルートに data-motion-ready を付けた時だけ「アニメ前(=非表示)」の
 * CSSが有効になる。JS無効/初期化失敗/reduced-motion では最初から表示のまま。
 */
export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // セクション([data-reveal])のみ監視。写真マスク([data-reveal-img])は
    // clip で不可視のため IO が交差を検知できない → 親セクションの isIn で開く。
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    // reduced-motion / 対象なし: data-motion-ready を付けない → 常に表示
    if (reduce || nodes.length === 0) return;
    root.setAttribute("data-motion-ready", "");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.isIn);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: "0px 0px -4% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => {
      io.disconnect();
      root.removeAttribute("data-motion-ready");
    };
  }, []);
  return null;
}

/**
 * ごく弱い背景パララックス。対象は [data-parallax] を持つ既存の背景写真のみ。
 * 1つの scroll ハンドラ + 1つの rAF で全対象を更新。画面外は更新しない。
 * スマホ / reduced-motion では無効。アンマウントで解除。
 */
export function ParallaxController() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    if (reduce || mobile) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    if (els.length === 0) return;
    const speeds = els.map((el) => Math.abs(parseFloat(el.dataset.parallax || "") || 0.05));

    let raf: number | null = null;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) continue; // 画面外は更新しない
        const center = rect.top + rect.height / 2;
        const off = (center - vh / 2) / vh; // 概ね -0.6..0.6
        const y = Math.max(-14, Math.min(14, -off * speeds[i] * vh));
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
      els.forEach((el) => {
        el.style.transform = "";
      });
    };
  }, []);
  return null;
}

export function ToTopButton() {
  return (
    <button
      type="button"
      className={styles.toTop}
      aria-label="ページ上部へ戻る"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6" /></svg>
      TOP
    </button>
  );
}
