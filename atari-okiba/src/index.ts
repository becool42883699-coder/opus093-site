/**
 * あたり置き場 — 自分専用の公開ハブ
 * Cloudflare Workers + R2(ファイル本体) + KV(案件メタ情報)
 *
 * ルーティング:
 *   GET  /                  → /admin へ302
 *   GET  /admin             → 管理画面HTML(ADMIN_TOKENでBasic認証)
 *   *    /api/*             → 管理API(ADMIN_TOKEN + 書き込みはX-Atari-Adminヘッダ必須)
 *   GET  /p/<slug>/...      → 最新版の配信(案件ごとの閲覧パスワード対応)
 *   GET  /p/<slug>/v/<n>/.. → 確定済み過去版の配信
 */
import { ADMIN_HTML } from "./adminHtml";

export interface Env {
  FILES: R2Bucket;
  META: KVNamespace;
  ADMIN_TOKEN?: string;
}

interface VersionInfo {
  version: number;
  fileCount: number;
  uploadedAt: string;
}

interface ProjectAuth {
  salt: string;
  hash: string;
}

interface ProjectMeta {
  slug: string;
  name: string;
  auth: ProjectAuth | null;
  latestVersion: number; // 0 = 未公開
  nextVersion: number; // 次に採番する版番号
  createdAt: string;
  updatedAt: string;
  versions: VersionInfo[]; // 確定済みの版のみ(昇順)
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const MAX_FILE_BYTES = 95 * 1024 * 1024; // プラットフォーム上限100MBの手前
const MAX_NAME_LEN = 100;
const MAX_PASSWORD_LEN = 128;
const MAX_LIST_PROJECTS = 40; // 無料枠のサブリクエスト上限(50)対策

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  bmp: "image/bmp",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  wasm: "application/wasm",
  zip: "application/zip",
  webmanifest: "application/manifest+json; charset=utf-8",
};

// ---------------------------------------------------------------------------
// 共通ユーティリティ
// ---------------------------------------------------------------------------

function contentTypeFor(path: string): string {
  const seg = path.split("/").pop() ?? "";
  const dot = seg.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  const ext = seg.slice(dot + 1).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * アップロード・配信の両方で使う相対パスのサニタイズ。
 * 不正なら null。R2キーに `..` / 空セグメント / 制御文字等が混入する経路を遮断する。
 */
function sanitizeRelPath(input: string): string | null {
  if (typeof input !== "string") return null;
  const p = input.normalize("NFC");
  if (p.length === 0 || p.length > 1024) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(p)) return null;
  if (p.includes("\\")) return null;
  const segs = p.split("/");
  if (segs.length > 40) return null;
  for (const s of segs) {
    if (s === "" || s === "." || s === "..") return null;
    if (s.length > 255) return null;
  }
  return segs.join("/");
}

function r2Key(slug: string, version: number, rel: string): string {
  return `sites/${slug}/v${version}/${rel}`;
}

const projectKey = (slug: string) => `project:${slug}`;

const te = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 定数時間比較。Workersのcrypto.subtle.timingSafeEqualを使い、無ければXOR集約で代替 */
function timingSafeEqualBytes(a: ArrayBuffer, b: ArrayBuffer): boolean {
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (x: ArrayBuffer, y: ArrayBuffer) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function" && a.byteLength === b.byteLength) {
    return subtle.timingSafeEqual(a, b);
  }
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  let diff = va.length === vb.length ? 0 : 1;
  const n = Math.max(va.length, vb.length);
  for (let i = 0; i < n; i++) diff |= (va[i] ?? 0) ^ (vb[i] ?? 0);
  return diff === 0;
}

/** 文字列同士の定数時間比較(長さ差も漏らさないようdigest同士を比較する) */
async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", te.encode(a)),
    crypto.subtle.digest("SHA-256", te.encode(b)),
  ]);
  return timingSafeEqualBytes(da, db);
}

