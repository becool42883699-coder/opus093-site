/**
 * 完了条件1〜5とセキュリティ要件の自動テスト。
 * @cloudflare/vitest-pool-workers により、実際のworkerd上でWorker全体(SELF)を叩く。
 * 各テストはストレージが分離されるため、必要な状態はテスト内で毎回作る。
 */
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const BASE = "https://hub.test";
const TOKEN = "test-admin-token"; // vitest.config.ts の miniflare.bindings と一致させる

function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, "X-Atari-Admin": "1", ...extra };
}

function basicAuth(user: string, pass: string): string {
  const bytes = new TextEncoder().encode(`${user}:${pass}`);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `Basic ${btoa(bin)}`;
}

async function createProject(slug: string, name = slug, password = ""): Promise<Response> {
  return SELF.fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ slug, name, password }),
  });
}

async function allocateVersion(slug: string): Promise<number> {
  const res = await SELF.fetch(`${BASE}/api/projects/${slug}/versions`, {
    method: "POST",
    headers: adminHeaders(),
  });
  expect(res.status).toBe(200);
  const { version } = (await res.json()) as { version: number };
  return version;
}

async function putFile(slug: string, version: number, path: string, body: string): Promise<Response> {
  return SELF.fetch(
    `${BASE}/api/projects/${slug}/versions/${version}/files?path=${encodeURIComponent(path)}`,
    { method: "PUT", headers: adminHeaders(), body },
  );
}

async function finalize(slug: string, version: number): Promise<Response> {
  return SELF.fetch(`${BASE}/api/projects/${slug}/versions/${version}/finalize`, {
    method: "POST",
    headers: adminHeaders(),
  });
}

/** 採番→全ファイルPUT(直列)→finalize までを行い、版番号を返す */
async function uploadVersion(slug: string, files: Record<string, string>): Promise<number> {
  const version = await allocateVersion(slug);
  for (const [path, body] of Object.entries(files)) {
    const res = await putFile(slug, version, path, body);
    expect(res.status).toBe(200);
  }
  const fin = await finalize(slug, version);
  expect(fin.status).toBe(200);
  return version;
}

// ---------------------------------------------------------------------------

describe("完了条件1: 案件を作成できる", () => {
  it("作成に成功すると201でメタ情報が返る(認証情報は含まれない)", async () => {
    const res = await createProject("cond1-a", "テスト案件", "");
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.slug).toBe("cond1-a");
    expect(body.name).toBe("テスト案件");
    expect(body.hasPassword).toBe(false);
    expect(body.latestVersion).toBe(0);
    expect(JSON.stringify(body)).not.toContain("salt");
    expect(JSON.stringify(body)).not.toContain("hash");
  });

  it("一覧に作成した案件が出る", async () => {
    await createProject("cond1-list");
    const res = await SELF.fetch(`${BASE}/api/projects`, { headers: adminHeaders() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { projects: Array<{ slug: string }> };
    expect(body.projects.map((p) => p.slug)).toContain("cond1-list");
  });

  it("認証なしは401", async () => {
    const res = await SELF.fetch(`${BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Atari-Admin": "1" },
      body: JSON.stringify({ slug: "cond1-noauth" }),
    });
    expect(res.status).toBe(401);
  });

  it("管理APIはBasic認証を受け付けない(ブラウザ自動送信の資格情報を使わせない)", async () => {
    const res = await SELF.fetch(`${BASE}/api/projects`, {
      headers: { Authorization: basicAuth("admin", TOKEN) },
    });
    expect(res.status).toBe(401);
    // 認証ダイアログを出さないためWWW-Authenticateも返さない
    expect(res.headers.get("www-authenticate")).toBeNull();
  });

  it("誤ったトークンは401", async () => {
    const res = await SELF.fetch(`${BASE}/api/projects`, { headers: { Authorization: "Bearer wrong-token" } });
    expect(res.status).toBe(401);
  });

  it("CSRF対策ヘッダ(X-Atari-Admin)なしの書き込みは403", async () => {
    const res = await SELF.fetch(`${BASE}/api/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "cond1-csrf" }),
    });
    expect(res.status).toBe(403);
  });

  it("不正なスラッグは400", async () => {
    for (const slug of ["ABC", "日本語", "a/b", "-abc", "a..b", "", "a".repeat(64)]) {
      const res = await createProject(slug);
      expect(res.status, `slug=${slug}`).toBe(400);
    }
  });

  it("重複スラッグは409", async () => {
    expect((await createProject("cond1-dup")).status).toBe(201);
    expect((await createProject("cond1-dup")).status).toBe(409);
  });
});

