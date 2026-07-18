import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./service.module.css";
import { SubFooter, SubHeader, SubHero } from "../components/SubpageShell";
import { JsonLd, SITE_URL } from "../components/TrmSeo";

export const metadata: Metadata = {
  title: "事業案内|福岡・山口の板金塗装/出張修理 T-REX",
  description: "福岡県・山口県対応。板金塗装、荷台修理・架装、出張修理、事故対応・保険修理、メンテナンス・点検、車両陸送・軽運送の6事業をワンストップで提供するT-REXの事業案内です。",
  alternates: { canonical: "/service/" },
  openGraph: { title: "事業案内|T-REX CO., LTD.", description: "福岡・山口対応の6つの事業をご案内。", images: ["/service-hero-bg.webp"] },
};

const services = [
  ["01", "板金塗装", "高品質な塗装で、美しく\n強い仕上がりへ。", "spray-gun"],
  ["02", "荷台修理・架装", "用途に応じた設計で\n作業効率と安全性を向上。", "cargo-conversion"],
  ["03", "出張修理サービス", "現場へ駆けつけ、迅速に\nトラブルを解決します。", "mobile-repair-truck"],
  ["04", "事故対応・保険修理", "事故後の対応も安心。\n保険修理までサポート。", "shield-confirm"],
  ["05", "メンテナンス・点検", "定期点検でトラブルを\n未然に防ぎます。", "inspection-tools"],
  ["06", "車両陸送・軽運送", "安全・確実な車両輸送と\n軽貨物運送を行います。", "rapid-response-tools"],
] as const;

export default function ServicePage() {
  return (
    <>
      <SubHeader active="/service" />
      <JsonLd data={services.map(([, title, description]) => ({
        "@context": "https://schema.org", "@type": "Service", name: title,
        description: description.replace("\n", ""), provider: { "@id": `${SITE_URL}/#business` },
        areaServed: ["福岡県", "山口県"],
      }))} />

      <main className={styles.page}>
        <SubHero en="SERVICE / OUR BUSINESS" ja="事業案内" lead="福岡県・山口県の現場を支える6つの事業。板金塗装から車両陸送まで、確かな技術でワンストップ対応します。" bg="/service-hero-bg.webp" bgFit="contain" />

        <section className={styles.cardsBand} aria-label="T-REXの6つの事業">
          <span className={styles.sideTab} aria-hidden="true">NEVER STOP THE SITE</span>
          <div className={styles.cardsGrid}>
            {services.map(([number, title, description, icon]) => (
              <Link className={styles.card} href="/contact" key={number}>
                <Image className={styles.cardIcon} src={`/icons/${icon}.svg`} alt="" width={96} height={76} />
                <b>{number}</b>
                <h2>{title}</h2>
                <p>{description}</p>
                <span>詳しく見る <i>→</i></span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.skyline} aria-label="お問い合わせへのご案内">
          <Image src="/service-skyline.webp" alt="北九州の街並みを描いたT-REXブループリント" width={1536} height={172} sizes="100vw" />
          <Link className={styles.skylineLink} href="/contact" aria-label="事業内容について問い合わせる" />
        </section>
      </main>

      <SubFooter />
    </>
  );
}
