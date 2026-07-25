"use client";

/**
 * CONTACT ヒーローの「シグナル」演出。
 * 中心からごく細いブルーのリングが静かに広がり続ける(=つながる/連絡のモチーフ)。
 * ブランドの禁止事項に触れないよう、強い発光・派手な回転・粒子の飛散はしない。
 *
 * - Canvas 2D のみ(WebGL不要)。低性能端末でも軽い。
 * - reduced-motion: 何も描かない(静的なまま)。
 * - 画面外・タブ非表示では rAF を止める。
 * - pointer-events: none。タッチスクロールを一切妨げない。
 */

import { useEffect, useRef } from "react";
import styles from "./becool.module.css";

type Ring = { t: number };

const PERIOD = 2600; // 1リングの寿命(ms)
const INTERVAL = 900; // リング発生間隔(ms)

export default function ContactPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2);
    let w = 0, h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let raf: number | null = null;
    let running = true;
    let last = performance.now();
    let acc = INTERVAL; // 最初のリングをすぐ出す
    const rings: Ring[] = [];
    // 対角の半分まで広がれば画面を覆える
    const maxR = () => Math.hypot(w, h) * 0.62;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      acc += dt;
      while (acc >= INTERVAL) {
        acc -= INTERVAL;
        rings.push({ t: 0 });
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dt;
        if (rings[i].t > PERIOD) rings.splice(i, 1);
      }

      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.5;
      const R = maxR();
      for (const ring of rings) {
        const p = ring.t / PERIOD; // 0..1
        // 立ち上がりは速く、終盤はゆっくり消える
        const e = 1 - Math.pow(1 - p, 2.2);
        const r = R * e;
        const alpha = Math.max(0, 0.34 * (1 - p) * Math.min(1, p * 6));
        if (alpha <= 0.002 || r <= 0) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(122, 175, 236, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const stop = () => {
      running = false;
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    let rzRaf: number | null = null;
    const onResize = () => {
      if (rzRaf != null) return;
      rzRaf = requestAnimationFrame(() => { rzRaf = null; resize(); });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (rzRaf != null) cancelAnimationFrame(rzRaf);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.contactPulse} aria-hidden="true" />;
}
