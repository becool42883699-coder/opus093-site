# CLAUDE.md

このファイルは `becool42883699-coder/opus093-site` リポジトリでの作業方針・決定事項をまとめたもの。
新しいセッションはここを読んでから作業を始めること。

> ## 最重要ルール
> **スマホ表示を絶対に崩さないこと。** どんな小さな変更でも、作業完了前に必ず
> モバイル幅（390px前後）で見た目とスクロール動作を検証する（§4参照）。
> 「PCでは直った、スマホは未確認」のまま完了報告しない。

## 1. プロジェクトの構成と目的

- Next.js（App Router / Turbopack）+ React + TypeScript のマルチページサイト。
- 本作業の対象は `/becool` 配下（GARAGE BeCool、福岡県北九州市の中古車販売・整備店の
  コーポレートサイト）。他ルート（`/about` 等）は基本的に触らない。
  ページは `/becool`（TOP）/ `/becool/contact` / `/becool/maintenance` / `/becool/stock`。
- スタイリングは **CSS Modules のみ**（`app/becool/becool.module.css`）。Tailwind・
  shadcn・`@/` パスエイリアスは使わない方針。
- **ホスティング（2系統・移行中）**:
  - **現状の実運用・検証先**: 静的エクスポート → GitHub Actions
    （`.github/workflows/deploy-pages.yml`）が `main` push を `gh-pages` ブランチへ
    デプロイ。公開URL: `https://becool42883699-coder.github.io/opus093-site/becool/`。
    ビルドコマンド: `NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/opus093-site npm run build`
    → `out/`。これまでの動作確認・デプロイは全てこの経路。
  - **将来/並行の配置先**: Xserver上で既存のWordPressサイトと**同居**させる形で
    この静的HTML出力を配置する想定がある（`out/` をそのまま、またはWordPressのURL構造と
    衝突しないサブディレクトリへ）。`.htaccess` はWordPress側の設定を壊さないよう
    **触らない**（`.claude/settings.json` で編集を拒否済み）。配置パス・ベースパスの
    扱いは未確定なので、着手時は必ずユーザーに確認すること。
- 依存追加は原則禁止。3D/粒子演出はすべて既存の `three`（1つだけの実行時依存）を使う。
  GSAP・Framer Motion・Lenis 等は無断で追加しない。

## 2. 確定した仕様・デザイン方針

### ヒーローロゴ演出
- `app/becool/page.tsx` の `HERO_ANIM` 定数で切替（`logo | glass | particle | sweep | blueprint`）。
  5パターンとも実装は残置し、コードを消さずに定数変更だけで戻せるようにしてある。
- **現在の既定値は `"logo"`**＝演出なしの元のブランドロックアップ（SINCE 1999入り、
  `HeroFullLogo`）。ユーザーが「元のSINCEのやつに戻して」と指定した確定状態。
  過去に `glass` / `blueprint` を経由しており好みは固定ではないので、切替依頼が
  来たら該当行を変えるだけで対応する。
- `glass` に戻す時のチューニング方針（確定・踏襲すること）: 立体感と厚みは最小限、
  強い白ハイライト・太い発光輪郭・濃い青の“透明ガラス”感は禁止（roughnessを上げて
  マット寄りにし、ネイビーは `tint` の density で乗せる）。常時回転は使わず傾きは
  スクロール連動で2〜4度だけ。背景は常に透明。

### 演出コンポーネントの割当（Canvas UI ボキャブラリー）
- **Glass Object**（公式ソースを `vendor/canvas-ui/` にベンダリング）→ ヒーローロゴ。
- **Ripple**（自前実装 `HeroRipple.tsx`）→ ロゴのクリック反応。ロゴ形成/読込完了後のみ有効。
- **Grid**（CSS実装）→ CUSTOM サービスパネルの背景に極薄グリッド。
- **Particle Object**（公式ソースをベンダリング）→ フッター直前のクロージング
  ブランドマーク（`FooterParticleMark.tsx`）。ヒーローではない。
