import styles from "./becool.module.css";
import { MobileMenu, RevealController, ToTopButton } from "./BecoolClient";

/* サブパス配信(GitHub Pages等)でも画像が解決できるようベースパスを前置 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p: string) => `${BASE}${p}`;

/* ---- nav ------------------------------------------------------------ */
const NAV = [
  { href: "#about", label: "ABOUT" },
  { href: "#service", label: "SERVICE" },
  { href: "#works", label: "WORKS" },
  { href: "#news", label: "NEWS" },
  { href: "#contact", label: "CONTACT" },
];

/* ---- services (automotive / placeholder copy) ----------------------- */
const SERVICES = [
  {
    title: "CUSTOM",
    jp: "カスタム・ドレスアップ",
    body: "エアロ・ホイール・マフラーまで。あなたのイメージを一台に落とし込み、世界で一台だけの相棒に仕上げます。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="10" /><circle cx="32" cy="32" r="21" />
        <path d="M32 11v8M32 45v8M11 32h8M45 32h8" />
      </svg>
    ),
  },
  {
    title: "MAINTENANCE",
    jp: "整備・メンテナンス",
    body: "オイル交換から定期点検まで。長く安心して乗れるよう、クルマの状態を丁寧に見極めて整えます。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M44 20a10 10 0 0 1-13 13L18 46a5 5 0 0 1-7-7l13-13a10 10 0 0 1 13-13l-7 7 4 8 8 4z" />
      </svg>
    ),
  },
  {
    title: "BODYWORK",
    jp: "板金・塗装",
    body: "小さなキズからフルペイントまで。純正以上の仕上がりを目指し、色と質感にこだわって蘇らせます。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 44l24-24 6 6-24 24H14z" /><path d="M38 20l6-6 6 6-6 6" />
      </svg>
    ),
  },
  {
    title: "INSPECTION",
    jp: "車検・法定点検",
    body: "国家資格を持つ整備士が、法定基準をしっかり満たしながら、余計な費用をかけない車検をご提案します。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 8l20 7v13c0 12-8.5 23-20 28C20.5 51 12 40 12 28V15z" /><path d="M24 31l6 6 12-13" />
      </svg>
    ),
  },
];

const WORKS = [
  { src: asset("/becool/img/work-1.svg"), cap: "DEMO CAR — Sedan" },
  { src: asset("/becool/img/work-2.svg"), cap: "CUSTOM — SUV" },
  { src: asset("/becool/img/work-3.svg"), cap: "BODY PAINT — Coupe" },
  { src: asset("/becool/img/work-4.svg"), cap: "WHEEL — Hatch" },
  { src: asset("/becool/img/work-5.svg"), cap: "AERO — Wagon" },
  { src: asset("/becool/img/work-6.svg"), cap: "RESTORE — Classic" },
];

const NEWS = [
  { date: "2026.06.20", cat: "WORKS", title: "デモカーのフルカスタムが完成しました。" },
  { date: "2026.05.08", cat: "INFO", title: "夏のエアコン・冷却系点検キャンペーンを開始しました。" },
  { date: "2026.04.15", cat: "BLOG", title: "はじめてのホイール選び、失敗しないための基本。" },
];

/* ---- brand marks ---------------------------------------------------- */
const HEX = "M725 195 L917 306 L917 571 L725 683 L533 571 L533 306 Z";
const SYMBOL =
  "M 864 421 L 865 425 L 851 467 L 816 490 L 816 535 L 818 535 L 865 505 L 867 505 L 868 506 L 868 539 L 832 563 L 799 583 L 797 581 L 797 462 L 800 459 Z M 915 334 L 903 340 L 898 344 L 893 346 L 888 350 L 883 352 L 873 359 L 846 374 L 841 378 L 748 433 L 748 680 L 915 571 L 915 472 L 896 456 L 903 437 L 915 411 Z M 534 334 L 534 571 L 631 632 L 637 637 L 647 642 L 664 654 L 724 691 L 724 411 L 619 477 L 619 534 L 620 535 L 669 504 L 672 505 L 672 589 L 669 590 L 598 546 L 587 538 L 587 515 L 588 514 L 587 513 L 587 483 L 588 482 L 587 479 L 588 477 L 588 467 L 587 466 L 587 457 L 588 456 L 587 452 L 587 423 L 588 422 L 587 366 L 552 345 L 536 334 Z M 724 313 L 716 319 L 616 381 L 616 438 L 724 369 Z M 537 311 L 540 314 L 586 341 L 588 341 L 725 255 L 864 341 L 913 312 L 912 310 L 904 306 L 901 303 L 896 301 L 859 277 L 725 195 Z";

