import type { Metadata } from "next";
import Link from "next/link";
import { ArrowGlyph, Icon, PhoneGlyph } from "../components/trx/Icon";
import PageHero from "../components/trx/PageHero";
import SubPage from "../components/trx/SubPage";
import { HOURS, TEL, TEL_HREF } from "../components/trx/site";
import site from "../components/trx/site.module.css";
import sub from "../components/trx/sub.module.css";

export const metadata: Metadata = {
  title: "採用情報|福岡・山口 T-REX",
  description: "福岡県・山口県の現場を支えるT-REXの採用情報。管理・作業、鈑金・塗装、出張サービス、事務サポートの各職種を募集中。未経験者歓迎、技術を身につけながら働ける環境です。",
  alternates: { canonical: "/recruit/" },
  openGraph: {
    title: "採用情報|T-REX CO., LTD.",
    description: "一緒に、現場の未来をつくろう。T-REX採用情報。",
    images: ["/recruit-hero-bg.webp"],
  },
};

const jobs = [
  ["01", "管理士・作業スタッフ", "Site Crew", "現場の安全・管理・調整・記録など、作業が円滑に進むよう現場を支える仕事です。", "shield-safety"],
  ["02", "鈑金・塗装スタッフ", "Body & Paint", "鈑金・塗装作業や仕上げ作業など、確かな技術で車両や機械をよみがえらせます。", "spray-gun"],
  ["03", "出張サービススタッフ", "Field Service", "お客様の現場へ出向き、点検・修理・作業サポートを行います。", "rapid-response-tools"],
  ["04", "事務・サポートスタッフ", "Office Support", "経理業務・見積作成・書類作成など、現場と会社を内側から支えます。", "estimate-document"],
] as const;

export default function RecruitPage() {
  return (
    <SubPage current="/recruit" footerCta={false}>
      <PageHero
        index="05" en="Recruit"
        ja={[["一緒に、"], [{ text: "現場の未来をつくろう。", em: true }]]}
        lead="T-REXは、現場を支える仲間を募集しています。未経験者も大歓迎。技術を身につけながら、自分らしく働ける環境です。"
        image={{ src: "/recruit-hero-bg.webp", width: 1916, height: 821, position: "50% 45%" }}
        imageAlt="重機と街並みを背にしたT-REXのマスコットのブループリント"
      >
        <a className={`${site.pill} ${site.pillGhost}`} href="#positions">
          募集職種を見る<ArrowGlyph className={site.pillArrow} />
        </a>
      </PageHero>

      <section className={`${site.section} ${site.light} ${site.lift}`} id="positions" data-surface="light" aria-labelledby="positions-title">
        <div className={site.head}>
          <p className={site.label}><span>(01)</span>Open Positions — 募集職種</p>
          <h2 id="positions-title" className={site.h2} data-x-split>経験よりも、<br /><em>前向きな姿勢を。</em></h2>
          <p className={site.lead} data-x-reveal>専門的な知識や技術は、入社してから身につけられます。4つの職種で仲間を募集しています。</p>
        </div>
        <div className={sub.cards} data-x-reveal="stagger">
          {jobs.map(([n, title, en, desc, icon]) => (
            <article className={sub.card} key={n}>
              <div className={sub.cardHead}><span className={sub.cardNum}>{n}</span><Icon name={icon} className={sub.cardIcon} /></div>
              <p className={sub.cardEn} aria-hidden="true">{en}</p>
              <h3>{title}</h3>
              <p>{desc}</p>
              <a className={sub.rowLink} href="#entry">この職種について問い合わせる<ArrowGlyph /></a>
            </article>
          ))}
        </div>
      </section>

      <section className={site.section} aria-labelledby="message-title">
        <p className={site.label}><span>(02)</span>Message — メッセージ</p>
        <h2 id="message-title" className={site.srOnly}>現場の力に、確かな技術を。</h2>
        <p className={sub.statement} data-x-words>
          現場の力に、確かな技術を。
          大切なのは、目の前の仕事に真剣に向き合うこと。仲間と力を合わせ、お客様の「困った」に応える仕事を一緒に始めませんか。
        </p>
        <p className={sub.sign} data-x-reveal><span>T-REX CO., LTD.</span></p>
      </section>

      <section className={`${site.section} ${site.light} ${site.lift}`} id="entry" data-surface="light" aria-labelledby="entry-title">
        <div className={sub.entry}>
          <p className={site.label}><span>(03)</span>Entry — 採用に関するお問い合わせ</p>
          <h2 id="entry-title" className={site.h2} data-x-split>まずは、<br /><em>話を聞きに。</em></h2>
          <p className={site.lead} data-x-reveal>募集状況や仕事内容について、お気軽にご連絡ください。</p>
          <a className={sub.telBig} href={TEL_HREF} data-x-reveal><PhoneGlyph />{TEL}</a>
          <p className={sub.formNote}>電話受付 {HOURS}</p>
          <div className={sub.entryActions}>
            <Link className={site.pill} href="/contact" data-x-magnetic>
              お問い合わせフォームへ<ArrowGlyph className={site.pillArrow} />
            </Link>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
