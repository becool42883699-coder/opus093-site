import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Split from "./Split";
import { asset } from "./site";
import s from "./site.module.css";

/**
 * サブページ共通のヒーロー。巨大な欧文ワード(装飾)+ 和文 h1 + リード + 横長のビジュアル。
 * ビジュアルは <img> で置く(サブページには LCP の縛りがない)。
 */
/* 欧文ワードの「字幅の合計 ÷ 文字サイズ」(Archivo 900 / wdth 72% の実測)。
   左右の余白いっぱいに収まる文字サイズをこれで逆算する */
const GIANT_RATIO: Record<string, number> = { Services: 3.88, Works: 2.97, Company: 4.05, Recruit: 3.45, Contact: 3.83 };

export default function PageHero({
  index, en, ja, lead, image, imageAlt = "", children,
}: {
  index: string; en: string; ja: Parameters<typeof Split>[0]["lines"]; lead: ReactNode;
  image?: { src: string; width: number; height: number; position?: string };
  imageAlt?: string; children?: ReactNode;
}) {
  return (
    <section className={s.pageHero} aria-labelledby="page-title">
      <div className={s.phMeta}>
        <span>({index})</span>
        <nav aria-label="パンくずリスト"><Link href="/">Top</Link><i aria-hidden="true">/</i><span aria-current="page">{en}</span></nav>
      </div>
      <p className={s.phGiant} aria-hidden="true" style={{ fontSize: `min(calc((100vw - var(--x-m) * 2) / ${GIANT_RATIO[en] ?? 4}), 30vw)` }}><Split lines={[[en]]} step={45} /></p>
      <div className={s.phBody}>
        <h1 id="page-title" className={s.phTitle}><Split lines={ja} delay={260} step={30} /></h1>
        <div className={`${s.phLead} x-rise`} style={{ "--d": "520ms" } as CSSProperties}>
          <p>{lead}</p>
          {children}
        </div>
      </div>
      {image && (
        <figure className={`${s.phMedia} x-open`} style={{ "--d": "300ms" } as CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(image.src)} alt={imageAlt} width={image.width} height={image.height}
            style={image.position ? { objectPosition: image.position } : undefined}
            data-x-parallax="8" fetchPriority="high"
          />
        </figure>
      )}
    </section>
  );
}
