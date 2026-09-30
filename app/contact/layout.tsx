import type { Metadata } from "next";
import { JsonLd } from "../components/TrmSeo";
import { faq } from "./faq";

export const metadata: Metadata = {
  title: "お問い合わせ|福岡・山口 T-REX",
  description: "福岡県・山口県対応のT-REXへのお問い合わせ。板金塗装・荷台換装/修理・出張修理・車両陸送のご相談は電話(090-7531-5428)またはフォームからお気軽にどうぞ。",
  alternates: { canonical: "/contact/" },
  openGraph: { title: "お問い合わせ|T-REX CO., LTD.", description: "修理・施工・出張対応のご相談窓口。", images: ["/contact-hero-bg.webp"] },
};



export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    }} />

    {children}
  </>;
}
