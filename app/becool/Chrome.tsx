import Link from "next/link";
import styles from "./becool.module.css";
import { MobileMenu, ToTopButton } from "./BecoolClient";

/* GARAGE BeCool 共通シェル(ヘッダー/フッター)と共有定数。
   トップ(/becool)とサブページ(maintenance/stock)で共用する。 */

/* サブパス配信(GitHub Pages等)でも画像が解決できるようベースパスを前置 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const asset = (p: string) => `${BASE}${p}`;
export const LINE_URL = "https://line.me/R/ti/p/@123jicrs";
export const SITE_URL = "https://garage-becool.co.jp/";
export const TEL = "093-967-2345";
export const TEL_HREF = `tel:${TEL.replaceAll("-", "")}`;

/* ページをまたぐためパス付き。ハッシュはトップのセクションへ */
export const NAV = [
  { href: "/becool/#about", label: "ABOUT" },
  { href: "/becool/#showroom", label: "SHOWROOM" },
  { href: "/becool/maintenance/", label: "MAINTENANCE" },
  { href: "/becool/stock/", label: "STOCK" },
  { href: "/becool/#shop", label: "SHOP" },
  { href: "/becool/#contact", label: "CONTACT" },
];

export function GbSymbol({ size = 34 }: { size?: number }) {
  return (
    <img src={asset("/becool/img/symbol.svg")} alt="" width={size} height={size} style={{ width: size, height: "auto" }} />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={className}>GARAGE <b>BeCool</b></span>;
}

export function BecoolHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/becool/" aria-label="GARAGE BeCool トップへ">
        <GbSymbol size={36} />
        <Wordmark className={styles.brandName} />
      </Link>
      <nav className={styles.navDesktop} aria-label="メインナビゲーション">
        {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
      </nav>
      <MobileMenu links={NAV} />
    </header>
  );
}

export function BecoolFooter() {
  return (
    <footer id="contact" className={styles.footer}>
      <div data-reveal className={`${styles.footInner} ${styles.reveal}`}>
        <span className={styles.footBrand}>
          <GbSymbol size={38} />
          <Wordmark className={styles.footWordmark} />
        </span>
        <p className={styles.footDesc}>
          福岡県北九州市小倉南区で、中古車販売・買取・車検・整備・メンテナンスを行う地域密着型のカーショップ。
          沼店・中吉田店の2店舗で、車選びから購入後のカーライフまでトータルにサポートします。
        </p>
        <p className={styles.footMeta}>
          有限会社ビークール<br />
          共通お問い合わせ TEL: <a href={TEL_HREF}>{TEL}</a><br />
          営業時間 10:00〜20:00／年中無休
        </p>
        <div className={styles.footSocial}>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer" aria-label="公式LINE">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.06.7.2.8.5.07.25 0 .64 0 .9l-.13.8c-.04.24-.2.94.82.5s5.5-3.2 7.5-5.5C20.8 15 22 13.1 22 11c0-4.4-4.5-8-10-8Zm-3.6 9.8H6.9a.4.4 0 0 1-.4-.4V9.6a.4.4 0 0 1 .8 0v2.4h1.1a.4.4 0 0 1 0 .8Zm1.7-.4a.4.4 0 0 1-.8 0V9.6a.4.4 0 0 1 .8 0v2.8Zm3.7 0a.4.4 0 0 1-.3.4h-.1a.4.4 0 0 1-.3-.16L12 10.8v1.6a.4.4 0 0 1-.8 0V9.6a.4.4 0 0 1 .7-.24L13 11V9.6a.4.4 0 0 1 .8 0v2.8Zm2.8-1.8a.4.4 0 0 1 0 .8h-1.1v.6h1.1a.4.4 0 0 1 0 .8h-1.5a.4.4 0 0 1-.4-.4V9.6a.4.4 0 0 1 .4-.4h1.5a.4.4 0 0 1 0 .8h-1.1v.6h1.1Z" /></svg>
          </a>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" aria-label="公式サイト">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15 15 0 0 0-1-3.3A8 8 0 0 1 18.9 8ZM12 4c.9 1.2 1.5 2.6 1.9 4h-3.8c.4-1.4 1-2.8 1.9-4ZM4.3 14a8 8 0 0 1 0-4h3.3a17 17 0 0 0 0 4Zm.8 2h3a15 15 0 0 0 1 3.3A8 8 0 0 1 5.1 16ZM8.1 8h-3a8 8 0 0 1 4-3.3A15 15 0 0 0 8.1 8ZM12 20c-.9-1.2-1.5-2.6-1.9-4h3.8c-.4 1.4-1 2.8-1.9 4Zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4Zm.6 5.3c.5-1 .8-2.1 1-3.3h3a8 8 0 0 1-4 3.3ZM16.4 14a17 17 0 0 0 0-4h3.3a8 8 0 0 1 0 4Z" /></svg>
          </a>
        </div>
        <div className={styles.footLinks}>
          <Link href="/becool/maintenance/">整備・車検</Link><span>｜</span>
          <Link href="/becool/stock/">在庫車両</Link><span>｜</span>
          <Link href="/becool/#shop">店舗案内</Link><span>｜</span>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer">LINE予約</a>
        </div>
        <p className={styles.copyright}>© 1999 GARAGE BeCool / 有限会社ビークール</p>
      </div>
      <ToTopButton />
    </footer>
  );
}

/* 電話・LINEへの誘導バンド(サブページ下部で共用) */
export function CtaBand({ lead }: { lead: string }) {
  return (
    <section className={styles.ctaBand} aria-label="お問い合わせ">
      <div data-reveal className={`${styles.ctaBandInner} ${styles.reveal}`}>
        <p className={styles.ctaLead}>{lead}</p>
        <p className={styles.ctaTel}>
          <a href={TEL_HREF}>{TEL}</a>
          <small>受付 10:00〜20:00／年中無休（沼店・中吉田店 共通）</small>
        </p>
        <div className={styles.ctaActions}>
          <a className={styles.telBtn} href={TEL_HREF}>電話で相談する</a>
          <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">LINEで相談する</a>
        </div>
      </div>
    </section>
  );
}

/* サブページ共通のページヘッダー(パンくず + 見出し + 背景写真) */
export function SubHero({ en, jp, lead, photo, alt }: {
  en: string; jp: string; lead?: string; photo: string; alt?: string;
}) {
  return (
    <div className={styles.subHero}>
      <div className={`${styles.subHeroBg} ${styles.halftone}`} aria-hidden="true">
        <img src={asset(photo)} alt={alt ?? ""} />
      </div>
      <div className={styles.subHeroInner}>
        <nav className={styles.breadcrumb} aria-label="パンくず">
          <Link href="/becool/">TOP</Link><span aria-hidden="true">/</span><em>{en}</em>
        </nav>
        <h1>{en}</h1>
        <p className={styles.subHeroJp}>{jp}</p>
        {lead ? <p className={styles.subHeroLead}>{lead}</p> : null}
      </div>
    </div>
  );
}
