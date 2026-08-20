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

### 統一スクロール演出（確定・4ページとも適用済み）
- トークンは `tokens.css` の `--anim-duration` / `--anim-duration-slow` / `--anim-ease` /
  `--anim-stagger` / `--anim-distance` の5つ。**演出の種類ごとに値を変えない**のが統一感の核。
  新しい演出を足す時も必ずこのトークン経由で書く。
- **コントローラは `ScrollAnim.tsx` の1つだけ**（旧 `RevealController` は撤去・統合済み）。
  IntersectionObserver で `[data-reveal]` を監視し、一度だけ `.isInview` と `.isIn` を付与、
  ルートに `data-anim-ready` と `data-motion-ready` を立てる。
  加えてスクロール進捗バーを rAF で `scaleX` 更新。4ページとも `<ScrollAnim />` を置く。
  - `.isInview` … 統一演出（line/stagger/up/zoom）用
  - `.isIn` … 写真マスク `[data-reveal-img]` 用（TOPの clip-path 演出がこれに依存）
- 種類は `data-reveal="line|stagger|up|zoom"` の4つだけ。line=見出し(EN→下線scaleX→和文)、
  stagger=カード群(+アイコンは0.2s後に scale(0.8)→1)、up=フェードアップ、zoom=写真 scale(1.08)→1。
  対象要素には `styles.jsReveal` クラスも必ず付ける（CSSが `.jsReveal[data-reveal=…]` で書かれている）。
- 写真マスクだけは値なしの素の `data-reveal` を親セクションに付ける（`.isIn` を得るため）。
  TOPの CONCEPT / SHOWROOM / SHOP の3つ。
- no-JS安全の作り: 「アニメ前」の指定は全て `:global([data-anim-ready]) …:not(.isInview)` で
  ゲート。JS無効・初期化失敗・reduced-motion では属性が付かず `opacity:0` が残らない。
- ヒーローは `100svh` のまま（`100dvh` はiOS SafariでURLバー開閉に追従して高さが動くため不採用）。

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

7. **reveal用CSSがカードの表示制御を詳細度で上書きする**（現在は解消済み・考え方は有効）
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

14. **IntersectionObserver の threshold は「面積比」なので、背の高い要素で発火しない**
    統一演出のIOを `threshold: 0.15` のままにすると、ビューポートより遥かに高い
    セクション（SHOWROOMのスティッキー・スタック等）は交差比が最大でも
    `viewportH / elementH` にしかならず、閾値に届かず**永久に発火しない**。
    → `threshold: 0` + `rootMargin: "0px 0px -12% 0px"` で「下端から12%の位置を
    越えたら」という判定にする。要素の高さに依存しない。

15. **CSS Modules の規則は `!important` 同士だと詳細度で決まる**
    JS無効時の保険に `noscript` で `header[data-overlay="true"]{…!important}` を
    当てたが、透明化側の `:global(.becool) .header[data-overlay]:not([data-scrolled])`
    の方が詳細度が高く、背景だけ効かなかった（文字色は効いたので気付きにくい）。
    → 属性セレクタを重ねて詳細度を明示的に上回らせる。**`!important` を付けたから
    勝つ、と思い込まない。**

16. **Tailwind の @layer は globals.css に必ず負ける**（`/tomoshibi` で踏んだ）
    Tailwind v4 は既定で全部を `@layer theme/base/utilities` に入れる。CSS の
    カスケードレイヤーは**「レイヤー無しの宣言が、レイヤー内の宣言に詳細度と無関係で勝つ」**
    ため、素の `h1{color:#fff}` / `main{background:#000}` / `body{…}` を
    レイヤー無しで持っている `globals.css` に、`bg-[#F4F0E8]` も `text-[#211D19]` も
    **一切効かない**。黒地に白文字のまま出て、しかもビルドもlintも通るので気付きにくい。
    → ユーティリティだけレイヤーの外へ出す（`app/tomoshibi/tomoshibi.css` 参照）。
    ```css
    @layer theme, base;
    @import "tailwindcss/theme.css" layer(theme);
    @import "tailwindcss/preflight.css" layer(base);
    @import "tailwindcss/utilities.css" source(none);   /* ← レイヤー指定なし */
    ```

