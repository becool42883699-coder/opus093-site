import styles from "./becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../components/TrmSeo";
import { MobileMenu, RevealController, ToTopButton } from "./BecoolClient";
import BecoolWaterIntro from "./BecoolWaterIntro";
import { CUBE_MARK_D, CUBE_GARAGE_D, CUBE_BECOOL_D, CUBE_SINCE_D, CUBE_GRADS, SCRIPT_D, SCRIPT_GRAD } from "./brandLogo";

/* サブパス配信(GitHub Pages等)でも画像が解決できるようベースパスを前置 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p: string) => `${BASE}${p}`;
const LINE_URL = "https://line.me/R/ti/p/@123jicrs";
const SITE_URL = "https://garage-becool.co.jp/";

/* ---- nav ------------------------------------------------------------ */
const NAV = [
  { href: "#about", label: "ABOUT" },
  { href: "#showroom", label: "SHOWROOM" },
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
    photo: "/becool/img/service-sales.webp",
    body: "店頭在庫のご案内から、全国のオークション・流通在庫を使ったお車探しまで。ご希望の車種・年式・予算に合わせて、ぴったりの一台をご提案します。買取・査定・ローンのご相談も。",
    icon: (
      <img className={styles.serviceIconImg} src={asset("/becool/img/icon-car-sales.png")} alt="" width={512} height={512} />
    ),
  },
  {
    title: "INSPECTION",
    jp: "車検・整備・点検",
    photo: "/becool/img/service-inspection.webp",
    body: "車検・法定点検から、オイル・タイヤ・バッテリー交換、警告灯や異音の診断まで。国家資格を持つ整備士が対応します。代車のご用意、LINEでの整備予約にも対応。",
    icon: (
      <img className={styles.serviceIconImg} src={asset("/becool/img/icon-inspection.png")} alt="" width={512} height={512} />
    ),
  },
  {
    title: "CUSTOM",
    jp: "ドレスアップ・取付",
    photo: "/becool/img/service-custom.webp",
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
    photo: "/becool/img/service-carlife.webp",
    body: "購入後のアフターサポートや乗り換えのご相談まで、末永くお付き合いします。全国納車にも対応。クルマのことなら、はじめての方もお気軽にご相談ください。",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 54s-18-11-18-24a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 13-18 24-18 24z" />
      </svg>
    ),
  },
];

/* ---- showroom gallery (real interior photos) ----------------------- */
const GALLERY = [
  { src: "/becool/img/interior-01.webp", shape: "tall", alt: "GARAGE BeCool 店内エントランス。観葉植物とスズキ各車カタログ" },
  { src: "/becool/img/interior-02.webp", shape: "wide", alt: "GARAGE BeCool 店内の商談スペース。大理石調テーブルと大きな窓" },
  { src: "/becool/img/interior-03.webp", shape: "tall", alt: "GARAGE BeCool のくつろげる待合ラウンジ" },
  { src: "/becool/img/interior-04.webp", shape: "wide", alt: "GARAGE BeCool 店内ラウンジの全景。ソファと受付カウンター" },
  { src: "/becool/img/interior-05.webp", shape: "wide", alt: "GARAGE BeCool 窓際の商談テーブル。夕方の光が差し込む店内" },
  { src: "/becool/img/interior-06.webp", shape: "tall", alt: "GARAGE BeCool 受付まわりのラウンジ。木目の天井と間接照明" },
  { src: "/becool/img/interior-07.webp", shape: "tall", alt: "GARAGE BeCool のテーブルにちょこんと座るオレンジのマスコット" },
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
    photo: asset("/becool/img/store-nakayoshida.webp"),
    alt: "GARAGE BeCool 中吉田店の外観",
    comingSoon: false,
    zip: "〒800-0204",
    addr: "福岡県北九州市小倉南区中吉田6丁目18-5",
    tel: "093-967-2345",
    hours: "10:00〜20:00／年中無休",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区中吉田6丁目18-5",
  },
  {
    name: "沼店",
    photo: "",
    alt: "GARAGE BeCool 沼店（写真準備中）",
    comingSoon: true,
    zip: "〒800-0205",
    addr: "福岡県北九州市小倉南区沼本町2丁目778-2",
    tel: "093-967-2345",
    hours: "10:00〜20:00／年中無休",
    map: "https://www.google.com/maps/search/?api=1&query=福岡県北九州市小倉南区沼本町2丁目778-2",
  },
];

