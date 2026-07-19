import styles from "./becool.module.css";
import { MobileMenu, RevealController, ToTopButton } from "./BecoolClient";
import BecoolHeroIntro from "./BecoolHeroIntro";
import { CUBE_VIEWBOX, CUBE_STOPS, CUBE_D, CUBE_TOP, CUBE_LEFT, CUBE_RIGHT } from "./cubeLogo";

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
    photo: "/becool/img/service-sales.webp",
    body: "店頭在庫のご案内から、全国のオークション・流通在庫を使ったお車探しまで。ご希望の車種・年式・予算に合わせて、ぴったりの一台をご提案します。買取・査定・ローンのご相談も。",
    icon: (
      <img className={styles.serviceIconImg} src={asset("/becool/img/icon-car-sales.svg")} alt="" width={512} height={512} />
    ),
  },
  {
    title: "INSPECTION",
    jp: "車検・整備・点検",
    photo: "/becool/img/service-inspection.webp",
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

/* ---- 旧ロゴ(GBキューブ)。form-design.jp のイントロを同じ構造で再現:
       [組立] 各面が「移動+マスク」の複合で経路に沿って敷かれて現れる
              (屋根左→左面Gを下る→右面Bを上る→屋根右で閉じる)。
              併走して辺の延長線(logo-guide)が伸びて消える。
       [走査] 完成後、斜めの走査線(scan-beam)が通り、通過した部分の塗りが
              透明化して輪郭線(logo-wire)だけ残り、背景が透けて見える。
       [復元] 同じ帯が逆方向に戻り、光の帯を伴って塗りが再構築される。
       すべて SVG マスク(stroke-dash の帯) + GSAP。発光ではなく透過で光を表現。 --- */
function HeroCubeLogo() {
  const sweep = { stroke: "#fff", fill: "none", pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 } as const;
  const scan = { d: "M500 180 L950 700", strokeWidth: 560, fill: "none", pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 } as const;
  return (
    <svg className={styles.heroCarSvg} viewBox={CUBE_VIEWBOX} role="img" aria-label="GARAGE BeCool ロゴ">
      <defs>
        {/* ロゴ全体で1つのグラデ(面ごとに分割しても統一される) */}
        <linearGradient id="cubeGrad" gradientUnits="userSpaceOnUse" x1="534" y1="195" x2="915" y2="691">
          {CUBE_STOPS.map(([off, col]) => <stop key={off} offset={off} stopColor={col} />)}
        </linearGradient>
        {/* 各面の「敷かれていく」reveal マスク。白ストロークが通った所だけ表示される */}
        <mask id="mCubeTop" maskUnits="userSpaceOnUse" x="420" y="120" width="620" height="660">
          <path className="mask-sweep sweep-roof-l" d="M725 222 L556 330" strokeWidth={150} strokeLinecap="square" {...sweep} />
          <path className="mask-sweep sweep-roof-r" d="M894 330 L725 222" strokeWidth={150} strokeLinecap="square" {...sweep} />
        </mask>
        <mask id="mCubeLeft" maskUnits="userSpaceOnUse" x="420" y="120" width="620" height="660">
          <path className="mask-sweep sweep-left" d="M629 322 L629 700" strokeWidth={212} strokeLinecap="square" {...sweep} />
        </mask>
        <mask id="mCubeRight" maskUnits="userSpaceOnUse" x="420" y="120" width="620" height="660">
          <path className="mask-sweep sweep-right" d="M831 692 L831 322" strokeWidth={202} strokeLinecap="square" {...sweep} />
        </mask>
        {/* 走査帯: 同じ斜め帯で「塗りを隠す(黒)」「線画を見せる(白)」を同期させる */}
        <mask id="mScanFill" maskUnits="userSpaceOnUse" x="420" y="120" width="620" height="660">
          <rect x="420" y="120" width="620" height="660" fill="#fff" />
          <path className="scan-hide" stroke="#000" {...scan} />
        </mask>
        <mask id="mScanWire" maskUnits="userSpaceOnUse" x="420" y="120" width="620" height="660">
          <rect x="420" y="120" width="620" height="660" fill="#000" />
          <path className="scan-show" stroke="#fff" {...scan} />
        </mask>
        {/* 走査線ビームをロゴ周辺だけに収めるクリップ */}
        <clipPath id="cScanBeam"><rect x="470" y="150" width="510" height="580" /></clipPath>
      </defs>
      {/* 辺の延長線(細い見当線)。リボンの通過に合わせて描かれ、順に消える */}
      <g className="logo-guide" aria-hidden="true">
        <path className="gl-tl" d="M802 141 L455 352" pathLength={1} />
        <path className="gl-lv" d="M534 232 L534 758" pathLength={1} />
        <path className="gl-lb" d="M462 526 L800 739" pathLength={1} />
        <path className="gl-rb" d="M988 526 L650 739" pathLength={1} />
        <path className="gl-rv" d="M916 758 L916 232" pathLength={1} />
        <path className="gl-tr" d="M648 141 L995 352" pathLength={1} />
      </g>
      {/* 線画: 走査線が通過して透明化した部分にだけ現れる輪郭。
          マスクは走査フェーズ中だけ GSAP が付与する(毎フレームのラスタライズ削減) */}
      <g className="scan-wire-wrap" aria-hidden="true">
        <path className="logo-wire" d={CUBE_D} fillRule="evenodd" />
      </g>
      {/* 塗り3面(evenodd で G/B の白抜きを保持)。
          組立マスクは組立中だけ・走査マスクは走査中だけ GSAP が付け外しする */}
      <g className="scan-fill-wrap">
        <g className="mwrap-top"><path className="logo-fill face-top" d={CUBE_TOP} fill="url(#cubeGrad)" fillRule="evenodd" /></g>
        <g className="mwrap-left"><path className="logo-fill face-left" d={CUBE_LEFT} fill="url(#cubeGrad)" fillRule="evenodd" /></g>
        <g className="mwrap-right"><path className="logo-fill face-right" d={CUBE_RIGHT} fill="url(#cubeGrad)" fillRule="evenodd" /></g>
      </g>
      {/* 走査線ビーム(帯の先端を走る細い光) */}
      <g clipPath="url(#cScanBeam)" aria-hidden="true">
        <line className="scan-beam" x1="303" y1="350" x2="697" y2="10" />
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
          <div className={styles.heroInner} data-hero-stage data-intro="play">
            <div className={`logo-zone ${styles.logoZone}`}>
              <span className={`logo-backing ${styles.logoBacking}`} aria-hidden="true" />
              <HeroCubeLogo />
            </div>
            {/* ワードマーク: ロゴ完成後、横方向のマスクが左から右へ開いて現れる */}
            <p className={`${styles.heroWordmark} hero-wordmark`}>
              <span>GARAGE</span> <span className={styles.wmAccent}>BeCool</span>
            </p>
            <p className={`${styles.tagline} hero-tagline`}>Used Car &amp; Car Life Support — since 1999</p>
          </div>
          {/* JS無効時は組み上げ演出をスキップし、完成ロゴ(塗り)を表示する */}
          <noscript>
            <style>{`[data-hero-stage] .logo-fill,[data-hero-stage] .hero-tagline,[data-hero-stage] .hero-wordmark{opacity:1!important}[data-hero-stage] .logo-guide{display:none!important}`}</style>
          </noscript>
          <BecoolHeroIntro />
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
