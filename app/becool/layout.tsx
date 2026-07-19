import type { Metadata } from "next";
import { Exo_2, Montserrat, Noto_Sans_JP } from "next/font/google";
import "./tokens.css";

const exo = Exo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-exo", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500"], variable: "--font-montserrat", display: "swap" });
const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto", display: "swap" });

export const metadata: Metadata = {
  title: "garage becool｜クルマのカスタム・整備・板金塗装｜SINCE 1999",
  description:
    "garage becool は1999年創業のカーガレージ。カスタム・メンテナンス・板金塗装・車検まで、クルマを楽しむすべてをサポートします。",
  alternates: { canonical: "/becool" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "garage becool",
    title: "garage becool｜クルマのカスタム・整備・板金塗装｜SINCE 1999",
    description:
      "1999年創業のカーガレージ garage becool。カスタム・整備・板金塗装・車検まで、クルマのある毎日をかっこよく。",
    images: ["/becool/img/logo.svg"],
  },
};

export default function BecoolLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${exo.variable} ${montserrat.variable} ${noto.variable}`}>{children}</div>;
}
