"use client";

/**
 * Peel(自前・設計図→完成写真)。
 * 上層に同じ写真の「設計図(ブループリント)」版を重ね、ビュー到達時に「1回だけ」
 * 斜めにめくって剥がし、下層の完成写真を見せる。めくり際にはハイライトの反り(lip)と
 * 影を出して紙をめくる質感にする。
 *
 * Canvas UI 公式 Peel は実験的 HTML-in-Canvas API 前提で一般ブラウザでは無効化される
 * ため、CSS(clip-path + フィルタ)で同等演出を再現している。
 *
 * - 素の <img>(完成写真)を常時下層に描画(no-JS / reduced-motion でもそのまま見える)。
 * - 設計図の上層は JS 準備完了(data-peel-ready)時のみ表示 → スクロールで剥がす。
 */

/* 交差時の同期setState(演出開始)のため。react-hooks/set-state-in-effect は誤検知。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import styles from "./becool.module.css";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

const DURATION = 1800;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function PeelReveal({ src, alt, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lipRef = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false); // JSで設計図層を有効化(no-JSでは非表示)
  const [peeled, setPeeled] = useState(false); // 剥がし完了 → 設計図層を除去

  // マウント時: reduced-motion でなければ設計図層を有効化(covering)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setReady(true);
  }, []);

  // ready で設計図層が描画されたら: 初期状態を適用し、交差で1回だけ剥がす
  useEffect(() => {
    if (!ready) return;
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    const lip = lipRef.current;
    if (!wrap || !sheet || !lip) return;

    const apply = (p: number) => {
      const xt = (1.35 - 1.75 * p) * 100; // 上端X(%)
      const xb = (1.0 - 1.75 * p) * 100; // 下端X(%)
      sheet.style.clipPath = `polygon(-2% -2%, ${xt}% -2%, ${xb}% 102%, -2% 102%)`;
      const lipX = (xt + xb) / 2;
      lip.style.transform = `translateX(${lipX}%) skewX(-19deg)`;
      lip.style.opacity = p > 0.02 && p < 0.99 ? "1" : "0";
    };
    apply(0);

    let started = false;
    const start = () => {
      if (started || ranRef.current) return;
      started = true;
      ranRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = easeInOut(Math.min((now - t0) / DURATION, 1));
        apply(p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else setPeeled(true); // 設計図層を外す
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !document.hidden) start();
      },
      { threshold: 0.3 },
    );
    io.observe(wrap);
    return () => {
      io.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  return (
    <div ref={wrapRef} className={`${styles.peelWrap} ${className || ""}`} data-peel-ready={ready ? "true" : undefined}>
      {/* 完成写真(下層・常時) */}
      <img src={src} alt={alt} loading="lazy" className={styles.peelPhoto} />
      {/* 設計図(上層・剥がされる)。完成後は除去。lipは非クリップで影を写真側に落とす */}
      {ready && !peeled && (
        <>
          <div ref={sheetRef} className={styles.peelSheet} aria-hidden="true">
            <img src={src} alt="" className={styles.peelBlueprintImg} />
            <span className={styles.peelGrid} />
          </div>
          <span ref={lipRef} className={styles.peelLip} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