- **Particle Scroll**（自前実装 `ParticleScrollReveal.tsx`）→ PICK UP（在庫車）の写真が、
  初回スクロール到達時に**1回だけ**砂状の粒子から組み上がる。
- **Peel**（自前実装 `PeelReveal.tsx`）→ ABOUT セクションの写真。ネイビーの設計図を
  斜めにめくって完成写真を露出、**1回だけ**。

  **重要**: Canvas UI 公式の `Peel` / `ParticleScroll` は実験的な HTML-in-Canvas API
  （`drawElementImage` / `requestPaint`）が前提で、一般ブラウザでは演出が無効化される
  （＝本番で何も起きない）。そのため **この2つだけは自前実装している。**

### SERVICE セクション（カード型UI・確定）
- `app/becool/page.tsx` の `SVC_UI` 定数で切替。**確定値は `"B"`**（ユーザー選択）。
  `"A"`（ダークカード2列・常時4件表示）も残置してあるので定数1行で戻せる。
- 案B = 明るいカード。PC(861px〜)はタブ切替、モバイルは横スワイプ(scroll-snap)。
  切替は**ラジオ+CSSのみ**でJS無効でも4件すべて読める。
- 崩してはいけない構造: 1サービス=1カード / 上=画像ブロック(3:2・`object-fit:cover`・
  `loading="lazy"`・width/height属性) / 下=テキストブロック。**写真に文字を重ねない**。
  本文とボタン文言は `SERVICES` 配列の値をそのまま使う（要約・言い換え禁止）。
- 新規クラスは全て `bc-svc-` 接頭辞。白背景の日本語サブだけ `--bc-blue`（対白5.97:1）を
  使う（`--bc-blue-light` は対白2.89:1で不足するため明地では使わない）。

### CONTACT ページの統一スクロール演出（確定）
- トークンは `tokens.css` の `--anim-duration` / `--anim-duration-slow` / `--anim-ease` /
  `--anim-stagger` / `--anim-distance` の5つ。**演出の種類ごとに値を変えない**のが統一感の核。
  新しい演出を足す時も必ずこのトークン経由で書く。
- `ScrollAnim.tsx` が IntersectionObserver(threshold 0.15 / rootMargin `0px 0px -10% 0px`)で
  `[data-reveal]` に `.isInview` を一度だけ付与＋スクロール進捗バーを rAF で `scaleX` 更新。
- 種類は `data-reveal="line|stagger|up|zoom"` の4つだけ。line=見出し(EN→下線scaleX→和文)、
  stagger=カード群(+アイコンは0.2s後に scale(0.8)→1)、up=フェードアップ、zoom=写真 scale(1.08)→1。
- no-JS安全の作り: 「アニメ前」の指定は全て `:global([data-anim-ready]) …:not(.isInview)` で
  ゲート。JS無効・初期化失敗・reduced-motion では属性が付かず `opacity:0` が残らない。
- ヒーローは `100svh` のまま（`100dvh` はiOS SafariでURLバー開閉に追従して高さが動くため不採用）。
- TOPページは旧来の `RevealController`（`data-motion-ready` + `.reveal` / `.isIn`）のまま。
  **2系統が併存している**ので、どちらを触っているか毎回確認すること。

### 全ページ共通の統一ルール（確定・4ページとも適用済み）
色味がページ・コンポーネントごとに散っていたのを、下の4点で固定した。
**新しいセクションを足す時も必ずこの枠内に収めること。**

