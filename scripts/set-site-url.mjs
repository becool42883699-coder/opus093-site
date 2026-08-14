/**
 * サイトの公開URLを一括で切り替えるスクリプト。
 *
 *   node scripts/set-site-url.mjs https://example.com
 *
 * 独自ドメインに移行するときに実行すれば、canonical / OGP / 構造化データ
 * (app/components/TrmSeo.tsx の SITE_URL 経由) と、静的に持っている
 * sitemap.xml / robots.txt / llms.txt のURLが揃って書き換わる。
 * 現在のURLは TrmSeo.tsx の SITE_URL を正として読み取る。
 */
import { readFileSync, writeFileSync } from "node:fs";

const SEO_FILE = "app/components/TrmSeo.tsx";
const TARGETS = [SEO_FILE, "public/sitemap.xml", "public/robots.txt", "public/llms.txt"];

const nextUrl = process.argv[2]?.replace(/\/+$/, "");
if (!nextUrl) {
  console.error("Usage: node scripts/set-site-url.mjs <https://new-domain>");
  process.exit(1);
}
if (!/^https?:\/\/[^/\s]+$/.test(nextUrl)) {
  console.error(`Invalid URL: ${nextUrl} (例: https://example.com)`);
  process.exit(1);
}

const currentUrl = readFileSync(SEO_FILE, "utf-8").match(/export const SITE_URL = "([^"]+)"/)?.[1];
if (!currentUrl) {
  console.error(`SITE_URL が ${SEO_FILE} に見つかりません。`);
  process.exit(1);
}
if (currentUrl === nextUrl) {
  console.log(`set-site-url: already ${nextUrl} — nothing to do`);
  process.exit(0);
}

for (const file of TARGETS) {
  const source = readFileSync(file, "utf-8");
  const result = source.replaceAll(currentUrl, nextUrl);
  const hits = source.split(currentUrl).length - 1;
  if (result !== source) writeFileSync(file, result);
  console.log(`set-site-url: ${file} — ${hits} occurrence(s)`);
}
console.log(`set-site-url: ${currentUrl} -> ${nextUrl}`);
