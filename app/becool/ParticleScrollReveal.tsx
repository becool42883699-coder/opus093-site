"use client";

/**
 * Particle Scroll(自前・画像ベース)。
 * スクロールで対象がビューに入った「1回だけ」、画像を砂状の粒子から組み上げる。
 * Canvas UI 公式の ParticleScroll は実験的 HTML-in-Canvas API 前提で一般ブラウザでは
 * 無効化されるため、画像を格子状セルにサンプリングして 2D Canvas で同等演出を再現する。
 *
 * - 既定は素の <img>(no-JS / reduced-motion / Canvas不可でもそのまま表示)。
 * - JS有効かつ交差時に一度だけ: 画像を薄いオーバーレイ canvas で粒子集合 → 実画像へ。
 * - 再スクロールで再生しない(1回だけ)。画面外・タブ非表示中は開始しない。
 */

/* 交差時の同期setState(演出開始)のため。react-hooks/set-state-in-effect は誤検知。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import styles from "./becool.module.css";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** セルの目安サイズ(px, 表示ピクセル基準)。小さいほど細かい砂。 */
  cell?: number;
};

const DURATION = 1500; // 総尺(ms)
const STAGGER = 0.55; // 粒子ごとの開始ばらつき(0..1)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function ParticleScrollReveal({ src, alt, className, imgClassName, cell = 9 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ranRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false); // 演出中: 実imgを隠す
  const [done, setDone] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!wrap || !canvas || !img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (reduce || !ctx) return; // フォールバック: 素の画像のまま

    let started = false;

    const start = () => {
      if (started || ranRef.current) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      if (!img.complete || img.naturalWidth === 0) return; // 画像未読込なら見送り
      started = true;
      ranRef.current = true;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);

      // 画像を表示サイズで一旦オフスクリーンに描いて格子サンプリング(cover相当)
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      octx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const data = octx.getImageData(0, 0, w, h).data;

      // 粒子数の上限(重すぎない範囲)に合わせてセルサイズを調整
      let cs = cell;
      while ((w / cs) * (h / cs) > 3000) cs += 1;
      const cols = Math.floor(w / cs), rows = Math.floor(h / cs);

      type P = { hx: number; hy: number; sx: number; sy: number; r: number; g: number; b: number; d: number };
      const ps: P[] = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const px = Math.floor((gx + 0.5) * cs);
          const py = Math.floor((gy + 0.5) * cs);
          const i = (py * w + px) * 4;
          const a = data[i + 3];
          if (a < 24) continue;
          // 散布: 主に下方向へ(砂が落ちて積もる) + ランダム
          const ang = Math.random() * Math.PI * 2;
          const dist = 24 + Math.random() * 70;
          ps.push({
            hx: gx * cs, hy: gy * cs,
            sx: gx * cs + Math.cos(ang) * dist,
            sy: gy * cs + Math.sin(ang) * dist + 40 + Math.random() * 60,
            r: data[i], g: data[i + 1], b: data[i + 2],
            d: Math.random(), // 開始ばらつき用
          });
        }
      }
      if (ps.length === 0) { ranRef.current = false; started = false; return; }

      setPlaying(true);
      const t0 = performance.now();
      const tick = (now: number) => {
        const gt = Math.min((now - t0) / DURATION, 1);
        ctx.clearRect(0, 0, w, h);
        for (let k = 0; k < ps.length; k++) {
          const p = ps[k];
          // 個々の進行(スタガー)
          let lt = (gt - p.d * STAGGER) / (1 - STAGGER);
          if (lt <= 0) continue;
          if (lt > 1) lt = 1;
          const e = easeOut(lt);
          const x = p.sx + (p.hx - p.sx) * e;
          const y = p.sy + (p.hy - p.sy) * e;
          const size = cs * (0.55 + 0.45 * e);
          ctx.globalAlpha = e;
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
        if (gt < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // 完成: 実画像へ引き渡してcanvasを消す
          setDone(true);
          setPlaying(false);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && !document.hidden) {
          if (img.complete && img.naturalWidth > 0) start();
          else img.addEventListener("load", start, { once: true });
        }
      },
      { threshold: 0.25 },
    );
    io.observe(wrap);
    return () => {
      io.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [cell]);

  return (
    <div ref={wrapRef} className={`${styles.psrWrap} ${className || ""}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={imgClassName}
        data-psr-hidden={playing && !done ? "true" : undefined}
      />
      <canvas
        ref={canvasRef}
        className={styles.psrCanvas}
        aria-hidden="true"
        data-psr-done={done ? "true" : undefined}
      />
    </div>
  );
}
