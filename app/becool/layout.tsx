import type { Metadata } from "next";
import { Exo_2, Montserrat, Noto_Sans_JP } from "next/font/google";
import "./tokens.css";

const exo = Exo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-exo", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500"], variable: "--font-montserrat", display: "swap" });
const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto", display: "swap" });

export const metadata: Metadata = {
  title: "GARAGE BeCool｜北九州の中古車販売・買取・車検・整備｜SINCE 1999",
  description:
    "GARAGE BeCool（有限会社ビークール）は福岡県北九州市小倉南区の地域密着型カーショップ。中古車販売・買取・車検・整備・メンテナンスまで、カーライフをトータルでサポートします。沼店・中吉田店の2店舗。",
  alternates: { canonical: "/becool" },
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/becool/img/symbol.svg` },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "GARAGE BeCool",
    title: "GARAGE BeCool｜北九州の中古車販売・買取・車検・整備",
    description:
      "福岡県北九州市小倉南区の中古車販売・整備店 GARAGE BeCool。中古車販売・買取・車検・整備・メンテナンスまで、カーライフをトータルでサポート。",
    images: ["/becool/img/photo-porsche.webp"],
  },
};

export default function BecoolLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${exo.variable} ${montserrat.variable} ${noto.variable}`}>{children}</div>;
}
