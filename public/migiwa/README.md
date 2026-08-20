# 汀ノ庭 / MIGIWA STUDIO

福岡県北九州市小倉北区のホームページ制作 MIGIWA STUDIO のポートフォリオサイト。

## 状態

**本文は入っているが、まだ公開できる状態ではない。**
FAQ の回答や取引条件など、事業上の約束になる記述が仮のまま入っている。
該当ブロックは `<html data-draft="1">` の間だけ画面に「要確認」が出る。
一覧は `公開前チェック.md`（52件）。全部確認したら `data-draft` を外す。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | TOP。水面から海底まで潜る3D表現(three.js / WebGL)＋本文 |
| `works/index.html` | 制作実績。3Dは載せず読みやすさを優先。JS無効でも全文読める |
| `copy.json` | **本文の生成元。** ここを直して `node scripts/build-migiwa.mjs` |
| `site.config.js` | 変わりうる値を集めた1ファイル。未確定は `PENDING` |
| `公開前チェック.md` | 仮の記述52件。公開前に本人が確認する項目 |
| `NOTES.md` | 査読で採らなかった指摘と、その理由 |
| `vendor/three/` | three 0.185.1 の自前配布。`scripts/vendor-three.mjs` が生成 |

`index.html` は `public/lab/trexworks_umiatari_v6.html` を土台にしている。
水中の演出・降格経路・自動品質調整の作りはそちらと共通。

## 検証

```
node scripts/verify.mjs --src=public/migiwa/index.html --tier=high
node scripts/verify.mjs --src=public/migiwa/index.html --view=iphone2

# 2ページ間のリンクを実際に辿る(out/ を作ってから)
NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/opus093-site npm run build
node scripts/check-links.mjs
```

リンク検査は必ず `out/` に対して行う。`public/` を配ると `/becool/` が
無いので、生きているリンクまで404に見える。

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
- 制作実績は **GARAGE BeCool / T-REX CO., LTD. の2件**。
  以前あった `L tAq` は元ファイルの残骸で実在しないため、全て削除した。
  実績を増やす時は `copy.json` と `index.html` の `WORKS` の両方を直す
  (件数の表示・カードの配置・構造化データはそこから作られる)

## 未確定(`site.config.js` の PENDING と `PROVISIONAL`)

ドメイン / フォームの送信先 / LINE公式アカウント / 公開するメールアドレス /
現地訪問に応じる範囲 / FAQの回答(納期・修正回数・遠方対応・予算) /
取引条件(相談と見積もりは無料か / 支払いの回数 / 返信の目安)

FAQ の回答は「仮でいいから作っておいて」という指示で書いた草案。
**事業上の約束になるので、公開前に必ず本人の確認を取ること。**

## 置き先

Cloudflare Pages を想定。フォームは `functions/api/contact.js` を置いて
`site.config.js` の `contact.formAction` を `/api/contact` に向ければ動く。
