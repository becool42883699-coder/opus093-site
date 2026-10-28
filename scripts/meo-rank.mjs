// GARAGE BeCool の MEO（Googleマップ検索順位）と競合を Places API (New) で調べる。
//
//   GOOGLE_MAPS_API_KEY=... node scripts/meo-rank.mjs
//   node scripts/meo-rank.mjs --dry-run      # キー無しで、検索する地点・言葉と呼び出し回数だけ出す
//
// 各地点に「その辺りにいる人が検索した」形で円(半径1km)の位置バイアスを掛け、
// キーワードごとの上位60件を取って自店の順位を数える。広告枠は含まれない。
// Googleマップアプリの表示順とは多少ずれることがあるので、傾向を見る用途に使う。
// 出力は artifacts/meo/<日付>/ （.gitignore 済み）。

import { mkdir, writeFile } from "node:fs/promises";

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const DRY = process.argv.includes("--dry-run");
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// 自店。Google 上の掲載名が分からないので、住所の一部で照合して place id を確定させる。
const SHOPS = [
  { key: "nakayoshida", label: "中吉田店", query: "GARAGE BeCool 中吉田", addrMatch: "中吉田" },
  { key: "numa", label: "沼店", query: "GARAGE BeCool 沼本町", addrMatch: "沼本町" },
];
const OWN_NAME = /be\s*cool|ビー\s*クール|ビークール/i;

const KEYWORDS = [
  "中古車",
  "中古車販売",
  "車 買取",
  "車検",
  "車 整備",
  "自動車修理",
  "車 カスタム",
  "オイル交換",
];

// 店の周り以外に、人が集まる場所からの検索も見る。座標は API で引く。
const LANDMARKS = ["守恒駅", "志井公園駅", "下曽根駅", "城野駅", "石田駅", "朽網駅", "小倉駅", "小倉南区役所"];

// 店を中心に 2km 四方の8方位も見る。
const RING_KM = 2;
const BIAS_RADIUS_M = 1000;
const MAX_PAGES = 3; // 20件 × 3 = 上位60件まで

const RANK_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "places.websiteUri",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");
const LOCATE_FIELDS = "places.id,places.displayName,places.formattedAddress,places.location";
const SHOP_FIELDS = `${LOCATE_FIELDS},places.rating,places.userRatingCount,places.primaryTypeDisplayName`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchText(body, fieldMask) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": fieldMask },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const text = await res.text();
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * 2 ** attempt);
      continue;
    }
    throw new Error(`Places API ${res.status}: ${text}`);
  }
  throw new Error("Places API: retries exhausted");
}

function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function offset(center, km, bearingDeg) {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (km * Math.cos(rad)) / 111.32;
  const dLng = (km * Math.sin(rad)) / (111.32 * Math.cos((center.latitude * Math.PI) / 180));
  return { latitude: center.latitude + dLat, longitude: center.longitude + dLng };
}

const KITAKYUSHU_SOUTH = { latitude: 33.835, longitude: 130.9 }; // 小倉南区のおおよその中心（照合時の位置バイアス用）

async function locateShops() {
  const found = [];
  for (const shop of SHOPS) {
    const data = await searchText(
      {
        textQuery: shop.query,
        languageCode: "ja",
        regionCode: "JP",
        locationBias: { circle: { center: KITAKYUSHU_SOUTH, radius: 15000 } },
      },
      SHOP_FIELDS,
    );
    const hit = (data.places ?? []).find(
      (p) => p.formattedAddress?.includes(shop.addrMatch) && OWN_NAME.test(p.displayName?.text ?? ""),
    ) ?? (data.places ?? []).find((p) => p.formattedAddress?.includes(shop.addrMatch));
    if (!hit) {
      console.warn(`! ${shop.label} を Google 上で特定できなかった（"${shop.query}"）。名前の一致だけで順位を数える。`);
      continue;
    }
    console.log(`✓ ${shop.label}: ${hit.displayName.text} / ${hit.formattedAddress}`);
    found.push({ ...shop, id: hit.id, name: hit.displayName.text, location: hit.location, place: hit });
  }
  return found;
}

async function locateLandmarks() {
  const out = [];
  for (const name of LANDMARKS) {
    const data = await searchText(
      { textQuery: `${name} 北九州市`, languageCode: "ja", regionCode: "JP", pageSize: 1 },
      LOCATE_FIELDS,
    );
    const p = data.places?.[0];
    if (p?.location) out.push({ label: name, location: p.location });
    else console.warn(`! ${name} の座標が取れなかった`);
  }
  return out;
}

function buildPoints(shops, landmarks) {
  const pts = [];
  const dirs = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  for (const s of shops) {
    pts.push({ label: `${s.label}（店の前）`, location: s.location });
    dirs.forEach((d, i) => pts.push({ label: `${s.label}の${d}${RING_KM}km`, location: offset(s.location, RING_KM, i * 45) }));
  }
  for (const l of landmarks) pts.push(l);
  return pts;
}

