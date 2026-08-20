/**
 * /tomoshibi — サーバーコンポーネントの薄い包み。metadata を持たせるためだけに分けている。
 * 中身は TomoshibiLP.tsx("use client")。
 *
 * ブランド・住所・施工事例・お客様の声はすべて仮の値なので、
 * 実在の工務店として検索結果に出ないよう noindex を明示している。
 */
import type { Metadata } from "next";
import TomoshibiLP from "./TomoshibiLP";

export const metadata: Metadata = {
  title: "灯家 -TOMOSHIBI-|暮らしに合わせて、住まいを仕立てる。",
  description:
    "北九州の気候と土地を読み、家族の10年後まで設計する工務店です。灯家 -TOMOSHIBI- の注文住宅ランディングページ(デザイン確認用のサンプル)。",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TomoshibiLP />;
}
