import styles from "./becool.module.css";
import { MobileMenu, RevealController, ToTopButton } from "./BecoolClient";

/* サブパス配信(GitHub Pages等)でも画像が解決できるようベースパスを前置 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p: string) => `${BASE}${p}`;
const LINE_URL = "https://line.me/R/ti/p/@123jicrs";
const SITE_URL = "https://garage-becool.co.jp/";

/* ---- nav ------------------------------------------------------------ */
const NAV = [
  { href: "#about", label: "ABOUT" },
  { href: "#service", label: "SERVICE" },
  { href: "#car", label: "CAR" },
  { href: "#shop", label: "SHOP" },
  { href: "#contact", label: "CONTACT" },
];

/* ---- services (from the official business info) --------------------- */
const SERVICES = [
  {
    title: "CAR SALES",
    jp: "車両販売・乗り換え",
    body: "店頭在庫のご案内から、全国のオークション・流通在庫を使ったお車探しまで。ご希望の車種・年式・予算に合わせて、ぴったりの一台をご提案します。買取・査定・ローンのご相談も。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 40l4-14a6 6 0 0 1 6-4h20a6 6 0 0 1 6 4l4 14" />
        <path d="M8 40h48v8H8zM16 48v5M48 48v5" /><circle cx="20" cy="40" r="3" /><circle cx="44" cy="40" r="3" />
      </svg>
    ),
  },
  {
    title: "INSPECTION",
    jp: "車検・整備・点検",
    body: "車検・法定点検から、オイル・タイヤ・バッテリー交換、警告灯や異音の診断まで。国家資格を持つ整備士が対応します。代車のご用意、LINEでの整備予約にも対応。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M44 20a10 10 0 0 1-13 13L18 46a5 5 0 0 1-7-7l13-13a10 10 0 0 1 13-13l-7 7 4 8 8 4z" />
      </svg>
    ),
  },
  {
    title: "CUSTOM",
    jp: "ドレスアップ・取付",
    body: "エアロ・アルミホイール・オーディオなどのドレスアップ、カーナビや各種パーツの取り付けに対応。あなたのイメージを一台に落とし込み、思いどおりの仕上がりへ。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="10" /><circle cx="32" cy="32" r="21" />
        <path d="M32 11v8M32 45v8M11 32h8M45 32h8" />
      </svg>
    ),
  },
  {
    title: "CAR LIFE",
    jp: "カーライフサポート",
    body: "購入後のアフターサポートや乗り換えのご相談まで、末永くお付き合いします。全国納車にも対応。クルマのことなら、はじめての方もお気軽にご相談ください。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 54s-18-11-18-24a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 13-18 24-18 24z" />
      </svg>
    ),
  },
];

/* ---- pick-up cars (real photos) ------------------------------------- */
const CARS = [
  { src: asset("/becool/img/photo-porsche.webp"), name: "PORSCHE 718 CAYMAN", tag: "SPORTS", price: "¥6,980,000", alt: "GARAGE BeCool 店頭の白いポルシェ 718 ケイマン" },
  { src: asset("/becool/img/photo-alphard.webp"), name: "TOYOTA ALPHARD", tag: "CUSTOM", price: "¥5,480,000", alt: "GARAGE BeCool でカスタムした黒いトヨタ アルファード" },
];

/* ---- shops (from the official store info) --------------------------- */
const SHOPS = [
  {
    name: "中吉田店",
    photo: asset("/becool/img/photo-showroom.webp"),
    alt: "GARAGE BeCool 中吉田店のショールーム内観",
    zip: "〒800-0204",
    addr: "福岡県北九州市小倉南区中吉田6丁目18-5",
    tel: "093-967-2345",
    hours: "10:00〜20:00／年中無休",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区中吉田6丁目18-5",
  },
  {
    name: "沼店",
    photo: asset("/becool/img/photo-reception.webp"),
    alt: "GARAGE BeCool 沼店のレセプション・ラウンジ内観",
    zip: "〒800-0205",
    addr: "福岡県北九州市小倉南区沼本町2丁目778-2",
    tel: "093-967-2345",
    hours: "10:00〜20:00／年中無休",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区沼本町2丁目778-2",
  },
];

