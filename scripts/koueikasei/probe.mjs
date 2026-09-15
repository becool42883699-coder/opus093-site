#!/usr/bin/env node
/**
 * koueikasei.jp への到達性チェック。
 * このセッションの egress ポリシーで対象ドメインが許可されたかを判定する。
 *   node scripts/koueikasei/probe.mjs
 * 終了コード 0 = 到達可能 / 1 = 遮断中
 */
const TARGET = process.env.KK_TARGET || "https://koueikasei.jp/";
const host = new URL(TARGET).host;

const res = await fetch(TARGET, { redirect: "follow" }).catch((e) => e);

if (res instanceof Error) {
  const cause = res.cause?.message || res.message;
  console.log(`BLOCKED  ${host}  (${cause})`);
  console.log("\n環境の Network access を Custom + Allowed domains に koueikasei.jp を追加し、");
  console.log("新しいセッションを開始してください（詳細は scripts/koueikasei/README.md）。");
  process.exit(1);
}

console.log(`REACHABLE  ${host}  HTTP ${res.status}  ${res.headers.get("content-type") || ""}`);
const body = await res.text();
console.log(`body: ${body.length} bytes`);
process.exit(0);