/** Basic認証ヘッダをUTF-8としてデコード */
function decodeBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const m = header.match(/^Basic\s+(.+)$/i);
  if (!m) return null;
  try {
    const bin = atob(m[1].trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

async function makeAuth(password: string): Promise<ProjectAuth> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = [...saltBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = await sha256Hex(`${salt}:${password}`);
  return { salt, hash };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** KVは同一キーへの書き込みが1回/秒制限のため、失敗時は待ってリトライする */
async function kvPutWithRetry(env: Env, key: string, value: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await env.META.put(key, value);
      return;
    } catch (e) {
      lastError = e;
      if (attempt < 2) await sleep(1100);
    }
  }
  throw lastError;
}

async function loadProject(env: Env, slug: string): Promise<ProjectMeta | null> {
  const raw = await env.META.get(projectKey(slug));
  if (raw === null) return null;
  return JSON.parse(raw) as ProjectMeta;
}

async function saveProject(env: Env, meta: ProjectMeta): Promise<void> {
  await kvPutWithRetry(env, projectKey(meta.slug), JSON.stringify(meta));
}

/** APIレスポンス用のメタ情報。認証情報(salt/hash)は絶対に含めない */
function summarize(meta: ProjectMeta) {
  return {
    slug: meta.slug,
    name: meta.name,
    hasPassword: meta.auth !== null,
    latestVersion: meta.latestVersion,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    versions: meta.versions,
  };
}

// ---------------------------------------------------------------------------
// レスポンスヘルパー
// ---------------------------------------------------------------------------

/** 固定文言のみを埋め込む(ユーザー入力は渡さないこと) */
function pageHtml(title: string, message: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;margin:0;background:#f5f5f4;color:#1c1917;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
main{max-width:420px;text-align:center}
h1{font-size:18px;margin:0 0 8px}
p{font-size:14px;color:#57534e;margin:0;line-height:1.8}
</style>
</head>
<body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`;
}

function textPage(status: number, title: string, message: string): Response {
  return new Response(pageHtml(title, message), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function apiError(status: number, message: string): Response {
  return json(status, { error: message });
}

function redirectTo(url: URL, path: string): Response {
  return new Response(null, {
    status: 301,
    headers: { Location: path + url.search, "Cache-Control": "no-cache" },
  });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const v: unknown = await request.json();
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 管理側の認証
// ---------------------------------------------------------------------------

async function isAdminAuthorized(request: Request, env: Env): Promise<boolean> {
  const token = env.ADMIN_TOKEN;
  if (!token) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (bearer) return timingSafeEqualStr(bearer[1].trim(), token);
  const basic = decodeBasicAuth(header);
  if (basic) return timingSafeEqualStr(basic.pass, token);
  return false;
}

function adminAuthRequired(asJson: boolean): Response {
  const headers = new Headers({
    "WWW-Authenticate": 'Basic realm="atari-okiba-admin", charset="UTF-8"',
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (asJson) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify({ error: "認証が必要です。" }), { status: 401, headers });
  }
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(
    pageHtml("認証が必要です", "ユーザー名は admin(任意)、パスワードに ADMIN_TOKEN を入力してください。"),
    { status: 401, headers },
  );
}

// ---------------------------------------------------------------------------
// 管理画面 (/admin)
// ---------------------------------------------------------------------------

async function handleAdminPage(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return textPage(405, "許可されていません", "このURLはGETのみ対応です。");
  }
  if (!env.ADMIN_TOKEN) {
    return textPage(
      500,
      "設定エラー",
      "ADMIN_TOKEN が未設定です。ターミナルで npx wrangler secret put ADMIN_TOKEN を実行して設定してください。",
    );
  }
  if (!(await isAdminAuthorized(request, env))) return adminAuthRequired(false);

  const nonce = crypto.randomUUID();
  const html = ADMIN_HTML.replaceAll("__CSP_NONCE__", nonce);
  return new Response(request.method === "HEAD" ? null : html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; ` +
        "connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    },
  });
}

