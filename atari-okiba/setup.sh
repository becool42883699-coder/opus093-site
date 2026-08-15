#!/bin/sh
# あたり置き場 かんたんセットアップ
# 使い方: atari-okiba フォルダの中で  sh setup.sh
# ログイン → R2作成 → KV作成&設定反映 → 鍵の設定 → デプロイ まで一気に行います。
set -eu

cd "$(dirname "$0")"

say() { printf '%s\n' "$1"; }
line() { say "────────────────────────────────────────"; }

line
say " あたり置き場 セットアップ"
line
say ""

# --- 0. Node確認 ------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  say "✘ Node.js が見つかりません。https://nodejs.org/ja から入れてください(v20以上)。"
  exit 1
fi

# --- 1. 依存パッケージ ------------------------------------------------------
say "▶ 部品を入れています(少し時間がかかります)…"
npm install --silent
say "  完了。"
say ""

# --- 2. Cloudflareログイン --------------------------------------------------
if npx wrangler whoami 2>/dev/null | grep -qi "You are logged in"; then
  say "▶ Cloudflareには既にログイン済みです。"
else
  say "▶ Cloudflareにログインします。ブラウザが開くので「Allow」を押してください。"
  npx wrangler login
fi
say ""

# --- 3〜4. R2 と KV ---------------------------------------------------------
sh scripts/provision.sh
say ""

# --- 5. 管理トークン --------------------------------------------------------
say "▶ 管理画面の鍵(ADMIN_TOKEN)を設定します。"
if command -v openssl >/dev/null 2>&1; then
  TOKEN=$(openssl rand -base64 24)
else
  TOKEN=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64'))")
fi

printf '%s' "$TOKEN" | npx wrangler secret put ADMIN_TOKEN >/dev/null 2>&1 || {
  say "✘ 鍵の設定に失敗しました。手動で次を実行してください:"
  say "    npx wrangler secret put ADMIN_TOKEN"
  exit 1
}

line
say " 管理画面の鍵(この画面にしか出ません。今すぐ控えてください)"
say ""
say "   $TOKEN"
say ""
line
say ""

# --- 6. デプロイ ------------------------------------------------------------
say "▶ 公開します…"
npx wrangler deploy
say ""
line
say " 完了しました。表示された https://atari-okiba.〇〇.workers.dev の"
say " 末尾に /admin を付けて開き、上の鍵を貼り付けてログインしてください。"
line
