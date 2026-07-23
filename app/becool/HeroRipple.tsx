"use client";

/**
 * ロゴ表示領域だけに重ねる軽量な Ripple オーバーレイ(2D canvas)。
 *  - クリック/タップ時だけ、薄いブルーの同心円を2〜3本、約0.85sで消す
 *  - 自動波紋なし・ホバー追従なし・常時アニメなし(動いていない時はrAF停止)
 *  - canvas は pointer-events:none / aria-hidden。クリック取得は親ラッパ側
 *  - Particle ObjectのWebGL Canvasには一切触れない(再キャプチャ/再描画しない)
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import styles from "./becool.module.css";

export interface RippleHandle {
  /** 親ラッパ左上を原点とする CSS px 座標で波紋を発生 */
  spawn: (x: number, y: number) => void;
}

const DURATION = 850; // ms

const HeroRipple = forwardRef<RippleHandle, { className?: string }>(
  function HeroRipple({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spawnRef = useRef<(x: number, y: number) => void>(() => {});

    useImperativeHandle(ref, () => ({ spawn: (x, y) => spawnRef.current(x, y) }), []);

    useEffect(() => {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (!canvas || !parent) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const ripples: { x: number; y: number; start: number }[] = [];
      let raf: number | null = null;
      let w = 0;
      let h = 0;
      let dpr = 1;

      const resize = () => {
        w = parent.clientWidth;
        h = parent.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      };

      const loop = () => {
        const now = performance.now();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const maxR = Math.min(w, h) * 0.5;
        let i = ripples.length;
        while (i--) {
          const r = ripples[i];
          const t = (now - r.start) / DURATION;
          if (t >= 1) {
            ripples.splice(i, 1);
            continue;
          }
          const ease = 1 - Math.pow(1 - t, 3);
          const baseR = maxR * ease;
          const fade = 1 - t;
          for (let k = 0; k < 3; k++) {
            const rr = baseR - k * (maxR * 0.12);
            const a = fade * (0.26 - k * 0.07);
            if (rr <= 0 || a <= 0) continue;
            ctx.beginPath();
            ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(90,162,236,${a.toFixed(3)})`;
            ctx.stroke();
          }
        }
        if (ripples.length > 0) {
          raf = requestAnimationFrame(loop);
        } else {
          ctx.clearRect(0, 0, w, h);
          raf = null; // 動いていない時は描画停止
        }
      };

      spawnRef.current = (x: number, y: number) => {
        ripples.push({ x, y, start: performance.now() });
        if (ripples.length > 6) ripples.splice(0, ripples.length - 6);
        if (raf == null) raf = requestAnimationFrame(loop);
      };

      // ResizeObserver の連続発火は rAF で間引く
      let scheduled = false;
      const ro = new ResizeObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          resize();
        });
      });
      ro.observe(parent);
      resize();

      return () => {
        ro.disconnect();
        if (raf != null) cancelAnimationFrame(raf);
        raf = null;
        ripples.length = 0;
        spawnRef.current = () => {};
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`${styles.rippleCanvas} ${className || ""}`}
      />
    );
  },
);

export default HeroRipple;
