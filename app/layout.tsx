import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "T-REX CO., LTD. | 現場を止めない、圧倒的な力。",
  description: "板金塗装・荷台改装・出張修理まで。現場の困ったに応えるT-REX。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
