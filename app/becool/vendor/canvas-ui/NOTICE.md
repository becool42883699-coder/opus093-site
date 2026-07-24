# Vendored: Canvas UI (React) — Particle Object / Glass Object

Source: https://github.com/DavidHDev/canvas-ui （公式リポジトリ）
Docs:   https://canvasui.dev/docs/components/

以下は上記公式リポジトリのソースを取り込んだもの（shadcnレジストリと同一）。
ライセンスは上流に従う。

- `ParticleObject.tsx` / `ParticleObjectVanilla.ts`
- `GlassObject.tsx` / `GlassObjectVanilla.ts`（SVGを押し出してガラス素材化）

本プロジェクト用の追加:
- `ParticleObjectVanilla.ts` に `intro` / `introSpread` オプションを追加
  （読み込み時に粒子を散布→バネで形状へ収束させる導入演出）。該当箇所は
  「[GARAGE BeCool 追加]」コメントで明示。

補足（不採用）:
- Canvas UI の `Peel` / `ParticleScroll` は実験的な HTML-in-Canvas API
  （`drawElementImage` / `requestPaint`）を前提とし、フラグ無効の一般ブラウザでは
  演出が無効化されるため未採用。同等の演出は画像ベースの自前実装で再現している
  （`PeelReveal` / `ParticleScrollReveal`）。
