"use client";

/**
 * 施工写真のギャラリー + 拡大表示(ライトボックス)。
 * 写真はボタンなので、マウス・タッチ・キーボードのどれでも開ける。拡大は <dialog> の showModal で、
 * Esc・背景のクリック・「閉じる」で閉じ、←→ / スワイプで前後へ送る。閉じるとフォーカスは元の写真へ戻る。
 * JS が無い時はただの写真の並び(拡大はできないが、全部見える)。
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLenis } from "../lenisBridge";
import sub from "./sub.module.css";

export type Photo = { src: string; alt: string; cap: string; w: number; h: number; tall?: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

export default function Gallery({ photos }: { photos: Photo[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (i + d + photos.length) % photos.length), [photos.length]);

  /* 開いている間は背面をスクロールさせない */
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const root = document.documentElement;
    const onOpen = () => {
      root.style.overflow = "hidden";
      getLenis()?.stop?.();
    };
    const onClose = () => {
      root.style.overflow = "";
      getLenis()?.start?.();
    };
    const observer = new MutationObserver(() => (el.open ? onOpen() : onClose()));
    observer.observe(el, { attributes: true, attributeFilter: ["open"] });
    return () => {
      observer.disconnect();
      onClose();
    };
  }, []);

  const photo = photos[index];

  return (
    <>
      <div className={sub.gallery}>
        {photos.map((p, i) => (
          <figure className={`${sub.shot} ${p.tall ? sub.shotTall : ""}`} key={p.src}>
            <button type="button" className={sub.shotImg} data-x-clip data-cursor="view" onClick={() => open(i)} aria-label={`拡大する: ${p.cap}`}>
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 34vw" />
            </button>
            <figcaption><span>{pad(i + 1)}</span>{p.cap}</figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialog}
        className={sub.lightbox}
        aria-label="施工写真の拡大表示"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        onPointerDown={(event) => (startX.current = event.clientX)}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const dx = event.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
        }}
      >
        <div className={sub.lbTop}>
          <span className={sub.lbCount} aria-live="polite">{pad(index + 1)} / {pad(photos.length)}</span>
          <button type="button" className={sub.lbClose} onClick={close}>Close<i aria-hidden="true" /></button>
        </div>
        <figure className={sub.lbFig} key={photo.src}>
          <Image src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} sizes="(max-width: 899px) 100vw, 80vw" />
          <figcaption>{photo.cap}</figcaption>
        </figure>
        <button type="button" className={`${sub.lbNav} ${sub.lbPrev}`} onClick={() => step(-1)} aria-label="前の写真"><i aria-hidden="true" /></button>
        <button type="button" className={`${sub.lbNav} ${sub.lbNext}`} onClick={() => step(1)} aria-label="次の写真"><i aria-hidden="true" /></button>
      </dialog>
    </>
  );
}