// ---------------------------------------------------------------------------
// 管理API (/api)
// ---------------------------------------------------------------------------

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.ADMIN_TOKEN) {
    return apiError(500, "ADMIN_TOKEN が未設定です。npx wrangler secret put ADMIN_TOKEN で設定してください。");
  }
  if (!(await isAdminAuthorized(request, env))) return adminAuthRequired(true);

  const method = request.method;
  // CSRF対策: 書き込み系は独自ヘッダを必須にする(クロスオリジンからは
  // CORSプリフライトなしに独自ヘッダを付けられず、本WorkerはCORSを許可しない)
  if (method !== "GET" && method !== "HEAD" && request.headers.get("x-atari-admin") !== "1") {
    return apiError(403, "不正なリクエストです(X-Atari-Admin: 1 ヘッダが必要です)。");
  }

  const segs = url.pathname.split("/").filter((s) => s !== "");
  // segs[0] は "api"
  if (segs.length === 2 && segs[1] === "projects") {
    if (method === "GET") return listProjects(env);
    if (method === "POST") return createProject(request, env);
    return apiError(405, "許可されていないメソッドです。");
  }
  if (segs.length === 3 && segs[1] === "projects") {
    if (method === "PATCH") return updateProject(request, env, segs[2]);
    return apiError(405, "許可されていないメソッドです。");
  }
  if (segs.length === 4 && segs[1] === "projects" && segs[3] === "versions") {
    if (method === "POST") return allocateVersion(env, segs[2]);
    return apiError(405, "許可されていないメソッドです。");
  }
  if (segs.length === 6 && segs[1] === "projects" && segs[3] === "versions" && segs[5] === "files") {
    if (method === "PUT") return uploadFile(request, env, url, segs[2], segs[4]);
    return apiError(405, "許可されていないメソッドです。");
  }
  if (segs.length === 6 && segs[1] === "projects" && segs[3] === "versions" && segs[5] === "finalize") {
    if (method === "POST") return finalizeVersion(env, segs[2], segs[4]);
    return apiError(405, "許可されていないメソッドです。");
  }
  return apiError(404, "APIが見つかりません。");
}

async function listProjects(env: Env): Promise<Response> {
  const names: string[] = [];
  let cursor: string | undefined;
  while (names.length < 500) {
    const res = await env.META.list({ prefix: "project:", cursor });
    for (const k of res.keys) names.push(k.name);
    if (res.list_complete) break;
    cursor = res.cursor;
  }
  const limited = names.slice(0, MAX_LIST_PROJECTS);
  const values = await Promise.all(limited.map((n) => env.META.get(n)));
  const projects = values
    .filter((v): v is string => v !== null)
    .map((v) => summarize(JSON.parse(v) as ProjectMeta))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return json(200, { projects, truncated: names.length > limited.length });
}

async function createProject(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (body === null) return apiError(400, "JSONボディが必要です。");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!SLUG_RE.test(slug)) {
    return apiError(400, "スラッグは英小文字・数字・ハイフンで1〜63文字にしてください(先頭は英数字)。");
  }
  const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
  const name = nameRaw === "" ? slug : nameRaw;
  if (name.length > MAX_NAME_LEN) return apiError(400, `表示名は${MAX_NAME_LEN}文字以内にしてください。`);
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length > MAX_PASSWORD_LEN) {
    return apiError(400, `パスワードは${MAX_PASSWORD_LEN}文字以内にしてください。`);
  }

  const existing = await loadProject(env, slug);
  if (existing) return apiError(409, "同じスラッグの案件が既にあります。");

  const now = new Date().toISOString();
  const meta: ProjectMeta = {
    slug,
    name,
    auth: password === "" ? null : await makeAuth(password),
    latestVersion: 0,
    nextVersion: 1,
    createdAt: now,
    updatedAt: now,
    versions: [],
  };
  await saveProject(env, meta);
  return json(201, summarize(meta));
}

