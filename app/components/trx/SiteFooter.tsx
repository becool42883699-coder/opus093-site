import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph, Logo, PhoneGlyph } from "./Icon";
import { asset, FAX, HOLIDAYS, HOURS, MAIL, NAV, TEL, TEL_HREF } from "./site";
import s from "./site.module.css";

/**
 * 全ページ共通のフッター。上に「電話一本」の大きなCTA帯、下に巨大なワードマーク。
 * お問い合わせページ自身では CTA 帯を出さない(cta={false})。
 * children はクレジット表記の差し込み口(トップのエンジン3DのCC-BY表記。消さないこと)。
 */
export default function SiteFooter({ cta = true, children }: { cta?: boolean; children?: ReactNode }) {
  return (
    <footer className={s.footer} data-x-site>
      {cta && (
        <section className={s.footCta} aria-labelledby="foot-cta-title">
          {/* v14 の「相談」のイラスト */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.footArt} src={asset("/brand/consult.webp")} alt="" width={520} height={540} loading="lazy" data-x-parallax="10" />
          <p className={s.label}><span>(Contact)</span>お問い合わせ</p>
          <h2 id="foot-cta-title" className={s.footCtaTitle} data-x-split>
            現場のことなら、<br />まず電話一本。
          </h2>
          <a className={s.footTel} href={TEL_HREF} data-x-reveal>
            <PhoneGlyph className={s.footTelGlyph} />
            <span>{TEL}</span>
          </a>
          <div className={s.footCtaRow} data-x-reveal>
            <p>営業時間 {HOURS}<br />福岡県・山口県を中心に、出張修理・持込修理どちらも対応します。</p>
            <Link className={s.pill} href="/contact" data-x-magnetic>
              フォームで相談する<ArrowGlyph className={s.pillArrow} />
            </Link>
          </div>
        </section>
      )}

      <div className={s.footGrid}>
        <div className={s.footBrand}>
          <Link className={s.brand} href="/" aria-label="T-REX トップへ">
            <Logo className={s.footLogo} />
          </Link>
          <p>現場を、止めない。<br />福岡・山口の板金塗装・荷台換装・出張修理・車両陸送。</p>
        </div>
        <nav className={s.footCol} aria-label="フッターナビゲーション">
          <h3>Sitemap</h3>
          {NAV.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className={s.footCol}>
          <h3>Contact</h3>
          <a href={TEL_HREF}>TEL {TEL}</a>
          <span>FAX {FAX}</span>
          <a href={`mailto:${MAIL}`}>{MAIL}</a>
        </div>
        <div className={s.footCol}>
          <h3>Hours</h3>
          <span>{HOURS}</span>
          <span>定休日 {HOLIDAYS}</span>
          <span>対応エリア 福岡県・山口県</span>
        </div>
      </div>

      {children && <div className={s.footCredits}>{children}</div>}

      <div className={s.footBottom}>
        <small>© T-REX CO., LTD. All Rights Reserved.</small>
        <a href="#top" className={s.toTop}>Back to top<ArrowGlyph className={s.toTopArrow} /></a>
      </div>
      <div className={s.wordmark} aria-hidden="true" data-x-wordmark>T-REX</div>
    </footer>
  );
}
