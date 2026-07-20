import type { Metadata } from "next";
import Link from "next/link";
import styles from "../becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../../components/TrmSeo";
import { RevealController } from "../BecoolClient";
import { TEL, BecoolHeader, BecoolFooter, CtaBand, SubHero } from "../Chrome";

export const metadata: Metadata = {
  title: "整備・車検｜GARAGE BeCool｜北九州市小倉南区の車検・点検・メンテナンス",
  description:
    "GARAGE BeCool（北九州市小倉南区）の整備・車検ページ。車検・法定点検・オイル交換・タイヤ交換・バッテリー交換・故障診断まで、国家資格を持つ整備士が対応。他店でご購入のお車も歓迎、LINEでの整備予約にも対応しています。",
  alternates: { canonical: "/becool/maintenance" },
};

/* ---- 整備メニュー(トップのINSPECTION紹介文に載っている内容のみ) ---------- */
const MENUS = [
  {
    en: "VEHICLE INSPECTION",
    title: "車検",
    body: "国家資格を持つ整備士が点検・整備し、車検をまるごとサポート。お見積りは無料です。代車のご用意もご相談ください。",
    icon: <path d="M10 34l8 8 14-16M32 6a26 26 0 1 1-.01 0" />,
  },
  {
    en: "PERIODIC CHECK",
    title: "法定点検",
    body: "12ヶ月点検などの法定点検に対応。日常のコンディション維持と、トラブルの早期発見につながります。",
    icon: <path d="M14 6h28l8 10v42H14zM22 30h20M22 40h20M42 6v10h8" />,
  },
  {
    en: "OIL CHANGE",
    title: "オイル交換",
    body: "エンジンオイルの交換はもっとも基本のメンテナンス。走行距離や乗り方に合わせて、交換時期からご案内します。",
    icon: <path d="M32 8s-16 18-16 30a16 16 0 0 0 32 0C48 26 32 8 32 8ZM24 40a8 8 0 0 0 8 8" />,
  },
  {
    en: "TIRE",
    title: "タイヤ交換",
    body: "すり減り・ひび割れのチェックから、履き替え・ローテーションまで。季節タイヤの入れ替えもお任せください。",
    icon: <><circle cx="32" cy="32" r="26" /><circle cx="32" cy="32" r="10" /><path d="M32 6v16M32 42v16M6 32h16M42 32h16" /></>,
  },
  {
    en: "BATTERY",
    title: "バッテリー交換",
    body: "「エンジンのかかりが悪い」と感じたら点検のサインです。測定のうえ、必要な場合のみ交換をご提案します。",
    icon: <path d="M20 14h6v-4h12v4h6a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4ZM26 34h12M32 28v12" />,
  },
  {
    en: "DIAGNOSIS",
    title: "故障診断",
    body: "警告灯の点灯や異音・違和感など、気になる症状を診断します。原因と対処を分かりやすくご説明します。",
    icon: <path d="M32 8 6 52h52ZM32 26v12M32 44v2" />,
  },
];

/* ---- 選ばれる理由 ----------------------------------------------------- */
const POINTS = [
  { no: "01", title: "国家資格を持つ整備士", body: "点検・整備は国家資格を持つスタッフが担当。安全と品質に責任を持って向き合います。" },
  { no: "02", title: "他店購入のお車も歓迎", body: "当店以外でご購入されたお車の車検・整備も大歓迎。かかりつけの整備工場としてご利用ください。" },
  { no: "03", title: "代車のご用意", body: "お車をお預かりする際は代車のご用意もご相談いただけます。お気軽にお申し付けください。" },
  { no: "04", title: "LINEでかんたん予約", body: "整備のご予約・ご相談は公式LINEからも可能。写真を送っての事前相談にも対応します。" },
];

/* ---- 整備の流れ ------------------------------------------------------- */
const FLOW = [
  { no: "01", en: "RESERVE", title: "ご予約", body: "お電話または公式LINEでご希望の日時をお知らせください。症状のご相談だけでも大丈夫です。" },
  { no: "02", en: "CHECK", title: "ご入庫・点検", body: "お車をお預かりし、状態を丁寧に確認します。代車が必要な場合は事前にご相談ください。" },
  { no: "03", en: "ESTIMATE", title: "お見積り・作業", body: "作業内容と費用をご説明し、ご了承をいただいてから整備を進めます。お見積りは無料です。" },
  { no: "04", en: "DELIVERY", title: "お引き渡し", body: "作業内容をご報告してお引き渡し。次回の点検・交換時期の目安もあわせてご案内します。" },
];

