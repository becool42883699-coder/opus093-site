# Vendored: Canvas UI — Particle Object (React)

Source: https://github.com/DavidHDev/canvas-ui （公式 React 版 Particle Object）
Docs:   https://canvasui.dev/docs/components/particle-object

`ParticleObject.tsx` / `ParticleObjectVanilla.ts` は上記公式リポジトリのソースを
取り込んだもの（shadcnレジストリと同一）。ライセンスは上流に従う。

本プロジェクト用の追加:
- `ParticleObjectVanilla.ts` に `intro` / `introSpread` オプションを追加
  （読み込み時に粒子を散布→バネで形状へ収束させる導入演出）。該当箇所は
  「[GARAGE BeCool 追加]」コメントで明示。
