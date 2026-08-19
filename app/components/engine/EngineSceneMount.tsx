"use client";

/* WebGLシーンはSSRしない(初期HTMLに載せる意味がなく、three も初期バンドルに要らない)。
   4幕のコピー・ラベル・諸元は app/engine/page.tsx がサーバー側で出しているので、
   ここが読み込まれなくてもページの中身は全部読める。 */

import dynamic from "next/dynamic";

const EngineScene = dynamic(() => import("./EngineScene"), { ssr: false });

export default function EngineSceneMount() {
  return <EngineScene />;
}
