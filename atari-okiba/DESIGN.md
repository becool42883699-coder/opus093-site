# あたり置き場 — 設計書 (DESIGN.md)

自分専用の公開ハブ。HTML一式をブラウザにドラッグ&ドロップすると確認用URLが発行される。
Cloudflare Workers 1本 + R2(ファイル本体) + KV(案件メタ情報)で構成し、フレームワークは使わない。

## 全体構成

```
ブラウザ(管理画面 /admin)
   │  Basic認証 (パスワード = ADMIN_TOKEN)
   ▼
Cloudflare Worker (src/index.ts)
   ├── GET  /admin            … 管理画面HTML(1枚、ビルドなし)を配信
   ├── /api/*                 … 管理API(ADMIN_TOKEN必須 + CSRF対策ヘッダ)
   └── GET  /p/<slug>/...     … 公開配信(案件ごとの閲覧パスワード対応)
        │
        ├── KV (META)  … 案件メタ情報 project:<slug>
        └── R2 (FILES) … ファイル本体 sites/<slug>/v<n>/<相対パス>
```

## R2 キー設計

```
sites/<slug>/v<n>/<相対パス>
```

例: `sites/acme-lp/v2/css/style.css`

- `<slug>` は `^[a-z0-9][a-z0-9-]{0,62}$` に一致するもののみ許可(作成時に検証)。
  → キーの区切り文字 `/` や `..` がslugに混入することはない。
- `<n>` はバージョン番号(正の整数、サーバ側で採番)。
- `<相対パス>` はアップロード時・配信時ともに **同一のサニタイズ関数** `sanitizeRelPath()` を通す:
  - NFC正規化(Macのファイル名NFD問題を吸収)
  - 空文字・1024文字超・制御文字(0x00-0x1f, 0x7f)・バックスラッシュを拒否
  - `/` で分割し、空セグメント・`.`・`..`・255文字超セグメント・41階層以上を拒否
- R2のキーはフラットな文字列でありパス解決の概念がないため、トラバーサルの本質的リスクは
  「自前で組み立てたキーが別案件のプレフィックスに重なること」。上記により `..` や `/` の
  混入経路を全て遮断する(多層防御としてアップロード側・配信側の両方で実施)。

## KV スキーマ

キー: `project:<slug>` / 値: JSON

```jsonc
{
  "slug": "acme-lp",
  "name": "ACME様 LP",
  "auth": {                    // 閲覧パスワード未設定なら null
    "salt": "16バイトhex",
    "hash": "sha256(salt + ':' + password) のhex"
  },
  "latestVersion": 2,          // 0 = 未公開。/p/<slug>/ が参照する版
  "nextVersion": 3,            // 次に採番する版(確定前の割り当ても消費する)
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",      // 版が確定(finalize)した日時
  "versions": [                // 確定済みの版のみ。昇順
    { "version": 1, "fileCount": 12, "uploadedAt": "ISO8601" },
    { "version": 2, "fileCount": 13, "uploadedAt": "ISO8601" }
  ]
}
```

設計判断:
- **latestVersion と nextVersion を分離**: アップロード途中で放棄された版が「最新」を
  汚さないようにする。finalize されて初めて latestVersion が進む。
- **versions には確定済みのみ**: 未確定版は配信対象外(/p/<slug>/v/<n>/ は versions に
  含まれる版のみ配信)。アップロード途中の中身が第三者から見えることはない。
- **パスワードは salt付きSHA-256**: Basic認証では毎リクエスト(全アセット)で検証が走るため、
  PBKDF2等の高コストKDFは無料枠のCPU制限(10ms)と相性が悪い。閲覧パスワードは
  「確認用URLの簡易保護」という位置づけのため、salt付きSHA-256 + 定数時間比較を採用。
  比較は digest 同士を `crypto.subtle.timingSafeEqual` で行う。
- 一覧表示はKVの `list({prefix: "project:"})` + 個別get。無料プランのサブリクエスト上限
  (50/リクエスト)を考慮し、一覧は先頭40案件で打ち切り `truncated` を返す(個人ツールとして十分)。

## URL ルーティング

| メソッド | パス | 認証 | 動作 |
|---|---|---|---|
| GET | `/` | なし | `/admin` へ302 |
| GET | `/admin` | ADMIN_TOKEN (Basic) | 管理画面HTML(nonce付きCSP、no-store) |
| GET | `/api/projects` | ADMIN_TOKEN | 案件一覧(メタ情報のみ、認証情報は含めない) |
| POST | `/api/projects` | ADMIN_TOKEN + CSRFヘッダ | 案件作成 {slug, name, password?} |
| PATCH | `/api/projects/:slug` | 同上 | 表示名・閲覧パスワード変更 |
| POST | `/api/projects/:slug/versions` | 同上 | 新バージョン採番 → {version} |
| PUT | `/api/projects/:slug/versions/:n/files?path=<相対パス>` | 同上 | ファイル1件アップロード(本文=生バイト) |
| POST | `/api/projects/:slug/versions/:n/finalize` | 同上 | 版を確定し latestVersion を更新 |
| GET/HEAD | `/p/:slug` | — | `/p/:slug/` へ301 |
| GET/HEAD | `/p/:slug/<path>` | 閲覧パスワード(あれば) | 最新版のファイル配信 |
| GET/HEAD | `/p/:slug/v/:n/<path>` | 同上 | 確定済み版nのファイル配信 |

配信の詳細仕様:
- パスが `/` で終わる(または空)なら `index.html` を補完。
- 拡張子なしパスでオブジェクトが無い場合、`<path>/index.html` が存在すれば `<path>/` へ301
  (相対リンクを正しく解決させるため)。
