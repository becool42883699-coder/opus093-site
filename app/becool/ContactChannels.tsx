"use client";

/**
 * 連絡手段を「大きな組版の一覧」として見せるセクション。
 * 行にホバーすると、その手段を表す写真がカーソルに追従して現れる。
 *
 * - PC(hover可)のみプレビューを出す。スマホは素の一覧としてそのまま機能する。
 * - 画像はホバーで初めて表示するが、要素自体は最初からDOMにあり lazy 読み込み。
 * - 追従は rAF 1本 + transform のみ。reduced-motion では追従・拡大をしない。
 */

import { useEffect, useRef } from "react";
import styles from "./becool.module.css";

export type Channel = {
  no: string;
  en: string;
  title: string;
  note: string;
  action: string;
  href: string;
  external?: boolean;
  cursor: string;
  photo: string;
};

export default function ContactChannels({ items }: { items: Channel[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    if (!list || !preview) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let x = 0, y = 0, tx = 0, ty = 0, shown = false;
    let raf: number | null = null;
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      preview.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = list.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!shown) { x = tx; y = ty; }
      const row = (e.target as Element | null)?.closest?.("[data-photo]") as HTMLElement | null;
      if (row) {
        const src = row.dataset.photo!;
        const img = preview.querySelector("img")!;
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        preview.dataset.on = "true";
        if (!shown) { shown = true; raf ??= requestAnimationFrame(loop); }
      } else {
        delete preview.dataset.on;
      }
    };
    const onLeave = () => { delete preview.dataset.on; };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.channelsWrap}>
      <ul ref={listRef} className={styles.channelList}>
        {items.map((c) => (
          <li key={c.en} className={styles.channelRow} data-photo={c.photo}>
            <a
              className={styles.channelLink}
              href={c.href}
              data-cursor={c.cursor}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className={styles.channelNo}>{c.no}</span>
              <span className={styles.channelMain}>
                <span className={styles.channelTitle}>{c.title}</span>
                <span className={styles.channelNote}>{c.note}</span>
              </span>
              <span className={styles.channelMeta}>
                <span className={styles.channelEn}>{c.en}</span>
                <span className={styles.channelCta}>{c.action}</span>
              </span>
              <span className={styles.channelArrow} aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
              </span>
            </a>
          </li>
        ))}
        {/* カーソル追従プレビュー(PCのみ表示) */}
        <div ref={previewRef} className={styles.channelPreview} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" loading="lazy" />
        </div>
      </ul>
    </div>
  );
}
