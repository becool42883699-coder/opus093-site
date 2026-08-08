import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";
import TrmFx from "./components/TrmFx";
import { JsonLd, localBusinessLd, SITE_URL } from "./components/TrmSeo";

/* ビルド時に自己ホスト化されるためランタイムのCDN依存はない */
const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-grotesk", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "T-REX CO., LTD.|福岡・山口の板金塗装/出張修理",
  description: "T-REX CO., LTD.は福岡県・山口県対応の板金塗装・荷台換装/修理・出張修理・車両陸送の専門会社。現場を止めない迅速対応で建設・土木・運送業を支えます。",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "ja_JP", siteName: "T-REX CO., LTD.",
    title: "T-REX CO., LTD.|福岡・山口の板金塗装/出張修理",
    description: "福岡県・山口県対応。板金塗装・荷台換装・出張修理・車両陸送。現場を止めない迅速対応のT-REX。",
    images: ["/hero-trex-construction-final.webp"],
  },
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/brand-tx.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>{children}<TrmFx /><JsonLd data={localBusinessLd} /></body>
    </html>
  );
}
