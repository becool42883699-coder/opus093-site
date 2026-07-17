import type { Metadata } from "next";
import "./globals.css";
import TrmFx from "./components/TrmFx";

export const metadata: Metadata = {
  title: "T-REX CO., LTD. | 現場を止めない、圧倒的な力。",
  description: "板金塗装・荷台改装・出張修理まで。現場の困ったに応えるT-REX。",
  icons: { icon: "/icons/brand-tx.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}<TrmFx /></body>
    </html>
  );
}
