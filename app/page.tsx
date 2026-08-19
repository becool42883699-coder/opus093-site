/**
 * / — サーバーコンポーネントの薄い包み。metadata / OGP を持たせるためだけに分けている。
 * 中身(4幕エンジン体験 + 従来の各セクション)は TopPage.tsx("use client")。
 */

import type { Metadata } from "next";
import { breadcrumbLd, JsonLd, SITE_URL } from "./components/TrmSeo";
import TopPage from "./TopPage";

const DESC =
  "T-REX CO., LTD.は福岡県・山口県対応の板金塗装・荷台換装/修理・出張修理・車両陸送の専門会社。トップページではエンジンオーバーホールの工程を4幕のリアルタイム3Dで公開しています。現場を止めない迅速対応。";

export const metadata: Metadata = {
  title: "T-REX — 現場を、止めない。",
  description: DESC,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "T-REX CO., LTD.",
    url: `${SITE_URL}/`,
    title: "T-REX — 現場を、止めない。",
    description: DESC,
    images: [{ url: "/og-top-engine.jpg", width: 1200, height: 630, alt: "T-REX TRX-4 オーバーホール — 第4幕「始動」のリアルタイム3D" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "T-REX — 現場を、止めない。",
    description: DESC,
    images: ["/og-top-engine.jpg"],
  },
};

/* 旧 /engine を / に一本化したので、パンくずは「トップ」1階層だけ。 */
const topLd = {
  ...breadcrumbLd("トップ", ""),
  itemListElement: [{ "@type": "ListItem", position: 1, name: "トップ", item: `${SITE_URL}/` }],
};

export default function Page() {
  return (
    <>
      <TopPage />
      <JsonLd data={topLd} />
    </>
  );
}
