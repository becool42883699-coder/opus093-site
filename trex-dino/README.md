# trex-dino

T-rex株式会社の1ページのホームページ(カーソルを目で追う恐竜ヒーロー付き)。
作業の決まりは **AGENTS.md**(Codex など)/ CLAUDE.md(Claude Code)。引き継ぎ用の最初の指示は HANDOFF_PROMPT.md。

    python3 -m http.server 8000 --directory site      # または: npx serve site

`file://` で開くと WebGL がテクスチャを読めないので、必ずローカルサーバーで開く。

確認(PC / スマホ / iPhone SE / JS無効 / 動きを減らす設定 / タッチ / 横はみ出し):

    npm install && npx playwright install chromium
    npm run verify        # 画像は verify-out/ に出る
