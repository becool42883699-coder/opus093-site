"use client";

/**
 * 灯家 -TOMOSHIBI- 注文住宅ブランド ランディングページ(1ファイル完結)
 * ---------------------------------------------------------------------------
 * 配色はブランドの5色のみ:
 *   胡粉 #F4F0E8 / 墨 #211D19 / 真鍮 #8A7355 / 灰白 #E4DDD1 / 深緑 #3E4A3D
 *
 * コントラストの取り方(いずれも実測値・AA基準):
 *   墨   on 胡粉 = 14.6:1 / 墨   on 灰白 = 12.3:1  → 本文・見出し
 *   深緑 on 胡粉 =  8.2:1 / 深緑 on 灰白 =  6.9:1  → 英字ラベル・注記
 *   胡粉 on 深緑 =  8.2:1                          → ボタンのホバー
 *   胡粉 on 真鍮 =  4.0:1                          → CTAの主ボタンのみ。
 *     4.5:1 に届かないため、ラベルは 19px / bold(= AA の「大きい文字」の
 *     しきい値 18.66px/bold を満たす → 必要 3:1)で使う。
 *     真鍮は小さい文字には使わない(罫・線画・進行インジケータ・CTAの面のみ)。
 *     流れの番号 01〜05 も当初は真鍮だったが 3.96:1 だったので深緑へ変更した。
 *     副ボタンは真鍮の罫 + 墨文字(14.6:1)。
 *
 * 演出は framer-motion。prefers-reduced-motion と JS無効の時は
 * tomoshibi.css と下の <noscript> が初期状態を打ち消すので全文が読める。
 *
 * 写真は要綱どおり生成せず `/images/...` を <img src> で参照する。
 * ファイルが無い前提なので、読み込みに失敗したら灰白の下地にパス名を出す。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowDown, ArrowUpRight, ExternalLink, Menu, X } from "lucide-react";

/* ── デザイントークン ───────────────────────────────────────── */

const FONTS = {
  "--f-min": '"Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", serif',
  "--f-go": '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
} as CSSProperties;

/* セクション上下の余白。モバイル64px / デスクトップ120px。詰めない。 */
const PAD = "py-16 md:py-[120px]";
const WRAP = "mx-auto w-full max-w-[1180px] px-6 md:px-10";
const MINCHO = "[font-family:var(--f-min)] tracking-[0.06em]";
const GOTHIC = "[font-family:var(--f-go)]";
const BODY = `${GOTHIC} text-[15px] leading-[1.9] md:text-[16px]`;
/* 固定ナビの分だけアンカー着地をずらす */
const ANCHOR = "scroll-mt-[72px] md:scroll-mt-[88px]";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* 入場は1種類だけ: fade + 24px 上昇、子は 0.08s ずつ遅らせる */
const GROUP: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/* 交差比(amount)で判定すると、ビューポートより背の高いセクションは
   最大でも viewportH/elementH にしかならず永久に発火しない。
   下端から12%入ったら、という位置での判定にして高さに依存させない。 */
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/* ── 本文データ ─────────────────────────────────────────────── */

const NAV = [
  { label: "施工事例", href: "#works" },
  { label: "家づくりの流れ", href: "#flow" },
  { label: "モデルハウス", href: "#modelhouse" },
  { label: "資料請求", href: "#document" },
];

const HERO_SHOTS = [
  { src: "/images/hero-01.jpg", alt: "灯家が設計した住宅の外観。夕暮れに窓から灯りがもれている" },
  { src: "/images/hero-02.jpg", alt: "吹き抜けから光が落ちるリビング。木の梁が見えている" },
  { src: "/images/hero-03.jpg", alt: "土間から庭へ続く開口部。奥に植栽が見える" },
];

