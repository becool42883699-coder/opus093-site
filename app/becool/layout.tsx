import type { Metadata } from "next";
import "./tokens.css";

export const metadata: Metadata = {
  title: "Be Cool｜東京のグラフィックデザインスタジオ",
  description:
    "Be Cool は、ロゴ・チラシ・パンフレット・Webサイト・写真撮影までを手がける東京のデザインスタジオ。伝えたい想いを、ともにカタチにします。",
  alternates: { canonical: "/becool" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Be Cool",
    title: "Be Cool｜東京のグラフィックデザインスタジオ",
    description:
      "ロゴ・チラシ・パンフレット・Webサイト・写真撮影まで。伝えたい想いを、ともにカタチにするデザインスタジオ Be Cool。",
    images: ["/becool/img/hero.svg"],
  },
};

export default function BecoolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