describe("案件の削除", () => {
  async function del(slug: string, confirm?: string): Promise<Response> {
    const q = confirm === undefined ? "" : `?confirm=${encodeURIComponent(confirm)}`;
    return SELF.fetch(`${BASE}/api/projects/${slug}${q}`, { method: "DELETE", headers: adminHeaders() });
  }

  it("削除すると案件・ファイル・URLがすべて消える", async () => {
    await createProject("del-a");
    await uploadVersion("del-a", { "index.html": "v1", "css/a.css": "x" });
    await uploadVersion("del-a", { "index.html": "v2" });
    expect((await SELF.fetch(`${BASE}/p/del-a/`)).status).toBe(200);

    const res = await del("del-a", "del-a");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; deletedFiles: number };
    expect(body.ok).toBe(true);
    expect(body.deletedFiles).toBe(3); // v1の2ファイル + v2の1ファイル

    // 配信も過去版も消えている
    expect((await SELF.fetch(`${BASE}/p/del-a/`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/p/del-a/v/1/`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/p/del-a/css/a.css`)).status).toBe(404);

    // 一覧からも消えている
    const list = await SELF.fetch(`${BASE}/api/projects`, { headers: adminHeaders() });
    const listBody = (await list.json()) as { projects: Array<{ slug: string }> };
    expect(listBody.projects.map((p) => p.slug)).not.toContain("del-a");
  });

  it("confirmパラメータがないと削除されない(誤操作防止)", async () => {
    await createProject("del-confirm");
    await uploadVersion("del-confirm", { "index.html": "keep me" });

    expect((await del("del-confirm")).status).toBe(400);
    expect((await del("del-confirm", "wrong-slug")).status).toBe(400);
    // 案件は無事
    expect((await SELF.fetch(`${BASE}/p/del-confirm/`)).status).toBe(200);
  });

  it("存在しない案件の削除は404、認証なしは401", async () => {
    expect((await del("no-such-project", "no-such-project")).status).toBe(404);
    const noAuth = await SELF.fetch(`${BASE}/api/projects/x?confirm=x`, {
      method: "DELETE",
      headers: { "X-Atari-Admin": "1" },
    });
    expect(noAuth.status).toBe(401);
  });

  it("削除後は同じスラッグを作り直せる(バージョンはv1から)", async () => {
    await createProject("del-reuse");
    await uploadVersion("del-reuse", { "index.html": "old project" });
    expect((await del("del-reuse", "del-reuse")).status).toBe(200);

    expect((await createProject("del-reuse")).status).toBe(201);
    const v = await uploadVersion("del-reuse", { "index.html": "new project" });
    expect(v).toBe(1);
    const res = await SELF.fetch(`${BASE}/p/del-reuse/`);
    expect(await res.text()).toContain("new project");
  });

  it("削除は他の案件に影響しない(プレフィックスの取り違えがない)", async () => {
    await createProject("del-x");
    await createProject("del-x-longer");
    await uploadVersion("del-x", { "index.html": "x" });
    await uploadVersion("del-x-longer", { "index.html": "longer survives" });

    expect((await del("del-x", "del-x")).status).toBe(200);
    const survivor = await SELF.fetch(`${BASE}/p/del-x-longer/`);
    expect(survivor.status).toBe(200);
    expect(await survivor.text()).toContain("longer survives");
  });
});

