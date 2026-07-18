import type { Metadata } from "next";

/* /about は /company へ統合済みのリダイレクトページ。検索結果には出さない */
export const metadata: Metadata = {
  title: "会社概要へ移動|T-REX CO., LTD.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/company/" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