function HeroMark() {
  return (
    <svg className={styles.heroLogo} viewBox="510 171 429 544" role="img" aria-label="garage becool GBキューブロゴ">
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

/* full-color GB symbol (gradient preserved) for header / footer */
function GbSymbol({ size = 34 }: { size?: number }) {
  return (
    <img src={asset("/becool/img/symbol.svg")} alt="" width={size} height={size} style={{ width: size, height: "auto" }} />
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>garage <b>becool</b></span>
  );
}

export default function BecoolPage() {
  return (
    <div className={`becool ${styles.root}`}>
      {/* ---------- HEADER ---------- */}
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="garage becool トップへ">
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
            <img src={asset("/becool/img/hero.svg")} alt="ガレージでクルマを整備・カスタムする様子（イメージ）" />
          </div>
          <div className={styles.heroInner}>
            <HeroMark />
            <p className={styles.wordmark}>garage <span className={styles.wmBlue}>becool</span></p>
            <p className={styles.tagline}>Car Customize &amp; Maintenance — since 1999</p>
          </div>
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* ---------- CONCEPT ---------- */}
        <section className={styles.concept} aria-label="コンセプト">
          <div className={`${styles.conceptPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/concept.svg")} alt="ガレージのピットとクルマ（イメージ）" />
          </div>
          <div className={styles.conceptBand}>
            <p data-reveal className={styles.reveal}>
              クルマは、ただの移動手段じゃない。<br />
              あなたの毎日を、ちょっとかっこよくする相棒だ。
            </p>
          </div>
          <div className={`${styles.cardsPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/card-mockup.svg")} alt="garage becool のツールとパーツ（イメージ）" />
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section id="about" className={styles.section} aria-labelledby="about-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="about-h">ABOUT US</h2>
            <span>garage becool について</span>
          </div>
          <div data-reveal className={`${styles.aboutBody} ${styles.reveal}`}>
            <p>
              1999年、一台のクルマへの「かっこよくしたい」という想いから、garage becool は始まりました。
              以来わたしたちは、<em>クルマと過ごす時間そのものを豊かにする</em>ことを大切にしています。
            </p>
            <p>
              カスタムも、整備も、板金塗装も。手を入れるのは車体だけでなく、それに乗る人の毎日です。
              「どんなふうに乗りたいか」をじっくり聞かせてもらうことから、すべての作業が始まります。
            </p>
            <p>
              ホイール一本の相談から、フルカスタムの一台まで。国家資格を持つ整備士が、
              安全とデザインの両方に責任を持って向き合います。クルマのことなら、どうぞお気軽にご相談ください。
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

        {/* ---------- WORKS ---------- */}
        <section id="works" className={styles.section + " " + styles.works} aria-labelledby="works-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="works-h">WORKS</h2>
            <span>制作・施工実績</span>
          </div>
          <ul data-reveal className={`${styles.worksGrid} ${styles.reveal}`}>
            {WORKS.map((w) => (
              <li key={w.src} className={`${styles.workItem} ${styles.halftone}`}>
                <img src={w.src} alt={`施工実績: ${w.cap}（イメージ）`} loading="lazy" />
                <span className={styles.workCap}>{w.cap}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- NEWS ---------- */}
        <section id="news" className={styles.section} aria-labelledby="news-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="news-h">NEWS</h2>
            <span>お知らせ・ブログ</span>
          </div>
          <div data-reveal className={`${styles.newsList} ${styles.reveal}`}>
            {NEWS.map((n) => (
              <article key={n.title} className={styles.newsItem}>
                <div className={styles.newsMeta}>
                  <time dateTime={n.date.replace(/\./g, "-")}>{n.date}</time>
                  <span className={styles.newsCat}>{n.cat}</span>
                </div>
                <h3>{n.title}</h3>
              </article>
            ))}
          </div>
          <a className={styles.readMore} href="#news">+ READ MORE</a>
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
            1999年創業のカーガレージ。カスタム・整備・板金塗装・車検まで、
            クルマを楽しむすべてをサポートします。あなたの一台を、もっとかっこよく。
          </p>
          <p className={styles.footMeta}>
            〒000-0000　東京都サンプル区サンプル町0-0-0<br />
            TEL: 000-0000-0000　Email: hello@example.com<br />
            営業時間 9:00–19:00 / 定休日 水曜
          </p>
          <div className={styles.footSocial}>
            <a href="#contact" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2.7 0 3 0 4.1.06 1.1.05 1.8.24 2.5.5.6.26 1.1.6 1.6 1.1s.85 1 1.1 1.6c.26.7.45 1.4.5 2.5.06 1.1.06 1.4.06 4.1s0 3-.06 4.1c-.05 1.1-.24 1.8-.5 2.5-.26.6-.6 1.1-1.1 1.6s-1 .85-1.6 1.1c-.7.26-1.4.45-2.5.5-1.1.06-1.4.06-4.1.06s-3 0-4.1-.06c-1.1-.05-1.8-.24-2.5-.5a4.4 4.4 0 0 1-1.6-1.1 4.4 4.4 0 0 1-1.1-1.6c-.26-.7-.45-1.4-.5-2.5C2.01 15 2 14.7 2 12s0-3 .06-4.1c.05-1.1.24-1.8.5-2.5.26-.6.6-1.1 1.1-1.6s1-.85 1.6-1.1c.7-.26 1.4-.45 2.5-.5C9 2.01 9.3 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 1.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4ZM17.4 6a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" /></svg>
            </a>
            <a href="#contact" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 12s0-3.3-.42-4.9a2.5 2.5 0 0 0-1.76-1.76C19.2 5 12 5 12 5s-7.2 0-8.82.34A2.5 2.5 0 0 0 1.42 7.1C1 8.7 1 12 1 12s0 3.3.42 4.9a2.5 2.5 0 0 0 1.76 1.76C4.8 19 12 19 12 19s7.2 0 8.82-.34a2.5 2.5 0 0 0 1.76-1.76C23 15.3 23 12 23 12Zm-13 3.2V8.8l5.6 3.2-5.6 3.2Z" /></svg>
            </a>
          </div>
          <div className={styles.footLinks}>
            <a href="#contact">プライバシーポリシー</a><span>｜</span><a href="#contact">Q &amp; A</a>
          </div>
          <p className={styles.copyright}>© 1999 garage becool</p>
        </div>
        <ToTopButton />
      </footer>

      <RevealController />
    </div>
  );
}
