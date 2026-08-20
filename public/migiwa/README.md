# 汀ノ庭 / MIGIWA STUDIO

福岡県北九州市小倉北区のホームページ制作 MIGIWA STUDIO のポートフォリオサイト。

## 状態

**制作中。まだ公開できる状態ではない。** 本文は差し替え途中で、
T-REX WORKS のコピーがまだ残っている箇所がある。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | TOP。水面から海底まで潜る3D表現(three.js / WebGL)＋本文 |
| `site.config.js` | 変わりうる値を集めた1ファイル。未確定は `PENDING` |
| `vendor/three/` | three 0.185.1 の自前配布。`scripts/vendor-three.mjs` が生成 |

`index.html` は `public/lab/trexworks_umiatari_v6.html` を土台にしている。
水中の演出・降格経路・自動品質調整の作りはそちらと共通。

## 検証

```
node scripts/verify.mjs --src=public/migiwa/index.html --tier=high
node scripts/verify.mjs --src=public/migiwa/index.html --view=iphone2
```

`--tier=high` を付けないと、検証機は hardwareConcurrency が小さいため
必ず low ティアになり、high 側にしかない経路(水面の映り込み)が
一度も動かないまま「通った」ことになる。

## 決まっていること

- サイト名の表記は「汀ノ庭」の4文字のみ。**読み・ふりがな・由来は出さない**
- **電話番号は載せない**。導線は LINE / フォーム / メール の3つ
- 法人は未設立。**設立年・代表者名・価格は出さない**
- 自社サイトにAIのデモは載せない(説明のみ)
- 「お客様の声」は作らない。ロゴ制作はサービスに含めない
- 拠点は福岡県北九州市小倉北区まで。番地は出さない

## 未確定(`site.config.js` の PENDING と `PROVISIONAL`)

ドメイン / フォームの送信先 / LINE公式アカウント / 公開するメールアドレス /
現地訪問に応じる範囲 / FAQの回答(納期・修正回数・遠方対応・予算) /
制作実績3件の詳細 / L tAq が何の案件か

FAQ の回答は「仮でいいから作っておいて」という指示で書いた草案。
**事業上の約束になるので、公開前に必ず本人の確認を取ること。**

## 置き先

Cloudflare Pages を想定。フォームは `functions/api/contact.js` を置いて
`site.config.js` の `contact.formAction` を `/api/contact` に向ければ動く。
