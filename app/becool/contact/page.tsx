import type { Metadata } from "next";
import Link from "next/link";
import styles from "../becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../../components/TrmSeo";
import { RevealController, ParallaxController, HeaderScrollController } from "../BecoolClient";
import { asset, LINE_URL, TEL, TEL_HREF, BecoolHeader, BecoolFooter } from "../Chrome";
import ContactPulse from "../ContactPulse";
import OpenStatus from "../OpenStatus";

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
    title: "LINEで相談・予約する",
    body: "車検・整備のご予約がLINEからできます。写真を送れるので、キズや気になる箇所の相談もスムーズです。",
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

/* ---- LINEでできること -------------------------------------------------- */
const LINE_CAN = [
  {
    t: "車検・整備の予約",
    b: "ご希望の日時とお車をお送りください。空き状況を確認してお返事します。代車のご相談もこちらで。",
    icon: <><path d="M12 18h40v34H12z" /><path d="M12 28h40M24 10v10M40 10v10" /><path d="M22 40l6 6 12-13" /></>,
  },
  {
    t: "お車探しの相談",
    b: "車種・年式・ご予算をお送りいただければ、店頭在庫と全国の流通在庫からお探しします。",
    icon: <><circle cx="29" cy="29" r="17" /><path d="M41 41l12 12" /></>,
  },
  {
    t: "写真で状態を相談",
    b: "キズ・へこみ・警告灯など、気になる箇所を撮って送るだけ。電話では伝えにくいこともそのまま。",
    icon: <><path d="M8 18h12l4-6h16l4 6h12v30H8z" /><circle cx="32" cy="32" r="10" /></>,
  },
  {
    t: "買取・査定の相談",
    b: "今のお車の情報をお送りいただければ、おおよその査定をご案内します。乗り換えのご相談もまとめて。",
    icon: <><path d="M32 8v48" /><path d="M18 20h20a7 7 0 0 1 0 14H26a7 7 0 0 0 0 14h20" /></>,
  },
];

/* ---- 追加から相談までの流れ -------------------------------------------- */
const LINE_STEPS = [
  { n: "01", t: "友だち追加", b: "下のボタンから、GARAGE BeCool の公式アカウントを友だち追加してください。" },
  { n: "02", t: "メッセージを送る", b: "ご用件をそのまま送信。写真の添付もできます。かしこまった文面でなくて大丈夫です。" },
  { n: "03", t: "スタッフが返信", b: "営業時間内に順次お返事します。ご予約はこのやりとりの中で確定します。" },
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
    q: "整備や車検の予約はLINEでできますか？",
    a: "はい、LINEから車検・整備のご予約をそのまま承っています。ご希望の日時とお車をお送りください。空き状況を確認してお返事します。お電話（093-967-2345）でのご予約も同じように承ります。",
  },
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
            {/* LINEから整備・車検の予約ができることは分かりやすく前に出す */}
            <p className={styles.lineNotice}>
              <span aria-hidden="true">LINE</span>
              車検・整備のご予約は、LINEからそのままできます
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

          {/* ---------- LINE 導入 ---------- */}
          <section id="line" data-reveal className={`${styles.section} ${styles.lineSection} ${styles.reveal}`} aria-labelledby="line-h">
            <div className={styles.sectionHead}>
              <h2 id="line-h">LINE</h2>
              <span>LINEでできること</span>
            </div>
            <p className={styles.lineLead}>
              友だち追加していただければ、<em>車検・整備のご予約</em>から、お車探し・買取査定のご相談まで
              チャットで完結します。写真をそのまま送れるので、電話では伝えにくいこともスムーズです。
            </p>

            <ul className={styles.lineCanGrid}>
              {LINE_CAN.map((c) => (
                <li key={c.t} className={styles.lineCan}>
                  <span className={styles.lineCanIcon} aria-hidden="true">
                    <svg viewBox="0 0 64 64">{c.icon}</svg>
                  </span>
                  <h3>{c.t}</h3>
                  <p>{c.b}</p>
                </li>
              ))}
            </ul>

            <ol className={styles.lineSteps}>
              {LINE_STEPS.map((s) => (
                <li key={s.n} className={styles.lineStep}>
                  <span className={styles.lineStepNo} aria-hidden="true">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </li>
              ))}
            </ol>

            <div className={styles.lineCta}>
              <a className={styles.lineAddBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">
                <span className={styles.lineAddMark} aria-hidden="true">LINE</span>
                友だち追加する
              </a>
              <p className={styles.lineCtaNote}>
                受付 10:00〜20:00／年中無休。営業時間外のメッセージには、翌営業時間に順次お返事します。
                お急ぎの方は <a href={TEL_HREF}>{TEL}</a> へどうぞ。
              </p>
            </div>
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