const CONCEPT_TEXT = [
  "家族の人数も、朝起きる時間も、休みの日の過ごし方も、一軒ごとに違います。それなのに間取りだけが同じ形をしている——私たちはそこに、ずっと違和感を持っていました。",
  "灯家の設計は、聞くことから始まります。朝いちばんに立つ場所、洗濯物を干すまでの動線、来客の頻度。暮らしの手ざわりを一つずつ確かめてから、はじめて線を引きます。",
  "北九州は、海からの風と冬の底冷えが同居する土地です。敷地の向き、隣家との距離、風の抜け方を読んでから断熱と開口の位置を決める。派手さはありませんが、10年後に効いてくるのはこの部分です。",
];

const WORKS = [
  { src: "/images/works-01.jpg", name: "風の抜ける平屋", area: "92.7㎡", place: "北九州市八幡西区" },
  { src: "/images/works-02.jpg", name: "土間のある家", area: "108.4㎡", place: "北九州市小倉南区" },
  { src: "/images/works-03.jpg", name: "陽だまりの二世帯", area: "141.2㎡", place: "中間市" },
  { src: "/images/works-04.jpg", name: "本棚のある家", area: "116.8㎡", place: "遠賀郡水巻町" },
  { src: "/images/works-05.jpg", name: "海を見る家", area: "98.5㎡", place: "北九州市門司区" },
  { src: "/images/works-06.jpg", name: "庭を囲む家", area: "124.0㎡", place: "福岡市西区" },
];

const SPECS = [
  { label: "断熱等級", value: "7", unit: "等級", note: "最高等級。全棟で標準仕様としています" },
  { label: "耐震等級", value: "3", unit: "等級", note: "許容応力度計算による構造計算を全棟で実施" },
  { label: "C値", value: "0.4", unit: "㎠/㎡", note: "全棟で気密測定を行い、結果をお渡しします" },
  { label: "UA値", value: "0.34", unit: "W/㎡K", note: "北九州(6地域)の基準を大きく下回る水準" },
];

const FLOW = [
  { no: "01", title: "相談", text: "まずは暮らしの話を伺います。予算も土地も決まっていない段階で構いません。図面より先に、生活の話をさせてください。" },
  { no: "02", title: "土地", text: "候補地の風向き・日照・法規制を調べ、その土地で建てられる家の形をお伝えします。見送りをお勧めすることもあります。" },
  { no: "03", title: "設計", text: "平面図と模型で確かめながら間取りを詰めます。納得のいくまで、何度でも描き直します。" },
  { no: "04", title: "施工", text: "着工後はいつでも現場をご覧いただけます。工程ごとに写真で記録を残し、隠れる部分こそお見せします。" },
  { no: "05", title: "引渡し", text: "設備の使い方をご説明し、鍵をお渡しします。以降は定期点検で長くお付き合いします。" },
];

const VOICES = [
  {
    text: "打ち合わせのたびに「それは本当に要りますか」と聞かれたのが印象的でした。減らす提案をしてくれる会社は初めてで、結果として予算の中に収まりました。住みはじめて二度目の冬ですが、朝の廊下が冷たくないことに毎回おどろきます。",
    who: "北九州市小倉南区・K様",
    meta: "30代ご夫婦／延床 108.4㎡",
  },
  {
    text: "土地探しの段階から相談に乗ってもらいました。日当たりが悪いと諦めかけた敷地に、光を落とす方法があると言われて驚いたのを覚えています。今はその吹き抜けが、家族の集まる場所になっています。",
    who: "中間市・T様",
    meta: "40代ご家族／延床 141.2㎡",
  },
];

/* ── 間取り線画(このページの記憶に残る1点) ───────────────────
   stroke-dashoffset を framer-motion の pathLength で動かす。
   ヒーローの背景とセクションの仕切りの2箇所だけに使い、他の装飾は控える。 */

const PLAN_ROOMS = [
  "M40 40 H440 V320 H40 Z",
  "M40 200 H250 M250 200 V320 M300 40 V200 M300 120 H440",
  "M250 200 V244 A44 44 0 0 0 294 200",
  "M120 36 H200 M120 44 H200",
  "M348 212 H440 M348 230 H440 M348 248 H440 M348 266 H440 M348 212 V284",
  "M40 344 H440 M40 337 V351 M440 337 V351",
];

