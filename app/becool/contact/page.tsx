import type { Metadata } from "next";
import Link from "next/link";
import styles from "../becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../../components/TrmSeo";
import { RevealController, HeaderScrollController } from "../BecoolClient";
import { asset, LINE_URL, TEL, TEL_HREF, BecoolHeader, BecoolFooter } from "../Chrome";
import ContactFluid from "../ContactFluid";
import ContactCursor from "../ContactCursor";
import ContactChannels, { type Channel } from "../ContactChannels";
import Marquee from "../Marquee";
import OpenStatus from "../OpenStatus";
import ContactComposer from "../ContactComposer";

export const metadata: Metadata = {
  title: "お問い合わせ｜GARAGE BeCool｜北九州市小倉南区の中古車販売・車検・整備",
  description:
    "GARAGE BeCool（北九州市小倉南区）へのお問い合わせ。お車探し・車検・整備・買取査定・カスタムのご相談は、お電話（093-967-2345）またはLINEで。沼店・中吉田店とも10:00〜20:00、年中無休で受付しています。",
  alternates: { canonical: "/becool/contact" },
};

/* ---- 連絡手段(実在するものだけ。メールアドレスは未把握のため置かない) ------ */
const CHANNELS: Channel[] = [
  {
    no: "01", en: "PHONE", title: "電話する", note: "いちばん早い。迷っている段階でも大歓迎です。",
    action: TEL, href: TEL_HREF, cursor: "CALL", photo: asset("/becool/img/interior-06.webp"),
  },
  {
    no: "02", en: "LINE", title: "LINEで送る", note: "写真が送れるから、キズや異音の相談もそのまま。",
    action: "友だち追加", href: LINE_URL, external: true, cursor: "OPEN", photo: asset("/becool/img/service-inspection.webp"),
  },
  {
    no: "03", en: "VISIT", title: "店に行く", note: "予約なしでどうぞ。見るだけでも構いません。",
    action: "店舗を見る", href: "#shops", cursor: "MAP", photo: asset("/becool/img/store-nakayoshida.webp"),
  },
];

const TICKER = [
  "OPEN 10:00 – 20:00", "年中無休", "093-967-2345", "沼店 / 中吉田店",
  "見積り無料", "全国納車", "LINE相談OK",
];

const CASES = [
  { n: "01", t: "はじめての車選び", b: "予算だけ決まっていれば大丈夫。条件の整理からご一緒します。" },
  { n: "02", t: "いまの車の乗り換え", b: "今のお車の査定と、次の一台のご提案をまとめてご相談いただけます。" },
  { n: "03", t: "車検が近い", b: "見積りは無料。代車のご用意や、LINEでの予約にも対応しています。" },
  { n: "04", t: "遠方から購入したい", b: "全国納車に対応。状態は写真などで丁寧にご案内します。" },
];

const SHOPS = [
  {
    name: "中吉田店", photo: asset("/becool/img/store-nakayoshida.webp"),
    alt: "GARAGE BeCool 中吉田店の外観", comingSoon: false,
    zip: "〒800-0204", addr: "福岡県北九州市小倉南区中吉田6丁目18-5",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区中吉田6丁目18-5",
  },
  {
    name: "沼店", photo: "", alt: "GARAGE BeCool 沼店（写真準備中）", comingSoon: true,
    zip: "〒800-0205", addr: "福岡県北九州市小倉南区沼本町2丁目778-2",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区沼本町2丁目778-2",
  },
];

const FAQS = [
  { q: "予約は必要ですか？", a: "ご予約なしでもご来店いただけます。ただ、整備や商談でお待たせしないよう、お電話かLINEで一言いただけるとスムーズにご案内できます。" },
  { q: "しつこい営業はありませんか？", a: "ありません。ご相談だけ、見積りだけのご利用も歓迎です。「今日は見るだけ」でもお気軽にお声かけください。" },
  { q: "何時まで問い合わせできますか？", a: "沼店・中吉田店ともに10:00〜20:00、年中無休で受付しています。営業時間外にいただいたLINEには、翌営業時間に順次お返事します。" },
  { q: "車がなくても相談できますか？", a: "もちろんです。免許を取ったばかりの方や、これから買い替えを考え始めた方のご相談も多くいただいています。" },
];

const contactLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${ROOT_URL}/becool/contact/#page`,
      name: "お問い合わせ｜GARAGE BeCool",
      url: `${ROOT_URL}/becool/contact/`,
      about: { "@type": "Organization", name: "有限会社ビークール" },
    },
    {
      "@type": "FAQPage",
      "@id": `${ROOT_URL}/becool/contact/#faq`,
      mainEntity: FAQS.map((f) => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

/* 巨大タイトルは1文字ずつ出すため文字に割る(スクリーンリーダーには一語で読ませる) */
function Kinetic({ text }: { text: string }) {
  return (
    <h1 className={styles.kinetic} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={`${ch}-${i}`} aria-hidden="true" style={{ ["--i" as string]: i }}>
          <b>{ch}</b>
        </span>
      ))}
    </h1>
  );
}