17. **framer-motion の `onError` は hydration 前に404した画像を取りこぼす**
    SSRのHTMLを受け取ったブラウザは hydration より前に読み込みを始めるので、
    `<img onError>` が張られる頃には error が終わっている。遅延読み込みの画像
    （画面外）だけ拾えて、`eager` なヒーローの3枚だけプレースホルダにならなかった。
    → マウント時に `img.complete && img.naturalWidth === 0` を見て拾い直す。

18. **framer-motion の `pathLength` は `stroke-dashoffset` を触らない**
    線画ドローの完了判定を `getComputedStyle(path).strokeDashoffset` で書いたら、
    framer が動かすのは `stroke-dasharray`(0→1)の方なので **常に 0 が返り、
    検証が無条件で素通り**していた。「58本すべて描画完了」と報告していたが、
    実際には何も測れていない。
    → 進捗は `strokeDasharray.split(',')[0]` を見る（`none` なら演出なし＝描画済み）。
    reduced-motion / JS無効 側の打ち消しも `stroke-dasharray: none !important` が
    効いている方で、`stroke-dashoffset` の指定は保険。

## 4. 今後の作業で守るべきルール

- **変更後は必ずモバイル幅（390px前後）で検証してから完了報告する**（最重要）。
  PC幅の確認だけで終わらせない。
- 新規npm依存は追加しない。既存の `three` / IntersectionObserver / ResizeObserver /
  requestAnimationFrame / CSS Modules の範囲で実装する。
- 演出を追加・変更する時は必ず: (a) reduced-motion, (b) WebGL非対応, (c) JS無効,
  (d) モバイルのタッチスクロール、の4点をPlaywrightで検証してからデプロイする。
- コンソールエラー・TypeScriptエラー・lintエラー（新規追加分）はゼロが前提。
  既存の pre-existing なエラー（`MobileMenu` / `TrmMenu` のsetState警告2件）は触らない。
- **演出を選ぶ・足す・変えるときは、先に `.claude/skills/signature-effects/` を読む。**
  業種→演出の逆引き表、1ページ1点の原則、共通実装ルール（動かしてよいCSSプロパティ、
  reduced-motion、一回発火、禁じ手）がまとまっている。`/tomoshibi` はこの A1
  「線画ドロー」を採用した実装例。
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

## 6. T-REX側（ルート `/`）— EQUIPMENT の3D車両ビューア

`/becool` とは別に、ルート側の T-REX サイト（`app/page.tsx` ほか）には
SERVICE と WORKS の間に **EQUIPMENT（対応車両）セクション**がある。
クレーン付き特装車の glTF を Three.js で表示し、光と映り込みは HDRI から取る。

### 構成ファイル
- `app/components/TruckScene.tsx` … シーン本体（"use client"）
- `app/globals.css` の「EQUIPMENT」ブロック … `.truckStage` / `.truckCanvas` / `.equipmentSpecs`
- `public/models/crane-truck.glb` … 3.4MB（gzip 1.8MB）/ 約115K三角形
- `public/assets/hdri/env.hdr` … Poly Haven「quarry_01」1K（CC0・屋外曇天）
- `public/equipment-crane-truck.webp` … 3Dを出さない環境用の静止画（透過WebP・41KB）

### 守る決まり
- three とローダーは **必ず動的import**。初期バンドルに載せない。
- HDRI は `scene.environment` にだけ入れる。**`scene.background` には使わない**
  （黒背景とサイトの世界観は変えない）。強度は `scene.environmentIntensity = 1.0`。
  読み込み失敗時は `console.warn` 1行だけ出して映り込みなしで続行する。
- 回転はスクロール連動のヨー（±0.45rad）と、**fine pointer のときだけ**ドラッグ。
  タッチではドラッグを取らない（縦スクロールを殺さないため）。
- canvas は `pointer-events:none` + `touch-action:auto`。ポインタ操作は親
  `.truckStage` 側で拾う。
- IntersectionObserver（`rootMargin: 300px`）で画面に近づいたら初期化、離れたら
  **破棄**（`renderer.dispose()` + `forceContextLoss()`）。タブ非表示で描画ループ停止。
- reduced-motion / WebGL非対応 / `saveData` / 低性能端末（cores≤2 or memory≤1）は
  3Dを起動せず静止画のまま。JS無効時も静止画がそのまま残る。
