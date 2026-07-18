"use client";

/**
 * TrmStages — 3段階の工程スライダー(施工前→施工中→完成)
 * 1本のスライダーで工程が進むほど次の段階の写真へクロスフェードする。
 * 実体は透明のrange input(タッチ/マウス/キーボード対応・アクセシブル)。
 */

import Image from "next/image";
import { useState } from "react";

type Stage = { src: string; alt: string; label: string };

export default function TrmStages({ stages, width, height }: { stages: [Stage, Stage, Stage]; width: number; height: number }) {
  const [v, setV] = useState(0);
  const o0 = Math.max(0, Math.min(1, 1 - v / 50));
  const o1 = v <= 50 ? v / 50 : Math.max(0, (100 - v) / 50);
  const active = v < 34 ? 0 : v < 67 ? 1 : 2;
  return (
    <div className="trm-stages">
      <div className="trm-stagesView">
        <Image src={stages[2].src} alt={stages[2].alt} width={width} height={height} />
        <Image src={stages[1].src} alt={stages[1].alt} width={width} height={height} style={{ opacity: o1 }} />
        <Image src={stages[0].src} alt={stages[0].alt} width={width} height={height} style={{ opacity: o0 }} />
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          onChange={(event) => setV(Number(event.target.value))}
          aria-label="施工工程スライダー(施工前・施工中・完成を切り替え)"
        />
      </div>
      <div className="trm-stagesBar" aria-hidden="true">
        {stages.map((stage, index) => (
          <span key={stage.label} className={index === active ? "trm-stageOn" : ""}>{stage.label}</span>
        ))}
      </div>
    </div>
  );
}
