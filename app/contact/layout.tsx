import type { Metadata } from "next";
import { JsonLd, SITE_URL } from "../components/TrmSeo";

export const metadata: Metadata = {
  title: "お問い合わせ|福岡・山口 T-REX",
  description: "福岡県・山口県対応のT-REXへのお問い合わせ。板金塗装・荷台換装/修理・出張修理・車両陸送のご相談は電話(090-7531-5428)またはフォームからお気軽にどうぞ。",
  alternates: { canonical: "/contact/" },
  openGraph: { title: "お問い合わせ|T-REX CO., LTD.", description: "修理・施工・出張対応のご相談窓口。", images: ["/contact-hero-bg.webp"] },
};

/* FAQはcontactページの表示文言と同一内容(差し替え時は両方更新) */
export const faq = [
  ["出張対応エリアはどこまでですか?", "福岡県・山口県を中心に対応しています。その他の地域も可能な限り対応しますので、まずはお気軽にご相談ください。"],
  ["車両や機械の持込修理はできますか?", "可能です。持込修理・出張修理のどちらにも対応しています。状態やご都合に合わせて最適な方法をご提案します。"],
  ["見積りは無料ですか?", "はい、お見積りは無料です。お電話またはお問い合わせフォームから、車両・機械の状態と症状をお知らせください。"],
];

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "トップ", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "お問い合わせ", item: `${SITE_URL}/contact/` },
      ],
    }} />
    {children}
  </>;
}