- 静止画とシーンのカメラは同じ値を使う（fov 34 / 距離 `maxDim*1.22` / 高さ `maxDim*0.36` /
  ヨー 4.0）。**片方だけ変えると切り替わる瞬間に絵が飛ぶ**ので必ず両方直す。

### モデルの素性と注意（重要）
- 元データはユーザー提供の FBX（Ural Next クレーン車）。**GTA の車両MOD由来**で、
  ライセンスの出所がはっきりしない。商用サイトで使い続けるなら権利の確認、
  もしくは自社車両の実写・自作モデルへの差し替えを勧めること。
- 取り込み時に次の外国語表記を除去済み。**差し替え・再変換する時は同じ処理が必要**。
  - ブームの赤文字（電話番号 / ЧЕЛЯБИНЕЦ / GTA MOD配布者のウォーターマーク）
    → テクスチャ `55.png` を拡散インペイントで塗り潰し
  - クレーン架装のメーカー銘板・ロシア語警告表記 → `57.png` を周囲色で平滑化
  - 運転席ドアとクレーンキャビンの**三色旗デカール**
    → テクスチャではなく純色マテリアルの小さなポリゴン。該当プリミティブを削除
      （マテリアル `.9` / `.15` / `door_rf_ok.7` / `salon.4` / `.11` の200頂点未満）
- フロントグリルの「URAL」ロゴは車種そのものの標識なので残してある。
- コピーは「当社の車両」と言い切らず、**車種イメージ**である旨を必ず併記する。

### 変換パイプライン（再現手順）
リポジトリにツールは入れない。作業時にスクラッチ領域へ入れて使う。
1. `assimp export <model>.FBX out.gltf -f gltf2`（FBX2glTF はテクスチャを解決できない）
2. TGA を PNG へ変換し、gltf の `images[].uri` をファイル名だけに書き換える。
   **拡張子は小文字**にする（`image/PNG` だと gltf-transform のテクスチャ処理が素通りする）
3. 車外から見えない `MOTOR`（エンジン）と `salon`（内装）のノードを削除（頂点の約36%）
4. `gltf-transform` で `dedup → prune → resize 1024 → webp 82 → weld → simplify 0.5 → quantize`
   （デコーダ不要にするため Draco / meshopt は使わない。`KHR_mesh_quantization` は three が対応済み）

## 7. TRX-4 オーバーホールの4幕演出（**トップページ `/` に移設済み**）

`t-rex-engine-v3.html`（ユーザー提供のHTML1枚デモ）を移植したストーリー演出。
スクロールで **鉄の塊 → 透視 → 手組み → 始動** の4幕が進む。

> **2026-08-19: `/engine` を廃止し、演出はトップ `/` の主役に移した。**
> 配置と命綱の決まりは §8 を必ず読むこと。`/engine` には `/` へ転送する置き石だけが
> 残っている（`app/engine/page.tsx` + `EngineRedirect.tsx`、それと
> `scripts/postprocess-pages.mjs` が `out/engine/index.html` に挿す meta refresh）。

### 構成ファイル
- `app/TopPage.tsx` … 4幕のコピー・ラベル・諸元を**静的HTMLで出し切る**
  （JS無効・クローラでも全文が読める）。旧 `app/engine/page.tsx` の役割を引き継いだ。
- `app/components/engine/EngineSceneMount.tsx` … `next/dynamic(ssr:false)` の薄い包み。
- `app/components/engine/EngineScene.tsx` … WebGL＋GSAP＋Lenis。描くDOMは `<canvas>` だけ。
- `app/components/engine/buildEngine.ts` … 造形とマテリアル。three は引数で受け取る
  （このモジュール自体は three を引き込まない）。
- `app/components/engine/engine.module.css` … v3のCSSを踏襲。

### 守る決まり
- **SubpageShell（＝TrmMotion）を使わない**。v3独自のヘッダーを持つため。
  **Lenis と ScrollTrigger の橋渡しは `app/components/TopMotion.tsx` が唯一の所有者**で、
  `EngineScene` は Lenis を作らない。2つ作るとホイール1回で2倍スクロールし、
  `<html>` の `lenis-*` クラスが発振して操作感が壊れる（§8 も参照）。