async function rankAt(point, keyword) {
  const results = [];
  let pageToken;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await searchText(
      {
        textQuery: keyword,
        languageCode: "ja",
        regionCode: "JP",
        pageSize: 20,
        locationBias: { circle: { center: point.location, radius: BIAS_RADIUS_M } },
        ...(pageToken ? { pageToken } : {}),
      },
      RANK_FIELDS,
    );
    results.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
    await sleep(300);
  }
  return results;
}

function summarize(shops, points, runs) {
  const ownIds = new Set(shops.map((s) => s.id));
  const isOwn = (p) => ownIds.has(p.id) || OWN_NAME.test(p.displayName?.text ?? "");
  const lines = [];
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`# GARAGE BeCool MEO 調査（${date}）`, "");
  lines.push(
    "Places API (New) の Text Search で、各地点に半径1kmの位置バイアスを掛けて上位60件を取得。",
    "広告枠は含まない。Googleマップアプリの表示順とは多少ずれることがある。「圏外」は上位60件に無いこと。",
    "",
  );

  // 1. 自店の順位表（キーワード × 地点）
  lines.push("## 自店の順位", "");
  lines.push(`| 地点 | ${KEYWORDS.join(" | ")} |`, `|---|${KEYWORDS.map(() => "---").join("|")}|`);
  for (const pt of points) {
    const cells = KEYWORDS.map((kw) => {
      const list = runs.find((r) => r.point === pt.label && r.keyword === kw)?.places ?? [];
      const ranks = list.map((p, i) => (isOwn(p) ? i + 1 : null)).filter(Boolean);
      return ranks.length ? ranks.map((r) => `${r}位`).join("/") : "圏外";
    });
    lines.push(`| ${pt.label} | ${cells.join(" | ")} |`);
  }
  lines.push("");

  // 2. 競合の集計（上位10件に何回出たか）
  const comp = new Map();
  for (const run of runs) {
    run.places.slice(0, 10).forEach((p, i) => {
      if (isOwn(p)) return;
      const c = comp.get(p.id) ?? { place: p, top3: 0, top10: 0, rankSum: 0, keywords: new Set() };
      c.top10++;
      if (i < 3) c.top3++;
      c.rankSum += i + 1;
      c.keywords.add(run.keyword);
      comp.set(p.id, c);
    });
  }
  const ranked = [...comp.values()].sort((a, b) => b.top3 - a.top3 || b.top10 - a.top10).slice(0, 30);
  lines.push("## 競合（上位10件への登場回数が多い順・上位30）", "");
  lines.push("| 店名 | 上位3回数 | 上位10回数 | 平均順位 | 評価 | 口コミ数 | 業種 | 中吉田店から | 出たキーワード |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  const base = shops[0]?.location;
  for (const c of ranked) {
    const p = c.place;
    const dist = base && p.location ? `${haversineKm(base, p.location).toFixed(1)}km` : "-";
    lines.push(
      `| [${p.displayName?.text}](${p.googleMapsUri}) | ${c.top3} | ${c.top10} | ${(c.rankSum / c.top10).toFixed(1)} | ${p.rating ?? "-"} | ${p.userRatingCount ?? 0} | ${p.primaryTypeDisplayName?.text ?? "-"} | ${dist} | ${[...c.keywords].join("、")} |`,
    );
  }
  lines.push("");

  // 3. 自店の掲載情報
  lines.push("## 自店の掲載情報", "");
  for (const s of shops) {
    const p = s.place;
    lines.push(`- ${s.label}: ${s.name} / 評価 ${p?.rating ?? "-"} / 口コミ ${p?.userRatingCount ?? 0}件 / 業種 ${p?.primaryTypeDisplayName?.text ?? "-"}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const perRank = MAX_PAGES;
  const plannedPoints = SHOPS.length * 9 + LANDMARKS.length;
  const maxCalls = SHOPS.length + LANDMARKS.length + plannedPoints * KEYWORDS.length * perRank;
  console.log(`地点 ${plannedPoints} × キーワード ${KEYWORDS.length}、API 呼び出しは最大 ${maxCalls} 回`);
  if (DRY) {
    console.log("キーワード:", KEYWORDS.join(" / "));
    console.log("目印の地点:", LANDMARKS.join(" / "));
    return;
  }
  if (!KEY) {
    console.error("GOOGLE_MAPS_API_KEY が設定されていない。");
    process.exit(1);
  }

  const shops = await locateShops();
  if (!shops.length) throw new Error("自店を1件も特定できなかった。SHOPS の query を Google 上の掲載名に合わせる。");
  const landmarks = await locateLandmarks();
  const points = buildPoints(shops, landmarks);

  const runs = [];
  for (const pt of points) {
    for (const kw of KEYWORDS) {
      process.stdout.write(`  ${pt.label} / ${kw} … `);
      const places = await rankAt(pt, kw);
      runs.push({ point: pt.label, location: pt.location, keyword: kw, places });
      console.log(`${places.length}件`);
      await sleep(200);
    }
  }

  const dir = `artifacts/meo/${new Date().toISOString().slice(0, 10)}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/raw.json`, JSON.stringify({ shops, points, keywords: KEYWORDS, runs }, null, 2));
  await writeFile(`${dir}/summary.md`, summarize(shops, points, runs));
  console.log(`\n→ ${dir}/summary.md と raw.json に保存した`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
