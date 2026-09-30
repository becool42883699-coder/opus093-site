"use client";

/**
 * トップページ(2026 リデザイン)。
 *
 * 流れ: ヒーロー → 流れる帯 → ステートメント → 4幕エンジン体験(ピン) → 諸元 →
 *       事業 → 施工実績(横スクロール) → 数字 → 会社 → 電話CTA+フッター
 *
 * 命綱(CLAUDE.md §8。演出の都合で削らない):
 *  - 固定ヘッダーの電話ボタンは全スクロール位置で押せる(SiteHeader)
 *  - ヒーローの電話ボタンはHTMLとして即時表示。入場アニメーションの対象にしない
 *  - ヒーローの「サービス一覧へ」でピン区間を飛ばせる(scrollToElement)
 *  - 4幕の本文・諸元は静的HTML。JS無効・reduced-motion・WebGL2非対応では縦積みで読める
 */

import Image from "next/image";
import Link from "next/link";
import { scrollToElement } from "./components/lenisBridge";
import EngineSceneMount from "./components/engine/EngineSceneMount";
import eng from "./components/engine/engine.module.css";
import SiteHeader from "./components/trx/SiteHeader";
import SiteFooter from "./components/trx/SiteFooter";
import SiteMotion from "./components/trx/SiteMotion";
import V14Hero, { HERO_PROBE } from "./components/trx/V14Hero";
import { ArrowGlyph, Logo } from "./components/trx/Icon";
import site from "./components/trx/site.module.css";
import t from "./top.module.css";

/* 初回ペイント前に走らせる。EngineScene と同じ条件で判定する。 */
const MOTION_PROBE = `try{
var r=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,g=false;
try{g=!!document.createElement('canvas').getContext('webgl2')}catch(e){}
if(!r&&g)document.documentElement.setAttribute('data-engine-motion','on')}catch(e){}`;

const CHAPTERS = [
  { n: "01", name: "鉄の塊", head: <>鉄の<em>塊。</em></>, cap: "20万キロ働いた鋳鉄のブロック。面研とラインボーリングで、もう一度ゼロへ戻す。" },
  { n: "02", name: "透視", head: <>透視<em>する。</em></>, cap: "外装がガラスに変わる。クランクはあなたのスクロールと連動し、カムがバルブを叩き、上死点で点火する。" },
  { n: "03", name: "手組み", head: <>手で、<em>組む。</em></>, cap: "1,214点。ロッドキャップを外し、ヘッドを吊り上げ、クランクを降ろす——そして全ボルトを規定トルクで組み戻す。" },
  { n: "04", name: "始動", head: <><em>始動。</em></>, cap: "規定トルクで組み、火を入れる。クランキング——初爆——安定回転。納車まで、あと少し。" },
];
const CHAPTER_NAV = CHAPTERS.map((c) => `${c.n} ${c.name}`);

const LABELS = [
  { i: 1, cls: "lbl1" as const, b: "ツインカム", rest: " — DOHC 16V" },
  { i: 2, cls: "lbl2" as const, b: "ピストンピン", rest: " — フルフロート" },
  { i: 3, cls: "lbl3" as const, b: "ロッドキャップ", rest: " — 規定トルク管理" },
];

const SPECS = [
  { v: <>TRX-4</>, l: "直列4気筒 DOHC 16V" },
  { v: <>1,998<small>cc</small></>, l: "排気量" },
  { v: <>10.8<small>:1</small></>, l: "圧縮比(ブループリント処理)" },
  { v: <>1,214</>, l: "部品点数 — すべて手組み" },
];

const MARQUEE = ["Body & Paint", "Cargo Bed", "On-site Repair", "Transport", "Engine Overhaul"];

const PRINCIPLES = [
  { en: "Speed", ja: "止めない対応力", d: "現場の状況を素早く把握し、復旧までの時間を最小限に抑えます。" },
  { en: "Quality", ja: "妥協しない品質", d: "見えない部分まで丁寧に。長く安心して使える仕上がりを追求します。" },
  { en: "Safety", ja: "安全を最優先", d: "作業者と現場の安全を守るため、確認と基本動作を徹底します。" },
];

