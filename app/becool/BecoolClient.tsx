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

/** Adds an "isIn" class to elements marked with data-reveal when scrolled into view. */
export function RevealController() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce) { nodes.forEach((n) => n.classList.add(styles.isIn)); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add(styles.isIn); io.unobserve(e.target); }
        });
      },
      // セクションが顔を出したらすぐ競り上がりを始める(遅発火だと「ぬるっ」と見える)
      { threshold: 0.04, rootMargin: "0px 0px -4% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
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
