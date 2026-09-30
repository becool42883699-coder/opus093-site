import type { CSSProperties } from "react";
import { asset } from "./site";
import s from "./site.module.css";

/**
 * public/icons の線画SVGを CSS マスクで描く。色は currentColor に従うので、
 * 暗い面・明るい面・ホバーで色を塗り替えられる(<img> だと元のグレー固定になる)。
 */
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  const style = { "--icon": `url(${asset(`/icons/${name}.svg`)})` } as CSSProperties;
  return <span className={`${s.icon} ${className}`} style={style} aria-hidden="true" />;
}

/** ロゴマーク。シアンの円に TX。brand-tx.svg と同じ字形をインラインで持つ */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="22" fill="var(--x-accent)" />
      <path d="M13 17h13M19.5 17v15M27 17l8 15M35 17l-8 15" fill="none" stroke="var(--x-ink)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

/** 斜め上の矢印(外へ・詳しく)。回転させれば右・下にも使える */
export function ArrowGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M6 18 18 6M8 6h10v10" />
    </svg>
  );
}
