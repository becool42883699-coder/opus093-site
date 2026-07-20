import type { Metadata } from "next";
import Link from "next/link";
import styles from "../becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../../components/TrmSeo";
import { RevealController } from "../BecoolClient";
import { asset, LINE_URL, TEL_HREF, BecoolHeader, BecoolFooter, CtaBand, SubHero } from "../Chrome";

export const metadata: Metadata = {
  title: "在庫車両｜GARAGE BeCool｜北九州市小倉南区の中古車販売",
  description:
    "GARAGE BeCool（北九州市小倉南区）の在庫車両ページ。店頭在庫のご案内のほか、全国のオークション・流通在庫からのお車探し（オーダー検索）にも対応。気になるお車はお電話・LINEでお気軽にお問い合わせください。",
  alternates: { canonical: "/becool/stock" },
};

/* ---- 在庫車両(実写真のある車両のみ掲載) ------------------------------- */
const STOCK = [
  {
    src: "/becool/img/photo-porsche.webp",
    name: "PORSCHE 718 CAYMAN",
    jp: "ポルシェ 718 ケイマン",
    tag: "SPORTS",
    price: "¥6,980,000",
    alt: "GARAGE BeCool 店頭の白いポルシェ 718 ケイマン",
    body: "存在感のあるホワイトのミッドシップスポーツ。詳細な装備・状態は店頭またはお問い合わせにてご確認ください。",
  },
  {
    src: "/becool/img/photo-alphard.webp",
    name: "TOYOTA ALPHARD",
    jp: "トヨタ アルファード",
    tag: "CUSTOM",
    price: "¥5,480,000",
    alt: "GARAGE BeCool でカスタムした黒いトヨタ アルファード",
    body: "当店でドレスアップを施したカスタム済みの一台。詳細な装備・状態は店頭またはお問い合わせにてご確認ください。",
  },
];

const stockLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GARAGE BeCool", item: `${ROOT_URL}/becool/` },
        { "@type": "ListItem", position: 2, name: "在庫車両", item: `${ROOT_URL}/becool/stock/` },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${ROOT_URL}/becool/stock/#stock`,
      itemListElement: STOCK.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Car",
          name: c.jp,
          image: `${ROOT_URL}${c.src}`,
          offers: {
            "@type": "Offer",
            price: c.price.replace(/[¥,]/g, ""),
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  ],
};

export default function StockPage() {
  return (
    <div className={`becool ${styles.root}`}>
      <JsonLd data={stockLd} />
      <BecoolHeader />

      <main>
        <SubHero
          en="STOCK"
          jp="在庫車両"
          lead="店頭在庫は随時入れ替わっています。気になる一台はお早めにどうぞ。"
          photo="/becool/img/photo-porsche.webp"
        />

        {/* ---------- 在庫一覧 ---------- */}
        <section data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="stock-h">
          <div className={styles.sectionHead}>
            <h2 id="stock-h">CAR STOCK</h2>
            <span>販売中の車両</span>
          </div>
          <ul className={styles.stockGrid}>
            {STOCK.map((c) => (
              <li key={c.name} className={styles.stockCard}>
                <div className={`${styles.stockPhoto} ${styles.halftone}`}>
                  <img src={asset(c.src)} alt={c.alt} loading="lazy" />
                  <span className={styles.stockTag}>{c.tag}</span>
                </div>
                <div className={styles.stockBody}>
                  <h3 className={styles.stockName}>{c.name}<span>{c.jp}</span></h3>
                  <p className={styles.stockPrice}>{c.price}<small>（税込）</small></p>
                  <p className={styles.stockDesc}>{c.body}</p>
                  <div className={styles.storeActions}>
                    <a className={styles.telBtn} href={TEL_HREF}>電話で問い合わせ</a>
                    <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">LINEで問い合わせ</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className={styles.stockNote}>
            掲載中の車両は店頭で販売中のため、ご来店の際は事前に在庫状況をお問い合わせいただくと確実です。
          </p>
        </section>

        {/* ---------- オーダー検索 ---------- */}
        <section data-reveal className={`${styles.orderBand} ${styles.reveal}`} aria-labelledby="order-h">
          <div className={styles.orderInner}>
            <h2 id="order-h">ORDER<span>お探しの車が見つからない方へ</span></h2>
            <p>
              店頭在庫にない車も、<em>全国のオークション・流通在庫</em>からお探しできます。
              車種・年式・色・ご予算などのご希望をお伝えください。あなたにぴったりの一台をご提案します。
            </p>
            <p className={styles.orderSub}>
              買取・査定は無料。乗り換え前の価格確認だけでも歓迎です。遠方の方には全国納車にも対応しています。
            </p>
            <Link className={styles.readMoreDark} href="/becool/#flow">ご利用の流れを見る</Link>
          </div>
        </section>

        <CtaBand lead="在庫の確認・お車探しのご相談は、お電話または公式LINEからどうぞ。" />
      </main>

      <BecoolFooter />
      <RevealController />
    </div>
  );
}