async function updateProject(request: Request, env: Env, slug: string): Promise<Response> {
  if (!SLUG_RE.test(slug)) return apiError(404, "案件が存在しません。");
  const meta = await loadProject(env, slug);
  if (!meta) return apiError(404, "案件が存在しません。");

  const body = await readJson(request);
  if (body === null) return apiError(400, "JSONボディが必要です。");

  if (body.name !== undefined) {
    if (typeof body.name !== "string") return apiError(400, "表示名が不正です。");
    const name = body.name.trim();
    if (name === "" || name.length > MAX_NAME_LEN) {
      return apiError(400, `表示名は1〜${MAX_NAME_LEN}文字にしてください。`);
    }
    meta.name = name;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string") return apiError(400, "パスワードが不正です。");
    if (body.password.length > MAX_PASSWORD_LEN) {
      return apiError(400, `パスワードは${MAX_PASSWORD_LEN}文字以内にしてください。`);
    }
    meta.auth = body.password === "" ? null : await makeAuth(body.password);
  }
  await saveProject(env, meta);
  return json(200, summarize(meta));
}

async function allocateVersion(env: Env, slug: string): Promise<Response> {
  if (!SLUG_RE.test(slug)) return apiError(404, "案件が存在しません。");
  const meta = await loadProject(env, slug);
  if (!meta) return apiError(404, "案件が存在しません。");
  const version = meta.nextVersion;
  meta.nextVersion += 1;
  await saveProject(env, meta);
  return json(200, { version });
}

function parseVersion(s: string): number | null {
  if (!/^[1-9][0-9]{0,5}$/.test(s)) return null;
  return parseInt(s, 10);
}

/** アップロード先として妥当な(採番済み・未確定の)版かを検証 */
function validateUploadTarget(meta: ProjectMeta, versionStr: string): { version: number } | { error: Response } {
  const version = parseVersion(versionStr);
  if (version === null) return { error: apiError(400, "バージョン番号が不正です。") };
  if (version >= meta.nextVersion) {
    return { error: apiError(400, "未割り当てのバージョンです。先に採番してください。") };
  }
  if (version <= meta.latestVersion || meta.versions.some((v) => v.version === version)) {
    return { error: apiError(409, "確定済みのバージョンは変更できません。") };
  }
  return { version };
}

async function uploadFile(
  request: Request,
  env: Env,
  url: URL,
  slug: string,
  versionStr: string,
): Promise<Response> {
  if (!SLUG_RE.test(slug)) return apiError(404, "案件が存在しません。");
  const meta = await loadProject(env, slug);
  if (!meta) return apiError(404, "案件が存在しません。");
  const target = validateUploadTarget(meta, versionStr);
  if ("error" in target) return target.error;

  const rawPath = url.searchParams.get("path");
  if (rawPath === null || rawPath === "") return apiError(400, "path クエリパラメータが必要です。");
  const rel = sanitizeRelPath(rawPath);
  if (rel === null) {
    return apiError(400, "パスが不正です(空セグメント・「..」・バックスラッシュ・制御文字は使えません)。");
  }

  const key = r2Key(slug, target.version, rel);
  const lenHeader = request.headers.get("content-length");
  if (lenHeader !== null && /^[0-9]+$/.test(lenHeader)) {
    if (parseInt(lenHeader, 10) > MAX_FILE_BYTES) {
      return apiError(413, "ファイルが大きすぎます(1ファイル95MBまで)。");
    }
    // Content-Length既知ならメモリに乗せずストリームのままR2へ
    await env.FILES.put(key, request.body);
  } else {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_FILE_BYTES) {
      return apiError(413, "ファイルが大きすぎます(1ファイル95MBまで)。");
    }
    await env.FILES.put(key, buf);
  }
  return json(200, { ok: true, path: rel });
}

