"use client";

/**
 * 無限に流れるティッカー。
 * 同じ内容を2組並べ、-50% まで transform で動かして繋ぎ目なくループする。
 * transform だけなので合成のみで動き、再描画コストがほぼ無い。
 * reduced-motion では停止し、静的な帯として読める状態にする。
 */

import styles from "./becool.module.css";

export default function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const group = (
    <span className={styles.marqueeGroup} aria-hidden="true">
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className={styles.marqueeItem}>
          {t}
          <i aria-hidden="true" />
        </span>
      ))}
    </span>
  );
  return (
    <div className={styles.marquee} data-reverse={reverse ? "true" : undefined}>
      {/* 読み上げ用に1回だけテキストを持たせ、視覚用の2組は aria-hidden */}
      <span className={styles.srOnly}>{items.join("　/　")}</span>
      <div className={styles.marqueeTrack}>
        {group}
        {group}
      </div>
    </div>
  );
}
