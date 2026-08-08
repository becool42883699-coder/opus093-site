"use client";

/* スクロール連動キャンバス・シーケンス(sui系ブリーフ 6-1)
   - position:fixed のフルスクリーンcanvasに連番WebPを描画
   - ScrollTrigger start:0 → end:2420、scrub:true
   - ctx は { alpha:false }。先頭10枚のロードを待ってから初回描画
   - prefers-reduced-motion では最終フレームを静止表示(6-5) */

import { useEffect, useRef } from "react";

const FRAMES = 90;
const SEQ_END = 2420;

export default function HeroSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* モバイルは縦構図の別セット(/seq-m/)を使う。マウント時に一度だけ判定 */
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    canvas.width = isMobile ? 800 : 1440;
    canvas.height = isMobile ? 1400 : 900;
    const dir = isMobile ? "/seq-m/" : "/seq/";

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < FRAMES; i++) {
      const img = new Image();
      img.src = `${base}${dir}${String(i).padStart(4, "0")}.webp`;
      images.push(img);
    }

    const seq = { frame: 0 };
    const render = () => {
      const img = images[Math.round(seq.frame)];
      if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    let cancelled = false;
    let tween: { kill: () => void; scrollTrigger?: { kill: () => void } } | null = null;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      seq.frame = FRAMES - 1;
      images[FRAMES - 1].decode().then(() => { if (!cancelled) render(); }).catch(() => {});
      return () => { cancelled = true; };
    }

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      /* フレーム未ロードの黒画面を避けるため先頭10枚を待つ */
      await Promise.all(images.slice(0, 10).map((img) => img.decode().catch(() => {})));
      if (cancelled) return;
      render();

      tween = gsap.to(seq, {
        frame: FRAMES - 1,
        ease: "none",
        snap: "frame",
        scrollTrigger: { trigger: ".seqZone", start: 0, end: SEQ_END, scrub: true },
        onUpdate: render,
      });
    })();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, []);

  return (
    <div className="seqFixed" aria-hidden="true">
      <canvas ref={canvasRef} width={1440} height={900} />
    </div>
  );
}
