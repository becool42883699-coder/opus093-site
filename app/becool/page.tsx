import styles from "./becool.module.css";
import { MobileMenu, RevealController, ToTopButton } from "./BecoolClient";

/* サブパス配信(GitHub Pages等)でも画像が解決できるようベースパスを前置 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p: string) => `${BASE}${p}`;

/* ---- shared data (placeholder / original content) ------------------- */
const NAV = [
  { href: "#about", label: "ABOUT" },
  { href: "#service", label: "SERVICE" },
  { href: "#works", label: "WORKS" },
  { href: "#news", label: "NEWS" },
  { href: "#contact", label: "CONTACT" },
];

const SERVICES = [
  {
    title: "BRANDING",
    body: "ロゴやコンセプト設計から、伝わる世界観を一貫して組み立てます。お店や企業の「らしさ」を、ぶれない軸としてカタチにします。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="26" cy="26" r="16" /><circle cx="40" cy="38" r="16" />
      </svg>
    ),
  },
  {
    title: "GRAPHIC",
    body: "名刺・チラシ・ポスター・パンフレットまで。紙のうえで手に取った瞬間に伝わる、丁寧な印刷物のデザインを行います。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 10h20l8 8v36H18z" /><path d="M38 10v8h8" />
      </svg>
    ),
  },
  {
    title: "WEB DESIGN",
    body: "見た目と使いやすさを両立した、成果につながるWebサイトを。最新のトレンドを取り入れつつ、無理のない運用まで見据えて設計します。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="14" width="44" height="30" rx="2" /><path d="M26 54h12M32 44v10" />
      </svg>
    ),
  },
  {
    title: "PHOTO",
    body: "商品・料理・空間・人物まで。ブランドの温度が伝わる一枚を撮影し、そのまま各媒体で活きるかたちに仕上げます。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 20h10l4-6h16l4 6h10v28H10z" /><circle cx="32" cy="33" r="9" />
      </svg>
    ),
  },
];

const WORKS = [
  { src: asset("/becool/img/work-1.svg"), cap: "BRAND LOGO — Cafe" },
  { src: asset("/becool/img/work-2.svg"), cap: "PAMPHLET — Clinic" },
  { src: asset("/becool/img/work-3.svg"), cap: "WEB SITE — Salon" },
  { src: asset("/becool/img/work-4.svg"), cap: "POSTER — Event" },
  { src: asset("/becool/img/work-5.svg"), cap: "PACKAGE — Sweets" },
  { src: asset("/becool/img/work-6.svg"), cap: "PHOTO — Product" },
];

const NEWS = [
  { date: "2026.06.28", cat: "WORKS", title: "アロマサロン様のブランドサイトを公開しました。" },
  { date: "2026.05.14", cat: "NEWS", title: "定額制デザインプランの受付を再開しました。" },
  { date: "2026.04.02", cat: "BLOG", title: "「伝わる名刺」をつくるために意識している3つのこと。" },
];

/* ---- original geometric monogram (drawn in the hero) ---------------- */
const HEX = "M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z";
const STEM = "M38 32 L38 68";
const BOWL_TOP = "M38 32 L62 42 L38 50";
const BOWL_BOTTOM = "M38 50 L66 60 L38 68";

function HeroMark() {
  return (
    <svg className={styles.heroLogo} viewBox="0 0 100 100" role="img" aria-label="Be Cool ロゴマーク">
      <polygon className={styles.markFill} points="38,32 62,42 38,50" />
      <polygon className={styles.markFill} points="38,50 66,60 38,68" />
      <path className={styles.markPath} pathLength={1} d={HEX} />
      <path className={styles.markPath} pathLength={1} d={STEM} />
      <path className={styles.markPath} pathLength={1} d={BOWL_TOP} />
      <path className={styles.markPath} pathLength={1} d={BOWL_BOTTOM} />
    </svg>
  );
}

function StaticMark() {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Be Cool">
      <polygon points="38,32 62,42 38,50" fill="currentColor" />
      <polygon points="38,50 66,60 38,68" fill="currentColor" />
      <path d={HEX} fill="none" stroke="currentColor" strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
}

