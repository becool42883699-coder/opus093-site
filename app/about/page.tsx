"use client";

/* 会社案内は会社概要(/company)へ統合。旧URLからは自動リダイレクトする */

import Link from "next/link";
import { useEffect } from "react";

export default function AboutRedirect() {
  useEffect(() => {
    window.location.replace(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/company/`);
  }, []);
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <p>会社案内は「会社概要」に統合されました。<br />
        <Link href="/company" style={{ color: "#00aeea", textDecoration: "underline" }}>会社概要ページへ移動する</Link>
      </p>
    </main>
  );
}