- 演出の尺・振り付け・カメラのキーフレーム・クランク機構の物理式・縦画面補正(dm)は
  v3の数値そのまま。`PIN_END = "+=460%"`、scrub 0.55 / 1.05 / 0.5 も同じ。
- **断面スイープとバルブカバーの「T-REX」プレートは不採用（復活させない）。**
  点火・失火の閃光は火の色（オレンジ系）。シアンに戻さない。
- JSからのDOM参照は **`data-*` 属性のみ**（`data-ch` / `data-lbl` / `data-chapnow` ほか）。
  CSS Modules はクラス名をハッシュ化するので、クラス名でJSから引かない。
- 演出を出す時だけ `<html>` に `data-engine-motion="on"` を付ける。判定は **初回ペイント前**に
  走るインラインスクリプト（`TopPage.tsx` の `MOTION_PROBE`）が行うので、レイアウトが飛ばない。
  付いていない状態（JS無効・reduced-motion・WebGL2非対応）では CSS 側が4幕を縦に並べた静的版に戻す。

### r128 → r185 で必要だった対応（再移植時も同じ）
- `renderer.outputEncoding = sRGBEncoding` は**削除**（現行の既定がsRGB）。
- ライト強度は**全て ×π**。r155 で `useLegacyLights` の既定が false になり、
  レガシー時の π 倍が外れたため。`PointLight.decay` は **明示的に 1**（現行既定は2）。
- `map` に使う CanvasTexture は `colorSpace = SRGBColorSpace`。
  `bumpMap` はデータなので **NoColorSpace のまま触らない**。
- `hasWebGL()` は **webgl2 のみ**で判定する。three は r163 で WebGL1 を切ったので、
  webgl1で「対応」と誤判定すると `new WebGLRenderer()` が例外を投げる。
- `scene.environment` 使用時、`material.envMapIntensity` は
  **`scene.environmentIntensity` に上書きされる**。強度調整はそこに一本化する。
- pmndrs postprocessing を使うので **`renderer.toneMapping = NoToneMapping`**。
  ACES は `ToneMappingEffect` 側で1回だけ掛ける（両方入れると二重）。
  `renderer.toneMappingExposure` は pmndrs が読まないので、v3の露出1.18は
  `ENV_INTENSITY` と `lightScale` に畳み込んである。

### 依存とアセット
- **`postprocessing`（pmndrs）6.39.4 を新規追加**。CLAUDE.md §4「新規npm依存は追加しない」
  の例外で、要綱書での明示指定による。Zlib ライセンス、three 0.185 と peer 互換。
  three 同梱の EffectComposer でも代替可能なので、依存を減らしたくなったら差し替えられる。
- HDRIは `/becool` の EQUIPMENT と**同じ `public/assets/hdri/env.hdr` を使い回す**
  （Poly Haven「quarry_01」1K・CC0）。ページ追加によるアセット増は0。
- 周辺減光は CSS の `.vin` が既にステージ全面に掛かっているので、
  **postprocessing 側の Vignette は入れない**（二重になるため）。

### GLTFエンジンモデル（導入済み）
ユーザー提供の2モデルを組み合わせている。**どちらも CC-BY-4.0（商用可・要クレジット）**。
クレジットは `app/engine/page.tsx` のフッターに出しており、**ライセンス上消してはいけない**。

| 役割 | ファイル | 出典 | 素の三角形 | 収録後 |
|---|---|---|---|---|
| シリンダーブロック（透視） | `public/models/engine-block.glb` | "Inline 4 engine block diagram (see through)" by Lame3D models | 11.2K | 249KB / gz 103KB |
| クランク＋コンロッド＋ピストン | `public/models/engine-crank.glb` | "Rigged 4-Cylinder Engine (FREE)" by david.gnzlv | 78.7K → 32.7K | 786KB / gz 417KB |

シリンダーヘッド・カム・バルブ16本・オイルパンは **v3の自作ジオメトリのまま**（2モデルとも
その部位を持っていないため）。要綱書のハイブリッド規定どおりの構成。

