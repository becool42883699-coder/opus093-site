"use client";

/**
 * 工程スライダー(施工前 → 施工中 → 完成)。1本のスライダーで次の段階の写真へクロスフェードする。
 * 実体は透明の range input なので、タッチ・マウス・キーボードのどれでも動かせる。
 */

import Image from "next/image";
import { useState } from "react";
import s from "./sub.module.css";

type Stage = { src: string; alt: string; label: string };

export default function Stages({ stages, width, height }: { stages: [Stage, Stage, Stage]; width: number; height: number }) {
  const [v, setV] = useState(0);
  const o0 = Math.max(0, Math.min(1, 1 - v / 50));
  const o1 = v <= 50 ? v / 50 : Math.max(0, (100 - v) / 50);
  const active = v < 34 ? 0 : v < 67 ? 1 : 2;
  return (
    <div className={s.stages}>
      <div className={s.stagesView} data-cursor="drag">
        <Image src={stages[2].src} alt={stages[2].alt} width={width} height={height} sizes="(max-width: 899px) 100vw, 60vw" />
        <Image src={stages[1].src} alt={stages[1].alt} width={width} height={height} sizes="(max-width: 899px) 100vw, 60vw" style={{ opacity: o1 }} />
        <Image src={stages[0].src} alt={stages[0].alt} width={width} height={height} sizes="(max-width: 899px) 100vw, 60vw" style={{ opacity: o0 }} />
        <input
          type="range" min={0} max={100} value={v}
          onChange={(event) => setV(Number(event.target.value))}
          aria-label="施工工程スライダー(施工前・施工中・完成を切り替え)"
          aria-valuetext={stages[active].label}
        />
        {v === 0 && <span className={s.stagesHint} aria-hidden="true">← Drag →</span>}
      </div>
      <div className={s.stagesBar} aria-hidden="true">
        {stages.map((stage, i) => (
          <span key={stage.label} data-on={i === active ? "true" : "false"}>{String(i + 1).padStart(2, "0")} {stage.label}</span>
        ))}
      </div>
    </div>
  );
}
