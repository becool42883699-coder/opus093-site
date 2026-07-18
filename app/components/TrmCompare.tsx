"use client";

/**
 * TrmCompare — ビフォーアフター比較スライダー
 * 中央のハンドルをドラッグ(タッチ/マウス/キーボード)で境界を動かして比較する。
 * 実体は透明のrange input(アクセシブル・タッチ対応)で、clip-pathで前面画像を切り抜く。
 */

import Image from "next/image";
import { useState, type CSSProperties } from "react";

type Props = {
  before: string;
  after: string;
  altBefore: string;
  altAfter: string;
  labelBefore?: string;
  labelAfter?: string;
  width: number;
  height: number;
};

export default function TrmCompare({ before, after, altBefore, altAfter, labelBefore = "BEFORE", labelAfter = "AFTER", width, height }: Props) {
  const [pos, setPos] = useState(50);
  return (
    <div className="trm-compare" style={{ "--trm-pos": `${pos}%` } as CSSProperties}>
      <Image src={after} alt={altAfter} width={width} height={height} />
      <div className="trm-compareBefore" aria-hidden="true">
        <Image src={before} alt={altBefore} width={width} height={height} />
      </div>
      <span className="trm-compareBadge trm-compareBadgeL">{labelBefore}</span>
      <span className="trm-compareBadge trm-compareBadgeR">{labelAfter}</span>
      <div className="trm-compareHandle" aria-hidden="true"><i>⇄</i></div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(event) => setPos(Number(event.target.value))}
        aria-label="施工前と施工後を比較するスライダー"
      />
    </div>
  );
}
