# koueikasei.jp 再現 — 調査・検証ハーネス

元サイトを目測ではなく実測で再現するための道具一式。
**実装より先にここを回し、出力を唯一の根拠にする。**

## 前提: ネットワーク許可が要る

このリポジトリのクラウド環境は既定で **Trusted**（パッケージレジストリと GitHub のみ）のため、
`koueikasei.jp` への CONNECT が egress ゲートウェイに 403 で弾かれる。

```
$ node scripts/koueikasei/probe.mjs
BLOCKED  koueikasei.jp  (Request was cancelled.)
```

### 許可手順

1. claude.ai/code のクラウド環境の設定を開く（雲アイコン → 環境を編集）
2. **Network access** を **Custom** にする
3. **Allowed domains** に以下を1行ずつ入れる

   ```
   koueikasei.jp
   *.koueikasei.jp
   ```

   素材が別ドメイン（CDN・Shopify 等）から来ている場合はそのホストも足す。
   実際の配信元は許可後に `assets.json` で確認できる。
4. **「Also include default list of common package managers」にチェックを入れる**
   （外すと npm と GitHub が落ちて、この環境でビルドできなくなる）
5. 保存し、**新しいセッションを開始する**
   ネットワークポリシーはセッション作成時に VM へ適用されるため、
   稼働中のこのセッションには遡って効かない。

`Full`（全ドメイン許可）でも可。その場合 3〜4 は不要。

許可できたかは再度 `node scripts/koueikasei/probe.mjs` で確認する。
`REACHABLE` が出れば採取に進める。

## 使い方

```bash
# 1. 元サイトから一次情報を採取（全フェーズ）
node scripts/koueikasei/capture-reference.mjs

# 一部だけ回す場合
node scripts/koueikasei/capture-reference.mjs assets styles shots

# 2. 静的ビルドを配信して自作ページと突き合わせる
NEXT_OUTPUT=export npm run build
cd out && python3 -m http.server 8080 &
node scripts/koueikasei/compare.mjs http://127.0.0.1:8080/koueikasei/
```

リビルドしたら配信プロセスを必ず落として立て直す（CLAUDE.md §3-4）。

## 採取フェーズ

| フェーズ | 出力 | 何に使うか |
|---|---|---|
| `assets` | `assets.json` / `assets/` | 実際に使われている画像・フォント・CSS/JS を確定。PC と SP 両方を踏むので出し分け素材も取れる |
| `dom` | `dom/<幅>.html` `.tree.json` | 各幅での実際のマークアップと可視ツリー |
| `styles` | `styles/<幅>.json` `css-variables.json` | 主要要素の Computed Style 全項目＋文書座標の矩形。配色トークンも抜く |
| `shots` | `shots/<幅>-full.png` `shots/<幅>/y*.png` | 全9幅のフルページと1画面刻みの連続スクショ |
| `motion` | `motion/<幅>.gsap.json` `.track.json` | GSAP/ScrollTrigger の実設定（start/end/scrub/pin/ease/stagger）と、スクロール60段階での transform・opacity・clip-path の推移 |
| `hero` | `hero/<幅>/t*.png` `.states.json` | ヒーロー切替を0.5秒×60で採取し、周期・順番・トランジションを確定 |
| `menu` | `menu/*.png` `open.html` | SP メニューの開閉フレームと開いた状態の DOM |

## 検証フェーズ

`compare.mjs` は2種類の差分を出す。

1. **幾何差分** — 元サイトと自作ページの主要ブロックをテキスト/画像名で同定し、
   文書座標・寸法・字組みのズレを px で一覧化。
   `OK` ≤4px / `NEAR` ≤16px / `OFF` >16px / `MISSING` で分類する。
   依頼の「主要ブロックの位置差を数px〜十数px以内」はここで判定する。
2. **画素差分** — 同一スクロール位置のスクショを重ね、不一致率と差分画像（赤が不一致）を出力。

主に見るのは `1440x900` と `390x844`（依頼で明示された2幅）。
`1920x1080` と `768x1024` も従として回す。

## 実装側の約束

- ヘッドレス Chromium は既定で `prefers-reduced-motion: reduce` のため、
  全コンテキストで `reducedMotion: 'no-preference'` を明示している（CLAUDE.md §3-9）。
  これを外すと「演出が動いていない状態」を正常と誤判定する。
- 画素比較は Chromium の `OffscreenCanvas` 上で行うので、pixelmatch 等の追加依存は要らない（CLAUDE.md §4）。
- Chromium はプリインストール版を `executablePath` で直接指す。
  `npx playwright install` は走らせない（環境の指示どおり）。

## 自己検証済みのノイズ下限

同一ページ同士を突き合わせる自己テストでは、幾何差分は全幅 `OK` のみ、
画素差分は 0% が基本で、**marquee のような常時動く要素を含む面だけ 1〜5% 残る**。
フレームが原理的に揃わないためで、この水準は「一致」と読む。
数値がこれを大きく超える面は実際のズレなので直す。