async function finalizeVersion(env: Env, slug: string, versionStr: string): Promise<Response> {
  if (!SLUG_RE.test(slug)) return apiError(404, "案件が存在しません。");
  const meta = await loadProject(env, slug);
  if (!meta) return apiError(404, "案件が存在しません。");
  const target = validateUploadTarget(meta, versionStr);
  if ("error" in target) return target.error;

  const prefix = r2Key(slug, target.version, "");
  let count = 0;
  let cursor: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await env.FILES.list({ prefix, cursor, limit: 1000 });
    count += res.objects.length;
    if (!res.truncated) break;
    cursor = res.cursor;
  }
  if (count === 0) return apiError(400, "ファイルが1つもアップロードされていません。");

  const now = new Date().toISOString();
  meta.versions.push({ version: target.version, fileCount: count, uploadedAt: now });
  meta.versions.sort((a, b) => a.version - b.version);
  meta.latestVersion = Math.max(meta.latestVersion, target.version);
  meta.updatedAt = now;
  await saveProject(env, meta);
  return json(200, { ok: true, version: target.version, fileCount: count, latestVersion: meta.latestVersion });
}

// ---------------------------------------------------------------------------
// 配信 (/p)
// ---------------------------------------------------------------------------

async function checkViewerAuth(request: Request, auth: ProjectAuth): Promise<boolean> {
  const basic = decodeBasicAuth(request.headers.get("authorization"));
  if (!basic) return false;
  const candidate = await sha256Hex(`${auth.salt}:${basic.pass}`);
  return timingSafeEqualStr(candidate, auth.hash);
}

