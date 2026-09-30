import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, SITE_URL } from "../components/TrmSeo";
import { ArrowGlyph, Icon } from "../components/trx/Icon";
import PageHero from "../components/trx/PageHero";
import SubPage from "../components/trx/SubPage";
import { asset } from "../components/trx/site";
import site from "../components/trx/site.module.css";
import sub from "../components/trx/sub.module.css";

export const metadata: Metadata = {
  title: "事業案内|福岡・山口の板金塗装/出張修理 T-REX",
  description: "福岡県・山口県対応。板金塗装、荷台修理・架装、出張修理、事故対応・保険修理、メンテナンス・点検、車両陸送・軽運送の6事業をワンストップで提供するT-REXの事業案内です。",
  alternates: { canonical: "/service/" },
  openGraph: { title: "事業案内|T-REX CO., LTD.", description: "福岡・山口対応の6つの事業をご案内。", images: ["/service-hero-bg.webp"] },
};

const services = [
  ["01", "板金塗装", "Body & Paint", "高品質な塗装で、美しく\n強い仕上がりへ。", "spray-gun"],
  ["02", "荷台修理・架装", "Cargo Bed & Body Work", "用途に応じた設計で\n作業効率と安全性を向上。", "cargo-conversion"],
  ["03", "出張修理サービス", "On-site Repair", "現場へ駆けつけ、迅速に\nトラブルを解決します。", "mobile-repair-truck"],
  ["04", "事故対応・保険修理", "Accident & Insurance", "事故後の対応も安心。\n保険修理までサポート。", "shield-confirm"],
  ["05", "メンテナンス・点検", "Maintenance", "定期点検でトラブルを\n未然に防ぎます。", "inspection-tools"],
  ["06", "車両陸送・軽運送", "Transport", "安全・確実な車両輸送と\n軽貨物運送を行います。", "rapid-response-tools"],
] as const;

export default function ServicePage() {
  return (
    <SubPage current="/service">
      <JsonLd data={services.map(([, title, , description]) => ({
        "@context": "https://schema.org", "@type": "Service", name: title,
        description: description.replace("\n", ""), provider: { "@id": `${SITE_URL}/#business` },
        areaServed: ["福岡県", "山口県"],
      }))} />

      <PageHero
        index="02" en="Services"
        ja={[["現場を支える、"], [{ text: "6つの事業。", em: true }]]}
        lead="福岡県・山口県の現場を支える6つの事業。板金塗装から車両陸送まで、確かな技術でワンストップ対応します。"
        image={{ src: "/service-hero-bg.webp", width: 1920, height: 800, position: "50% 40%" }}
        imageAlt="北九州の街並みとT-REXのマスコットを描いたブループリント"
      />

      <section className={`${site.section} ${site.light} ${site.lift}`} data-surface="light" aria-labelledby="svc-title">
        <div className={site.head}>
          <p className={site.label}><span>(01)</span>Our Business — 事業一覧</p>
          <h2 id="svc-title" className={site.h2} data-x-split>板金塗装から、<br /><em>車両陸送まで。</em></h2>
          <p className={site.lead} data-x-reveal>ひとつの窓口で、外装の板金塗装から荷台の修理・架装、事故後の保険修理、定期点検、輸送までを引き受けます。</p>
        </div>
        <div className={sub.rows}>
          {services.map(([n, title, en, desc, icon]) => (
            <article className={sub.row} key={n} data-x-reveal>
              <span className={sub.rowNum}>{n}</span>
              <div className={sub.rowTitle}><h3>{title}</h3><span>{en}</span></div>
              <p className={sub.rowDesc}>{desc}</p>
              <div className={sub.rowAct}>
                <Icon name={icon} className={sub.rowIcon} />
                <Link className={sub.rowLink} href="/contact">相談する<ArrowGlyph /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={site.section} aria-labelledby="area-title">
        <div className={site.head}>
          <p className={site.label}><span>(02)</span>Area — 対応エリア</p>
          <h2 id="area-title" className={site.h2} data-x-split>福岡・山口の<br /><em>現場へ。</em></h2>
          <p className={site.lead} data-x-reveal>福岡県・山口県を中心に対応しています。その他の地域も可能な限り対応しますので、まずはお気軽にご相談ください。</p>
        </div>
        <div className={sub.pair} data-x-reveal="stagger">
          <div>
            <Icon name="mobile-repair-truck" className={sub.pairIcon} />
            <h3>出張修理</h3>
            <p>現場へ伺い、故障箇所を点検。停止時間を抑えるため、その場で可能な修理を進めます。</p>
          </div>
          <div>
            <Icon name="shield-quality" className={sub.pairIcon} />
            <h3>持込修理</h3>
            <p>車両・機械の持ち込みに対応。状態やご都合に合わせて、最適な方法をご提案します。</p>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={sub.band} src={asset("/service-skyline.webp")} alt="" width={1536} height={172} loading="lazy" />
      </section>
    </SubPage>
  );
}
