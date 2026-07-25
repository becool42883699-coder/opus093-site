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
- スタイリングは **CSS Modules のみ**（`app/becool/becool.module.css`）。Tailwind・
  shadcn・`@/` パスエイリアスは使わない方針。
- **ホスティング（2系統・移行中）**:
  - **現状の実運用・検証先**: 静的エクスポート → GitHub Actions
    （`.github/workflows/deploy-pages.yml`）が `main` push を `gh-pages` ブランチへ
    デプロイ。公開URL: `https://becool42883699-coder.github.io/opus093-site/becool/`。
    ビルドコマンド: `NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/opus093-site npm run build`
    → `out/`。これまでの動作確認・デプロイは全てこの経路。
  - **将来/並行の配置先**: Xserver上で、既存のWordPressサイトと**同居**させる形で
    この静的HTML出力を配置する想定がある。`out/` をそのまま、または
    WordPressのURL構造と衝突しないサブディレクトリに置くことを想定。
    `.htaccess` はWordPress側の設定を壊さないよう**このプロジェクトからは触らない**
    （`.claude/settings.json` で編集を拒否済み）。Xserver固有の詳細（配置パス・
    ベースパスの扱い等）は未確定のため、着手時は必ずユーザーに確認すること。
- 依存追加は原則禁止。3D/粒子演出はすべて既存の `three`（1つだけの実行時依存）を使う。
  GSAP・Framer Motion・Lenis 等は無断で追加しない。

## 2. 確定した仕様・デザイン方針

### ヒーローロゴ演出
- `app/becool/page.tsx` の `HERO_ANIM` 定数で切替（`glass | particle | sweep | blueprint`）。
  4パターンとも実装は残置し、コードを消さずに定数変更だけで戻せるようにしてある。
- 現在の既定値は `"glass"`（Canvas UI「Glass Object」）。過去に `blueprint`
  （設計図式ビルドアニメ）に一度戻された実績あり＝ユーザーの好みは固定ではないので、
  切替依頼が来たら該当行を変えるだけで対応する。
- Glass Object のチューニング方針（確定・変更時は踏襲すること）:
  - 立体感・厚みは最小限（depth/bevel を小さく、thickness も控えめ）。
  - 強い白ハイライト・太い発光輪郭・濃い青の“透明ガラス”感は禁止。
    roughness を上げてマット寄りにし、ブランドのネイビーは `tint` の density で
    色を乗せる（IORやdispersionで派手な屈折・虹色を出さない）。
  - 常時の回転・浮遊アニメは使わない。傾きは **スクロール位置に応じて2〜4度だけ**
    CSSの3D transform で静かに傾ける（`prefers-reduced-motion` では無効化）。
  - 背景は常に透明。ロゴ本来のネイビー＋明るいブルーの配色を維持。

### 演出コンポーネントの割当（Canvas UI ボキャブラリー）
- **Glass Object**（公式ソースを `vendor/canvas-ui/` にベンダリング）→ ヒーローロゴ。
- **Ripple**（自前実装 `HeroRipple.tsx`）→ ロゴのクリック反応。ロゴ形成/読込完了後のみ有効。
- **Grid**（CSS実装）→ CUSTOM サービスパネルの背景に極薄グリッド。
- **Particle Object**（公式ソースをベンダリング）→ フッター直前のクロージング
  ブランドマーク（`FooterParticleMark.tsx`）。ヒーローではない。
- **Particle Scroll**（自前実装 `ParticleScrollReveal.tsx`）→ PICK UP（在庫車）の
  写真が、初回スクロール到達時に**1回だけ**砂状の粒子から組み上がる。
- **Peel**（自前実装 `PeelReveal.tsx`）→ ABOUT セクションの写真。ネイビーの
  設計図（デュオトーン＋製図グリッド）を斜めにめくって完成写真を露出、**1回だけ**。

  **重要**: Canvas UI 公式の `Peel` / `ParticleScroll` は実験的な HTML-in-Canvas API
  （`drawElementImage` / `requestPaint`）が前提で、フラグ無効の一般ブラウザでは
  演出が無効化される（＝本番で何も起きない）。そのため **この2つだけは公式ソースを
  使わず、画像ベースの Canvas 2D / CSS clip-path で自前実装している。**

### デザインルール（禁止事項）
- 配色は 白 / ライトグレー / チャコール / ネイビー / ブランドブルーのみ。
- 生成り・ベージュ・紙質テクスチャ・レーザー・グリッチ・VHS・火花・炎・
  大きな水しぶき・強い発光・激しい回転・強いバウンド・ページ全体の歪み・
  全セクション粒子化・派手な3Dカメラ移動は禁止。

### アクセシビリティ / パフォーマンス階層
- `prefers-reduced-motion: reduce` → 全演出停止、静的SVG/写真を表示。
- WebGL非対応 → 静的フォールバック（`hasWebGL()` で `webgl2`/`webgl`/
  `experimental-webgl` を試す）。