/** slugは英数ハイフンのみに検証済みのため、realmへのヘッダインジェクションは起きない */
function viewerAuthRequired(slug: string): Response {
  return new Response(
    pageHtml(
      "パスワードが必要です",
      "このページはパスワードで保護されています。ユーザー名は任意(例: guest)、閲覧パスワードを入力してください。",
    ),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${slug}", charset="UTF-8"`,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function serveHeaders(rel: string, etag: string, cacheControl: string): Headers {
  const h = new Headers();
  h.set("Content-Type", contentTypeFor(rel));
  h.set("ETag", etag);
  h.set("Cache-Control", cacheControl);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Accept-Ranges", "bytes");
  return h;
}

/** 拡張子なしパスで `<path>/index.html` があれば末尾スラッシュ付きへ301(相対リンク解決のため) */
async function dirRedirect(
  env: Env,
  url: URL,
  key: string,
  safeRel: string,
  hadTrailingSlash: boolean,
): Promise<Response | null> {
  if (hadTrailingSlash) return null;
  const lastSeg = safeRel.split("/").pop() ?? "";
  if (lastSeg.includes(".")) return null;
  const idx = await env.FILES.head(`${key}/index.html`);
  if (!idx) return null;
  return redirectTo(url, `${url.pathname}/`);
}

async function handleServe(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return textPage(405, "許可されていません", "このURLはGETのみ対応です。");
  }
  const m = url.pathname.match(/^\/p\/([^/]+)(\/.*)?$/);
  if (!m) return textPage(404, "見つかりません", "URLが正しくありません。");

  let slug: string;
  try {
    slug = decodeURIComponent(m[1]);
  } catch {
    return textPage(404, "見つかりません", "URLが正しくありません。");
  }
  if (!SLUG_RE.test(slug)) return textPage(404, "見つかりません", "案件が存在しません。");

  const meta = await loadProject(env, slug);
  if (!meta) return textPage(404, "見つかりません", "案件が存在しません。");

  // 認証は必ずバージョン解決より先(過去版URL経由の保護回避を防ぐ)
  if (meta.auth) {
    const ok = await checkViewerAuth(request, meta.auth);
    if (!ok) return viewerAuthRequired(slug);
  }

  if (m[2] === undefined) return redirectTo(url, `/p/${slug}/`);

  let rest = m[2].slice(1);
  let version = meta.latestVersion;
  let pinned = false;
  const vm = rest.match(/^v\/([0-9]{1,6})($|\/.*)$/);
  if (vm) {
    const parsed = parseVersion(vm[1]);
    if (parsed === null || !meta.versions.some((v) => v.version === parsed)) {
      return textPage(404, "見つかりません", "このバージョンは存在しません。");
    }
    version = parsed;
    pinned = true;
    if (vm[2] === "") return redirectTo(url, `/p/${slug}/v/${version}/`);
    rest = vm[2].slice(1);
  }
  if (version <= 0) {
    return textPage(404, "未公開", "まだファイルがアップロードされていません。");
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(rest);
  } catch {
    return textPage(404, "見つかりません", "URLが正しくありません。");
  }
  const hadTrailingSlash = decoded === "" || decoded.endsWith("/");
  const rel = hadTrailingSlash ? `${decoded}index.html` : decoded;
  const safe = sanitizeRelPath(rel);
  if (safe === null) return textPage(404, "見つかりません", "URLが正しくありません。");

  const key = r2Key(slug, version, safe);
  const isPrivate = meta.auth !== null;
  // 最新URLは同じURLで新しい版が見えることを最優先(no-cacheで毎回再検証)。
  // 版指定URLは確定後に変わらないため軽くキャッシュさせる。
  const cacheControl = pinned ? `${isPrivate ? "private" : "public"}, max-age=3600` : "no-cache";

  if (request.method === "HEAD") {
    const head = await env.FILES.head(key);
    if (!head) {
      const redirect = await dirRedirect(env, url, key, safe, hadTrailingSlash);
      return redirect ?? textPage(404, "見つかりません", "ファイルが存在しません。");
    }
    const headers = serveHeaders(safe, head.httpEtag, cacheControl);
    headers.set("Content-Length", String(head.size));
    return new Response(null, { status: 200, headers });
  }

  // Range対応(iPhone Safariの動画再生に必要)
  if (request.headers.get("range") !== null) {
    let obj: R2ObjectBody | null;
    try {
      obj = await env.FILES.get(key, { range: request.headers });
    } catch {
      return new Response("Range Not Satisfiable", { status: 416 });
    }
    if (!obj) {
      const redirect = await dirRedirect(env, url, key, safe, hadTrailingSlash);
      return redirect ?? textPage(404, "見つかりません", "ファイルが存在しません。");
    }
    const headers = serveHeaders(safe, obj.httpEtag, cacheControl);
    const r = obj.range as { offset?: number; length?: number; suffix?: number } | undefined;
    let start = 0;
    let length = obj.size;
    if (r) {
      if (typeof r.suffix === "number") {
        start = Math.max(0, obj.size - r.suffix);
        length = obj.size - start;
      } else {
        start = r.offset ?? 0;
        length = r.length ?? obj.size - start;
      }
    }
    headers.set("Content-Range", `bytes ${start}-${start + length - 1}/${obj.size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  const obj = (await env.FILES.get(key, { onlyIf: request.headers })) as R2ObjectBody | R2Object | null;
  if (!obj) {
    const redirect = await dirRedirect(env, url, key, safe, hadTrailingSlash);
    return redirect ?? textPage(404, "見つかりません", "ファイルが存在しません。");
  }
  const headers = serveHeaders(safe, obj.httpEtag, cacheControl);
  if (!("body" in obj) || obj.body === null) {
    // If-None-Match等の条件に一致 → 304
    return new Response(null, { status: 304, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

// ---------------------------------------------------------------------------
// エントリポイント
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/") {
        return new Response(null, { status: 302, headers: { Location: "/admin" } });
      }
      if (path === "/admin" || path === "/admin/") return handleAdminPage(request, env);
      if (path === "/api" || path.startsWith("/api/")) return handleApi(request, env, url);
      if (path === "/p" || path.startsWith("/p/")) return handleServe(request, env, url);
      return textPage(404, "見つかりません", "ページが存在しません。");
    } catch (e) {
      // スタックはログのみ。クライアントには内部情報を返さない
      console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
      return textPage(500, "サーバーエラー", "エラーが発生しました。時間をおいて再度お試しください。");
    }
  },
} satisfies ExportedHandler<Env>;
