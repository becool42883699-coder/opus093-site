import type { Metadata } from "next";
import Link from "next/link";
import styles from "../becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../../components/TrmSeo";
import { RevealController, ParallaxController, HeaderScrollController } from "../BecoolClient";
import { asset, LINE_URL, TEL, TEL_HREF, BecoolHeader, BecoolFooter } from "../Chrome";
import ContactPulse from "../ContactPulse";
import OpenStatus from "../OpenStatus";
import ContactComposer from "../ContactComposer";

export const metadata: Metadata = {
  title: "お問い合わせ｜GARAGE BeCool｜北九州市小倉南区の中古車販売・車検・整備",
  description:
    "GARAGE BeCool（北九州市小倉南区）へのお問い合わせ。お車探し・車検・整備・買取査定・カスタムのご相談は、お電話（093-967-2345）またはLINEで。沼店・中吉田店とも10:00〜20:00、年中無休で受付しています。",
  alternates: { canonical: "/becool/contact" },
};

/* ---- 連絡手段(実在するものだけ。メールアドレスは未把握のため置かない) ------ */
const CHANNELS = [
  {
    en: "PHONE",
    title: "電話で相談する",
    body: "いちばん早く繋がります。「なんとなく乗り換えたい」の段階でも大歓迎です。",
    action: TEL,
    href: TEL_HREF,
    external: false,
    icon: <path d="M14 10h12l6 14-8 5a28 28 0 0 0 13 13l5-8 14 6v12c0 2-2 4-4 4A46 46 0 0 1 10 14c0-2 2-4 4-4Z" />,
  },
  {
    en: "LINE",
    title: "LINEで相談する",
    body: "写真を送れるので、キズや気になる箇所の相談もスムーズ。整備のご予約にも。",
    action: "友だち追加して送る",
    href: LINE_URL,
    external: true,
    icon: <path d="M32 10c13 0 23 8 23 18 0 10-10 18-23 18a29 29 0 0 1-5-.4L15 52l3-9C13 40 9 34 9 28c0-10 10-18 23-18Z" />,
  },
  {
    en: "VISIT",
    title: "来店して相談する",
    body: "ゆったりくつろげる店内でご案内します。ご予約なしでもお気軽にどうぞ。",
    action: "店舗を見る",
    href: "#shops",
    external: false,
    icon: <path d="M32 58s-18-13-18-26a18 18 0 0 1 36 0c0 13-18 26-18 26Z M32 26a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />,
  },
];

/* ---- 相談しやすいように「よくある入口」を用意 --------------------------- */
const CASES = [
  { t: "はじめての車選び", b: "予算だけ決まっていれば大丈夫。条件の整理からご一緒します。" },
  { t: "いまの車の乗り換え", b: "今のお車の査定と、次の一台のご提案をまとめてご相談いただけます。" },
  { t: "車検が近い", b: "見積りは無料。代車のご用意や、LINEでの予約にも対応しています。" },
  { t: "遠方から購入したい", b: "全国納車に対応。状態は写真などで丁寧にご案内します。" },
];

const SHOPS = [
  {
    name: "中吉田店",
    photo: asset("/becool/img/store-nakayoshida.webp"),
    alt: "GARAGE BeCool 中吉田店の外観",
    comingSoon: false,
    zip: "〒800-0204",
    addr: "福岡県北九州市小倉南区中吉田6丁目18-5",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区中吉田6丁目18-5",
  },
  {
    name: "沼店",
    photo: "",
    alt: "GARAGE BeCool 沼店（写真準備中）",
    comingSoon: true,
    zip: "〒800-0205",
    addr: "福岡県北九州市小倉南区沼本町2丁目778-2",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区沼本町2丁目778-2",
  },
];

