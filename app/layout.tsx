import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { JsonLd, localBusinessLd, SITE_URL } from "./components/TrmSeo";

/* ビルド時に自己ホスト化されるためランタイムのCDN依存はない */
const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700", "900"], variable: "--font-noto", display: "swap" });
/* 欧文のディスプレイ書体。幅(wdth)軸を持つ可変フォントなので、コンデンスの見出しと
   通常幅の数字を1ファイルで賄える */
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
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
      <body className={`${notoSansJp.variable} ${archivo.variable} ${jetbrainsMono.variable}`}>{children}<JsonLd data={localBusinessLd} /></body>
    </html>
  );
}
