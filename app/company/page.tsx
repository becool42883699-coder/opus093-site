import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { Icon } from "../components/trx/Icon";
import PageHero from "../components/trx/PageHero";
import SubPage from "../components/trx/SubPage";
import { FAX, HOLIDAYS, HOURS, MAIL, TEL, TEL_HREF } from "../components/trx/site";
import site from "../components/trx/site.module.css";
import sub from "../components/trx/sub.module.css";

export const metadata: Metadata = {
  title: "会社概要|T-REX CO., LTD.",
  description: "福岡県・山口県対応のT-REX CO., LTD.会社概要。現場を止めないための理念と仕事の基準、会社情報、代表あいさつ、営業対応範囲・主な取引先業種をご紹介します。",
  alternates: { canonical: "/company/" },
  openGraph: { title: "会社概要|T-REX CO., LTD.", description: "T-REXの理念と会社情報。", images: ["/company-hero-bg.webp"] },
};

const values = [
  ["01", "Speed", "止めない対応力", "現場の状況を素早く把握し、復旧までの時間を最小限に抑えます。", "clock-fast"],
  ["02", "Quality", "妥協しない品質", "見えない部分まで丁寧に。長く安心して使える仕上がりを追求します。", "shield-quality"],
  ["03", "Safety", "安全を最優先", "作業者と現場の安全を守るため、確認と基本動作を徹底します。", "shield-safety"],
  ["04", "Partnership", "現場のパートナー", "一度きりではなく、困ったときに頼られる存在を目指します。", "gear-technology"],
] as const;

const profile: Array<[string, ReactNode]> = [
  ["商号", "T-REX CO., LTD."],
  ["代表者", "中津留 龍也"],
  ["設立年月", "2025年1月"],
  ["資本金", "300万円"],
  ["法人番号", "8290801031174"],
  ["電話番号", <a key="tel" href={TEL_HREF}>{TEL}</a>],
  ["FAX番号", FAX],
  ["メールアドレス", <a key="mail" href={`mailto:${MAIL}`}>{MAIL}</a>],
  ["営業時間", HOURS],
  ["定休日", HOLIDAYS],
];

export default function CompanyPage() {
  return (
    <SubPage current="/company">
      <PageHero
        index="04" en="Company"
        ja={[["現場を、"], [{ text: "止めないために。", em: true }]]}
        lead="現場を止めないために、できることを。T-REXの理念と会社情報をご紹介します。"
        image={{ src: "/company-hero-bg.webp", width: 1916, height: 821, position: "50% 50%" }}
        imageAlt="城と街並みを背にしたT-REXのマスコットのブループリント"
      />

      <section className={`${site.section} ${site.light} ${site.lift}`} data-surface="light" aria-labelledby="mission-title">
        <p className={site.label}><span>(01)</span>Our Mission — 理念</p>
        <h2 id="mission-title" className={site.srOnly}>理念</h2>
        <p className={sub.statement} data-x-words>
          現場を止めない。そのために、できることを。
          T-REXは、お客様の課題に真摯に向き合い、スピード・品質・安全のすべてに妥協しません。
        </p>
      </section>

      <section className={site.section} aria-labelledby="values-title">
        <div className={site.head}>
          <p className={site.label}><span>(02)</span>Our Values — 仕事の基準</p>
          <h2 id="values-title" className={site.h2} data-x-split>仕事の、<br /><em>基準。</em></h2>
        </div>
        <div className={`${sub.cards} ${sub.cards4}`} data-x-reveal="stagger">
          {values.map(([n, en, title, desc, icon]) => (
            <article className={sub.card} key={n}>
              <div className={sub.cardHead}><span className={sub.cardNum}>{n}</span><Icon name={icon} className={sub.cardIcon} /></div>
              <p className={sub.cardEn} aria-hidden="true">{en}</p>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${site.section} ${site.light} ${site.lift}`} data-surface="light" aria-labelledby="message-title">
        <div className={sub.split}>
          <figure className={`${sub.figure} ${sub.sticky}`} data-x-clip>
            <Image src="/company-profile-bg.webp" alt="" width={1024} height={1536} sizes="(max-width: 899px) 100vw, 40vw" />
          </figure>
          <div>
            <p className={site.label}><span>(03)</span>Message — 代表あいさつ</p>
            <h2 id="message-title" className={site.h2} style={{ margin: "24px 0 40px" }} data-x-split>誠実に、<br /><em>確かに。</em></h2>
            <blockquote className={sub.quote} data-x-reveal>
              <p>現場で生まれる一つひとつの課題に誠実に向き合い、確かな技術と迅速な対応で、お客様の仕事を支えてまいります。</p>
            </blockquote>
            <p className={sub.sign} data-x-reveal><span>代表 中津留 龍也</span><small>Representative</small></p>
          </div>
        </div>
      </section>

      <section className={site.section} aria-labelledby="profile-title">
        <div className={site.head}>
          <p className={site.label}><span>(04)</span>Profile — 会社情報</p>
          <h2 id="profile-title" className={site.h2} data-x-split>会社情報</h2>
        </div>
        <dl className={sub.table} data-x-reveal="stagger">
          {profile.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}
        </dl>
        <div className={sub.pair} data-x-reveal="stagger">
          <div>
            <Icon name="location-pin" className={sub.pairIcon} />
            <h3>営業・対応範囲</h3>
            <p>福岡県・山口県を中心に、その他の地域も可能な限り対応します。出張修理・持込修理ともに可能です。</p>
          </div>
          <div>
            <Icon name="gear-technology" className={sub.pairIcon} />
            <h3>主な取引先業種</h3>
            <p>建設機械リース会社、解体業、建設業、土木業、運送業</p>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