/* ---- brand marks ---------------------------------------------------- */
const HEX = "M725 195 L917 306 L917 571 L725 683 L533 571 L533 306 Z";
const SYMBOL =
  "M 864 421 L 865 425 L 851 467 L 816 490 L 816 535 L 818 535 L 865 505 L 867 505 L 868 506 L 868 539 L 832 563 L 799 583 L 797 581 L 797 462 L 800 459 Z M 915 334 L 903 340 L 898 344 L 893 346 L 888 350 L 883 352 L 873 359 L 846 374 L 841 378 L 748 433 L 748 680 L 915 571 L 915 472 L 896 456 L 903 437 L 915 411 Z M 534 334 L 534 571 L 631 632 L 637 637 L 647 642 L 664 654 L 724 691 L 724 411 L 619 477 L 619 534 L 620 535 L 669 504 L 672 505 L 672 589 L 669 590 L 598 546 L 587 538 L 587 515 L 588 514 L 587 513 L 587 483 L 588 482 L 587 479 L 588 477 L 588 467 L 587 466 L 587 457 L 588 456 L 587 452 L 587 423 L 588 422 L 587 366 L 552 345 L 536 334 Z M 724 313 L 716 319 L 616 381 L 616 438 L 724 369 Z M 537 311 L 540 314 L 586 341 L 588 341 L 725 255 L 864 341 L 913 312 L 912 310 L 904 306 L 901 303 L 896 301 L 859 277 L 725 195 Z";

function HeroMark() {
  return (
    <svg className={styles.heroLogo} viewBox="510 171 429 544" role="img" aria-label="GARAGE BeCool GBキューブロゴ">
      <defs>
        <linearGradient id="gbHero" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A4F55" />
          <stop offset="55%" stopColor="#31557C" />
          <stop offset="100%" stopColor="#1F63B6" />
        </linearGradient>
      </defs>
      <path className={styles.markPath} pathLength={1} d={HEX} />
      <path className={styles.symbolReveal} d={SYMBOL} fill="url(#gbHero)" fillRule="evenodd" />
    </svg>
  );
}

function GbSymbol({ size = 34 }: { size?: number }) {
  return (
    <img src={asset("/becool/img/symbol.svg")} alt="" width={size} height={size} style={{ width: size, height: "auto" }} />
  );
}

function Wordmark({ className }: { className?: string }) {
  return <span className={className}>GARAGE <b>BeCool</b></span>;
}