/* ---- flow (ご利用の流れ) -------------------------------------------- */
const FLOW = [
  {
    no: "01",
    en: "CONTACT",
    title: "ご相談",
    body: "ご来店・お電話・LINEで、ご希望やお悩みをお聞かせください。「なんとなく乗り換えたい」の段階でも大歓迎です。",
  },
  {
    no: "02",
    en: "PROPOSAL",
    title: "お車探し・お見積り",
    body: "店頭在庫と全国のオークション・流通在庫から、ご希望に合う一台をご提案。お見積りは無料です。",
  },
  {
    no: "03",
    en: "PREPARATION",
    title: "ご契約・納車準備",
    body: "ご契約後は各種手続きをサポート。国家資格を持つ整備士が点検・整備し、お引き渡しに備えます。",
  },
  {
    no: "04",
    en: "AFTER SUPPORT",
    title: "ご納車・アフターサポート",
    body: "全国納車にも対応。納車後も車検・整備・乗り換えのご相談まで、末永くサポートします。",
  },
];

/* ---- FAQ (JSON-LDのFAQPageと共用) ----------------------------------- */
const FAQS = [
  {
    q: "車検や整備だけの利用もできますか？",
    a: "はい、車検・法定点検・オイル交換などの整備のみのご利用も歓迎です。他店でご購入されたお車もお任せください。LINEからの整備予約にも対応しています。",
  },
  {
    q: "在庫にない車も探してもらえますか？",
    a: "全国のオークション・流通在庫からお探しできます。車種・年式・色・ご予算などのご希望をお気軽にお伝えください。",
  },
  {
    q: "ローンでの購入はできますか？",
    a: "各種オートローンのご相談に対応しています。頭金の有無やお支払い回数など、ご予算に合わせてご提案しますのでお気軽にご相談ください。",
  },
  {
    q: "遠方に住んでいますが購入できますか？",
    a: "全国納車に対応しています。遠方の方には、車両の状態を写真などで丁寧にご案内しますのでご安心ください。",
  },
  {
    q: "買取・査定だけでも大丈夫ですか？",
    a: "もちろん大丈夫です。査定は無料ですので、売却だけのご相談や、乗り換え前の価格確認にもご利用ください。",
  },
  {
    q: "営業時間と定休日を教えてください。",
    a: "沼店・中吉田店ともに10:00〜20:00、年中無休で営業しています。お電話（093-967-2345）またはLINEからお問い合わせください。",
  },
];