const PLAN_RULE = [
  "M0 56 H470 M524 56 H1200",
  "M470 56 V2 A54 54 0 0 1 524 56",
  "M700 52 H820 M700 60 H820",
  "M150 48 V64 M1010 48 V64",
];

/* 描き終わりまで 1.2 + 0.06 x 5 = 1.5秒(A1の「合計1.6秒以内」) */
const DRAW: Variants = {
  hidden: { pathLength: 0 },
  shown: { pathLength: 1, transition: { duration: 1.2, ease: "easeInOut" } },
};
const DRAW_GROUP: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } };

function PlanLines({ paths, viewBox, className }: { paths: string[]; viewBox: string; className: string }) {
  return (
    <motion.svg
      data-plan
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      variants={DRAW_GROUP}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {paths.map((d) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
          variants={DRAW}
        />
      ))}
    </motion.svg>
  );
}

/* セクションの仕切り。壁・建具の開き勝手・開口・寸法の抜き出し。 */
function PlanDivider() {
  return (
    <div className={WRAP}>
      <PlanLines paths={PLAN_RULE} viewBox="0 0 1200 80" className="h-16 w-full text-[#8A7355] md:h-20" />
    </div>
  );
}

/* ── 汎用パーツ ─────────────────────────────────────────────── */

function Group({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={GROUP} initial="hidden" whileInView="shown" viewport={VIEWPORT}>
      {children}
    </motion.div>
  );
}

function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div data-reveal className={className} variants={ITEM}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={`${GOTHIC} flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#3E4A3D]`}>
      <span aria-hidden="true" className="inline-block h-px w-8 bg-[#8A7355]" />
      {children}
    </p>
  );
}

/**
 * 写真の枠。要綱により画像は生成せずパスを参照する。
 * ファイルが無い(=404)ときは灰白の下地にパス名を小さく出す。
 */
/* 静的エクスポートの basePath(/opus093-site) は、Next が書き換えるのは
   自前のアセットと next/image だけで、**素の <img src> には付かない**。
   "/images/…" のままだと公開URLで必ず404になるのでここで前置きする。 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

function Shot({ src, alt, className, eager }: { src: string; alt: string; className: string; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  /* SSRのHTMLを受け取ったブラウザは hydration より前に読み込みを始めるので、
     onError だけでは「hydration前に404した画像」を取りこぼす
     (実際にヒーローの eager な3枚だけプレースホルダにならなかった)。
     マウント時に complete かつ naturalWidth === 0 のものを拾い直す。 */
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  if (broken) {
    return (
      <span role="img" aria-label={alt} className={`${className} flex items-center justify-center bg-[#E4DDD1]`}>
        <span className={`${GOTHIC} px-4 text-center text-[11px] leading-[1.7] tracking-[0.08em] text-[#3E4A3D]`}>{src}</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 要綱で <img src> による参照を指定
    <img
      ref={ref}
      src={`${BASE}${src}`}
      alt={alt}
      /* <img> は既定でネイティブのドラッグが働き、カルーセルの
         framer-motion のドラッグを奪ってスワイプが効かなくなる
         (プレースホルダは <span> だったので気付かなかった)。 */
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
      className={`${className} object-cover`}
    />
  );
}

/* ── 固定ナビ ───────────────────────────────────────────────── */