/* 事業の並びと文言は v14(ユーザー制作版)に合わせた */
const SERVICES = [
  { n: "01", ja: "板金塗装", en: "Body & Paint", d: "部分補修から全塗装、色合わせまで自社一貫で仕上げます。", img: "/works-photo-4.webp" },
  { n: "02", ja: "荷台換装", en: "Cargo Conversion", d: "架装・特装の載せ替えをワンストップで対応します。", img: "/works-photo-2.webp" },
  { n: "03", ja: "車両修理", en: "Vehicle Repair", d: "エンジンから足回りまで、整備士が一括で対応します。", img: "/works-photo-6.webp" },
  { n: "04", ja: "出張修理", en: "Mobile Response", d: "動かせない車両は現場へ。稼働を止めません。", img: "/works-photo-3.webp" },
  { n: "05", ja: "車両陸送・軽運送", en: "Transport", d: "全国どこへでも、自社手配で陸送・軽運送。", img: "/works-photo-7.webp" },
];

const WORKS = [
  { img: "/works-photo-7.webp", tag: "荷台換装", title: "施工前 — シャーシのみ", w: 870, h: 654 },
  { img: "/works-photo-1.webp", tag: "荷台換装", title: "施工中 — 根太の設置", w: 870, h: 653 },
  { img: "/works-photo-2.webp", tag: "荷台換装", title: "床板張替え 完成", w: 870, h: 654 },
  { img: "/works-photo-5.webp", tag: "板金塗装", title: "部品の塗装作業", w: 870, h: 1160 },
  { img: "/works-photo-4.webp", tag: "板金塗装", title: "塗装仕上げ — 鏡面パネル", w: 870, h: 652 },
  { img: "/works-photo-6.webp", tag: "架装", title: "特殊車両の架装作業", w: 870, h: 654 },
  { img: "/works-photo-8.webp", tag: "荷台修理", title: "床板張替え — 塗装仕上げ", w: 870, h: 652 },
];

const FACTS = [
  { v: "2025", u: "", l: "設立", d: "2025年1月設立。現場に根ざしたサービスを提供" },
  { v: "02", u: "県", l: "対応エリア", d: "福岡・山口。その他の地域も応相談" },
  { v: "9–18", u: "", l: "営業時間", d: "定休日は祝日・日曜日・土曜日(営業日あり)" },
  { v: "2", u: "way", l: "修理の形", d: "現場への出張修理と、工場への持込修理" },
];