/* ---- ローカルSEO: 2店舗ぶんの UsedCarDealer 構造化データ ---------------- */
const becoolLd = {
  "@context": "https://schema.org",
  "@graph": [
    ...SHOPS.map((s, i) => ({
    "@type": ["AutoDealer", "AutoRepair"],
    "@id": `${ROOT_URL}/becool/#store-${i + 1}`,
    name: `GARAGE BeCool ${s.name}`,
    url: `${ROOT_URL}/becool/`,
    telephone: "+81-93-967-2345",
    image: `${ROOT_URL}/becool/img/store-exterior.webp`,
    logo: `${ROOT_URL}/becool/img/symbol.svg`,
    foundingDate: "1999",
    parentOrganization: { "@type": "Organization", name: "有限会社ビークール" },
    address: {
      "@type": "PostalAddress",
      postalCode: s.zip.replace("〒", ""),
      addressRegion: "福岡県",
      addressLocality: "北九州市小倉南区",
      streetAddress: s.addr.replace("福岡県北九州市小倉南区", ""),
      addressCountry: "JP",
    },
    openingHours: "Mo,Tu,We,Th,Fr,Sa,Su 10:00-20:00",
    priceRange: "¥¥",
    sameAs: [SITE_URL, LINE_URL],
    description:
      "福岡県北九州市小倉南区の地域密着型カーショップ。中古車販売・買取・車検・整備・メンテナンス・ドレスアップに対応。",
    })),
    {
      "@type": "FAQPage",
      "@id": `${ROOT_URL}/becool/#faq`,
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

/* ---- ヒーロー水面イントロ(納品仕様書v1.1「俯瞰水面版」) ----------------
   俯瞰の透明な水面に同心円の波紋が広がり、中心からキューブロゴが浮上して
   組み上がる。構造が青い線へほどけ、筆記体 Be Cool ロゴへ再構築される。
   レイヤー構成(仕様書04): water-surface / subsurface-shadow / cube-parts /
   transition-lines / construction-guides / script-logo / shine
   ロゴパスは提供SVGのまま変形しない。時間制御は BecoolWaterIntro (GSAP)。 --- */
const CUBE_T = "translate(800 420) scale(0.75) translate(-725.5 -550)";
const SCRIPT_T = "translate(800 430) scale(1.05) translate(-523 -456.5)";

function HeroWaterStage() {
  const ringAttrs = { cx: 800, cy: 650, rx: 300, ry: 76, fill: "none" } as const;
  const fragAttrs = { fill: "none", pathLength: 1 } as const;
  const carline = "M 96 452 C 240 372 430 310 545 327 C 662 345 748 394 950 447";
  return (
    <svg className={styles.waterSvg} viewBox="0 0 1600 900" role="img" aria-label="GARAGE BeCool ロゴ">
      <defs>
        {(["mark", "garage", "blue", "since"] as const).map((k) => (
          <linearGradient key={k} id={"wlG-" + k} gradientUnits="userSpaceOnUse"
            x1={CUBE_GRADS[k].x1} y1={CUBE_GRADS[k].y1} x2={CUBE_GRADS[k].x2} y2={CUBE_GRADS[k].y2}>
            {CUBE_GRADS[k].stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
          </linearGradient>
        ))}
        <linearGradient id="wlG-script" gradientUnits="userSpaceOnUse"
          x1={SCRIPT_GRAD.x1} y1={SCRIPT_GRAD.y1} x2={SCRIPT_GRAD.x2} y2={SCRIPT_GRAD.y2}>
          {SCRIPT_GRAD.stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        <radialGradient id="wlG-water" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(67,160,220,0.30)" />
          <stop offset="55%" stopColor="rgba(67,160,220,0.12)" />
          <stop offset="100%" stopColor="rgba(67,160,220,0)" />
        </radialGradient>
        <radialGradient id="wlG-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(4,32,58,0.5)" />
          <stop offset="100%" stopColor="rgba(4,32,58,0)" />
        </radialGradient>
        <linearGradient id="wlG-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* 再構築B: 筆記体を左から露出する帯マスク(露出フェーズ中のみGSAPが適用) */}
        <mask id="wlReveal" maskUnits="userSpaceOnUse" x="300" y="220" width="1000" height="420">
          <rect className="wl-reveal" x="330" y="240" width="960" height="380" fill="#fff" />
        </mask>
      </defs>

      {/* water-surface: 俯瞰の水面パッチ + 同心円波紋 + 中央開口 */}
      <g className="wl-water" aria-hidden="true">
        <ellipse cx={800} cy={650} rx={430} ry={112} fill="url(#wlG-water)" />
        <ellipse className="wl-ring wl-ring1" {...ringAttrs} />
        <ellipse className="wl-ring wl-ring2" {...ringAttrs} />
        <ellipse className="wl-ring wl-ring3" {...ringAttrs} />
        <ellipse className="wl-ring wl-ring4" {...ringAttrs} />
        <ellipse className="wl-mouth" cx={800} cy={650} rx={56} ry={14} />
      </g>

      {/* subsurface-shadow: 水面下の屈折・楕円影 */}
      <ellipse className="wl-shadow" cx={800} cy={655} rx={280} ry={58} fill="url(#wlG-shadow)" aria-hidden="true" />

      {/* cube-parts: キューブロゴ4パス(マーク/garage/becool/SINCE 1999) */}
      <g className="wl-cube" transform={CUBE_T}>
        <path className="wl-mark" d={CUBE_MARK_D} fill="url(#wlG-mark)" fillRule="evenodd" />
        <path className="wl-word-g" d={CUBE_GARAGE_D} fill="url(#wlG-garage)" fillRule="evenodd" />
        <path className="wl-word-b" d={CUBE_BECOOL_D} fill="url(#wlG-blue)" fillRule="evenodd" />
        <path className="wl-since" d={CUBE_SINCE_D} fill="url(#wlG-since)" fillRule="evenodd" />
      </g>

      {/* transition-lines: 分解時のエッジ線(輪郭ストローク片が右へ流れる) */}
      <g className="wl-frag" transform={CUBE_T} aria-hidden="true">
        <path className="wl-frag-p" d={CUBE_MARK_D} {...fragAttrs} />
        <path className="wl-frag-p" d={CUBE_GARAGE_D} {...fragAttrs} />
        <path className="wl-frag-p" d={CUBE_BECOOL_D} {...fragAttrs} />
      </g>

      {/* construction-guides + 再構築Aの線描画(筆記体ロゴ座標系) */}
      <g className="wl-guides" transform={SCRIPT_T} aria-hidden="true">
        <path className="wl-guide wl-guide-arc" d={carline} pathLength={1} />
        <rect className="wl-guide wl-guide-box" x={453} y={406} width={267} height={63} pathLength={1} />
        <path className="wl-guide wl-guide-base" d="M 250 600 L 1120 600" pathLength={1} />
        <path className="wl-cobalt" d={carline} pathLength={1} />
      </g>

      {/* script-logo: 最終ロゴ(提供SVGのパスを100%表示) */}
      <g className="wl-final-wrap">
        <g className="wl-final" transform={SCRIPT_T}>
          <path d={SCRIPT_D} fill="url(#wlG-script)" fillRule="evenodd" />
        </g>
      </g>

      {/* shine: 最後の細い光沢帯 */}
      <g className="wl-shine" aria-hidden="true">
        <rect x={320} y={230} width={110} height={400} fill="url(#wlG-shine)" transform="skewX(-16)" />
      </g>
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
      <JsonLd data={becoolLd} />
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
            <img src={asset("/becool/img/hero-exterior.webp")} alt="GARAGE BeCool の店舗外観（雨上がりの夕暮れ）" />
          </div>
          <div className={styles.heroInner} data-hero-stage data-intro="play">
            <div className={`logo-zone ${styles.logoZone}`}>
              <span className={`logo-backing ${styles.logoBacking}`} aria-hidden="true" />
              <HeroWaterStage />
            </div>
            {/* ワードマーク: ロゴ完成後、横方向のマスクが左から右へ開いて現れる */}
            <p className={`${styles.heroWordmark} hero-wordmark`}>
              <span>GARAGE</span> <span className={styles.wmAccent}>BeCool</span>
            </p>
            <p className={`${styles.tagline} hero-tagline`}>Used Car &amp; Car Life Support — since 1999</p>
          </div>
          {/* JS無効時は演出をスキップし、最終ロゴ(筆記体)を表示する */}
          <noscript>
            <style>{`[data-hero-stage] .wl-final,[data-hero-stage] .hero-tagline,[data-hero-stage] .hero-wordmark{opacity:1!important}[data-hero-stage] .wl-water,[data-hero-stage] .wl-frag,[data-hero-stage] .wl-guides,[data-hero-stage] .wl-cube{display:none!important}`}</style>
          </noscript>
          <BecoolWaterIntro />
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* ヒーローは sticky で固定し、以下のコンテンツが上に被さってせり上がる */}
        <div className={styles.belowHero}>
        {/* ---------- CONCEPT ---------- */}
        <section data-reveal className={`${styles.concept} ${styles.reveal}`} aria-label="コンセプト">
          <div className={`${styles.conceptPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/store-exterior.webp")} alt="GARAGE BeCool の店舗外観（夕景）" />
          </div>
          <div className={styles.conceptBand}>
            <p>
              地域のカーライフを、<br />
              もっと安心に、もっと楽しく。
            </p>
          </div>
          <div className={`${styles.cardsPhoto} ${styles.halftone}`}>
            <img src={asset("/becool/img/photo-alphard.webp")} alt="GARAGE BeCool でカスタムしたトヨタ アルファード" />
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section id="about" data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="about-h">
          <div className={styles.sectionHead}>
            <h2 id="about-h">ABOUT US</h2>
            <span>GARAGE BeCool について</span>
          </div>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutBody}>
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
            <figure className={`${styles.aboutMedia} ${styles.halftone}`}>
              <img src={asset("/becool/img/about-detail.webp")} alt="GARAGE BeCool 店頭のポルシェ 718 ケイマン（ブルーグレーディング）" loading="lazy" />
            </figure>
          </div>
        </section>

        {/* ---------- SHOWROOM (店内ギャラリー) ---------- */}
        <section id="showroom" data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="showroom-h">
          <div className={styles.sectionHead}>
            <h2 id="showroom-h">SHOWROOM</h2>
            <span>店内のご案内</span>
          </div>
          {/* スクロールで上の写真は固定・下の写真がせり上がって重なる(スティッキー・スタック) */}
          <div className={styles.galleryStack}>
            {GALLERY.map((g) => (
              <figure key={g.src} className={`${styles.stackItem} ${styles.halftone}`}>
                <img src={asset(g.src)} alt={g.alt} loading="lazy" />
              </figure>
            ))}
          </div>
          <p className={styles.galleryNote}>ゆったりくつろげる店内で、車選びからアフターのご相談まで。お気軽にお立ち寄りください。</p>
        </section>

        {/* ---------- SERVICES ---------- */}
        <section id="service" data-reveal className={`${styles.services} ${styles.reveal}`} aria-label="サービス">
          {SERVICES.map((s) => (
            <div key={s.title} className={styles.servicePanel}>
              <div className={styles.servicePhoto} aria-hidden="true">
                <img src={asset(s.photo)} alt="" loading="lazy" />
              </div>
              <div className={styles.serviceInner}>
                <span className={styles.serviceIcon}>{s.icon}</span>
                <h3>{s.title}</h3>
                <p className={styles.serviceJp}>{s.jp}</p>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- FLOW (ご利用の流れ) ---------- */}
        <section id="flow" data-reveal className={`${styles.section} ${styles.reveal}`} aria-labelledby="flow-h">
          <div className={styles.sectionHead}>
            <h2 id="flow-h">FLOW</h2>
            <span>ご利用の流れ</span>
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

        {/* ---------- PICK UP CAR ---------- */}
        <section id="car" data-reveal className={`${styles.section} ${styles.works} ${styles.reveal}`} aria-labelledby="car-h">
          <div className={styles.sectionHead}>
            <h2 id="car-h">PICK UP</h2>
            <span>販売車両</span>
          </div>
          <ul className={styles.pickupGrid}>
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
        <section id="shop" data-reveal className={`${styles.section} ${styles.shop} ${styles.reveal}`} aria-labelledby="shop-h">
          <div className={styles.sectionHead}>
            <h2 id="shop-h">SHOP</h2>
            <span>店舗案内</span>
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
                    <b>TEL</b> <a href={`tel:${s.tel.replaceAll("-", "")}`}>{s.tel}</a><br />
                    <b>営業時間</b> {s.hours}
                  </p>
                  <div className={styles.storeActions}>
                    <a className={styles.telBtn} href={`tel:${s.tel.replaceAll("-", "")}`}>電話する</a>
                    <a className={styles.lineBtn} href={LINE_URL} target="_blank" rel="noopener noreferrer">LINEで予約</a>
                    <a className={styles.mapBtn} href={s.map} target="_blank" rel="noopener noreferrer">MAPで見る</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" data-reveal className={`${styles.section} ${styles.faq} ${styles.reveal}`} aria-labelledby="faq-h">
          <div className={styles.sectionHead}>
            <h2 id="faq-h">FAQ</h2>
            <span>よくあるご質問</span>
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
        </div>{/* /belowHero */}
      </main>

      {/* ---------- FOOTER ---------- */}
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
            共通お問い合わせ TEL: <a href="tel:0939672345">093-967-2345</a><br />
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