export default function BecoolPage() {
  return (
    <div className={`becool ${styles.root}`}>
      {/* ---------- HEADER ---------- */}
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Be Cool トップへ">
          <span style={{ color: "var(--bc-ink)", width: 34, height: 34, display: "block" }}><StaticMark /></span>
          <span className={styles.brandName}>Be Cool</span>
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
            <img src={asset("/becool/img/hero.svg")} alt="制作の現場で手を動かすデザイナーたちの様子（イメージ）" />
          </div>
          <div className={styles.heroInner}>
            <HeroMark />
            <p className={styles.wordmark}>Be Cool</p>
            <p className={styles.tagline}>Graphic Design Studio — since 2020</p>
          </div>
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* ---------- CONCEPT ---------- */}
        <section className={styles.concept} aria-label="コンセプト">
          <div className={`${styles.conceptPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/concept.svg")} alt="デザイン制作物が並ぶ机（イメージ）" />
          </div>
          <div className={styles.conceptBand}>
            <p data-reveal className={styles.reveal}>
              デザインとは、言葉にならない想いを、<br />
              目に見えるカタチへ変えていく仕事。
            </p>
          </div>
          <div className={`${styles.cardsPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/card-mockup.svg")} alt="Be Cool の名刺デザイン（イメージ）" />
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section id="about" className={styles.section} aria-labelledby="about-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="about-h">ABOUT US</h2>
            <span>Be Cool について</span>
          </div>
          <div data-reveal className={`${styles.aboutBody} ${styles.reveal}`}>
            <p>
              デザインって、いったい何だろう——。わたしたちは、そんな問いから仕事を始めます。
              お店を開くとき、商品を届けたいとき、イベントを知らせたいとき。人はいつも、
              <em>「伝えたい」</em>という気持ちを抱えています。
            </p>
            <p>
              その気持ちを、見た人がまっすぐ受け取れる「かたち」にすること。それが、
              わたしたちの考えるデザインです。かっこよさや華やかさよりも先に、
              「何を、誰に、どう伝えるか」を丁寧にほどいていきます。
            </p>
            <p>
              Be Cool は、ロゴやチラシといった小さな一枚から、ブランド全体の設計、
              Webサイトや写真まで。お客様の想いを、ともにカタチにしていく
              デザインスタジオです。どんなに小さなご相談でも、どうぞお気軽にお声がけください。
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
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- WORKS ---------- */}
        <section id="works" className={styles.section + " " + styles.works} aria-labelledby="works-h">
          <div data-reveal className={`${styles.sectionHead} ${styles.reveal}`}>
            <h2 id="works-h">WORKS</h2>
            <span>制作実績</span>
          </div>
          <ul data-reveal className={`${styles.worksGrid} ${styles.reveal}`}>
            {WORKS.map((w) => (
              <li key={w.src} className={`${styles.workItem} ${styles.halftone}`}>
                <img src={w.src} alt={`制作実績: ${w.cap}（イメージ）`} loading="lazy" />
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
                <div className={styles.newsFoot}>
                  <span>👁 16</span>
                  <span>💬 0</span>
                  <span className={styles.newsHeart} aria-label="いいね">♥ 8</span>
                </div>
              </article>
            ))}
          </div>
          <a className={styles.readMore} href="#news">+ READ MORE</a>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.footInner}>
          <span className={styles.footBrand} style={{ color: "var(--bc-on-dark)" }}>
            <span style={{ width: 34, height: 34, display: "block" }}><StaticMark /></span>
            <span>Be Cool</span>
          </span>
          <p className={styles.footDesc}>
            東京にある小さなデザインスタジオ。ロゴ・チラシ・パンフレット・
            Webサイト・写真撮影などを行っています。伝えたい想いを、ともにカタチに。
          </p>
          <p className={styles.footMeta}>
            〒000-0000　東京都サンプル区サンプル町0-0-0<br />
            Email: hello@example.com
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
          <p className={styles.copyright}>© 2020 Be Cool</p>
        </div>
        <ToTopButton />
      </footer>

      <RevealController />
    </div>
  );
}