export default function BecoolContactPage() {
  return (
    <div className={`becool ${styles.root} ${styles.contactRoot}`}>
      <JsonLd data={contactLd} />
      <BecoolHeader overlay />
      <ContactCursor />

      <main id="top">
        {/* ---------- HERO: 流体シェーダー + 巨大キネティックタイポ ---------- */}
        <section className={styles.fluidHero} aria-label="お問い合わせ">
          <ContactFluid />
          <div className={styles.fluidHeroInner}>
            <nav className={styles.breadcrumb} aria-label="パンくず">
              <Link href="/becool/">TOP</Link><span aria-hidden="true">/</span><em>CONTACT</em>
            </nav>
            <Kinetic text="CONTACT" />
            <p className={styles.fluidLead}>
              クルマのことなら、どんな入口からでも。<br />
              「まだ何も決まっていない」段階のご相談が、いちばん多いです。
            </p>
            <div className={styles.fluidStatus}>
              <OpenStatus />
              <a className={styles.heroTel} href={TEL_HREF} data-cursor="CALL">{TEL}</a>
            </div>
          </div>
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* 流れるティッカー */}
        <Marquee items={TICKER} />

        <div className={styles.belowHero}>
          {/* ---------- 連絡手段(大きな組版 + ホバープレビュー) ---------- */}
          <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="ch-h">
            <div className={styles.sectionHead}>
              <h2 id="ch-h">HOW TO REACH US</h2>
              <span>ご相談の方法</span>
            </div>
            <ContactChannels items={CHANNELS} />
          </section>

          {/* ---------- 相談内容コンポーザー ---------- */}
          <section id="compose" data-reveal className={`${styles.section} ${styles.composeSection} ${styles.reveal}`} aria-labelledby="cp-h">
            <div className={styles.sectionHead}>
              <h2 id="cp-h">MESSAGE</h2>
              <span>相談内容をまとめる</span>
            </div>
            <p className={styles.composeLead}>
              選んで書くと、そのまま送れる文面ができます。コピーしてLINEに貼り付けてください。
            </p>
            <ContactComposer lineUrl={LINE_URL} tel={TEL} telHref={TEL_HREF} />
          </section>

          {/* ---------- こんなご相談から ---------- */}
          <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="case-h">
            <div className={styles.sectionHead}>
              <h2 id="case-h">SUCH AS</h2>
              <span>こんなご相談から</span>
            </div>
            <ul className={styles.caseGrid}>
              {CASES.map((c) => (
                <li key={c.t} className={styles.caseItem}>
                  <span className={styles.caseNo} aria-hidden="true">{c.n}</span>
                  <h3>{c.t}</h3>
                  <p>{c.b}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- 店舗 ---------- */}
          <section id="shops" data-reveal className={`${styles.section} ${styles.shop} ${styles.reveal}`} aria-labelledby="shop-h">
            <div className={styles.sectionHead}>
              <h2 id="shop-h">SHOP</h2>
              <span>店舗のご案内</span>
            </div>
            <div className={styles.storeGrid}>
              {SHOPS.map((s) => (
                <article key={s.name} className={styles.storeCard}>
                  {s.comingSoon ? (
                    <div className={`${styles.storePhoto} ${styles.storeComingSoon}`} role="img" aria-label={s.alt}>
                      <span>準備中</span><small>Photo Coming Soon</small>
                    </div>
                  ) : (
                    <div className={`${styles.storePhoto} ${styles.halftone}`}>
                      <img src={s.photo} alt={s.alt} loading="lazy" />
                    </div>
                  )}
                  <div className={styles.storeBody}>
                    <h3 className={styles.storeName}>GARAGE <span>BeCool</span> {s.name}</h3>
                    <p className={styles.storeMeta}>
                      {s.zip}<br />{s.addr}<br />
                      <b>TEL</b> <a href={TEL_HREF}>{TEL}</a><br />
                      <b>営業時間</b> 10:00〜20:00／年中無休
                    </p>
                    <div className={styles.storeActions}>
                      <a className={styles.telBtn} href={TEL_HREF} data-cursor="CALL">電話する</a>
                      <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">LINEで予約</a>
                      <a className={styles.mapBtn} href={s.map} target="_blank" rel="noopener noreferrer" data-cursor="MAP">MAPで見る</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ---------- FAQ ---------- */}
          <section data-reveal className={`${styles.section} ${styles.faq} ${styles.reveal}`} aria-labelledby="cfaq-h">
            <div className={styles.sectionHead}>
              <h2 id="cfaq-h">FAQ</h2>
              <span>お問い合わせの前に</span>
            </div>
            <div className={styles.faqList}>
              {FAQS.map((f) => (
                <details key={f.q} className={styles.faqItem}>
                  <summary>
                    <span className={styles.faqQ} aria-hidden="true">Q</span>
                    {f.q}
                    <span className={styles.faqToggle} aria-hidden="true" />
                  </summary>
                  <p className={styles.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* ---------- 締め ---------- */}
          <section className={styles.contactOutro} aria-label="連絡先">
            <p className={styles.outroSmall}>お気軽にどうぞ</p>
            <a className={styles.outroTel} href={TEL_HREF} data-cursor="CALL">{TEL}</a>
            <p className={styles.outroHours}>10:00〜20:00／年中無休（沼店・中吉田店 共通）</p>
          </section>
        </div>
      </main>

      <BecoolFooter />

      <RevealController />
      <HeaderScrollController />
    </div>
  );
}
