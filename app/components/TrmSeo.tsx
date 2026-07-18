/**
 * TrmSeo — SEO/MEO/LLMO用の共通定数とJSON-LDコンポーネント
 * SITE_URL を独自ドメインに変えれば canonical/OGP/構造化データが一括で切り替わる
 */

export const SITE_URL = "https://becool42883699-coder.github.io/opus093-site";

export const BIZ = {
  name: "T-REX CO., LTD.",
  phone: "+81-90-7531-5428",
  email: "info@t-rex-works.com",
  areas: ["福岡県", "山口県"],
  hours: "Mo,Tu,We,Th,Fr 09:00-18:00",
};

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export const localBusinessLd = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "@id": `${SITE_URL}/#business`,
  name: BIZ.name,
  url: `${SITE_URL}/`,
  telephone: BIZ.phone,
  email: BIZ.email,
  image: `${SITE_URL}/hero-trex-construction-final.webp`,
  areaServed: BIZ.areas.map((name) => ({ "@type": "AdministrativeArea", name })),
  address: { "@type": "PostalAddress", addressRegion: "福岡県", addressCountry: "JP" },
  openingHours: BIZ.hours,
  description: "福岡県・山口県対応の板金塗装・荷台換装/修理・出張修理・車両陸送。現場を止めない迅速対応のT-REX。",
};

export function breadcrumbLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}/` },
    ],
  };
}