export default function BecoolPage() {
  return (
    <div className={`becool ${styles.root}`}>
      {/* ---------- HEADER ---------- */}
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="GARAGE BeCool トップへ">
          <GbSymbol size={36} />
          <Wordmark className={styles.brandName} />
        </a>
        <nav className={styles.navDesktop} aria-label="メインナビゲーション">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <MobileMenu links={NAV} />
      </header>

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className={styles.hero} aria-label="ヒーロー">
          <div className={`${styles.heroBg} ${styles.halftone}`}>
            <img src={asset("/becool/img/photo-porsche.webp")} alt="GARAGE BeCool 店頭に並ぶ白いポルシェ 718 ケイマン" />
          </div>
          <div className={styles.heroInner}>
            <HeroMark />
            <p className={styles.wordmark}>GARAGE <span className={styles.wmBlue}>BeCool</span></p>
            <p className={styles.tagline}>Used Car &amp; Car Life Support — since 1999</p>
          </div>
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* ---------- CONCEPT ---------- */}
        <section className={styles.concept} aria-label="コンセプト">
          <div className={`${styles.conceptPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/photo-lounge.webp")} alt="GARAGE BeCool のラウンジ内観" />
          </div>
          <div className={styles.conceptBand}>
            <p data-reveal className={styles.reveal}>
              地域のカーライフを、<br />
              もっと安心に、もっと楽しく。
            </p>
          </div>
          <div className={`${styles.cardsPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/photo-alphard.webp")} alt="GARAGE BeCool でカスタムしたトヨタ アルファード" />
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section id="about" className={styles.section} aria-labelledby="about-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="about-h">ABOUT US</h2>
            <span>GARAGE BeCool について</span>
          </div>
          <div data-reveal className={`${styles.aboutBody} ${styles.reveal}`}>
            <p>
              GARAGE BeCool は<em>1999年創業</em>、福岡県北九州市小倉南区を中心とする地域密着型のカーショップです。
              中古車の販売だけでなく、買取・車検・整備・メンテナンスまで一括で対応しています。
            </p>
            <p>
              大切にしているのは、車選びから購入後のカーライフまでをトータルでサポートすること。
              全国から車両を仕入れ、人気の一台を求めやすくお届けします。はじめての方でも相談しやすい店づくりと、
              購入後も気軽に頼れる体制を整えています。
            </p>
            <p>
              整備は国家資格を持つスタッフが担当し、安全と品質に責任を持って向き合います。
              沼店・中吉田店の2店舗で、あなたのカーライフを「もっと安心に、もっと楽しく」お手伝いします。
            </p>
          </div>
        </section>

        {/* ---------- SERVICES ---------- */}
        <section id="service" className={styles.services} aria-label="サービス">
          {SERVICES.map((s) => (
            <div key={s.title} className={styles.servicePanel}>
              <div data-reveal className={`${styles.serviceInner} ${styles.reveal}`}>
                <span className={styles.serviceIcon}>{s.icon}</span>
                <h3>{s.title}</h3>
                <p className={styles.serviceJp}>{s.jp}</p>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- PICK UP CAR ---------- */}
        <section id="car" className={styles.section + " " + styles.works} aria-labelledby="car-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="car-h">PICK UP</h2>
            <span>販売車両</span>
          </div>
          <ul data-reveal className={`${styles.pickupGrid} ${styles.reveal}`}>
            {CARS.map((c) => (
              <li key={c.name} className={`${styles.pickupItem} ${styles.halftone}`}>
                <img src={c.src} alt={c.alt} loading="lazy" />
                <span className={styles.pickupCap}>
                  <span className={styles.pickupName}><strong>{c.name}</strong><span>{c.tag}</span></span>
                  <span className={styles.pickupPrice}>{c.price}<small>（税込）</small></span>
                </span>
              </li>
            ))}
          </ul>
          <a className={styles.readMore} href={SITE_URL} target="_blank" rel="noopener noreferrer">+ 在庫一覧を見る</a>
        </section>

        {/* ---------- SHOP ---------- */}
        <section id="shop" className={styles.section + " " + styles.shop} aria-labelledby="shop-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="shop-h">SHOP</h2>
            <span>店舗案内</span>
          </div>
          <div data-reveal className={`${styles.storeGrid} ${styles.reveal}`}>
            {SHOPS.map((s) => (
              <article key={s.name} className={styles.storeCard}>
                <div className={`${styles.storePhoto} ${styles.halftone}`}>
                  <img src={s.photo} alt={s.alt} loading="lazy" />
                </div>
                <div className={styles.storeBody}>
                  <h3 className={styles.storeName}>GARAGE <span>BeCool</span> {s.name}</h3>
                  <p className={styles.storeMeta}>
                    {s.zip}<br />
                    {s.addr}<br />
                    <b>TEL</b> {s.tel}<br />
                    <b>営業時間</b> {s.hours}
                  </p>
                  <div className={styles.storeActions}>
                    <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">LINEで予約</a>
                    <a className={styles.mapBtn} href={s.map} target="_blank" rel="noopener noreferrer">MAPで見る</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.footInner}>
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
            共通お問い合わせ TEL: 093-967-2345<br />
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
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">公式サイト</a><span>｜</span>
            <a href="#shop">店舗案内</a><span>｜</span><a href={LINE_URL} target="_blank" rel="noopener noreferrer">LINE予約</a>
          </div>
          <p className={styles.copyright}>© 1999 GARAGE BeCool / 有限会社ビークール</p>
        </div>
        <ToTopButton />
      </footer>

      <RevealController />
    </div>
  );
}