**位置合わせの実測値**（`buildEngine.ts` の定数。動かすと噛み合わなくなる）
- ブロックのボア中心（素の値）: `-1.020 / -0.280 / +0.448 / +1.192`（間隔 0.7373）
- クランク機構の気筒中心（素の値）: `0 / 2.2534 / 4.4898 / 6.761`（間隔 2.2534）、クランク軸 `y=-3.0204`、クランク半径 0.917
- 両者の間隔を **1.300** に揃える → `BLOCK_SCALE=1.7645` / `CRANK_SCALE=0.57691`、`CYLX=[-1.949,-0.65,0.65,1.949]`
- ブロックは `BLOCK_Y=0.95`（デッキ面がピストン上死点の上に来る高さ）
- ヘッドとオイルパンはブロックのデッキ/スカートに合わせて `HEAD_LIFT` / `PAN_DROP` で自動追従
- 最後に `FIT_SCALE=0.78` で全体を縮め、**v3のカメラのキーフレームをそのまま流用**している

**クランクの駆動**: モデルのアニメーション（`ArmatureAction` / 1.3333秒）が
**クランク1回転そのもの**なので、クランク角を時間へ写像して `AnimationMixer.setTime()` で回す。
ピストンの上下・コンロッドの首振りはこれ1本で付いてくる（v3のクランク機構の物理式は
点火タイミングの `cos(TH + PH[i])` にだけ残っている）。
ロッドキャップ（`Biela inferior`）は**ミキサーが位置を書いた後**に `setCapSlide()` でずらすこと。
順番を逆にすると毎フレーム上書きされて分解が効かなくなる。

差し替える場合の接続点は `buildEngine()` の `shellG`（外殻）/ `headG` / `panG` / `crankRoot`。

## 8. トップページ `/` の構成（2026-08-19 全面差し替え）

旧トップ（写真ヒーロー）を廃し、**§7 の4幕エンジン体験を主役**に据えた。
体験を優先しつつ「急いで電話したい客」を取りこぼさないのが最優先の設計要件で、
下の**命綱**は演出の都合で削ってはいけない。

### ファイル分割の理由
- `app/page.tsx` … **サーバーコンポーネント**。`metadata` / OGP / JSON-LD だけを持つ薄い包み。
  トップは `"use client"` なので、metadata を持たせるにはこの分割が要る。
- `app/TopPage.tsx` … 本体（`"use client"`）。固定ヘッダー・ヒーロー・4幕・下部セクション・
  フッターまで全部ここ。
- `app/components/TopMotion.tsx` … Lenis + ScrollTrigger の**唯一の所有者**（§7 参照）。
- `app/components/lenisBridge.ts` … Lenis インスタンスの受け渡しと `scrollToElement()`。
  Lenis が無い時（モバイル／reduced-motion）はネイティブスクロールに落ちる。

### 上から順の構成（並べ替えは可、削除は不可）
ヒーロー（即時表示） → 4幕エンジン体験（ピン区間） → 諸元 → 実績バッジ →
サービス → EQUIPMENT（3D車両・§6） → 黒→白ワイプ → 施工実績 → 会社情報/アクセス →
問い合わせCTA → フッター（CC-BY クレジット付き）。

### 命綱（合否ライン。触る前に必ず確認する）
1. **固定ヘッダーの電話ボタンは全スクロール位置で押せる。** ピン区間中も消さない・
   隠さない・`pointer-events` を切らない。SPは電話アイコン＋番号で1タップ発信
   （`.telLead` の「電話」ラベルだけ 640px 未満で隠す）。
2. **ヒーローの電話ボタンはHTMLとして即時表示**。`TopMotion` のフェードイン
   （`[data-hero-rise]`）の**対象に入れない**。LCPはヒーローのテキストであること
   （canvasにしない）。
3. **ヒーローの「サービス一覧へ ↓」でピン区間を飛ばせる**（`scrollToElement()` 経由）。
   往復してもピンが壊れないこと。
4. reduced-motion / JS無効 / WebGL2非対応では、4幕が縦積みの静的テキストに落ち、
   ヒーローと下部セクションが完全に読める。

### ヒーローの背景（ユーザー選択・確定）
ブランドのメインビジュアル（`hero-trex-construction-final.webp`）を敷き、その上に
暗幕を重ねる。**`<img>` / `next/image` ではなく CSS の `background-image` で敷く**こと
——要素にすると LCP がヒーローの見出しテキストから写真へ移り、命綱の要件を壊す。
- 819px以下は軽量版 `hero-trex-construction-sp.webp`（幅1100px・86KB）に差し替え、
  表示位置を `59% center` に寄せて恐竜の顔を窓に入れる（PCは `72% center`）。
  SPは画像の横を2割ほどしか見せないので、解像度を落としても見た目は変わらない。