const FAQS = [
  {
    q: "予約は必要ですか？",
    a: "ご予約なしでもご来店いただけます。ただ、整備や商談でお待たせしないよう、お電話かLINEで一言いただけるとスムーズにご案内できます。",
  },
  {
    q: "しつこい営業はありませんか？",
    a: "ありません。ご相談だけ、見積りだけのご利用も歓迎です。「今日は見るだけ」でもお気軽にお声かけください。",
  },
  {
    q: "何時まで問い合わせできますか？",
    a: "沼店・中吉田店ともに10:00〜20:00、年中無休で受付しています。営業時間外にいただいたLINEには、翌営業時間に順次お返事します。",
  },
  {
    q: "車がなくても相談できますか？",
    a: "もちろんです。免許を取ったばかりの方や、これから買い替えを考え始めた方のご相談も多くいただいています。",
  },
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
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function BecoolContactPage() {
  return (
    <div className={`becool ${styles.root}`}>
      <JsonLd data={contactLd} />
      <BecoolHeader overlay />

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className={styles.contactHero} aria-label="お問い合わせ">
          <div className={styles.contactHeroBg} aria-hidden="true">
            <img src={asset("/becool/img/interior-06.webp")} alt="" data-parallax="0.05" />
          </div>
          {/* 中心から静かに広がるシグナルの波紋(reduced-motionでは描画しない) */}
          <ContactPulse />
          <div className={styles.contactHeroInner}>
            <nav className={styles.breadcrumb} aria-label="パンくず">
              <Link href="/becool/">TOP</Link><span aria-hidden="true">/</span><em>CONTACT</em>
            </nav>
            <h1 className={styles.contactTitle}>CONTACT</h1>
            <p className={styles.contactJp}>お問い合わせ</p>
            <p className={styles.contactLead}>
              クルマのことなら、どんな入口からでも。<br />
              「まだ何も決まっていない」段階のご相談が、いちばん多いです。
            </p>
            <OpenStatus />
            <p className={styles.contactHours}>10:00〜20:00／年中無休（沼店・中吉田店 共通）</p>
          </div>
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        <div className={styles.belowHero}>
          {/* ---------- 連絡手段 ---------- */}
          <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="ch-h">
            <div className={styles.sectionHead}>
              <h2 id="ch-h">HOW TO CONTACT</h2>
              <span>ご相談の方法</span>
            </div>
            <ul className={styles.channelGrid}>
              {CHANNELS.map((c) => (
                <li key={c.en} className={styles.channelCard}>
                  <span className={styles.channelIcon} aria-hidden="true">
                    <svg viewBox="0 0 64 64">{c.icon}</svg>
                  </span>
                  <span className={styles.channelEn}>{c.en}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  {c.external ? (
                    <a className={styles.channelAction} href={c.href} target="_blank" rel="noopener noreferrer">{c.action}</a>
                  ) : (
                    <a className={styles.channelAction} href={c.href}>{c.action}</a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- 相談内容コンポーザー ---------- */}
          <section id="compose" data-reveal className={`${styles.section} ${styles.composeSection} ${styles.reveal}`} aria-labelledby="cp-h">
            <div className={styles.sectionHead}>
              <h2 id="cp-h">MESSAGE</h2>
              <span>相談内容をまとめる</span>
            </div>
            <p className={styles.composeLead}>
              下で選んで書くと、そのまま送れる文面ができます。コピーしてLINEに貼り付けてください。
            </p>
            <ContactComposer lineUrl={LINE_URL} tel={TEL} telHref={TEL_HREF} />
          </section>

          {/* ---------- よくある入口 ---------- */}
          <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="case-h">
            <div className={styles.sectionHead}>
              <h2 id="case-h">SUCH AS</h2>
              <span>こんなご相談から</span>
            </div>
            <ul className={styles.caseGrid}>
              {CASES.map((c) => (
                <li key={c.t} className={styles.caseItem}>
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
                      <span>準備中</span>
                      <small>Photo Coming Soon</small>
                    </div>
                  ) : (
                    <div className={`${styles.storePhoto} ${styles.halftone}`}>
                      <img src={s.photo} alt={s.alt} loading="lazy" />
                    </div>
                  )}
                  <div className={styles.storeBody}>
                    <h3 className={styles.storeName}>GARAGE <span>BeCool</span> {s.name}</h3>
                    <p className={styles.storeMeta}>
                      {s.zip}<br />
                      {s.addr}<br />
                      <b>TEL</b> <a href={TEL_HREF}>{TEL}</a><br />
                      <b>営業時間</b> 10:00〜20:00／年中無休
                    </p>
                    <div className={styles.storeActions}>
                      <a className={styles.telBtn} href={TEL_HREF}>電話する</a>
                      <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">LINEで予約</a>
                      <a className={styles.mapBtn} href={s.map} target="_blank" rel="noopener noreferrer">MAPで見る</a>
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
        </div>
      </main>

      <BecoolFooter />

      <RevealController />
      <ParallaxController />
      <HeaderScrollController />
    </div>
  );
}
