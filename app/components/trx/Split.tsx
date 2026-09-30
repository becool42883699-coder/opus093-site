import type { CSSProperties, ReactNode } from "react";
import { segmentText } from "./segment";
import s from "./site.module.css";

/**
 * 読み込み直後に1文字ずつせり上がる見出し。**サーバー側で文字を割って出す**ので、
 * JS を待たずに初回ペイントから CSS アニメーションで始まる(割り直しによるチラつきが無い)。
 * 読み上げは srOnly の元の文で行い、割った側は aria-hidden。
 * reduced-motion ではアニメーションを切る(globals.css)。
 *
 * lines: 1行ずつの配列。行の要素は文字列か { text, em: true }(アクセント色)。
 */
type Piece = string | { text: string; em?: boolean };

export default function Split({ lines, delay = 0, step = 38 }: { lines: Piece[][]; delay?: number; step?: number }) {
  let i = 0;
  const plain = lines.map((l) => l.map((p) => (typeof p === "string" ? p : p.text)).join("")).join("");
  const out: ReactNode[] = [];
  lines.forEach((line, li) => {
    const chars: ReactNode[] = [];
    line.forEach((piece, pi) => {
      const text = typeof piece === "string" ? piece : piece.text;
      const em = typeof piece !== "string" && piece.em;
      const spans = segmentText(text).map((word, wi) => {
        if (word === " ") return " ";
        return (
          <span className="x-word" key={`${pi}-${wi}`}>
            {Array.from(word).map((ch, ci) => {
              const style = { "--i": i++ } as CSSProperties;
              return <span className="x-m" key={ci}><span className="x-c" style={style}>{ch}</span></span>;
            })}
          </span>
        );
      });
      chars.push(em ? <em key={pi}>{spans}</em> : <span key={pi}>{spans}</span>);
    });
    out.push(<span className="x-line" key={li}>{chars}</span>);
  });
  return (
    <>
      <span className={s.srOnly}>{plain}</span>
      <span className="x-in" aria-hidden="true" style={{ "--d": `${delay}ms`, "--step": `${step}ms` } as CSSProperties}>{out}</span>
    </>
  );
}