- 端末性能ティア（`hardwareConcurrency` / `deviceMemory` / `saveData` / 画面幅）で
  粒子数を調整。目安: 高性能PC ≤18000、標準PC 12000-16000、モバイル 5000-8000、
  低性能・データセーバー → 0（=SVGフォールバック）。
- 画面外・タブ非表示になったら IntersectionObserver + `visibilitychange` で
  停止/アンマウントし GPU を解放。再表示で再開。

## 3. 踏んだ地雷と再発防止ルール

1. **clip-pathで隠した要素はIntersectionObserverが発火しない**
   `[data-reveal-img]` を直接IOで監視すると可視面積0のため交差判定が来ず、
   永久に表示されないデッドロックになった。
   → IOで監視するのは親の `[data-reveal]` セクションのみ。写真側のclip解除は
   CSSで `.reveal.isIn [data-reveal-img]` として連動させる。

2. **能力判定前に「完成ロゴが一瞬見えて粒子へ切り替わる」問題**
   WebGL初期化完了までSVGフォールバックが不透明のままだと「完成形→崩壊」に
   見えてしまう。→ 能力判定完了前・粒子/ガラス起動時は、SVGを常に**低い
   不透明度の下地**として表示し、`onLoad` 完了で自然にクロスフェード。

3. **useEffect内でのstate初期化順序の鶏卵問題**
   `PeelReveal` で「refが存在する条件」と「refを描画させるstate」を同じ
   useEffect内で扱い、初回は必ずrefがnullで早期returnするバグを作った。
   → フラグを立てる処理とそのフラグに依存するDOM操作は別のuseEffectに分離する。

4. **検証用ローカルサーバーの静的ファイルが古いまま**という事故
   symlink経由の`python3 -m http.server`使い回しで、リビルド後も古い内容を
   返し続け「直っていないように見える」誤判定を出した。
   → ビルドし直したら**サーバープロセスを殺して再起動**、symlinkも作り直す。
   `curl`でHTMLの中身が実際に新しいか確認してから検証する。

5. **スマホ / iOS Safari 表示での注意点**（最重要ルールの再発防止策）
   - 演出用canvasは **必ず `pointer-events: none` + `touch-action: auto`** を
     モバイルで強制上書きする（ベンダーコンポーネントのinline styleが
     `touch-action: none` を当て、縦スクロールを止めることがある）。
   - 実装後は必ず **横スクロール（overflow-x）が発生していないか**
     `document.documentElement.scrollWidth > clientWidth` で確認する。
   - モバイルは粒子数を大幅に減らし、`radius`/`strength`等のホバー系
     パラメータは0にしてタッチでの誤動作・重さを避ける。
   - reduced-motion・低性能端末・画面外では演出を**確実にアンマウント**し、
     iOS SafariでWebGLコンテキストを掴んだまま重くなる状態を作らない。
   - 実機の代わりにPlaywrightの `isMobile/hasTouch` + `deviceScaleFactor`を
     上げた検証を必ず通す（見た目だけでなく実際にスクロール操作して確認）。

6. **Next 16 で `next lint` コマンドが廃止**。→ `npm run lint`（`eslint .`）を使う。

7. **squash-merge運用でのブランチ再利用**
   同じ作業ブランチに次の変更を積むと、旧コミットが「mainに既にマージ済み」と
   衝突してpushが弾かれる。
   → `git fetch origin main` → `git stash` → `git reset --hard origin/main` →
   `git stash pop` → コミット → `git push --force-with-lease`。
   ただし**未マージの作業が残っている場合は絶対にreset --hardしない**
   （stashで退避できているか必ず確認してから実行する）。

## 4. 今後の作業で守るべきルール

- **変更後は必ずモバイル幅（390px前後）で検証してから完了報告する**（最重要）。
  PC幅の確認だけで終わらせない。
- 新規npm依存は追加しない。既存の `three` / IntersectionObserver /
  ResizeObserver / requestAnimationFrame / CSS Modules の範囲で実装する。
- 演出を追加・変更する時は必ず: (a) reduced-motion, (b) WebGL非対応,
  (c) 低性能/データセーバー, (d) モバイルのタッチスクロール、の4点を
  Playwrightで検証してからデプロイする。
- コンソールエラー・TypeScriptエラー・lintエラー（新規追加分）はゼロが前提。
  既存の pre-existing なエラーはスコープ外なので触らない。
- デザインルール（配色5色・禁止演出リスト）は毎回のレビュー基準にする。
- 既存の演出（Ripple・Grid・Particle Object・Particle Scroll・Peel）は、
  明示的に依頼が無い限り削除・全面書き換えしない。
- `.htaccess` は編集しない（Xserver側WordPressの設定を壊すリスクがあるため）。
- 作業ブランチは `claude/becool-particle-logo` を使い続ける（都度作り直さない）。
  コミットメッセージ末尾には `Co-Authored-By` / `Claude-Session` トレーラーを付ける。
