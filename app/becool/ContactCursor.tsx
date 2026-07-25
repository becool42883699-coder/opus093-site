"use client";

/**
 * カスタムカーソル(PCのみ)。
 * 小さなリングがポインタを追い、[data-cursor] を持つ要素に乗ると
 * 拡大してラベル(例: CALL / LINE / OPEN)を表示する。
 *
 * - (hover:hover)+(pointer:fine) 以外では一切起動しない(スマホは素のまま)。
 * - reduced-motion では起動しない。
 * - 位置更新は rAF 1本。transform だけを触るので再レイアウトしない。
 */

import { useEffect, useRef } from "react";
import styles from "./becool.module.css";

export default function ContactCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = dotRef.current;
    const label = labelRef.current;
    if (!el || !label) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    el.dataset.on = "true";
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    let raf: number | null = null;

    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const hit = (e.target as Element | null)?.closest?.("[data-cursor]") as HTMLElement | null;
      if (hit) {
        el.dataset.hover = "true";
        label.textContent = hit.dataset.cursor || "";
      } else {
        delete el.dataset.hover;
        label.textContent = "";
      }
    };
    const onDown = () => { el.dataset.down = "true"; };
    const onUp = () => { delete el.dataset.down; };
    const onLeave = () => { delete el.dataset.on; };
    const onEnter = () => { el.dataset.on = "true"; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div ref={dotRef} className={styles.cursor} aria-hidden="true">
      <span ref={labelRef} className={styles.cursorLabel} />
    </div>
  );
}
