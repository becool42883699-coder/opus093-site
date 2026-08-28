import Link from "next/link";
import styles from "./becool.module.css";
import { JsonLd, SITE_URL as ROOT_URL } from "../components/TrmSeo";
import { ParallaxController, SpotlightController, HeaderScrollController } from "./BecoolClient";
import BecoolLogoIntro from "./BecoolLogoIntro";
import HeroParticleLogo from "./HeroParticleLogo";
import HeroGlassLogo from "./HeroGlassLogo";
import FooterParticleMark from "./FooterParticleMark";
import ParticleScrollReveal from "./ParticleScrollReveal";
import PeelReveal from "./PeelReveal";
import { CUBE_MARK_D, CUBE_GARAGE_D, CUBE_BECOOL_D, CUBE_SINCE_D, CUBE_GRADS, SCRIPT_D, SCRIPT_GRAD } from "./brandLogo";
import { asset, LINE_URL, SITE_URL, BecoolHeader, BecoolFooter } from "./Chrome";
import ScrollAnim from "./ScrollAnim";

/* ---- services (from the official business info) --------------------- */
const SERVICES: {
  title: string; jp: string; photo: string; body: string;
  icon: React.ReactNode; link?: { href: string; label: string };
}[] = [
  {
    title: "CAR SALES",
    jp: "車両販売・乗り換え",
    photo: "/becool/img/service-sales.webp",
    body: "店頭在庫のご案内から、全国のオークション・流通在庫を使ったお車探しまで。ご希望の車種・年式・予算に合わせて、ぴったりの一台をご提案します。買取・査定・ローンのご相談も。",
    link: { href: "/becool/stock/", label: "在庫車両を見る" },
    icon: (
      <img className={styles.serviceIconImg} src={asset("/becool/img/icon-car-sales.png")} alt="" width={512} height={512} />
    ),
  },
  {
    title: "INSPECTION",
    jp: "車検・整備・点検",
    photo: "/becool/img/service-inspection.webp",
    body: "車検・法定点検から、オイル・タイヤ・バッテリー交換、警告灯や異音の診断まで。国家資格を持つ整備士が対応します。代車のご用意、LINEでの整備予約にも対応。",
    link: { href: "/becool/maintenance/", label: "整備・車検の詳細を見る" },
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

/* ---- SERVICE のカードUI 切替 -------------------------------------------
   "A" = 縦積みの大型カード(ダークサーフェス)
   "B" = 明るいカード + ダークなアイコン帯(PCタブ / モバイル横スワイプ)
   どちらも「上=画像ブロック / 下=テキストブロック」で、写真に文字を重ねない。 */
const SVC_UI: "A" | "B" = "B";

/* 画像ブロックは 3:2。実寸を width/height に入れてレイアウトシフトを防ぐ。 */
const SVC_IMG_W = 900;
const SVC_IMG_H = 600;

/** 1枚ぶんの中身。本文・ボタン文言は SERVICES の値をそのまま使う(書き換えない)。 */
function ServiceCardBody({ s }: { s: (typeof SERVICES)[number] }) {
  return (
    <>
      <div className={styles["bc-svc-media"]} data-service={s.title}>
        <img
          src={asset(s.photo)}
          alt=""
          loading="lazy"
          width={SVC_IMG_W}
          height={SVC_IMG_H}
        />
      </div>
      <div className={styles["bc-svc-body"]}>
        <span className={styles["bc-svc-icon"]}>{s.icon}</span>
        <h3 className={styles["bc-svc-title"]}>{s.title}</h3>
        <p className={styles["bc-svc-jp"]}>{s.jp}</p>
        <p className={styles["bc-svc-text"]}>{s.body}</p>
        {s.link ? (
          <Link className={styles["bc-svc-link"]} href={s.link.href}>{s.link.label}</Link>
        ) : null}
      </div>
    </>
  );
}

/** 案A: 4枚を並べる大型カード。切替UIを持たず常時すべて表示。 */
function ServiceCardsA() {
  return (
    <ul className={`${styles["bc-svc-grid"]} ${styles.jsReveal}`} data-reveal="stagger">
      {SERVICES.map((s) => (
        <li key={s.title} className={`${styles["bc-svc-card"]} ${styles["bc-svc-card-dark"]}`}>
          <ServiceCardBody s={s} />
        </li>
      ))}
    </ul>
  );
}

/**
 * 案B: 明るいカード。PCはタブ切替、モバイルは横スワイプ。
 * 切替はラジオ+CSSのみで行うのでJS無効でも動作し、
 * モバイルでは全カードを横スクロールで読めるためどの環境でも4件に到達できる。
 */
function ServiceCardsB() {
  return (
    <div className={`${styles["bc-svc-tabs"]} ${styles.jsReveal}`} data-reveal="up">
      {SERVICES.map((s, i) => (
        <input
          key={`r-${s.title}`}
          type="radio"
          name="bc-svc"
          id={`bc-svc-${i}`}
          className={styles["bc-svc-radio"]}
          defaultChecked={i === 0}
        />
      ))}
      <div className={styles["bc-svc-tablist"]}>
        {SERVICES.map((s, i) => (
          <label key={`l-${s.title}`} htmlFor={`bc-svc-${i}`} className={styles["bc-svc-tab"]}>
            <span className={styles["bc-svc-tab-en"]}>{s.title}</span>
            <span className={styles["bc-svc-tab-jp"]}>{s.jp}</span>
          </label>
        ))}
      </div>
      <ul className={styles["bc-svc-panels"]}>
        {SERVICES.map((s) => (
          <li key={s.title} className={`${styles["bc-svc-card"]} ${styles["bc-svc-card-light"]}`}>
            <ServiceCardBody s={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- showroom gallery (real interior photos) ----------------------- */
const GALLERY = [
  { src: "/becool/img/interior-03.webp", shape: "tall", alt: "GARAGE BeCool のくつろげる待合ラウンジ" },
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

/* ---- ヒーロー ロゴビルド・イントロ(プロトタイプv2「精密組立版」) ----------
   ガイド線→六角フレーム線描画→キューブ面パネルロック→ワードマーク組立→
   光沢スイープ→線へ分解→車体ライン+GARAGEボックス線描画→
   筆記体 Be Cool を左からマスク露出→完成停止。総尺 約5.6s / 初回1回再生。
   ロゴパスは提供SVG(brandLogo)のまま変形しない。時間制御は純CSS
   (becool.module.css)。BecoolLogoIntro は「初回のみ再生」ゲートのみ担う。
   キューブは translate(345,120) scale(0.352)、筆記体は translate(240,155)
   scale(0.70) でステージ(1200x900)に配置(プロトタイプ座標系そのまま)。 --- */
const HEXFRAME_D = "M 724 157 L 928 300 L 928 584 L 724 727 L 520 584 L 520 300 Z";

/* ---- ヒーロー: ブランドロゴそのもの(キューブ + garage becool + SINCE 1999) ----
   public/becool/img/logo.svg と同じ4パス構成。暗いヒーロー写真の上に置くので、
   "garage" と "SINCE 1999" だけ明色版で塗る(元の濃いチャコールでは沈んで読めない)。
   キューブとブルーの "becool" はブランド本来のグラデーションのまま。 --- */
function HeroFullLogo() {
  const g = CUBE_GRADS.mark;
  return (
    <svg
      className={styles.fullLogo}
      viewBox="138 165 1176 771"
      role="img"
      aria-label="GARAGE BeCool — since 1999"
    >
      <defs>
        <linearGradient id="fl-mark" gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
          {g.stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        <linearGradient id="fl-blue" gradientUnits="userSpaceOnUse" x1="0" y1="710" x2="0" y2="825">
          <stop offset="0" stopColor="#8dc2f5" />
          <stop offset="1" stopColor="#4f95df" />
        </linearGradient>
        <linearGradient id="fl-garage" gradientUnits="userSpaceOnUse" x1="0" y1="720" x2="0" y2="830">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde4ec" />
        </linearGradient>
      </defs>
      <path d={CUBE_MARK_D} fill="url(#fl-mark)" fillRule="evenodd" />
      <path d={CUBE_GARAGE_D} fill="url(#fl-garage)" fillRule="evenodd" />
      <path d={CUBE_BECOOL_D} fill="url(#fl-blue)" fillRule="evenodd" />
      <path d={CUBE_SINCE_D} fill="rgba(226, 234, 243, 0.82)" fillRule="evenodd" />
    </svg>
  );
}

/* ---- ヒーローのワードマーク(ブランドロゴ下段の正規アートワーク) ----------
   "garage"(チャコール) + "becool"(ブルー) + "SINCE 1999"(罫線付き)。
   元ロゴのパスをそのまま使うので字形・字間はブランド指定どおり。
   x:167-1284 / y:729-906 に収まるので、少し余白を足した viewBox にする。 --- */
function HeroWordmark() {
  return (
    <svg
      className={`${styles.heroLockup} hero-wordmark`}
      viewBox="150 715 1155 205"
      role="img"
      aria-label="GARAGE BeCool — since 1999"
    >
      {/* 暗いヒーロー写真の上に置くため、字形は正規ロゴのまま「明色版」で塗る
          (元の濃いチャコールだと背景に沈んで読めないため)。becoolはブランドブルー。 */}
      <defs>
        <linearGradient id="hw-garage" gradientUnits="userSpaceOnUse" x1="0" y1="720" x2="0" y2="830">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde4ec" />
        </linearGradient>
        <linearGradient id="hw-blue" gradientUnits="userSpaceOnUse" x1="0" y1="710" x2="0" y2="825">
          <stop offset="0" stopColor="#8dc2f5" />
          <stop offset="1" stopColor="#4f95df" />
        </linearGradient>
      </defs>
      <path d={CUBE_GARAGE_D} fill="url(#hw-garage)" fillRule="evenodd" />
      <path d={CUBE_BECOOL_D} fill="url(#hw-blue)" fillRule="evenodd" />
      <path d={CUBE_SINCE_D} fill="rgba(226, 234, 243, 0.82)" fillRule="evenodd" />
    </svg>
  );
}

function HeroBuildStage() {
  return (
    <svg className={styles.buildSvg} viewBox="0 0 1200 900" role="img" aria-label="GARAGE BeCool ロゴ">
      <defs>
        {(["mark", "garage", "blue", "since"] as const).map((k) => (
          <linearGradient key={k} id={"bcG-" + k} gradientUnits="userSpaceOnUse"
            x1={CUBE_GRADS[k].x1} y1={CUBE_GRADS[k].y1} x2={CUBE_GRADS[k].x2} y2={CUBE_GRADS[k].y2}>
            {CUBE_GRADS[k].stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
          </linearGradient>
        ))}
        <linearGradient id="bcG-script" gradientUnits="userSpaceOnUse"
          x1={SCRIPT_GRAD.x1} y1={SCRIPT_GRAD.y1} x2={SCRIPT_GRAD.x2} y2={SCRIPT_GRAD.y2}>
          {SCRIPT_GRAD.stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        {/* 筆記体を左から露出する帯マスク(再生中のみCSSが reveal を動かす) */}
        <mask id="bcScriptMask">
          <rect className="bc-script-reveal" x="-20" y="-20" width="1240" height="940" fill="#fff" />
        </mask>
      </defs>

      {/* ガイド線・十字線(ステージ座標系)。マーク中心(≈599,418)に同心で置くが、
          キューブは拡大してもガイドは控えめな元サイズのまま(=後ろの線は小さく) */}
      <g className="bc-guides" transform="translate(-1,143)" aria-hidden="true">
        <line className="bc-guideline" x1="600" y1="-60" x2="600" y2="720" />
        <line className="bc-guideline" x1="120" y1="275" x2="1080" y2="275" />
        <circle className="bc-guidemark" cx="600" cy="275" r="188" />
        <circle className="bc-guidemark" cx="600" cy="275" r="122" />
        <line className="bc-guidetick" x1="404" y1="275" x2="424" y2="275" />
        <line className="bc-guidetick" x1="776" y1="275" x2="796" y2="275" />
        <line className="bc-guidetick" x1="600" y1="79" x2="600" y2="99" />
        <line className="bc-guidetick" x1="600" y1="451" x2="600" y2="471" />
      </g>

      {/* キューブロゴ(設計図式BLUEPRINT BUILD): 六角フレーム線描画 → GBマークを
          線画で描く → 面が塗りで埋まり立体化 → ワードマーク組立 → 分解。
          最終筆記体ロゴと同心(ロックアップ中心 ≈606,475)になるよう配置。
          キューブを拡大(scale 0.352→0.5)しても中心が動かないよう translate 再計算 */}
      <g className="bc-cube" transform="translate(237,198) scale(0.5)">
        <path className="bc-hexframe" pathLength={1} d={HEXFRAME_D} />
        {/* 02 LINEWORK: GBマークの輪郭を線画で引く */}
        <path className="bc-mark-line" pathLength={1} d={CUBE_MARK_D} fillRule="evenodd" />
        {/* 03 FORM & DEPTH: 面が塗りで埋まって立体になる */}
        <path className="bc-p-mark" d={CUBE_MARK_D} fill="url(#bcG-mark)" fillRule="evenodd" />
        <path className="bc-p-garage" d={CUBE_GARAGE_D} fill="url(#bcG-garage)" fillRule="evenodd" />
        <path className="bc-p-becool" d={CUBE_BECOOL_D} fill="url(#bcG-blue)" fillRule="evenodd" />
        <path className="bc-p-since" d={CUBE_SINCE_D} fill="url(#bcG-since)" fillRule="evenodd" />
      </g>

      {/* 分解断片(拡大したキューブの位置から右へ飛散) */}
      <g transform="translate(599,418) scale(1.42) translate(-557,-340)" aria-hidden="true">
        <path className="bc-frag" d="M 470 300 h 60" />
        <path className="bc-frag" d="M 520 360 h 90" />
        <path className="bc-frag" d="M 450 420 h 45" />
        <path className="bc-frag" d="M 560 260 h 70" />
        <path className="bc-frag" d="M 610 400 h 55" />
      </g>

      {/* 再構築: 筆記体 Be Cool(提供SVGのパスを100%表示・マスク露出) */}
      <g mask="url(#bcScriptMask)">
        <g transform="translate(240,155) scale(0.70)">
          <path d={SCRIPT_D} fill="url(#bcG-script)" fillRule="evenodd" clipRule="evenodd" />
        </g>
      </g>
    </svg>
  );
}

/* ---- ヒーローのロゴ演出 切替(すぐ戻せるように) --------------------------
   "glass"     : Canvas UI「Glass Object」(Three.js/WebGL)。SVGを押し出した
                 ガラス質のGBキューブ。スタジオ環境の屈折・映り込み・微分散(現)
   "particle"  : Canvas UI「Particle Object」。散布した粒子が中央へ集合し形成
   "sweep"     : クラウド状の光が流れてキューブが実体化する常時ループ演出
   "blueprint" : 設計図式ビルド→筆記体露出の1回再生演出
   値を変えるだけで切替(全演出のコードは残置)。 */
const HERO_ANIM: "logo" | "glass" | "particle" | "sweep" | "blueprint" = "logo";

/* ---- ロゴ演出(sweep): GBマークに雲状の光マスクが流れ続け、実体(塗り)が
   現れては消える。下地に薄いワイヤーフレーム。SMILで常時ループ(1回再生ではない)。
   マーク単体を表示し、下のワードマーク文字と縦に積んでロックアップを構成。 --- */
function HeroSweepStage() {
  const g = CUBE_GRADS.mark;
  return (
    <svg className={styles.sweepSvg} viewBox="480 170 470 560" role="img" aria-label="GARAGE BeCool ロゴ">
      <defs>
        <linearGradient id="swMark" gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
          {g.stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        {/* 流れる雲状ノイズ→高コントラストのアルファに変換して露出マスクに使う */}
        <filter id="swNoise" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.016" numOctaves={2} seed={7} result="n">
            <animate attributeName="baseFrequency" dur="16s" values="0.01 0.016; 0.013 0.02; 0.01 0.016" repeatCount="indefinite" />
          </feTurbulence>
          <feOffset in="n" dx="0" dy="0" result="no">
            <animate attributeName="dx" dur="13s" values="-60;60;-60" repeatCount="indefinite" />
            <animate attributeName="dy" dur="10s" values="-45;45;-45" repeatCount="indefinite" />
          </feOffset>
          <feColorMatrix in="no" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 7 -3.4" />
        </filter>
        {/* 白面から雲(黒)が抜けて穴になる=塗りが雲状に現れる */}
        <mask id="swHole">
          <rect x="440" y="150" width="560" height="620" fill="#fff" />
          <g filter="url(#swNoise)"><rect x="440" y="150" width="560" height="620" fill="#fff" /></g>
        </mask>
      </defs>
      <g mask="url(#swHole)">
        <path d={CUBE_MARK_D} fill="url(#swMark)" fillRule="evenodd" />
      </g>
      <path className="sw-wire" d={CUBE_MARK_D} fillRule="evenodd" />
    </svg>
  );
}

export default function BecoolPage() {
  const plainLogo = HERO_ANIM === "logo";
  const glass = HERO_ANIM === "glass";
  const particle = HERO_ANIM === "particle";
  const sweep = HERO_ANIM === "sweep";
  // マーク単体表示(glass/particle/sweep)はワードマークを別途下に置くので間隔を詰める。
  // "logo" はロゴ自体に garage becool / SINCE 1999 が入っているので別ワードマークは出さない。
  const compact = glass || particle || sweep;
  return (
    <div className={`becool ${styles.root}`}>
      <JsonLd data={becoolLd} />
      <BecoolHeader overlay />

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section data-hero className={styles.hero} aria-label="ヒーロー">
          <div className={styles.heroBg}>
            <img src={asset("/becool/img/hero-exterior.webp")} alt="GARAGE BeCool の店舗外観（雨上がりの夕暮れ）" data-parallax="0.05" />
          </div>
          {/* ごく淡い光が横切る層 + 隅のメタ表記。
              額縁(フレーム)は画面を箱で囲って表示領域を狭く見せるため使わない。 */}
          <span className={styles.heroSheen} aria-hidden="true" />
          <span className={`${styles.heroMeta} ${styles.heroMetaL}`} aria-hidden="true">Kitakyushu, Fukuoka</span>
          <span className={`${styles.heroMeta} ${styles.heroMetaR}`} aria-hidden="true">Est. 1999</span>
          {/* particle/sweep は常時演出なので data-intro="done"(ワードマーク即表示)。
              blueprintは1回再生なので "play"(BecoolLogoIntroが再生を制御) */}
          <div className={`${styles.heroInner} ${compact ? styles.heroInnerSweep : ""}`} data-hero-stage data-intro={plainLogo || compact ? "done" : "play"}>
            <div className={`logo-zone ${styles.logoZone} ${plainLogo ? styles.logoZoneFull : glass || particle ? styles.logoZoneParticle : sweep ? styles.logoZoneSweep : ""}`}>
              <span className={`logo-backing ${styles.logoBacking}`} aria-hidden="true" />
              {plainLogo ? <HeroFullLogo /> : glass ? <HeroGlassLogo /> : particle ? <HeroParticleLogo /> : sweep ? <HeroSweepStage /> : <HeroBuildStage />}
            </div>
            {/* ロゴ自体に garage becool / SINCE 1999 が入っている場合は別ワードマークを出さない */}
            {!plainLogo && <HeroWordmark />}
          </div>
          {/* blueprint(1回再生)時のみ: JS無効フォールバックと再生ゲート */}
          {!compact && (
            <>
              <noscript>
                <style>{`[data-hero-stage] .bc-guides,[data-hero-stage] .bc-hexframe,[data-hero-stage] .bc-cube,[data-hero-stage] .bc-frag{display:none!important}[data-hero-stage] .bc-script-reveal{transform:none!important;animation:none!important}[data-hero-stage] .hero-wordmark,[data-hero-stage] .hero-tagline{opacity:1!important;animation:none!important}`}</style>
              </noscript>
              <BecoolLogoIntro />
            </>
          )}
          <span className={styles.scrollCue} aria-hidden="true" />
        </section>

        {/* ヒーローは sticky で固定し、以下のコンテンツが上に被さってせり上がる */}
        <div className={styles.belowHero}>
        {/* ---------- CONCEPT ---------- */}
        <section data-reveal className={styles.concept} aria-label="コンセプト">
          <div className={`${styles.conceptPhoto} ${styles.halftone}`} data-reveal-img="center">
            <img src={asset("/becool/img/store-exterior.webp")} alt="GARAGE BeCool の店舗外観（夕景）" />
          </div>
          <div className={styles.conceptBand}>
            <p>
              地域のカーライフを、<br />
              もっと安心に、もっと楽しく。
            </p>
          </div>
          <div className={`${styles.cardsPhoto} ${styles.halftone}`} data-reveal-img="vertical">
            <img src={asset("/becool/img/photo-alphard.webp")} alt="GARAGE BeCool でカスタムしたトヨタ アルファード" />
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section id="about" className={`${styles.section} ${styles.surfaceWhite}`} aria-labelledby="about-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="about-h">ABOUT US</h2>
            <span>GARAGE BeCool について</span>
          </div>
          <div className={styles.aboutGrid}>
            <div className={`${styles.aboutBody} ${styles.jsReveal}`} data-reveal="up">
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
            {/* Peel: 設計図(ブループリント)から完成写真へ、ビュー到達時に斜めにめくって切替 */}
            <figure className={`${styles.aboutMedia} ${styles.jsReveal}`} data-reveal="up">
              <PeelReveal src={asset("/becool/img/store-nakayoshida.webp")} alt="GARAGE BeCool 中吉田店の外観（青空の下の店舗）" />
            </figure>
          </div>
        </section>

        {/* ---------- SHOWROOM (店内ギャラリー) ---------- */}
        <section id="showroom" data-reveal className={`${styles.section} ${styles.surfaceWhite}`} aria-labelledby="showroom-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="showroom-h">SHOWROOM</h2>
            <span>店内のご案内</span>
          </div>
          {/* スクロールで上の写真は固定・下の写真がせり上がって重なる(スティッキー・スタック) */}
          <div className={styles.galleryStack}>
            {GALLERY.map((g) => (
              <figure key={g.src} className={`${styles.stackItem} ${styles.halftone}`} data-reveal-img="vertical group">
                <img src={asset(g.src)} alt={g.alt} loading="lazy" />
              </figure>
            ))}
          </div>
          <p className={`${styles.galleryNote} ${styles.jsReveal}`} data-reveal="up">ゆったりくつろげる店内で、車選びからアフターのご相談まで。お気軽にお立ち寄りください。</p>
        </section>

        {/* ---------- SERVICES ---------- */}
        <section id="service" className={`${styles["bc-svc-section"]} ${styles.surfaceDark}`} aria-labelledby="svc-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="svc-h">SERVICE</h2>
            <span>サービス</span>
          </div>
          {SVC_UI === "A" ? <ServiceCardsA /> : <ServiceCardsB />}
        </section>

        {/* ---------- FLOW (ご利用の流れ) ---------- */}
        <section id="flow" className={`${styles.section} ${styles.surfaceWhite}`} aria-labelledby="flow-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="flow-h">FLOW</h2>
            <span>ご利用の流れ</span>
          </div>
          <ol className={`${styles.flowGrid} ${styles.jsReveal}`} data-reveal="stagger">
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
        <section id="car" className={`${styles.section} ${styles.surfaceDark}`} aria-labelledby="car-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="car-h">PICK UP</h2>
            <span>販売車両</span>
          </div>
          <ul className={styles.pickupGrid}>
            {CARS.map((c) => (
              <li key={c.name} className={`${styles.pickupItem} ${styles.halftone}`}>
                {/* Particle Scroll: 在庫車の切替として、ビュー到達時に1回だけ砂状の粒子から組み上げ */}
                <ParticleScrollReveal src={c.src} alt={c.alt} />
                <span className={styles.pickupCap}>
                  <span className={styles.pickupName}><strong>{c.name}</strong><span>{c.tag}</span></span>
                  <span className={styles.pickupPrice}>{c.price}<small>（税込）</small></span>
                </span>
              </li>
            ))}
          </ul>
          <Link className={`${styles.readMore} ${styles.jsReveal}`} data-reveal="up" href="/becool/stock/">+ 在庫一覧を見る</Link>
        </section>

        {/* ---------- SHOP ---------- */}
        <section id="shop" data-reveal className={`${styles.section} ${styles.surfaceWhite}`} aria-labelledby="shop-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="shop-h">SHOP</h2>
            <span>店舗案内</span>
          </div>
          <div className={`${styles.storeGrid} ${styles.jsReveal}`} data-reveal="stagger">
            {SHOPS.map((s) => (
              <article key={s.name} className={styles.storeCard}>
                {s.comingSoon ? (
                  <div className={`${styles.storePhoto} ${styles.storeComingSoon}`} role="img" aria-label={s.alt}>
                    <span>準備中</span>
                    <small>Photo Coming Soon</small>
                  </div>
                ) : (
                  <div className={`${styles.storePhoto} ${styles.halftone}`} data-reveal-img="horizontal">
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
        <section id="faq" className={`${styles.section} ${styles.surfaceDark}`} aria-labelledby="faq-h">
          <div className={`${styles.sectionHead} ${styles.jsReveal}`} data-reveal="line">
            <h2 id="faq-h">FAQ</h2>
            <span>よくあるご質問</span>
          </div>
          <div className={`${styles.faqList} ${styles.jsReveal}`} data-reveal="stagger">
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
        {/* ---------- CLOSING BRAND MARK (フッター前) ---------- */}
        <section className={`${styles.brandOutro} ${styles.surfaceWhite} ${styles.jsReveal}`} data-reveal="up" aria-label="ブランドマーク">
          <FooterParticleMark />
          <p className={styles.brandOutroWord}><span>GARAGE</span> <span className={styles.wmAccent}>BeCool</span></p>
          <p className={styles.brandOutroSub}>Used Car &amp; Car Life Support — since 1999</p>
        </section>
        </div>{/* /belowHero */}
      </main>

      <BecoolFooter />

      <ScrollAnim />
      <ParallaxController />
      <SpotlightController />
      <HeaderScrollController />
    </div>
  );
}
