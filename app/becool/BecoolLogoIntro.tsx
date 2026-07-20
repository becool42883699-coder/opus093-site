"use client";

/**
 * GARAGE BeCool ヒーローのロゴビルド・イントロ(プロトタイプv2「精密組立版」)。
 * タイムラインは純CSS(becool.module.css)で駆動する。このコンポーネントは
 * 「初回のみ再生」のゲートだけを担う軽量クライアント部品:
 *   - prefers-reduced-motion / 同一セッション2回目以降: data-intro="done"
 *     (CSSが最終ロゴ=筆記体を即表示)
 *   - 初回訪問: data-intro="play" を維持し、CSSアニメが1回再生される
 * JS/CSS不達時も最終ロゴが残るよう、SVGの既定状態は最終ロゴ表示。
 */

import { useEffect } from "react";

const PLAYED_KEY = "bc-hero-intro-played";

export default function BecoolLogoIntro() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
    if (!stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let played = false;
    try { played = !!sessionStorage.getItem(PLAYED_KEY); } catch { /* private mode */ }

    if (reduce || played) {
      stage.setAttribute("data-intro", "done"); // 最終ロゴを(短フェードで)表示
      return;
    }

    // 初回のみ: data-intro="play" のままCSSタイムラインに任せる
    try { sessionStorage.setItem(PLAYED_KEY, "1"); } catch { /* ignore */ }
  }, []);

  return null;
}
