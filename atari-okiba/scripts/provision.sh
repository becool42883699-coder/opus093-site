#!/bin/sh
# R2バケットとKVネームスペースが無ければ作り、KVのidを wrangler.jsonc に書き込む。
# ローカル(setup.sh)とGitHub Actionsの両方から呼ぶ。
# 前提: カレントディレクトリが atari-okiba/ で、wrangler が認証済みであること。
set -eu


BUCKET="atari-okiba-files"
KV_BINDING="META"
CONFIG="wrangler.jsonc"
PLACEHOLDER="00000000000000000000000000000000"


say() { printf '%s\n' "$1"; }


# --- R2バケット -------------------------------------------------------------
say "▶ R2バケット($BUCKET)を確認しています…"
if npx wrangler r2 bucket list 2>/dev/null | grep -q "$BUCKET"; then
  say "  既にあります。作成をスキップしました。"
else
  if npx wrangler r2 bucket create "$BUCKET" 2>/tmp/atari-r2.err; then
    say "  作成しました。"
  else
    say ""
    say "✘ R2バケットを作成できませんでした。"
    say "  R2は最初に一度だけ、ダッシュボードでの有効化が必要です:"
    say "    https://dash.cloudflare.com/ → 左メニュー「R2」→ 案内に従って有効化"
    say "  (無料枠10GB。有効化時に支払い情報を求められることがありますが、無料枠内なら課金されません)"
    say ""
    say "  wranglerからのエラー:"
    sed 's/^/    /' /tmp/atari-r2.err
    exit 1
  fi
fi


# --- KVネームスペース -------------------------------------------------------
say "▶ KVネームスペース($KV_BINDING)を確認しています…"


# 既存のネームスペースを探す。タイトルは "<worker名>-<binding>" 形式で作られる。
KV_ID=$(npx wrangler kv namespace list 2>/dev/null \
  | tr -d ' \n' \
  | sed 's/},{/}\n{/g' \
  | grep -i "$KV_BINDING" \
  | grep -o '"id":"[0-9a-f]\{32\}"' \
  | head -n 1 \
  | cut -d'"' -f4) || true


if [ -n "${KV_ID:-}" ]; then
  say "  既にあります(id: $KV_ID)。作成をスキップしました。"
else
  say "  作成します…"
  KV_OUT=$(npx wrangler kv namespace create "$KV_BINDING" 2>&1) || {
    say ""
    say "✘ KVネームスペースを作成できませんでした。wranglerからのエラー:"
    printf '%s\n' "$KV_OUT" | sed 's/^/    /'
    exit 1
  }
  KV_ID=$(printf '%s' "$KV_OUT" | grep -o '[0-9a-f]\{32\}' | head -n 1)
  if [ -z "$KV_ID" ]; then
    say ""
    say "✘ 作成はできましたが、idを読み取れませんでした。以下の出力から32桁のidを探して、"
    say "  $CONFIG の \"id\": \"$PLACEHOLDER\" と置き換えてください。"
    printf '%s\n' "$KV_OUT" | sed 's/^/    /'
    exit 1
  fi
  say "  作成しました(id: $KV_ID)。"
fi


# --- wrangler.jsonc に反映 --------------------------------------------------
if grep -q "$PLACEHOLDER" "$CONFIG"; then
  # sedの区切りに / を使わない(idは16進数なので衝突しない)
  sed -i.bak "s/$PLACEHOLDER/$KV_ID/" "$CONFIG"
  rm -f "$CONFIG.bak"
  say "▶ $CONFIG にKVのidを書き込みました。"
elif grep -q "\"id\": \"$KV_ID\"" "$CONFIG"; then
  say "▶ $CONFIG は既に正しいidになっています。"
else
  say "▶ $CONFIG には別のidが設定済みです。そのまま使用します。"
fi