/* ---- 整備FAQ ---------------------------------------------------------- */
const FAQS = [
  {
    q: "車検や整備だけの利用もできますか？",
    a: "はい、車検・法定点検・オイル交換などの整備のみのご利用も歓迎です。他店でご購入されたお車もお任せください。",
  },
  {
    q: "料金はどのくらいかかりますか？",
    a: "車種や作業内容によって異なるため、まずは無料のお見積りをご利用ください。作業前に必ず内容と費用をご説明し、ご了承をいただいてから進めます。",
  },
  {
    q: "整備の間、代車は借りられますか？",
    a: "代車のご用意についてもご相談いただけます。ご予約の際にお申し付けください。",
  },
  {
    q: "予約はどうすればいいですか？",
    a: `お電話（${TEL}）または公式LINEからご予約いただけます。営業時間は10:00〜20:00、年中無休です。`,
  },
];

const maintenanceLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GARAGE BeCool", item: `${ROOT_URL}/becool/` },
        { "@type": "ListItem", position: 2, name: "整備・車検", item: `${ROOT_URL}/becool/maintenance/` },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${ROOT_URL}/becool/maintenance/#faq`,
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function MaintenancePage() {
  return (
    <div className={`becool ${styles.root}`}>
      <JsonLd data={maintenanceLd} />
      <BecoolHeader />

      <main>
        <SubHero
          en="MAINTENANCE"
          jp="整備・車検"
          lead="国家資格を持つ整備士が、あなたの愛車のかかりつけに。"
          photo="/becool/img/service-inspection.webp"
        />

        {/* ---------- 導入 ---------- */}
        <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-label="整備・車検について">
          <div className={styles.aboutBody}>
            <p>
              GARAGE BeCool では、車検・法定点検から、オイル・タイヤ・バッテリー交換、
              警告灯や異音の診断まで、<em>国家資格を持つ整備士</em>が対応します。
            </p>
            <p>
              当店でご購入いただいたお車はもちろん、<em>他店でご購入されたお車の整備も歓迎</em>です。
              代車のご用意、LINEでの整備予約にも対応していますので、お気軽にご相談ください。
            </p>
          </div>
        </section>

        {/* ---------- 整備メニュー ---------- */}
        <section data-reveal className={`${styles.section} ${styles.menuSection} ${styles.reveal}`} aria-labelledby="menu-h">
          <div className={styles.sectionHead}>
            <h2 id="menu-h">MENU</h2>
            <span>整備メニュー</span>
          </div>
          <ul className={styles.menuGrid}>
            {MENUS.map((m) => (
              <li key={m.title} className={styles.menuCard}>
                <span className={styles.menuIcon} aria-hidden="true">
                  <svg viewBox="0 0 64 64">{m.icon}</svg>
                </span>
                <span className={styles.menuEn}>{m.en}</span>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
          <p className={styles.menuNote}>
            料金は車種・作業内容により異なります。<b>お見積りは無料</b>ですので、まずはお気軽にお問い合わせください。
          </p>
        </section>

        {/* ---------- 選ばれる理由 ---------- */}
        <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="point-h">
          <div className={styles.sectionHead}>
            <h2 id="point-h">POINT</h2>
            <span>選ばれる理由</span>
          </div>
          <ol className={`${styles.flowGrid} ${styles.noArrows}`}>
            {POINTS.map((p) => (
              <li key={p.no} className={styles.flowStep}>
                <span className={styles.flowNo} aria-hidden="true">{p.no}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 整備の流れ ---------- */}
        <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="mflow-h">
          <div className={styles.sectionHead}>
            <h2 id="mflow-h">FLOW</h2>
            <span>整備・車検の流れ</span>
          </div>
          <ol className={styles.flowGrid}>
            {FLOW.map((f) => (
              <li key={f.no} className={styles.flowStep}>
                <span className={styles.flowNo} aria-hidden="true">{f.no}</span>
                <span className={styles.flowEn}>{f.en}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- FAQ ---------- */}
        <section data-reveal className={`${styles.section} ${styles.faq} ${styles.reveal}`} aria-labelledby="mfaq-h">
          <div className={styles.sectionHead}>
            <h2 id="mfaq-h">FAQ</h2>
            <span>整備・車検のよくあるご質問</span>
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
          <Link className={styles.readMore} href="/becool/#faq">その他のご質問はこちら</Link>
        </section>

        <CtaBand lead="車検・整備のご予約は、お電話または公式LINEからどうぞ。" />
      </main>

      <BecoolFooter />
      <RevealController />
    </div>
  );
}