export default function TopPage() {
  /* ピン区間を飛ばして事業一覧へ。Lenis があれば滑らかに送る */
  const skipToSections = () => {
    const target = document.getElementById("service");
    if (target) scrollToElement(target, 0);
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MOTION_PROBE + HERO_PROBE }} />
      <SiteHeader current="/" chapters={CHAPTER_NAV} />

      <main id="top" className={t.main} data-x-site>
        {/* ---------------- ヒーロー(ユーザー制作 v14 の移植・見た目はそのまま) ---------------- */}
        <V14Hero nextId="about" />

        {/* ---------------- 流れる帯 ---------------- */}
        <div className={t.marquee} data-x-marquee="34" aria-hidden="true">
          {[0, 1].map((k) => (
            <div className={t.mTrack} data-x-track key={k}>
              {MARQUEE.map((m, i) => (
                <span key={m} className={i % 2 ? t.mOutline : undefined}>
                  {m}<i className={t.mMark} />
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* ---------------- ステートメント ---------------- */}
        <section className={`${site.section} ${site.light} ${site.lift} ${t.statement}`} id="about" data-surface="light" aria-labelledby="statement-title">
          <p className={site.label}><span>(01)</span>About — T-REXについて</p>
          <h2 id="statement-title" className={site.srOnly}>T-REXについて</h2>
          <p className={t.statementText} data-x-words>
            トラックが止まれば、現場が止まる。
            板金塗装から荷台の換装、出張修理、陸送まで——
            T-REXは、福岡・山口の現場を動かし続けるための仕事を、一手に引き受けます。
          </p>
          <ol className={t.principles} data-x-reveal="stagger">
            {PRINCIPLES.map((p, i) => (
              <li key={p.en}>
                <span className={t.pNum}>0{i + 1}</span>
                <span className={t.pEn}>{p.en}</span>
                <h3>{p.ja}</h3>
                <p>{p.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------- 4幕エンジン ---------------- */}
        <div className={eng.page} data-engine-page>
          <div className={eng.progress} data-progress aria-hidden="true" />

          <section className={`${site.section} ${t.engineIntro}`} aria-labelledby="engine-title">
            <div className={site.head}>
              <p className={site.label}><span>(02)</span>The Craft — エンジン整備</p>
              <h2 id="engine-title" className={site.h2} data-x-split>心臓部まで、<br /><em>手で組む。</em></h2>
              <p className={site.lead} data-x-reveal>
                ここから先は、TRX-4エンジンの分解から始動までの記録です。
                3Dは写真ではなく、ブラウザ上でリアルタイムに描いています。スクロールで進めてください。
              </p>
              {/* 命綱: 4幕のピン区間を飛ばして事業一覧へ */}
              <button className={t.skip} type="button" onClick={skipToSections}>
                4幕を飛ばして事業一覧へ<i aria-hidden="true" />
              </button>
            </div>
          </section>

          <div className={eng.stageWrap} data-stage-wrap>
            <div className={eng.stage} data-stage>
              <EngineSceneMount />
              <div className={eng.vin} aria-hidden="true" />
              <div className={eng.loadTrack} aria-hidden="true">
                <span className={eng.loadFill} data-engine-progress />
              </div>
              {CHAPTERS.map((c, i) => (
                <div className={eng.chapter} key={c.n} data-ch={i + 1}>
                  <p className={eng.act} aria-hidden="true"><span>Act {c.n}</span> / 04 — {c.name}</p>
                  <div className={eng.num} aria-hidden="true">{c.n}</div>
                  <h2>{c.head}</h2>
                  <p className={eng.cap}>{c.cap}</p>
                </div>
              ))}
              {LABELS.map((l) => (
                <div className={`${eng.lbl} ${eng[l.cls]}`} key={l.i} data-lbl={l.i} aria-hidden="true">
                  <b>{l.b}</b>{l.rest}<i />
                </div>
              ))}
            </div>
          </div>

          <section className={`${site.section} ${t.spec}`} data-spec aria-labelledby="engine-spec-title">
            <p className={site.label} id="engine-spec-title"><span>(—)</span>Specifications — 諸元</p>
            <div className={t.specGrid}>
              {SPECS.map((s) => (
                <div className={t.specCell} key={s.l} data-cell>
                  <div className={t.specV}>{s.v}</div>
                  <div className={t.specL}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className={t.specCta}>
              <Link className={site.pill} href="/contact" data-x-magnetic>
                オーバーホールを相談する<ArrowGlyph className={site.pillArrow} />
              </Link>
              <p className={t.price}><span>¥480,000〜</span>3年保証</p>
            </div>
          </section>
        </div>

        {/* ---------------- 事業 ---------------- */}
        <section className={`${site.section} ${site.light} ${site.lift} ${t.services}`} id="service" data-surface="light" aria-labelledby="service-title">
          <div className={site.head}>
            <p className={site.label}><span>(03)</span>Services — 事業内容</p>
            <h2 id="service-title" className={site.h2} data-x-split>トラックの困りごとを、<br /><em>一社でまとめて。</em></h2>
            <p className={site.lead} data-x-reveal>トラックまわりの困りごとを、一社でまとめて引き受けます。記載以外の作業もご相談いただけます。</p>
          </div>
          <div className={t.svcList} data-x-preview>
            {SERVICES.map((sv) => (
              <Link className={t.svcRow} href="/service" key={sv.n} data-x-preview-row data-x-reveal>
                <span className={t.svcNum}>{sv.n}</span>
                <span className={t.svcTitle}>
                  <strong>{sv.ja}</strong>
                  <span>{sv.en}</span>
                </span>
                <span className={t.svcDesc}>{sv.d}</span>
                <span className={t.svcThumb} aria-hidden="true">
                  <Image src={sv.img} alt="" width={870} height={653} sizes="120px" />
                </span>
                <ArrowGlyph className={t.svcArrow} />
              </Link>
            ))}
            <div className={t.preview} data-x-preview-box aria-hidden="true">
              {SERVICES.map((sv) => (
                <Image key={sv.n} src={sv.img} alt="" width={870} height={653} sizes="320px" data-x-preview-img />
              ))}
            </div>
          </div>
          <div className={t.svcMore}>
            <Link className={site.pill} href="/service" data-x-magnetic>
              全7事業を見る<ArrowGlyph className={site.pillArrow} />
            </Link>
          </div>
        </section>

        {/* ---------------- 施工実績(横スクロール) ---------------- */}
        <section className={t.works} id="works" data-x-hscroll aria-labelledby="works-title">
          <div className={t.worksTrack} data-x-hscroll-track>
            <div className={t.worksHead}>
              <p className={site.label}><span>(04)</span>Works — 施工実績</p>
              <h2 id="works-title" className={site.h2} data-x-split>仕事で、<br /><em>語る。</em></h2>
              <p className={site.lead}>シャーシだけの状態から、根太を据え、床を張り、塗って仕上げる。福岡・山口の現場で手がけた仕事の一部です。</p>
              <Link className={`${site.pill} ${site.pillGhost}`} href="/works" data-x-magnetic>
                施工実績を見る<ArrowGlyph className={site.pillArrow} />
              </Link>
            </div>
            {WORKS.map((w, i) => (
              <figure className={`${t.workCard} ${w.h > w.w ? t.workTall : ""}`} key={w.img}>
                <div className={t.workImg}>
                  <Image src={w.img} alt={`${w.tag} — ${w.title}`} width={w.w} height={w.h} sizes="(max-width: 899px) 78vw, 40vw" data-x-hscroll-img />
                </div>
                <figcaption>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <b>{w.title}</b>
                  <small>{w.tag}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className={t.worksBar} aria-hidden="true"><i data-x-hscroll-bar /></div>
        </section>

        {/* ---------------- 数字 ---------------- */}
        <section className={`${site.section} ${site.lift} ${t.facts}`} data-surface="accent" aria-labelledby="facts-title">
          <p className={site.label}><span>(05)</span>Facts — 数字で見るT-REX</p>
          <h2 id="facts-title" className={site.srOnly}>数字で見るT-REX</h2>
          <dl className={t.factGrid} data-x-reveal="stagger">
            {FACTS.map((f) => (
              <div key={f.l} className={t.fact}>
                <dt>{f.l}</dt>
                <dd className={t.factV}>{f.v}<small>{f.u}</small></dd>
                <dd className={t.factD}>{f.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- 会社 ---------------- */}
        <section className={`${site.section} ${site.light} ${site.lift} ${t.company}`} id="company" data-surface="light" aria-labelledby="company-title">
          <div className={t.companyArt}>
            <div className={t.companyDisc} aria-hidden="true" data-x-parallax="6" />
            <Image className={t.mascot} src="/hero-trex-v3-cropped.webp" alt="T-REXのマスコット。トラックを抱えた青い恐竜" width={1008} height={1013} sizes="(max-width: 899px) 86vw, 40vw" />
            <p className={t.companyTag} aria-hidden="true">Field<br />Partner</p>
          </div>
          <div className={t.companyBody}>
            <p className={site.label}><span>(06)</span>Company — 会社情報</p>
            <h2 id="company-title" className={site.h2} data-x-split>現場で生まれる課題に、<br /><em>誠実に向き合う。</em></h2>
            <p className={t.companyText} data-x-reveal>
              確かな技術と迅速な対応で、お客様の仕事を支えていく。T-REXは、トラック・大型車を中心とした板金塗装、荷台換装・修理、出張対応を通じて、現場の「困った」に応える会社です。
            </p>
            {/* v14 の代表カード */}
            <div className={t.repCard} data-x-reveal>
              <div className={t.repLogo}><Logo className={t.repLogoImg} /></div>
              <p className={t.repPill}>NEVER STOP THE SITE.</p>
              <p className={t.repName}><small>代表</small>中津留 龍也</p>
            </div>
            <dl className={t.profile} data-x-reveal="stagger">
              <div><dt>設立</dt><dd>2025年1月</dd></div>
              <div><dt>資本金</dt><dd>300万円</dd></div>
              <div><dt>主な取引先</dt><dd>建設機械リース会社、解体業、建設業、土木業、運送業</dd></div>
              <div><dt>対応</dt><dd>出張修理・持込修理</dd></div>
            </dl>
            <Link className={site.pill} href="/company" data-x-magnetic>
              会社概要を見る<ArrowGlyph className={site.pillArrow} />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter>
        エンジンの3Dは写真ではなく、ブラウザ上でリアルタイムに描いています。
        This work is based on{" "}
        <a href="https://sketchfab.com/3d-models/inline-4-engine-block-diagram-see-through-cf087cd5f8ff4dd495576d206a6dafcf" rel="noopener noreferrer" target="_blank">&quot;Inline 4 engine block diagram (see through)&quot;</a>{" "}
        by <a href="https://sketchfab.com/Lame3dModels" rel="noopener noreferrer" target="_blank">Lame3D models</a>{" "}
        and <a href="https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0" rel="noopener noreferrer" target="_blank">&quot;Rigged 4-Cylinder Engine (FREE)&quot;</a>{" "}
        by <a href="https://sketchfab.com/david.gnzlv" rel="noopener noreferrer" target="_blank">david.gnzlv</a>, licensed under{" "}
        <a href="http://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer" target="_blank">CC-BY-4.0</a>. 環境マップは Poly Haven「quarry_01」(CC0)。
      </SiteFooter>

      <SiteMotion />
    </>
  );
}