1. **面（背景）は2色だけ。** `--bc-white`（白）と `--bc-ink-soft`（暗ネイビー
   #222a34＝フッター・ステートメント帯と同じ色）のみ。セクションごとに
   `.surfaceWhite` / `.surfaceDark` を**明示して交互に**敷く（白→暗→白→暗）。
   コンポーネント側に背景を持たせない（第3の色が生えるため）。
   - `.surfaceDark` は `--bc-ink` / `--bc-muted` / `--bc-blue` / `--bc-line` を
     on-dark 系へ**トークンごと差し替える**方式。個々の要素に色を指定して回らないので、
     後からセクションを足しても自動で追従する。
   - ただし暗い面に載る**白いカードの中は明地用トークンへ戻す**（`-fixed` を参照）。
     カードを新設したら `.surfaceDark :is(…)` のリストに必ず追加すること。
     忘れると白カードに白文字が乗って読めなくなる。
   - `--bc-paper`（#f4f7fa）はセクションの面には使わない（写真タイルの下地等のみ）。
     旧 `--bc-works-bg`（#e7ecf2）は paper のエイリアスなので新規に使わない。
   - 例外: TOPの ABOUT と SHOWROOM だけ白が連続する。直前のコンセプト帯が暗いので
     ABOUT を白にして段差を作っており、SHOWROOM は写真がフルブリードで面の色が
     ほぼ見えないため。検証スクリプトでも SHOWROOM は交互判定から除外している。
2. **暗幕（スクリム）と影の黒は1つだけ。** 必ず `rgba(var(--bc-scrim-rgb), α)`
   （影は `--bc-shadow-rgb`）で書く。以前は同じ役割の暗幕に黒が6種類あり、
   彩度0%〜43%でページごとに色味が転んでいた。生の `rgba(0,0,0,…)` を持ち込まない。
   ヒーローの暗幕は3ページとも `--bc-scrim-hero`（1つのレシピ）を使う。
3. **文字サイズは役割トークンで決める。** カード見出し=`--bc-fs-card-title` /
   カード本文=`--bc-fs-card-body` / 欧文極小ラベル=`--bc-fs-label`+`--bc-ls-label` /
   和文サブ見出しの字間=`--bc-ls-jp`。以前はカード見出しが5サイズ・本文が5サイズ・
   和文サブの字間が3種類に散っていた。`font-size` を直書きしない。
4. **ヘッダーは4ページとも透明オーバーレイ**（`<BecoolHeader overlay />`）。
   先頭が全幅の暗いヒーローなのはどのページも同じ。ヒーローを抜けたら
   `HeaderScrollController` が白下地へ戻す。切替の閾値は `[data-hero]` の**高さ**から
   求める（§3-13 参照）。JS無効時は `Chrome.tsx` の `noscript` が常時白下地に固定する。

- 例外は **LINE のブランドカラー**（`--bc-line-green`）だけ。LINE 関連の要素以外に
  使わない。「営業中」バッジも以前は独自の緑だったが、ブランドブルーに統一済み。

### デザインルール（禁止事項）
- 配色は 白 / ライトグレー / チャコール / ネイビー / ブランドブルーのみ。
- 生成り・ベージュ・紙質テクスチャ・レーザー・グリッチ・VHS・火花・炎・
  大きな水しぶき・強い発光・激しい回転・強いバウンド・ページ全体の歪み・
  全セクション粒子化・派手な3Dカメラ移動は禁止。

### アクセシビリティ / パフォーマンス階層
- `prefers-reduced-motion: reduce` → 全演出停止、静的SVG/写真を表示。
- WebGL非対応 → 静的フォールバック（`hasWebGL()` で `webgl2`/`webgl`/`experimental-webgl`）。
- 端末性能ティア（`hardwareConcurrency` / `deviceMemory` / `saveData` / 画面幅）で粒子数を
  調整。目安: 高性能PC ≤18000、標準PC 12000-16000、モバイル 5000-8000、低性能・
  データセーバー → 0（=SVGフォールバック）。
- 画面外・タブ非表示は IntersectionObserver + `visibilitychange` で停止/アンマウントし
  GPUを解放。再表示で再開。

## 3. 踏んだ地雷と再発防止ルール

1. **clip-pathで隠した要素はIntersectionObserverが発火しない**
   `[data-reveal-img]` を直接IOで監視すると可視面積0のため交差判定が来ず、
   永久に表示されないデッドロックになった。
   → IOで監視するのは親の `[data-reveal]` セクションのみ。写真側のclip解除は
   CSSで `.reveal.isIn [data-reveal-img]` として連動させる。

2. **能力判定前に「完成ロゴが一瞬見えて粒子へ切り替わる」問題**
   WebGL初期化完了までSVGフォールバックが不透明のままだと「完成形→崩壊」に見える。
   → 判定完了前・粒子/ガラス起動時はSVGを**低い不透明度の下地**として表示し、
   `onLoad` 完了で自然にクロスフェード。