- Content-Type は **配信時に拡張子から決定**(クライアント申告は信用しない)。
  未知の拡張子は `application/octet-stream`。全レスポンスに `X-Content-Type-Options: nosniff`。
- キャッシュ: 最新URL(`/p/<slug>/`)は `no-cache`(同じURLで即座に新版が見えること優先)。
  版指定URLは確定後不変なので `max-age=3600`(パスワード付きは `private`)。
- `ETag`(R2のhttpEtag)+ `If-None-Match` → 304 対応。`Range` リクエスト(動画のiOS再生に必要)対応。
- 予約パス: 配信ルート直下の `v/<数字>/` はバージョンURLとして予約(制約として明記)。

## 認証フロー

### 管理側 (/admin, /api)
1. `ADMIN_TOKEN` は `wrangler secret put ADMIN_TOKEN` で設定(コード・設定ファイルに書かない)。
   未設定時は500でセットアップ手順を案内(認証素通りにはしない)。
2. `/admin` はBasic認証: ユーザー名は任意(慣例で `admin`)、パスワードにADMIN_TOKEN。
   ブラウザは同一オリジンのfetchに認証情報を自動付与するため、管理画面JSはトークンを
   保持しない(localStorage等に保存しない)。
3. `/api` はBasic(パスワード=トークン)と `Authorization: Bearer <トークン>` の両対応
   (curl・テスト用)。
4. トークン比較は SHA-256 digest 同士の `timingSafeEqual`(長さ差も含め定数時間)。
5. **CSRF対策**: 書き込み系(/apiのGET以外)は独自ヘッダ `X-Atari-Admin: 1` を必須にする。
   独自ヘッダ付きクロスオリジンリクエストはCORSプリフライトが必要で、本WorkerはCORSを
   一切許可しない(プリフライトに応答しない)ため、Basic自動付与を悪用したCSRFを遮断できる。
6. 管理画面HTMLはリクエストごとのnonce付きCSP(`script-src 'nonce-…'`)、
   `X-Frame-Options: DENY`、`Referrer-Policy: no-referrer`、`Cache-Control: no-store`。

### 閲覧側 (/p)
1. 案件メタの `auth` が null なら誰でも閲覧可。
2. `auth` があれば Basic認証。`WWW-Authenticate: Basic realm="<slug>", charset="UTF-8"` を返す
   (realmに入るslugは英数ハイフンのみ=ヘッダインジェクション不可)。ユーザー名は任意。
   iPhone Safari の標準ダイアログで開ける。
3. パスワードは UTF-8 でデコード(atob→バイト列→TextDecoder)し、salt付きSHA-256を
   定数時間比較。

## アップロードのシーケンス(直列アップロード)

```
管理画面JS                                Worker
   │ POST /api/projects/:slug/versions      │ nextVersionを採番して返す {version: n}
   │──────────────────────────────────────▶│ (KV書き込み)
   │ PUT …/versions/n/files?path=index.html │
   │──────────────────────────────────────▶│ R2 put sites/slug/vn/index.html
   │ PUT …/versions/n/files?path=css/a.css  │  … 1ファイルずつ直列(本文サイズ制限と
   │──────────────────────────────────────▶│     無料枠の同時実行を考慮)
   │ POST …/versions/n/finalize             │ R2 listで件数確認(0件なら400)
   │──────────────────────────────────────▶│ latestVersion=n, versions追記 (KV書き込み)
```

- ファイル本文はリクエストボディそのもの(multipart不使用)。Content-Length既知なら
  ストリームのままR2へput(メモリに乗せない)。1ファイル上限95MB(プラットフォーム上限100MBの手前)。
- 採番(allocate)と確定(finalize)が1秒以内に連続するとKVの同一キー書き込みレート
  (1回/秒)に当たる可能性があるため、KV putは失敗時1.1秒待って最大3回リトライ。
- 途中失敗時はその版を確定しない(finalizeしない)。最新URLは前の版のまま=安全側。
  放棄された版の番号は欠番になる(実害なし)。

## 管理画面 (1枚HTML)

- TypeScriptソース内の文字列として保持(`src/adminHtml.ts`)。wranglerの標準バンドルのみで
  完結し、ビルド工程・追加ツールなし。vitest-pool-workers でもそのまま動く。
- 素のJS。フォルダD&Dは DataTransfer の `webkitGetAsEntry()` で再帰走査
  (`readEntries` は100件ずつしか返さないためループで全件読む)。
  フォールバックとして `<input webkitdirectory>` のフォルダ選択ボタンも用意。
- 単一フォルダをドロップした場合はフォルダ名の階層を剥がしてルート直下に展開
  (`site/index.html` → `index.html`)。複数アイテムのドロップは相対パスをそのまま使う。
- `.DS_Store` / `Thumbs.db` / `desktop.ini` はクライアント側でスキップ。
- 動的な値のDOM反映は `textContent` / `createElement` のみ(innerHTMLに動的値を入れない)。
- UIは日本語・装飾最小限。スマホは閲覧のみ対応(管理はPC前提)。

## 制約・既知の限界(意図した割り切り)

| 項目 | 内容 |
|---|---|
| 配信サイト内の予約パス | サイト直下の `v/<数字>/…` はバージョンURLに解釈される |
| KVの結果整合性 | finalize直後、別リージョンからの閲覧に最大~60秒の伝播遅延があり得る |
| 一覧上限 | 管理画面の一覧は40案件まで(無料枠のサブリクエスト上限対策) |
| レート制限 | Basic認証の試行回数制限なし(個人ツール前提。強度はパスワード長で担保) |
| 案件削除 | v1では未実装(R2の大量削除はサブリクエスト上限と絡むため将来課題) |
| 同時実行 | 管理者1人が前提。採番の同時実行競合は対策しない |
