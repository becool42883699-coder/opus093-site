import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowGlyph, Icon } from "../components/trx/Icon";
import PageHero from "../components/trx/PageHero";
import Stages from "../components/trx/Stages";
import SubPage from "../components/trx/SubPage";
import site from "../components/trx/site.module.css";
import sub from "../components/trx/sub.module.css";

export const metadata: Metadata = {
  title: "施工実績|福岡・山口 T-REX",
  description: "福岡県・山口県で対応した板金塗装・荷台換装/修理・出張修理・車両陸送の施工実績。現場ごとに最適な方法をご提案するT-REXの代表的な事例をご紹介します。",
  alternates: { canonical: "/works/" },
  openGraph: { title: "施工実績|T-REX CO., LTD.", description: "福岡・山口の施工・対応事例。", images: ["/works-hero-bg.webp"] },
};

const works = [
  ["01", "大型ダンプ 荷台換装・修理", "荷台修理・架装", "損傷部を確認し、強度と実用性を重視して補修・換装。現場復帰までを迅速に支援します。", "cargo-conversion"],
  ["02", "特殊車両 全塗装", "板金塗装", "下地処理から塗装、仕上げまで一貫対応。車両の印象と耐久性を高めます。", "spray-gun"],
  ["03", "建設機械 油圧部修理", "出張修理", "現場へ訪問し、故障箇所を点検。停止時間を抑えるため、その場で可能な修理を進めます。", "rapid-response-tools"],
  ["04", "車両陸送・軽運送対応", "車両陸送", "車両や資材を安全・確実に輸送。日程や搬入条件に合わせて柔軟に対応します。", "mobile-repair-truck"],
] as const;

const photos = [
  { src: "/works-photo-8.webp", alt: "福岡・山口対応 T-REXの床板張替え 塗装仕上げの完成荷台", cap: "床板張替え 完成 — 塗装仕上げ", w: 870, h: 652 },
  { src: "/works-photo-6.webp", alt: "福岡・山口対応 T-REXの特殊車両 架装作業", cap: "特殊車両の架装作業", w: 870, h: 654 },
  { src: "/works-photo-3.webp", alt: "福岡・山口対応 T-REXによる大型車両の床板一部修理 施工", cap: "床板一部修理 施工", w: 870, h: 653 },
  { src: "/works-photo-5.webp", alt: "福岡・山口対応 T-REXの部品塗装作業", cap: "部品の塗装作業", w: 870, h: 1160, tall: true },
  { src: "/works-photo-4.webp", alt: "福岡・山口対応 T-REXの板金塗装 鏡面仕上げのパネル", cap: "塗装仕上げ — 鏡面パネル", w: 870, h: 652 },
];

export default function WorksPage() {
  return (
    <SubPage current="/works">
      <PageHero
        index="03" en="Works"
        ja={[["一つひとつの仕事に、"], [{ text: "技術と責任を。", em: true }]]}
        lead="福岡県・山口県で対応した代表的な施工・対応事例。車両や設備の状態、用途、納期を踏まえ、最適な方法をご提案します。"
        image={{ src: "/works-hero-bg.webp", width: 1916, height: 821, position: "50% 45%" }}
        imageAlt="工具とトラックに囲まれたT-REXのマスコットのブループリント"
      />

      <section className={`${site.section} ${site.light} ${site.lift}`} data-surface="light" aria-labelledby="cases-title">
        <div className={site.head}>
          <p className={site.label}><span>(01)</span>Selected Works — 代表的な事例</p>
          <h2 id="cases-title" className={site.h2} data-x-split>現場ごとに、<br /><em>最適解を。</em></h2>
          <p className={site.lead} data-x-reveal>ひとつとして同じ現場はありません。状態を見て、用途を聞いて、納期に合わせて手を打ちます。</p>
        </div>
        <div className={sub.rows}>
          {works.map(([n, title, tag, desc, icon]) => (
            <article className={sub.row} key={n} data-x-reveal>
              <span className={sub.rowNum}>{n}</span>
              <div className={sub.rowTitle}><h3>{title}</h3><span>{tag}</span></div>
              <p className={sub.rowDesc}>{desc}</p>
              <div className={sub.rowAct}>
                <Icon name={icon} className={sub.rowIcon} />
                <Link className={sub.rowLink} href="/contact">この内容を相談する<ArrowGlyph /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={site.section} aria-labelledby="process-title">
        <div className={sub.split}>
          <div className={sub.sticky}>
            <p className={site.label}><span>(02)</span>Process — 荷台換装の工程</p>
            <h2 id="process-title" className={site.h2} style={{ marginTop: 24 }} data-x-split>シャーシから、<br /><em>完成まで。</em></h2>
            <p className={site.lead} style={{ marginTop: 24 }} data-x-reveal>
              スライダーを動かすと、シャーシだけの状態から根太の設置、床板を張った完成までを順に見られます。
            </p>
          </div>
          <div data-x-reveal>
            <Stages
              width={870} height={653}
              stages={[
                { src: "/works-photo-7.webp", alt: "福岡・山口対応 T-REXの荷台換装 施工前(シャシのみ)", label: "シャーシ" },
                { src: "/works-photo-1.webp", alt: "福岡・山口対応 T-REXの荷台換装 施工中(根太の設置)", label: "根太" },
                { src: "/works-photo-2.webp", alt: "福岡・山口対応 T-REXの荷台床板張替え 完成", label: "完成" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className={site.section} style={{ paddingTop: 0 }} aria-labelledby="photos-title">
        <div className={site.head}>
          <p className={site.label}><span>(03)</span>Photo — 施工の様子</p>
          <h2 id="photos-title" className={site.h2} data-x-split>手の跡が、<br /><em>残る仕事。</em></h2>
          <p className={site.lead} data-x-reveal>実際の作業風景と仕上がりの一部をご紹介します。</p>
        </div>
        <div className={sub.gallery}>
          {photos.map((p, i) => (
            <figure className={`${sub.shot} ${p.tall ? sub.shotTall : ""}`} key={p.src}>
              <div className={sub.shotImg} data-x-clip>
                <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 34vw" />
              </div>
              <figcaption><span>{String(i + 1).padStart(2, "0")}</span>{p.cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </SubPage>
  );
}