3. **useEffect内でのstate初期化順序の鶏卵問題**
   `PeelReveal` で「refが存在する条件」と「refを描画させるstate」を同じuseEffect内で
   扱い、初回は必ずrefがnullで早期returnするバグを作った。
   → フラグを立てる処理とそのフラグに依存するDOM操作は別のuseEffectに分離する。

4. **検証用ローカルサーバーの静的ファイルが古いまま**という事故
   symlink経由の`python3 -m http.server`使い回しで、リビルド後も古い内容を返し続けた。
   → ビルドし直したら**サーバープロセスを殺して再起動**、symlinkも作り直す。

5. **スマホ / iOS Safari 表示での注意点**（最重要ルールの再発防止策）
   - 演出用canvasは **必ず `pointer-events: none` + `touch-action: auto`** をモバイルで
     強制上書き（ベンダーのinline styleが `touch-action: none` を当てて縦スクロールを殺す）。
   - 実装後は必ず `document.documentElement.scrollWidth > clientWidth` で**横スクロール**を確認。
   - モバイルは粒子数を大幅に減らし、`radius`/`strength` 等のホバー系は0にする。
   - reduced-motion・低性能端末・画面外では演出を**確実にアンマウント**する
     （iOS SafariがWebGLコンテキストを掴んだまま重くなるのを防ぐ）。
   - Playwrightの `isMobile/hasTouch` + `deviceScaleFactor` を上げた検証を必ず通す
     （見た目だけでなく実際にスクロール操作して確認）。
   - `background-attachment: fixed` は使わない。ビューポート高さは `100svh`。

6. **Next 16 で `next lint` コマンドが廃止**。→ `npm run lint`（`eslint .`）を使う。

7. **reveal用CSSがカードの表示制御を詳細度で上書きする**
   `:global([data-motion-ready]) .reveal.isIn .bc-svc-card { opacity: 1 }` が
   タブ側の `.bc-svc-panels .bc-svc-card { opacity: 0 }` に詳細度で勝ち、
   非選択のカード4枚が重なって表示された。
   → 汎用のreveal規則は必ず**そのUI専用の親クラス配下に限定**する
   （案A用は `.bc-svc-grid` 配下、案Bはブロック単位でreveal）。

8. **`position: relative` の要素は後続の非配置要素より上に描画される**
   画像ブロック(`position:relative`)が、負のmarginで重ねた円アイコンバッジの
   上半分を隠していた（アイコンが切れて見える）。
   → 重ねる側にも `position: relative; z-index` を明示する。
   暗い写真に濃色の円が溶ける問題は白いリング(`box-shadow: 0 0 0 6px`)で解決。

9. **ヘッドレスChromiumは既定で `prefers-reduced-motion: reduce`**
   Playwrightの既定コンテキストでは `data-motion-ready` / `data-anim-ready` が付かず、
   **演出が一切動いていない状態を「正常」と誤判定する**。
   → 演出の検証時は必ず `newContext({ reducedMotion: 'no-preference' })` を付ける。

10. **`npm run dev` ではクライアント側が hydrate しない**（この環境の既知事象）
    イベントハンドラも `useEffect` も動かず演出が全く出ないのに、コンソールエラーは出ない。
    → **演出の検証は必ず静的エクスポート**（`out/` を `python3 -m http.server` で配信）で行い、
    dev サーバーの結果を根拠に「動いていない」と判断しない。

11. **Playwright の `element.screenshot()` は表示制御を無視することがある**
    `captureBeyondViewport` の影響で `visibility:hidden` / `opacity:0` の要素まで写り込み、
    タブUIが「4枚重なって壊れている」ように見えた（実際は正常）。
    → 表示状態の判定は `page.screenshot({ clip })` か `getComputedStyle` で行う。

