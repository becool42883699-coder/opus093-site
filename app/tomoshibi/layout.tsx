/**
 * /tomoshibi — 灯家 -TOMOSHIBI- LP のセグメントレイアウト。
 *
 * ここでしか読まない tomoshibi.css を import することで、Tailwind の preflight を
 * このルートに閉じ込める。フォントは要綱どおり Google Fonts から読む
 * (和文の全サブセットを next/font で自前配布すると woff2 が数百本になるため)。
 */
import type { ReactNode } from "react";
import "./tomoshibi.css";

export default function TomoshibiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* next/font で和文を自前配布すると、Google の unicode-range 分割のせいで
          woff2 が2書体×3ウェイトで数百本 out/ に落ちる(数十MB)。サンプルLP1枚に
          その重さは見合わないので、要綱どおり Google Fonts から読む。
          no-page-custom-font はこのルートに閉じた意図的な選択。 */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
      />
      {children}
    </>
  );
}
