"use client";

import { useEffect, useRef } from "react";
import styles from "./becool.module.css";

const COLUMNS = 6;
const REVEAL_START = 0.08;
const REVEAL_SPAN = 0.92;
const REVEAL_ORDER_SCALE = 0.78;
const REVEAL_FADE_SPAN = 0.16;

type Cell = {
  element: HTMLSpanElement;
  order: number;
  delay: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Resizeしてもセル順が毎回変わらない、軽量な決定的ジッター。
function revealDelay(index: number) {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * 0.055;
}

function subscribeToMediaQuery(query: MediaQueryList, listener: () => void) {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  query.addListener(listener);
  return () => query.removeListener(listener);
}

type OrangeBlockTransitionProps = {
  targetId: string;
};

/**
 * SERVICEへ入るときの、スクロール連動のセルレイヤー。
 * IntersectionObserverやReact stateは使わず、セルのopacityだけをrAFで更新する。
 */
export default function OrangeBlockTransition({ targetId }: OrangeBlockTransitionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const layer = layerRef.current;
    const target = document.getElementById(targetId);
    if (!track || !layer || !target) return;

    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let cells: Cell[] = [];
    let frame: number | null = null;
    let resizeFrame: number | null = null;

    // 実ブラウザではrAFを使う。Browser検証ランタイムなどでrAFが露出しない場合だけ、
    // 同じ1フレーム単位の更新を保つためsetTimeoutへフォールバックする。
    const requestFrame = (callback: () => void) => {
      if (typeof window.requestAnimationFrame === "function") {
        return window.requestAnimationFrame(() => callback());
      }
      return window.setTimeout(callback, 0);
    };
    const cancelFrame = (id: number) => {
      if (typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(id);
      } else {
        window.clearTimeout(id);
      }
    };

    const clearCells = () => {
      cells.forEach(({ element }) => element.remove());
      cells = [];
    };

    const buildCells = () => {
      clearCells();
      if (!desktopQuery.matches || !motionQuery.matches) {
        return;
      }

      const cellSize = window.innerWidth / COLUMNS;
      const rows = Math.max(1, Math.ceil(window.innerHeight / cellSize));
      const total = rows * COLUMNS;
      layer.style.setProperty("--orange-cols", String(COLUMNS));
      layer.style.setProperty("--orange-cell-size", `${cellSize}px`);

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const index = row * COLUMNS + column;
          const element = document.createElement("span");
          element.setAttribute("aria-hidden", "true");
          element.style.opacity = "0";
          layer.appendChild(element);

          // CSS GridのDOM順は上段からなので、reveal用の順番だけ下段から反転する。
          const bottomFirstOrder = (rows - 1 - row) * COLUMNS + column;
          cells.push({
            element,
            order: total > 1 ? bottomFirstOrder / (total - 1) : 0,
            delay: revealDelay(index),
          });
        }
      }
    };

    const render = () => {
      frame = null;
      if (cells.length === 0) return;

      const rect = target.getBoundingClientRect();
      const distance = Math.max(target.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / distance, 0, 1);
      const revealProgress = clamp((progress - REVEAL_START) / REVEAL_SPAN, 0, 1);

      cells.forEach(({ element, order, delay }) => {
        const cellProgress = clamp(
          (revealProgress - order * REVEAL_ORDER_SCALE - delay) / REVEAL_FADE_SPAN,
          0,
          1,
        );
        element.style.opacity = cellProgress.toFixed(3);
      });
    };

    const scheduleRender = () => {
      if (frame == null) frame = requestFrame(render);
    };

    const handleResize = () => {
      if (resizeFrame != null) return;
      resizeFrame = requestFrame(() => {
        resizeFrame = null;
        buildCells();
        render();
      });
    };

    const handleModeChange = () => {
      buildCells();
      scheduleRender();
    };

    buildCells();
    render();
    window.addEventListener("scroll", scheduleRender, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    const unsubscribeDesktop = subscribeToMediaQuery(desktopQuery, handleModeChange);
    const unsubscribeMotion = subscribeToMediaQuery(motionQuery, handleModeChange);

    return () => {
      window.removeEventListener("scroll", scheduleRender);
      window.removeEventListener("resize", handleResize);
      unsubscribeDesktop();
      unsubscribeMotion();
      if (frame != null) cancelFrame(frame);
      if (resizeFrame != null) cancelFrame(resizeFrame);
      clearCells();
    };
  }, [targetId]);

  return (
    <div ref={trackRef} className={styles.orangeTransitionTrack} aria-hidden="true">
      <div ref={layerRef} className={styles.orangeTransitionLayer} />
    </div>
  );
}
