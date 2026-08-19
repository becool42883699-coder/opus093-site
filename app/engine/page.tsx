import type { Metadata } from "next";
import Link from "next/link";
import EngineRedirect from "./EngineRedirect";

/* 旧 /engine は残さない。4幕のエンジン体験はトップページ(/)に移した。
   静的エクスポートのため next.config の redirects は効かないので、
   canonical + クライアント側の置換 + ビルド後に差し込む meta refresh
   (scripts/postprocess-pages.mjs)の3段で / へ送る。 */

export const metadata: Metadata = {
  title: "TRX-4 オーバーホール | T-REX CO., LTD.",
  description: "エンジンオーバーホールの4幕はトップページへ移動しました。",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function EngineMoved() {
  return (
    <main className="movedPage">
      <p>このページはトップへ移動しました。</p>
      <Link href="/">T-REX トップへ</Link>
      <EngineRedirect />
    </main>
  );
}
