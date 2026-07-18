import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./recruit.module.css";
import { SubHero } from "../components/SubpageShell";
import TrmMotion from "../components/TrmMotion";
import TrmMenu from "../components/TrmMenu";

export const metadata: Metadata = {
  title: "採用情報 | T-REX CO., LTD.",
  description: "T-REXの採用情報。現場を支える仲間を募集しています。未経験者も歓迎します。",
  openGraph: {
    title: "採用情報 | T-REX CO., LTD.",
    description: "一緒に、現場の未来をつくろう。T-REX採用情報。",
  },
};

const jobs = [
  {
    number: "01",
    title: "管理士・作業スタッフ",
    description: "現場の安全・管理・調整・記録など、作業が円滑に進むよう現場を支える仕事です。",
    icon: "/icons/shield-safety.svg",
  },
  {
    number: "02",
    title: "鈑金・塗装スタッフ",
    description: "鈑金・塗装作業や仕上げ作業など、確かな技術で車両や機械をよみがえらせます。",
    icon: "/icons/spray-gun.svg",
  },
  {
    number: "03",
    title: "出張サービススタッフ",
    description: "お客様の現場へ出向き、点検・修理・作業サポートを行います。",
    icon: "/icons/rapid-response-tools.svg",
  },
  {
    number: "04",
    title: "事務・サポートスタッフ",
    description: "経理業務・見積作成・書類作成など、現場と会社を内側から支えます。",
    icon: "/icons/estimate-document.svg",
  },
];

export default function RecruitPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <TrmMotion />
        <Link className={styles.brand} href="/" aria-label="T-REX トップページへ">
          <Image src="/icons/brand-tx.svg" alt="" width={46} height={46} />
          <span><strong>T-REX</strong><small>T-REX CO., LTD.</small></span>
        </Link>
        <nav aria-label="採用ページナビゲーション">
          <Link href="/">トップへ戻る</Link>
          <a className={styles.headerCta} href="tel:09075315428">電話で応募</a>
        </nav>
        <TrmMenu />
      </header>

      <SubHero
        bg="/recruit-hero-bg.webp"
        en="RECRUIT / 採用情報"
        ja={<>一緒に、<br />現場の未来をつくろう。</>}
        lead={<>T-REXは、現場を支える仲間を募集しています。<br />未経験者も大歓迎。技術を身につけながら、自分らしく働ける環境です。</>}
      >
        <a className={styles.heroCta} href="#positions">募集職種を見る <b aria-hidden="true">↓</b></a>
      </SubHero>

      <section className={styles.intro} id="positions" aria-labelledby="positions-title">
        <div className={styles.sectionHeading}>
          <p>OPEN POSITIONS</p>
          <h2 id="positions-title">募集職種</h2>
          <span>経験よりも、前向きな姿勢を大切にします。</span>
        </div>
        <div className={styles.jobGrid}>
          {jobs.map((job) => (
            <article className={styles.jobCard} key={job.number}>
              <div><span>{job.number}</span><Image src={job.icon} alt="" width={52} height={52} /></div>
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <a href="#entry">この職種について問い合わせる</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.message} aria-labelledby="message-title">
        <p>MESSAGE</p>
        <h2 id="message-title">現場の力に、<br />確かな技術を。</h2>
        <div>
          <p>専門的な知識や技術は、入社してから身につけられます。大切なのは、目の前の仕事に真剣に向き合うこと。仲間と力を合わせ、お客様の「困った」に応える仕事を一緒に始めませんか。</p>
          <strong>T-REX CO., LTD.</strong>
        </div>
      </section>

      <section className={styles.entry} id="entry" aria-labelledby="entry-title">
        <div>
          <p>ENTRY / CONTACT</p>
          <h2 id="entry-title">採用に関するお問い合わせ</h2>
          <span>募集状況や仕事内容について、お気軽にご連絡ください。</span>
        </div>
        <a className={styles.phone} href="tel:09075315428">
          <Image src="/icons/phone.svg" alt="" width={34} height={34} />
          <span><small>電話で問い合わせる</small><strong>090-7531-5428</strong></span>
        </a>
        <Link className={styles.contactLink} href="/contact">お問い合わせフォームへ</Link>
      </section>

      <footer className={styles.footer}>
        <span>© T-REX CO., LTD. All Rights Reserved.</span>
        <Link href="/">トップページへ戻る</Link>
      </footer>
    </main>
  );
}
