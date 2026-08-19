"use client";

import { useEffect } from "react";

/* 履歴に残さず / へ置き換える。meta refresh より先に効く。 */
export default function EngineRedirect() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    window.location.replace(`${base}/`);
  }, []);
  return null;
}