- 暗幕はPCが左からの斜めグラデ、SPは上下方向。下端は必ず `--e-ink` へ落として
  4幕ステージへ継ぎ目なく渡す。
- 文字のコントラストは実測で担保する（背後の実ピクセルの上位2%を最悪ケースとして
  計測）。現状の最小は本文の 5.80:1（SP）。**暗幕を薄くする時は必ず測り直すこと。**

### 章インジケータの注意
`[data-chapnow]` / `[data-chapnav]` は**固定ヘッダー側にあり `.page` の外**。
`EngineScene` はこれらを `document` から引く。`page.querySelector` にすると
永久に「01 — 鉄の塊」のまま止まる（実際に踏んだ）。
狭い画面（720px未満）では `.chapnow` を隠してロゴと電話ボタンに場所を譲る。

### 読み込みの順番
`EngineScene` は `afterHeroPaint()`（rAF×2 → `requestIdleCallback`、最長1.5秒）を
待ってから three / postprocessing / glb 2本 / HDRI を取りに行く。ヒーローの
LCPと帯域を食い合わせないため。読み込み中は**黒いcanvas＋シアンの細いバー**
（`.loadTrack` / `[data-engine-progress]`、`THREE.LoadingManager` が駆動）。
**スピナーは使わない。** 完了で `[data-engine-page]` に `data-assets="ready"`。

### 旧 `/engine` の転送
静的エクスポートでは `next.config` の `redirects` が効かないので、
`scripts/postprocess-pages.mjs` が `out/engine/index.html` の `<head>` 先頭に
`<meta http-equiv="refresh">` を挿す。canonical は `app/engine/page.tsx` 側で `/` を指す。
JS無効でも転送される。**sitemap.xml / llms.txt に `/engine` を復活させない。**

## 9. `/tomoshibi` — 灯家 -TOMOSHIBI- 注文住宅LP（2026-08-20 追加）

ユーザー提供の「注文住宅LP デザインプロンプト」を、要綱指定のスタックのまま
実装したサンプルLP。**架空ブランドのデザイン確認用**で、T-REX / BeCool /
汀ノ庭の実サイトとは無関係。

### ファイル
| ファイル | 役割 |
|---|---|
| `app/tomoshibi/page.tsx` | サーバーコンポーネントの包み。metadata と **noindex** だけ |
| `app/tomoshibi/layout.tsx` | このルート専用のCSSと Google Fonts の `<link>` |
| `app/tomoshibi/tomoshibi.css` | Tailwind の入口 + レイヤー調整 + reduced-motion |
| `app/tomoshibi/TomoshibiLP.tsx` | **LP本体。要綱の「単一ファイルで完結」に従い1枚** |
| `postcss.config.mjs` | Tailwind v4 の PostCSS プラグイン（新規） |

### 依存の追加（§4「新規npm依存は追加しない」の例外）
要綱の Tech stack で明示指定されているため、§7 の `postprocessing` と同じ扱いで追加した。
`framer-motion` 13.1.1 / `lucide-react` 1.33.0 / `tailwindcss` 4.3.3（devDep）/
`@tailwindcss/postcss` 4.3.3（devDep）。**他のページからは一切参照していない。**

### 他サイトへ漏らさないための作り（触る前に必ず読む）
- Tailwind の CSS は `app/tomoshibi/layout.tsx` からしか import しない。App Router は
  そのセグメントのルートにだけCSSを配るので、**preflight は `/tomoshibi` の外に出ない**。
  ビルド後に `grep -rl <tailwindのchunk> out --include="*.html"` が
  `/tomoshibi/index.html` の1件だけであることを確認すること。
- `@import "tailwindcss/utilities.css" source(none)` + `@source "./TomoshibiLP.tsx"` で
  走査対象をLP1ファイルに固定。自動検出のままだと `bc-svc-card` 等まで拾う。