function Nav() {
  const still = useReducedMotion();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);

  /* スクロール100pxから胡粉の半透明+blurで浮かせる */
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkBase = `${GOTHIC} text-[13px] tracking-[0.12em] text-[#211D19] transition-colors duration-300 hover:text-[#3E4A3D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A7355]`;

  return (
    <header
      data-nav
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        lifted || open
          ? "border-b border-[#E4DDD1] bg-[#F4F0E8]/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className={`${WRAP} flex h-[72px] items-center justify-between md:h-[88px]`}>
        <a href="#top" className={`${MINCHO} flex items-baseline gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A7355]`}>
          <span className="text-[19px] text-[#211D19] md:text-[21px]">灯家</span>
          <span className={`${GOTHIC} text-[11px] uppercase tracking-[0.2em] text-[#3E4A3D]`}>TOMOSHIBI</span>
        </a>

        <nav aria-label="メインメニュー" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={linkBase}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="tomoshibi-menu"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-[#211D19] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A7355] md:hidden"
        >
          {open ? <X size={22} strokeWidth={1.5} aria-hidden="true" /> : <Menu size={22} strokeWidth={1.5} aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="tomoshibi-menu"
            key="menu"
            initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
            animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            exit={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
            transition={still ? { duration: 0 } : { duration: 0.4, ease: EASE }}
            className="overflow-hidden border-t border-[#E4DDD1] bg-[#F4F0E8]/95 backdrop-blur-md md:hidden"
          >
            <nav aria-label="メインメニュー(モバイル)" className={`${WRAP} py-4`}>
              <ul>
                {NAV.map((item) => (
                  <li key={item.href} className="border-b border-[#E4DDD1] last:border-b-0">
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`${GOTHIC} block py-4 text-[15px] tracking-[0.08em] text-[#211D19] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A7355]`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── ヒーロー ───────────────────────────────────────────────── */

function Hero() {
  const still = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);

  /* 5秒の自動送り。reduced-motion と、ホバー/フォーカス中は止める。 */
  useEffect(() => {
    if (still || held) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % HERO_SHOTS.length), 5000);
    return () => window.clearInterval(id);
  }, [still, held]);

  const step = useCallback((delta: number) => {
    setIndex((i) => (i + delta + HERO_SHOTS.length) % HERO_SHOTS.length);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-[72px] md:pt-[88px]">
      {/* 背景の間取り線画。装飾なので読み上げ対象から外す */}
      <PlanLines
        paths={PLAN_ROOMS}
        viewBox="0 0 480 360"
        className="pointer-events-none absolute left-5 top-[14%] h-[240px] w-[320px] text-[#8A7355]/15 sm:left-8 sm:h-[300px] sm:w-[400px] lg:left-6 lg:top-1/2 lg:h-[465px] lg:w-[620px] lg:-translate-y-1/2 lg:text-[#8A7355]/20"
      />

      <div className={`${WRAP} relative grid min-h-[calc(100svh-72px)] items-center gap-10 pb-16 pt-10 md:min-h-[calc(100svh-88px)] md:pb-24 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16`}>
        <Group className="lg:flex lg:flex-col lg:items-end">
          <Rise>
            <Eyebrow>Custom House / Kitakyushu</Eyebrow>
          </Rise>

          {/* 縦書きは右から左へ読むので、見出しを右・サブコピーをその左に置く。
              縦組みは高さが決まらないと折り返せないため lg 以降は h- を明示する
              (max-h- だと1列のまま伸びて隣の要素と重なる)。 */}
          {/* 縦組みの高さ = 1列に入る字数。字送りは font-size x (1 + letter-spacing 0.06em)
              なので、38px なら約40.3px/字 → 23rem(368px) でちょうど9字＝読点で折り返す。
              高さを詰めすぎると「住/まい」のように語中で切れる。 */}
          <div className="mt-7 lg:mt-10 lg:flex lg:h-[23rem] lg:flex-row-reverse lg:items-start lg:gap-7 xl:h-[25.5rem]">
            <Rise className="lg:h-full">
              <h1
                className={`${MINCHO} text-[30px] font-normal leading-[1.75] text-[#211D19] sm:text-[36px] lg:h-full lg:text-[38px] lg:leading-[1.6] lg:[writing-mode:vertical-rl] xl:text-[42px]`}
              >
                暮らしに合わせて、住まいを仕立てる。
              </h1>
            </Rise>

            <Rise className="mt-6 lg:mt-1 lg:h-[19rem] xl:h-[21rem]">
              <p className={`${BODY} max-w-[30rem] text-[#211D19] lg:h-full lg:max-w-none lg:[writing-mode:vertical-rl]`}>
                北九州の気候と土地を読み、家族の<span className="lg:[text-combine-upright:all]">10</span>年後まで設計する工務店です。
              </p>
            </Rise>
          </div>
        </Group>

        {/* 写真カルーセル(5秒自動送り・クロスフェード・スワイプ対応) */}
        <div
          className="relative"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={() => setHeld(false)}
        >
          <motion.div
            drag={still ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.x < -56) step(1);
              else if (info.offset.x > 56) step(-1);
            }}
            aria-roledescription="カルーセル"
            aria-label="灯家の施工写真"
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px] bg-[#E4DDD1] sm:aspect-[4/3] lg:aspect-[3/4]"
          >
            {HERO_SHOTS.map((shot, i) => (
              <motion.div
                key={shot.src}
                data-slide
                role="group"
                aria-roledescription="スライド"
                aria-label={`${i + 1} / ${HERO_SHOTS.length}`}
                aria-hidden={i !== index}
                initial={{ opacity: i === 0 ? 1 : 0 }}
                animate={{ opacity: i === index ? 1 : 0 }}
                transition={still ? { duration: 0 } : { duration: 1.1, ease: EASE }}
                className="absolute inset-0"
              >
                <Shot src={shot.src} alt={shot.alt} eager={i === 0} className="h-full w-full select-none" />
              </motion.div>
            ))}
          </motion.div>

          {/* ダッシュ型の進行インジケータ */}
          <div className="mt-5 flex items-center gap-3" role="tablist" aria-label="スライドの切り替え">
            {HERO_SHOTS.map((shot, i) => (
              <button
                key={shot.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}枚目を表示`}
                onClick={() => setIndex(i)}
                className="group py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A7355]"
              >
                {/* 非選択を灰白にすると対胡粉 1.19:1 で「何本あるか」すら見えない。
                    状態は色ではなく太さで示し、非選択も深緑(8.2:1)で必ず見えるようにする。
                    太さは height ではなく scaleY で出す(レイアウトを動かさない)。 */}
                <span
                  aria-hidden="true"
                  className={`block h-[3px] w-10 origin-center transition-[transform,background-color] duration-500 md:w-14 ${
                    i === index ? "scale-y-100 bg-[#8A7355]" : "scale-y-[0.34] bg-[#3E4A3D] group-hover:scale-y-100"
                  }`}
                />
              </button>
            ))}
            <span className={`${GOTHIC} ml-auto text-[11px] tracking-[0.2em] text-[#3E4A3D]`}>
              {String(index + 1).padStart(2, "0")} / {String(HERO_SHOTS.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <a
        href="#concept"
        className={`${GOTHIC} absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#3E4A3D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A7355] lg:inline-flex`}
      >
        Scroll
        <ArrowDown size={14} strokeWidth={1.5} aria-hidden="true" />
      </a>
    </section>
  );
}

/* ── 思想 ───────────────────────────────────────────────────── */

function Concept() {
  return (
    <section id="concept" className={`${PAD} ${ANCHOR}`}>
      <Group className={`${WRAP} grid gap-12 md:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center`}>
        <div>
          <Rise>
            <Eyebrow>Concept</Eyebrow>
          </Rise>
          <Rise>
            <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>
              住まいは、
              <br className="hidden sm:block" />
              暮らしに合わせて仕立てるもの。
            </h2>
          </Rise>
          {CONCEPT_TEXT.map((paragraph) => (
            <Rise key={paragraph}>
              <p className={`${BODY} mt-6 max-w-[34rem] text-[#211D19]`}>{paragraph}</p>
            </Rise>
          ))}
        </div>

        <Rise className="lg:pl-6">
          <figure className="rounded-[2px] border border-[#E4DDD1] bg-[#E4DDD1]/40 p-6 md:p-10">
            <PlanLines paths={PLAN_ROOMS} viewBox="0 0 480 360" className="h-auto w-full text-[#8A7355]" />
            <figcaption className={`${GOTHIC} mt-5 text-[12px] leading-[1.8] tracking-[0.08em] text-[#3E4A3D]`}>
              平屋・延床 92.7㎡／北九州市八幡西区。<br />
              風の抜ける方向に合わせて開口をずらした基本計画。
            </figcaption>
          </figure>
        </Rise>
      </Group>
    </section>
  );
}

/* ── 施工事例 ───────────────────────────────────────────────── */

function Works() {
  return (
    <section id="works" className={`${PAD} ${ANCHOR}`}>
      <Group className={WRAP}>
        <Rise>
          <Eyebrow>Works</Eyebrow>
        </Rise>
        <Rise>
          <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>これまでの仕立て。</h2>
        </Rise>
        <Rise>
          <p className={`${BODY} mt-5 max-w-[34rem] text-[#211D19]`}>
            同じ間取りは一つもありません。敷地と暮らしから引いた線が、そのまま形になっています。
          </p>
        </Rise>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 md:mt-16 md:gap-x-10 md:gap-y-14">
          {WORKS.map((work) => (
            <Rise key={work.src}>
              {/* ホバーは写真の 1.03 倍ゆっくり拡大のみ。事例名と延床面積は
                  タッチ端末でも読めるよう常に出しておく。 */}
              <li className="group list-none">
                <figure>
                  <div className="overflow-hidden rounded-[2px] bg-[#E4DDD1]">
                    <Shot
                      src={work.src}
                      alt={`施工事例「${work.name}」の写真`}
                      className="aspect-[4/3] w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="mt-5 flex items-baseline justify-between gap-4 border-t border-[#E4DDD1] pt-4">
                    <span className={`${MINCHO} text-[17px] text-[#211D19] md:text-[19px]`}>{work.name}</span>
                    <span className={`${GOTHIC} shrink-0 text-right text-[12px] leading-[1.8] tracking-[0.08em] text-[#3E4A3D]`}>
                      延床 {work.area}
                      <br />
                      {work.place}
                    </span>
                  </figcaption>
                </figure>
              </li>
            </Rise>
          ))}
        </ul>
      </Group>
    </section>
  );
}

/* ── 性能・仕様 ─────────────────────────────────────────────── */

function Performance() {
  return (
    <section id="performance" className={`${ANCHOR} bg-[#E4DDD1] ${PAD}`}>
      <Group className={WRAP}>
        <Rise>
          <Eyebrow>Performance</Eyebrow>
        </Rise>
        <Rise>
          <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>数字は、静かに効いてくる。</h2>
        </Rise>
        <Rise>
          <p className={`${BODY} mt-5 max-w-[34rem] text-[#211D19]`}>
            住みはじめてから差が出るのは、見た目では分からない部分です。標準仕様として基準を決めています。
          </p>
        </Rise>

        <dl className="mt-12 grid gap-px border-t border-[#8A7355]/40 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {SPECS.map((spec) => (
            <Rise key={spec.label}>
              <div className="border-b border-[#8A7355]/40 py-8 md:pr-8">
                <dt className={`${GOTHIC} text-[12px] tracking-[0.12em] text-[#3E4A3D]`}>{spec.label}</dt>
                <dd className="mt-3">
                  <span className={`${MINCHO} text-[54px] leading-none text-[#211D19] md:text-[62px]`}>{spec.value}</span>
                  <span className={`${GOTHIC} ml-2 text-[12px] tracking-[0.1em] text-[#3E4A3D]`}>{spec.unit}</span>
                  <span className={`${BODY} mt-4 block text-[14px] text-[#211D19]`}>{spec.note}</span>
                </dd>
              </div>
            </Rise>
          ))}
        </dl>

        <Rise>
          <p className={`${GOTHIC} mt-8 text-[12px] leading-[1.9] tracking-[0.06em] text-[#3E4A3D]`}>
            ※ 数値は標準仕様での目安です。プランと敷地条件によって変わります。
          </p>
        </Rise>
      </Group>
    </section>
  );
}

/* ── 家づくりの流れ ─────────────────────────────────────────── */

function Flow() {
  return (
    <section id="flow" className={`${PAD} ${ANCHOR}`}>
      <Group className={WRAP}>
        <Rise>
          <Eyebrow>Flow</Eyebrow>
        </Rise>
        <Rise>
          <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>はじめから、引渡しまで。</h2>
        </Rise>

        <ol className="mt-12 md:mt-16">
          {FLOW.map((step) => (
            <Rise key={step.no}>
              <li className="grid gap-3 border-t border-[#E4DDD1] py-8 md:grid-cols-[6rem_10rem_minmax(0,1fr)] md:items-baseline md:gap-8 md:py-10">
                <span className={`${GOTHIC} text-[13px] tracking-[0.2em] text-[#3E4A3D]`}>{step.no}</span>
                <h3 className={`${MINCHO} text-[20px] text-[#211D19] md:text-[22px]`}>{step.title}</h3>
                <p className={`${BODY} max-w-[38rem] text-[#211D19]`}>{step.text}</p>
              </li>
            </Rise>
          ))}
        </ol>
      </Group>
    </section>
  );
}

/* ── お客様の声 ─────────────────────────────────────────────── */

function Voices() {
  return (
    <section id="voices" className={`${PAD} ${ANCHOR}`}>
      <Group className={WRAP}>
        <Rise>
          <Eyebrow>Voices</Eyebrow>
        </Rise>
        <Rise>
          <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>住みはじめてから、聞いた話。</h2>
        </Rise>

        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 md:gap-8">
          {VOICES.map((voice) => (
            <Rise key={voice.who}>
              <figure className="h-full rounded-[2px] border border-[#E4DDD1] bg-[#E4DDD1]/45 p-7 md:p-9">
                <blockquote className={`${BODY} text-[#211D19]`}>{voice.text}</blockquote>
                <figcaption className={`${GOTHIC} mt-6 border-t border-[#8A7355]/35 pt-5 text-[12px] leading-[1.9] tracking-[0.08em] text-[#3E4A3D]`}>
                  <span className={`${MINCHO} block text-[15px] tracking-[0.06em] text-[#211D19]`}>{voice.who}</span>
                  {voice.meta}
                </figcaption>
              </figure>
            </Rise>
          ))}
        </div>
      </Group>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────────────── */

function Cta() {
  /* href は問い合わせ先が決まるまでフッターの会社概要へ落としている。
     押しても何も起きないボタンは作らない。実案件ではここに実URLを入れる。 */
  return (
    <section id="cta" className={`${PAD} ${ANCHOR}`}>
      <Group className={WRAP}>
        <Rise>
          <Eyebrow>Contact</Eyebrow>
        </Rise>
        <Rise>
          <h2 className={`${MINCHO} mt-6 text-[26px] leading-[1.75] text-[#211D19] md:text-[32px]`}>まず、暮らしの話から。</h2>
        </Rise>

        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-8">
          <Rise>
            <div id="document" className={`${ANCHOR} flex h-full flex-col rounded-[2px] border border-[#8A7355]/45 p-7 md:p-9`}>
              <h3 className={`${MINCHO} text-[20px] text-[#211D19] md:text-[22px]`}>資料請求</h3>
              <p className={`${BODY} mt-4 grow text-[#211D19]`}>
                施工事例と標準仕様、費用の考え方をまとめた冊子をお送りします。しつこいご連絡はいたしません。
              </p>
              <a
                href="#company"
                className={`${GOTHIC} mt-7 inline-flex items-center justify-center gap-2 rounded-none bg-[#8A7355] px-8 py-4 text-[19px] font-bold tracking-[0.08em] text-[#F4F0E8] transition-colors duration-300 hover:bg-[#3E4A3D] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#211D19]`}
              >
                資料請求
                <ArrowUpRight size={20} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </Rise>

          <Rise>
            <div id="modelhouse" className={`${ANCHOR} flex h-full flex-col rounded-[2px] border border-[#8A7355]/45 p-7 md:p-9`}>
              <h3 className={`${MINCHO} text-[20px] text-[#211D19] md:text-[22px]`}>モデルハウス来場予約</h3>
              <p className={`${BODY} mt-4 grow text-[#211D19]`}>
                断熱の効き方、素材の手ざわり、光の入り方を確かめていただけます。所要はおよそ90分です。
              </p>
              <a
                href="#company"
                className={`${GOTHIC} mt-7 inline-flex items-center justify-center gap-2 rounded-none border-2 border-[#8A7355] px-8 py-4 text-[19px] font-bold tracking-[0.08em] text-[#211D19] transition-colors duration-300 hover:bg-[#3E4A3D] hover:text-[#F4F0E8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#211D19]`}
              >
                来場予約
                <ArrowUpRight size={20} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </Rise>
        </div>
      </Group>
    </section>
  );
}

/* ── フッター ───────────────────────────────────────────────── */

const COMPANY = [
  { term: "屋号", desc: "灯家 -TOMOSHIBI-（仮）" },
  { term: "所在地", desc: "福岡県北九州市小倉北区○○ 1-2-3（仮）" },
  { term: "対応エリア", desc: "北九州市・福岡市および近郊" },
  { term: "営業時間", desc: "9:00 – 18:00 ／ 水曜定休" },
];

function Footer() {
  return (
    <footer id="company" className={`${ANCHOR} bg-[#211D19] py-16 md:py-[96px]`}>
      <div className={WRAP}>
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-16">
          <div>
            <p className={`${MINCHO} flex items-baseline gap-3 text-[22px] text-[#F4F0E8]`}>
              灯家
              <span className={`${GOTHIC} text-[11px] uppercase tracking-[0.2em] text-[#E4DDD1]`}>TOMOSHIBI</span>
            </p>
            <p className={`${BODY} mt-5 max-w-[24rem] text-[14px] text-[#E4DDD1]`}>
              北九州の気候と土地を読み、家族の10年後まで設計する工務店です。
            </p>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className={`${GOTHIC} mt-7 inline-flex items-center gap-2 border-b border-[#8A7355] pb-1 text-[13px] tracking-[0.14em] text-[#F4F0E8] transition-colors duration-300 hover:text-[#E4DDD1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A7355]`}
            >
              Instagram
              <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>

          <dl className="grid gap-px">
            {COMPANY.map((row) => (
              <div key={row.term} className="grid gap-1 border-t border-[#3E4A3D] py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                <dt className={`${GOTHIC} text-[12px] tracking-[0.12em] text-[#E4DDD1]`}>{row.term}</dt>
                <dd className={`${GOTHIC} text-[14px] leading-[1.9] text-[#F4F0E8]`}>{row.desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 border-t border-[#3E4A3D] pt-6">
          <p className={`${GOTHIC} text-[12px] leading-[1.9] tracking-[0.06em] text-[#E4DDD1]`}>
            ※ 本ページはデザイン確認用のサンプルです。ブランド名・所在地・施工事例・お客様の声・各数値はすべて仮のものです。
          </p>
          <p className={`${GOTHIC} mt-4 text-[11px] uppercase tracking-[0.2em] text-[#E4DDD1]`}>© TOMOSHIBI</p>
        </div>
      </div>
    </footer>
  );
}

/* ── ページ本体 ─────────────────────────────────────────────── */

export default function TomoshibiLP() {
  return (
    <div data-tomoshibi style={FONTS} className={`${GOTHIC} min-h-svh bg-[#F4F0E8] text-[#211D19] antialiased`}>
      {/* JS無効時: framer-motion がSSRで書いた初期状態(opacity:0 / 線画未描画)を打ち消す。
          !important はインラインスタイルより強いので、これで全文が読める。 */}
      <noscript>
        <style>{`
          [data-reveal]{opacity:1!important;transform:none!important}
          [data-plan] path{stroke-dasharray:none!important;stroke-dashoffset:0!important}
          [data-nav]{background:rgba(244,240,232,.9)!important;border-bottom-color:#E4DDD1!important}
        `}</style>
      </noscript>

      <a
        href="#concept"
        className={`${GOTHIC} sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-[#211D19] focus:px-4 focus:py-3 focus:text-[13px] focus:text-[#F4F0E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A7355]`}
      >
        本文へスキップ
      </a>

      <Nav />

      <main className="bg-[#F4F0E8]">
        <Hero />
        <PlanDivider />
        <Concept />
        <PlanDivider />
        <Works />
        <Performance />
        <Flow />
        <PlanDivider />
        <Voices />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}