12. **squash-merge運用でのブランチ再利用**
    同じ作業ブランチに次の変更を積むと、旧コミットが「mainにマージ済み」と衝突して
    pushが弾かれる。→ `git fetch origin main` → `git checkout -B <branch> origin/main`
    で作り直してから積む。**未マージの作業が残っている場合は絶対にやらない**
    （stashで退避できているか必ず確認してから実行する）。

13. **stickyな要素の `offsetTop` / `getBoundingClientRect()` はスクロール量に追従する**
    ヘッダーの透明→白下地の切替閾値を「ヒーローの下端」から求めようとして、
    `offsetTop + offsetHeight` で計算した。トップのヒーローは `position: sticky` で
    貼り付いている間、**offsetTop が scrollY と一緒に増え続ける**ため閾値が永遠に
    先へ逃げ、モバイルで一度も白下地に戻らなかった（デスクトップでは偶然通過した
    ので気付きにくい）。→ ヒーローは4ページとも main の先頭・ヘッダーは fixed で
    場所を取らないので、**下端＝ヒーローの `offsetHeight`** で求める。

14. **CSS Modules の規則は `!important` 同士だと詳細度で決まる**
    JS無効時の保険に `noscript` で `header[data-overlay="true"]{…!important}` を
    当てたが、透明化側の `:global(.becool) .header[data-overlay]:not([data-scrolled])`
    の方が詳細度が高く、背景だけ効かなかった（文字色は効いたので気付きにくい）。
    → 属性セレクタを重ねて詳細度を明示的に上回らせる。**`!important` を付けたから
    勝つ、と思い込まない。**

## 4. 今後の作業で守るべきルール

- **変更後は必ずモバイル幅（390px前後）で検証してから完了報告する**（最重要）。
  PC幅の確認だけで終わらせない。
- 新規npm依存は追加しない。既存の `three` / IntersectionObserver / ResizeObserver /
  requestAnimationFrame / CSS Modules の範囲で実装する。
- 演出を追加・変更する時は必ず: (a) reduced-motion, (b) WebGL非対応, (c) JS無効,
  (d) モバイルのタッチスクロール、の4点をPlaywrightで検証してからデプロイする。
- コンソールエラー・TypeScriptエラー・lintエラー（新規追加分）はゼロが前提。
  既存の pre-existing なエラー（`MobileMenu` / `TrmMenu` のsetState警告2件）は触らない。
- デザインルール（配色5色・禁止演出リスト）は毎回のレビュー基準にする。
- 既存の演出（Ripple・Grid・Particle Object・Particle Scroll・Peel・ScrollAnim）は、
  明示的に依頼が無い限り削除・全面書き換えしない。
- `.htaccess` は編集しない（Xserver側WordPressの設定を壊すリスクがあるため）。
- 作業ブランチはセッションごとに指定される（直近は `claude/becool-site-continue-x8nzr3`）。
  指定が無ければ既存の作業ブランチを使い回し、都度作り直さない。
  コミットメッセージ末尾には `Co-Authored-By` / `Claude-Session` トレーラーを付ける。
- デプロイは PR → main へ squash-merge → Actions「Deploy to GitHub Pages」の成功を確認、
  まで見届ける。マージしただけで完了報告しない。

## 5. この作業環境の制約（毎回ハマるので先に把握すること）

- **公開URL（github.io）へは外部アクセスできない**（プロキシが403）。デプロイ後の実表示を
  こちらから確認する手段が無いので、**マージ前にローカルの静的ビルドで検証を完結**させる。
  Actionsの成否だけは MCP の `actions_get` で確認できる。
- GitHub Pages のCDNはHTMLを約10分キャッシュし、**ブラウザをまたいで共有される**。
  ユーザーが「変わってない」と言った時はまず `?v=N` を付けて確認してもらう。
- `gh` CLI は無い。GitHub操作は全て `mcp__github__*` ツールを使う。
- WebKit は未インストールなので iOS Safari の実エンジン検証はできない。
  Chromium の `isMobile/hasTouch` エミュレーションで代替し、その旨を報告に明記する。
- 検証用サーバーは `out/` へのsymlink経由で立てる。リビルドしたら
  **プロセスを落として立て直す**（§3-4）。