describe("完了条件2: v1をアップロードすると /p/<slug>/ で表示される", () => {
  it("index.htmlが配信され、CSSも正しいContent-Typeで配信される", async () => {
    await createProject("cond2-a");
    const v = await uploadVersion("cond2-a", {
      "index.html": "<h1>v1 hello</h1>",
      "css/style.css": "body{color:red}",
      "app.js": "console.log(1)",
      "sub/index.html": "<p>sub page v1</p>",
    });
    expect(v).toBe(1);

    const res = await SELF.fetch(`${BASE}/p/cond2-a/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.text()).toContain("v1 hello");

    const css = await SELF.fetch(`${BASE}/p/cond2-a/css/style.css`);
    expect(css.status).toBe(200);
    expect(css.headers.get("content-type")).toContain("text/css");

    const js = await SELF.fetch(`${BASE}/p/cond2-a/app.js`);
    expect(js.headers.get("content-type")).toContain("text/javascript");
  });

  it("スラッシュなしURLはスラッシュ付きへ301", async () => {
    await createProject("cond2-slash");
    await uploadVersion("cond2-slash", { "index.html": "<h1>top</h1>" });
    const res = await SELF.fetch(`${BASE}/p/cond2-slash`, { redirect: "manual" });
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/p/cond2-slash/");
  });

  it("サブディレクトリはindex.html補完とディレクトリリダイレクトが効く", async () => {
    await createProject("cond2-sub");
    await uploadVersion("cond2-sub", { "index.html": "<h1>top</h1>", "sub/index.html": "<p>sub page</p>" });
    const redirect = await SELF.fetch(`${BASE}/p/cond2-sub/sub`, { redirect: "manual" });
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get("location")).toBe("/p/cond2-sub/sub/");
    const res = await SELF.fetch(`${BASE}/p/cond2-sub/sub/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("sub page");
  });

  it("存在しないファイルは404、未公開案件のトップも404", async () => {
    await createProject("cond2-404");
    expect((await SELF.fetch(`${BASE}/p/cond2-404/`)).status).toBe(404);
    await uploadVersion("cond2-404", { "index.html": "x" });
    expect((await SELF.fetch(`${BASE}/p/cond2-404/nope.html`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/p/no-such-project/`)).status).toBe(404);
  });
});

describe("完了条件3: 再アップロードでv2になり、同じURLで新しい内容が出る", () => {
  it("最新URLの内容が入れ替わり、バージョン履歴が2件になる", async () => {
    await createProject("cond3-a");
    const v1 = await uploadVersion("cond3-a", { "index.html": "<h1>OLD CONTENT</h1>" });
    const v2 = await uploadVersion("cond3-a", { "index.html": "<h1>NEW CONTENT</h1>" });
    expect(v1).toBe(1);
    expect(v2).toBe(2);

    const res = await SELF.fetch(`${BASE}/p/cond3-a/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("NEW CONTENT");
    expect(text).not.toContain("OLD CONTENT");

    const list = await SELF.fetch(`${BASE}/api/projects`, { headers: adminHeaders() });
    const body = (await list.json()) as {
      projects: Array<{ slug: string; latestVersion: number; versions: Array<{ version: number }> }>;
    };
    const proj = body.projects.find((p) => p.slug === "cond3-a");
    expect(proj?.latestVersion).toBe(2);
    expect(proj?.versions.map((v) => v.version)).toEqual([1, 2]);
  });

  it("最新URLはno-cache(同じURLで即座に新版が見える)", async () => {
    await createProject("cond3-cache");
    await uploadVersion("cond3-cache", { "index.html": "x" });
    const res = await SELF.fetch(`${BASE}/p/cond3-cache/`);
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });
});

describe("完了条件4: /p/<slug>/v/1/ で過去の版が見られる", () => {
  it("旧版の内容がそのまま残っている", async () => {
    await createProject("cond4-a");
    await uploadVersion("cond4-a", { "index.html": "<h1>OLD CONTENT</h1>", "old-only.txt": "keep me" });
    await uploadVersion("cond4-a", { "index.html": "<h1>NEW CONTENT</h1>" });

    const res = await SELF.fetch(`${BASE}/p/cond4-a/v/1/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("OLD CONTENT");

    const oldFile = await SELF.fetch(`${BASE}/p/cond4-a/v/1/old-only.txt`);
    expect(oldFile.status).toBe(200);
    expect(await oldFile.text()).toBe("keep me");

    const v2 = await SELF.fetch(`${BASE}/p/cond4-a/v/2/`);
    expect(await v2.text()).toContain("NEW CONTENT");
  });

  it("末尾スラッシュなしの版URLはスラッシュ付きへ301", async () => {
    await createProject("cond4-slash");
    await uploadVersion("cond4-slash", { "index.html": "x" });
    const res = await SELF.fetch(`${BASE}/p/cond4-slash/v/1`, { redirect: "manual" });
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/p/cond4-slash/v/1/");
  });

  it("存在しない版・未確定の版は404", async () => {
    await createProject("cond4-404");
    await uploadVersion("cond4-404", { "index.html": "x" });
    expect((await SELF.fetch(`${BASE}/p/cond4-404/v/99/`)).status).toBe(404);
    // 採番だけしてfinalizeしていない版は配信されない(途中の中身が見えない)
    const pending = await allocateVersion("cond4-404");
    await putFile("cond4-404", pending, "secret.html", "work in progress");
    expect((await SELF.fetch(`${BASE}/p/cond4-404/v/${pending}/secret.html`)).status).toBe(404);
  });
});

describe("完了条件5: パスワード設定済み案件はBasic認証がかかる", () => {
  it("認証なしは401でWWW-Authenticate: Basicが付く(iPhone Safariのダイアログが出る形式)", async () => {
    await createProject("cond5-a", "秘密案件", "view-pass-123");
    await uploadVersion("cond5-a", { "index.html": "<h1>secret content</h1>" });

    const res = await SELF.fetch(`${BASE}/p/cond5-a/`);
    expect(res.status).toBe(401);
    const wwwAuth = res.headers.get("www-authenticate") ?? "";
    expect(wwwAuth).toContain("Basic");
    expect(wwwAuth).toContain('charset="UTF-8"');
    expect(await res.text()).not.toContain("secret content");
  });

  it("正しいパスワードで200(ユーザー名は任意)", async () => {
    await createProject("cond5-ok", "秘密案件", "view-pass-123");
    await uploadVersion("cond5-ok", { "index.html": "<h1>secret content</h1>" });
    const res = await SELF.fetch(`${BASE}/p/cond5-ok/`, {
      headers: { Authorization: basicAuth("guest", "view-pass-123") },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("secret content");
  });

  it("誤ったパスワードは401", async () => {
    await createProject("cond5-ng", "秘密案件", "view-pass-123");
    await uploadVersion("cond5-ng", { "index.html": "x" });
    const res = await SELF.fetch(`${BASE}/p/cond5-ng/`, {
      headers: { Authorization: basicAuth("guest", "wrong-pass") },
    });
    expect(res.status).toBe(401);
  });

  it("過去版URLにも同じ認証がかかる(バージョンURL経由の回避不可)", async () => {
    await createProject("cond5-ver", "秘密案件", "view-pass-123");
    await uploadVersion("cond5-ver", { "index.html": "<h1>secret v1</h1>" });
    expect((await SELF.fetch(`${BASE}/p/cond5-ver/v/1/`)).status).toBe(401);
    const ok = await SELF.fetch(`${BASE}/p/cond5-ver/v/1/`, {
      headers: { Authorization: basicAuth("x", "view-pass-123") },
    });
    expect(ok.status).toBe(200);
  });

  it("日本語パスワード(UTF-8)でも認証できる", async () => {
    await createProject("cond5-jp", "和文", "ひみつのぱすわーど");
    await uploadVersion("cond5-jp", { "index.html": "x" });
    const res = await SELF.fetch(`${BASE}/p/cond5-jp/`, {
      headers: { Authorization: basicAuth("guest", "ひみつのぱすわーど") },
    });
    expect(res.status).toBe(200);
  });

  it("パスワード未設定の案件は誰でも閲覧できる", async () => {
    await createProject("cond5-open");
    await uploadVersion("cond5-open", { "index.html": "open" });
    expect((await SELF.fetch(`${BASE}/p/cond5-open/`)).status).toBe(200);
  });

  it("PATCHでパスワードを後から設定・解除できる", async () => {
    await createProject("cond5-patch");
    await uploadVersion("cond5-patch", { "index.html": "x" });
    expect((await SELF.fetch(`${BASE}/p/cond5-patch/`)).status).toBe(200);

    const set = await SELF.fetch(`${BASE}/api/projects/cond5-patch`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ password: "new-pass" }),
    });
    expect(set.status).toBe(200);
    expect((await SELF.fetch(`${BASE}/p/cond5-patch/`)).status).toBe(401);

    const clear = await SELF.fetch(`${BASE}/api/projects/cond5-patch`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ password: "" }),
    });
    expect(clear.status).toBe(200);
    expect((await SELF.fetch(`${BASE}/p/cond5-patch/`)).status).toBe(200);
  });
});

// ---------------------------------------------------------------------------

describe("セキュリティ: パストラバーサル", () => {
  it("アップロード時の不正パスは400", async () => {
    await createProject("sec-up");
    const v = await allocateVersion("sec-up");
    const badPaths = [
      "../evil.html",
      "a/../b.html",
      "..",
      "/abs.html",
      "a//b.html",
      "a\\b.html",
      "dir/./x.html",
      "a b.html",
    ];
    for (const p of badPaths) {
      const res = await putFile("sec-up", v, p, "x");
      expect(res.status, `path=${JSON.stringify(p)}`).toBe(400);
    }
  });

  it("R2キーが1024バイト上限を超える長い日本語パスは弾く(文字数ではなくバイト長で判定)", async () => {
    await createProject("sec-bytelen");
    const v = await allocateVersion("sec-bytelen");
    // 各セグメント200文字(UTF-8で600バイト)×2 → 文字数400・バイト数1200。文字数制限は通るがバイト超過
    const longPath = "あ".repeat(200) + "/" + "い".repeat(200) + ".html";
    const res = await putFile("sec-bytelen", v, longPath, "x");
    expect(res.status).toBe(400);
    // 配信側でも同様に長すぎるパスは404(R2例外を誘発しない)
    const serve = await SELF.fetch(`${BASE}/p/sec-bytelen/${encodeURIComponent(longPath)}`);
    expect([400, 404]).toContain(serve.status);
  });

  it('先頭が "v" のパスはバージョンURLと衝突するため400で拒否', async () => {
    await createProject("sec-vseg");
    const v = await allocateVersion("sec-vseg");
    expect((await putFile("sec-vseg", v, "v/1/index.html", "shadow")).status).toBe(400);
    // "v" 単体でなければOK(video.mp4 や css/v/x は許可)
    expect((await putFile("sec-vseg", v, "video.mp4", "x")).status).toBe(200);
    expect((await putFile("sec-vseg", v, "css/v/x.css", "x")).status).toBe(200);
  });

  it("Content-Lengthのない(チャンク転送)アップロードは411で拒否", async () => {
    await createProject("sec-chunked");
    const v = await allocateVersion("sec-chunked");
    // ReadableStreamボディはContent-Lengthが付かずchunkedになる
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("streamed body"));
        controller.close();
      },
    });
    const res = await SELF.fetch(
      `${BASE}/api/projects/sec-chunked/versions/${v}/files?path=x.html`,
      { method: "PUT", headers: adminHeaders(), body: stream, duplex: "half" } as RequestInit,
    );
    expect(res.status).toBe(411);
  });

  it("配信時のトラバーサル風URLで他案件やR2キー外へ到達できない", async () => {
    await createProject("sec-serve");
    await uploadVersion("sec-serve", { "index.html": "<h1>sec ok</h1>" });
    // 二重エンコードの ..(%252e%252e)→ 1回デコードで「%2e%2e」というただのファイル名になり404
    const doubleEnc = await SELF.fetch(`${BASE}/p/sec-serve/%252e%252e/%252e%252e/index.html`);
    expect(doubleEnc.status).toBe(404);
    // エンコードされたスラッシュやバックスラッシュを含むパスも404
    expect((await SELF.fetch(`${BASE}/p/sec-serve/a%5Cb.html`)).status).toBe(404);
    expect((await SELF.fetch(`${BASE}/p/sec-serve/a%00b.html`)).status).toBe(404);
  });

  it("URL正規化で他案件のスラッグに到達しても、その案件の認証は必ずかかる", async () => {
    await createProject("sec-open");
    await uploadVersion("sec-open", { "index.html": "public" });
    await createProject("sec-locked", "施錠", "pass-xyz");
    await uploadVersion("sec-locked", { "index.html": "locked content" });
    // /p/sec-open/../sec-locked/ はURL段階で /p/sec-locked/ に正規化される
    // → 認証(401)が必須のままであること
    const res = await SELF.fetch(`${BASE}/p/sec-open/../sec-locked/`);
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("locked content");
  });
});

describe("セキュリティ: 管理画面と管理API", () => {
  it("/admin はログインシェルを返し、nonceが実値に置換されている", async () => {
    const res = await SELF.fetch(`${BASE}/admin`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("あたり置き場");
    expect(html).not.toContain("__CSP_NONCE__");
    // リクエストごとに異なるnonceであること
    const other = await SELF.fetch(`${BASE}/admin`);
    expect(other.headers.get("content-security-policy")).not.toBe(res.headers.get("content-security-policy"));
  });

  it("トップは /admin へリダイレクト", async () => {
    const res = await SELF.fetch(`${BASE}/`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin");
  });

  it("未割り当てバージョンへのアップロードは400、確定済みへの追記は409", async () => {
    await createProject("sec-ver");
    expect((await putFile("sec-ver", 5, "x.html", "x")).status).toBe(400);
    const v = await uploadVersion("sec-ver", { "index.html": "x" });
    expect((await putFile("sec-ver", v, "y.html", "y")).status).toBe(409);
    expect((await finalize("sec-ver", v)).status).toBe(409);
  });

  it("空のバージョンはfinalizeできない", async () => {
    await createProject("sec-empty");
    const v = await allocateVersion("sec-empty");
    expect((await finalize("sec-empty", v)).status).toBe(400);
  });

  it("APIレスポンスにsalt/hashが漏れない", async () => {
    await createProject("sec-leak", "秘密", "some-password");
    const res = await SELF.fetch(`${BASE}/api/projects`, { headers: adminHeaders() });
    const text = await res.text();
    expect(text).not.toContain("salt");
    expect(text).not.toContain('"hash"');
    const proj = ((JSON.parse(text) as { projects: Array<Record<string, unknown>> }).projects).find(
      (p) => p.slug === "sec-leak",
    );
    expect(proj?.hasPassword).toBe(true);
  });
});

describe("セキュリティ: 同一オリジンの成果物からの管理API乗っ取り防止", () => {
  // 単一オリジンで管理画面と成果物配信を兼ねるため、ブラウザが自動送信する資格情報
  // (Basic/Cookie)を管理APIに使わない。Bearer専用にすることで、成果物スクリプトは
  // トークンを入手できず管理APIを呼べない(Referer検証は pushState で偽装可能なため使わない)。
  it("Bearer認証のみ受け付ける", async () => {
    const ok = await SELF.fetch(`${BASE}/api/projects`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(ok.status).toBe(200);
  });

  it("Basic認証は/admin由来のRefererを偽装しても拒否される(pushStateバイパス対策)", async () => {
    // 悪意ある /p ページが history.pushState('/admin') でRefererを偽装した状況を模す
    const spoofed = await SELF.fetch(`${BASE}/api/projects`, {
      headers: { Authorization: basicAuth("admin", TOKEN), Referer: `${BASE}/admin` },
    });
    expect(spoofed.status).toBe(401);

    const write = await SELF.fetch(`${BASE}/api/projects`, {
      method: "POST",
      headers: {
        Authorization: basicAuth("admin", TOKEN),
        Referer: `${BASE}/admin`,
        "X-Atari-Admin": "1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug: "hijacked" }),
    });
    expect(write.status).toBe(401);
    // 案件が作られていないこと
    const list = await SELF.fetch(`${BASE}/api/projects`, { headers: adminHeaders() });
    const body = (await list.json()) as { projects: Array<{ slug: string }> };
    expect(body.projects.map((p) => p.slug)).not.toContain("hijacked");
  });

  it("/admin は秘密を含まない静的シェルを返す(トークンが漏れない)", async () => {
    const res = await SELF.fetch(`${BASE}/admin`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain(TOKEN);
    expect(html).toContain("ログイン");
    // トークンをブラウザに保存しない(成果物スクリプトから読めるため)
    expect(html).not.toContain("localStorage");
    expect(html).not.toContain("sessionStorage");
  });

  it("管理画面のインラインスクリプトが壊れていない(文字列リテラルが改行で分断されていない)", async () => {
    // テンプレートリテラル内に \n などのエスケープを書くと、出力HTMLのJS文字列が
    // 改行で分断されて構文エラーになり、管理画面のJSが丸ごと停止する。
    // (その状態ではログインフォームがネイティブ送信され、トークンがURLに載る)
    const res = await SELF.fetch(`${BASE}/admin`);
    const html = await res.text();
    const script = html.slice(html.indexOf("<script"), html.indexOf("</script>"));
    const offenders: string[] = [];
    for (const line of script.split("\n")) {
      // 行内のエスケープされていないシングルクォートが奇数個 = 文字列が行内で閉じていない
      const quotes = (line.match(/(?<!\\)'/g) ?? []).length;
      if (quotes % 2 !== 0) offenders.push(line.trim());
    }
    expect(offenders).toEqual([]);
  });

  it("ログインフォームはGET送信でトークンをURLに載せない", async () => {
    const res = await SELF.fetch(`${BASE}/admin`);
    const html = await res.text();
    // トークン入力欄にname属性を持たせない。JSが壊れてネイティブ送信されても
    // クエリ文字列に値が乗らない(履歴・Referer・ログへの漏えいを防ぐ)
    const input = html.slice(html.indexOf('id="token-input"'));
    expect(input.slice(0, input.indexOf(">"))).not.toContain("name=");
    expect(html).not.toMatch(/<form[^>]*action=/i);
  });

  it("/admin レスポンスはno-referrer・DENY・nonce付きCSP", async () => {
    const res = await SELF.fetch(`${BASE}/admin`);
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy") ?? "").toContain("script-src 'nonce-");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("配信の付加機能", () => {
  it("拡張子からContent-Typeが決まり、未知の拡張子はoctet-stream", async () => {
    await createProject("misc-ct");
    await uploadVersion("misc-ct", {
      "index.html": "x",
      "img.svg": "<svg xmlns='http://www.w3.org/2000/svg'/>",
      "data.json": "{}",
      "unknown.xyz": "???",
    });
    expect((await SELF.fetch(`${BASE}/p/misc-ct/img.svg`)).headers.get("content-type")).toBe("image/svg+xml");
    expect((await SELF.fetch(`${BASE}/p/misc-ct/data.json`)).headers.get("content-type")).toContain(
      "application/json",
    );
    const unknown = await SELF.fetch(`${BASE}/p/misc-ct/unknown.xyz`);
    expect(unknown.headers.get("content-type")).toBe("application/octet-stream");
    expect(unknown.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("ETagが付き、If-None-Matchで304が返る", async () => {
    await createProject("misc-etag");
    await uploadVersion("misc-etag", { "index.html": "etag test" });
    const first = await SELF.fetch(`${BASE}/p/misc-etag/`);
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();
    const second = await SELF.fetch(`${BASE}/p/misc-etag/`, { headers: { "If-None-Match": etag! } });
    expect(second.status).toBe(304);
  });

  it("Rangeリクエストで206が返る(動画のiOS再生に必要)", async () => {
    await createProject("misc-range");
    await uploadVersion("misc-range", { "video.mp4": "0123456789" });
    const res = await SELF.fetch(`${BASE}/p/misc-range/video.mp4`, { headers: { Range: "bytes=2-5" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(await res.text()).toBe("2345");
  });

  it("版指定URLはキャッシュ可、パスワード付きはprivate", async () => {
    await createProject("misc-cache-pub");
    await uploadVersion("misc-cache-pub", { "index.html": "x" });
    const pub = await SELF.fetch(`${BASE}/p/misc-cache-pub/v/1/`);
    expect(pub.headers.get("cache-control")).toBe("public, max-age=3600");

    await createProject("misc-cache-pri", "施錠", "pw");
    await uploadVersion("misc-cache-pri", { "index.html": "x" });
    const pri = await SELF.fetch(`${BASE}/p/misc-cache-pri/v/1/`, {
      headers: { Authorization: basicAuth("g", "pw") },
    });
    expect(pri.headers.get("cache-control")).toBe("private, max-age=3600");
  });

  it("HEADリクエストに応答する", async () => {
    await createProject("misc-head");
    await uploadVersion("misc-head", { "index.html": "hello head" });
    const res = await SELF.fetch(`${BASE}/p/misc-head/`, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toBe("");
  });

  it("日本語ファイル名(NFC/NFD)を吸収して配信できる", async () => {
    await createProject("misc-jp");
    // アップロードはNFD(Macのドラッグ&ドロップ相当)、閲覧はNFCでも一致する
    const nfd = "らくがき.html".normalize("NFD");
    await uploadVersion("misc-jp", { "index.html": "top", [nfd]: "japanese file" });
    const res = await SELF.fetch(`${BASE}/p/misc-jp/${encodeURIComponent("らくがき.html".normalize("NFC"))}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("japanese file");
  });
});