- **ユーティリティはレイヤーの外に置く**（理由は §3-16。戻すと配色が全部死ぬ）。
- `globals.css` の `html/body/main` を打ち消すため `html:has([data-tomoshibi])` で上書き。
- `a:focus-visible{outline:…var(--color-primary)}` が効くと T-REXのブルー(#298dff)という
  **6色目**が入るので、`html:has([data-tomoshibi]) :focus-visible` で真鍮に固定している。

### 配色5色とコントラスト（実測・AA基準）
胡粉 `#F4F0E8` / 墨 `#211D19` / 真鍮 `#8A7355` / 灰白 `#E4DDD1` / 深緑 `#3E4A3D` のみ。
- 墨 on 胡粉 14.7:1、墨 on 灰白 12.4:1 → 本文・見出し
- 深緑 on 胡粉 8.2:1 → 英字ラベル・注記・流れの番号・カルーセルの非選択ダッシュ
- **真鍮は小さい文字に使わない**（対胡粉 3.96:1）。使うのは罫・線画・進行インジケータ・
  CTAの面のみ。CTA主ボタンのラベルだけ 19px/bold（AAの「大きい文字」= 3:1）で成立させている。
- 灰白を非選択ダッシュに使うと対胡粉 **1.19:1** で本数すら見えない。**状態は太さで示す。**

### 検証（`node scripts/…` は無い。スクラッチに置いて回す）
PC1440 / 1920 / 1024、SP 390×844（isMobile・hasTouch・DPR3）、reduced-motion、
JS無効、既存3ページへの影響、コントラスト実測 ─ すべて通してある。
- Playwright は `newContext({ reducedMotion: 'no-preference' })` を忘れない（§3-9）。
- **この環境にはミンチョの和文フォントが無い**。素のままだと `serif` が
  WenQuanYi Zen Hei（中文）に落ち、**縦組みの字が重なって「壊れている」ように見える**。
  実際の見た目を見るときは Google Fonts の TTF を落として fontconfig に入れる:
  ```
  curl -s "https://fonts.googleapis.com/css?family=Shippori+Mincho+B1:400,500,600&subset=japanese" \
    | grep -oE 'url\((https://[^)]+)\)' | sed 's/url(//;s/)//' \
    | while read u; do curl -s "$u" -o /usr/local/share/fonts/$RANDOM.ttf; done; fc-cache -f
  ```
  ブラウザからは `fonts.googleapis.com` へ出られない（プロキシ経由が必要）ので、
  検証時のフォント未適用は**ページの不具合ではない**。

### 決まっていること
- 見出し「暮らしに合わせて、住まいを仕立てる。」とサブコピーは**一字一句変えない**（要綱）。
- 写真は生成せず `/images/hero-0*.jpg` `/images/works-0*.jpg` を参照するだけ。
  **ファイルは置かない**。404したら灰白の下地にパス名を出す仕様。
- 縦書きは lg 以降のみ。縦組みの高さ `lg:h-[23rem]` は「1列9字＝読点で折り返す」ための実測値。
  詰めると「住/まい」のように語中で切れる。
- 施工事例・お客様の声・性能値・住所はすべて仮。**フッターにその旨を明記してあるので消さない。**
  実在の工務店として拾われないよう `robots: { index: false }` も外さない。
- sitemap.xml / llms.txt には**載せない**。

### signature-effects スキルへの適合（2026-08-20 に当てて直した）
シグネチャは **A1 線画ドロー(間取り図)**。スキルの注意事項に合わせて次を直してある。
- **path数は1図あたり10本まで** → 図は1pxも変えず、意味のまとまりごとに
  1本の `d` へ統合した（外壁 / 間仕切り / 建具 / 開口 / 階段 / 寸法 の6本。
  仕切りは4本）。1つの `d` に複数サブパスを書いても `pathLength` は全体で
  正規化されるので、順番に描かれて見た目は同じ。**バラすと本数超過に戻る。**
- **描画は合計1.6秒以内** → `duration 1.2s` + `staggerChildren 0.06s`＝設計値1.5秒。
  実測 1163ms（描き始め408ms → 6本完了1571ms）。
- **線幅1.4px前後** → `strokeWidth="1.4"` + `vectorEffect="non-scaling-stroke"`。
- **動かすのは transform / opacity / clip-path / stroke-dashoffset のみ** →
  height を動かしていた2箇所を潰した。モバイルメニューは `height:0→auto` をやめて
  `clip-path: inset()` で開く（ヘッダーが `fixed` なのでページはリフローしない）。
  カルーセルのダッシュは太さを `height` ではなく `scaleY` で出す。
