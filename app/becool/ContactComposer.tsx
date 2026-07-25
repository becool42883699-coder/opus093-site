"use client";

/**
 * 相談内容コンポーザー。
 * 「何を相談したいか」を選び、必要事項を書くと、そのまま送れる文面を組み立てる。
 * 静的サイト(サーバー無し)なので送信は行わず、
 *   ① 文面をコピー → ② LINEを開いて貼り付け
 * という導線にしている。電話したい人向けに発信ボタンも並べる。
 *
 * ※ このリポジトリに問い合わせ用メールアドレスは無いため、メール送信は用意していない。
 *   （実在しないアドレスを書くと届かないメールを送らせてしまうため）
 *
 * - JS無効/失敗時も、電話番号とLINEリンクは素のリンクとして機能する。
 * - クリップボードAPIが使えない環境では textarea を選択状態にして手動コピーに誘導。
 */

import { useMemo, useRef, useState } from "react";
import styles from "./becool.module.css";

const TOPICS = [
  { id: "find", label: "車を探したい", hint: "車種・年式・ご予算など" },
  { id: "inspect", label: "車検・整備", hint: "車種と、気になる症状など" },
  { id: "buy", label: "買取・査定", hint: "車種・年式・走行距離など" },
  { id: "custom", label: "カスタム・取付", hint: "やりたい内容・パーツなど" },
  { id: "other", label: "その他", hint: "ご相談内容" },
] as const;

type TopicId = (typeof TOPICS)[number]["id"];

export default function ContactComposer({ lineUrl, tel, telHref }: {
  lineUrl: string; tel: string; telHref: string;
}) {
  const [topic, setTopic] = useState<TopicId>("find");
  const [name, setName] = useState("");
  const [car, setCar] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const current = TOPICS.find((t) => t.id === topic)!;

  const message = useMemo(() => {
    const lines = [`【${current.label}のご相談】`];
    if (name.trim()) lines.push(`お名前：${name.trim()}`);
    if (car.trim()) lines.push(`お車：${car.trim()}`);
    if (body.trim()) lines.push(`内容：${body.trim()}`);
    lines.push("", "（GARAGE BeCool サイトのお問い合わせから）");
    return lines.join("\n");
  }, [current.label, name, car, body]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // クリップボードが使えない環境: 選択状態にして手動コピーへ誘導
      const el = areaRef.current;
      if (el) { el.focus(); el.select(); }
    }
  };

  return (
    <div className={styles.composer}>
      {/* 1. 相談内容を選ぶ */}
      <fieldset className={styles.composerStep}>
        <legend><span className={styles.stepNo}>01</span>ご相談の内容</legend>
        <div className={styles.chips} role="radiogroup" aria-label="ご相談の内容">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={topic === t.id}
              className={styles.chip}
              data-on={topic === t.id ? "true" : undefined}
              onClick={() => setTopic(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2. 内容を書く */}
      <fieldset className={styles.composerStep}>
        <legend><span className={styles.stepNo}>02</span>かんたんに入力（任意）</legend>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span>お名前</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例）山田 太郎" autoComplete="name" />
          </label>
          <label className={styles.field}>
            <span>お車</span>
            <input type="text" value={car} onChange={(e) => setCar(e.target.value)} placeholder="例）アルファード / 未定" />
          </label>
        </div>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>ご相談内容<small>{current.hint}</small></span>
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={`例）${current.hint}を教えてください`} />
        </label>
      </fieldset>

      {/* 3. 送る */}
      <fieldset className={styles.composerStep}>
        <legend><span className={styles.stepNo}>03</span>この内容で送る</legend>
        <p className={styles.composerNote}>
          下の文面をコピーして、LINEに貼り付けて送信してください。お急ぎの方はお電話がいちばん早く繋がります。
        </p>
        <textarea ref={areaRef} className={styles.preview} value={message} readOnly aria-label="送信する文面" rows={6} />
        <div className={styles.composerActions}>
          <button type="button" className={styles.copyBtn} onClick={copy}>
            {copied ? "コピーしました" : "文面をコピー"}
          </button>
          <a className={styles.lineBtn} href={lineUrl} target="_blank" rel="noopener noreferrer">LINEを開く</a>
          <a className={styles.telBtn} href={telHref}>電話する（{tel}）</a>
        </div>
      </fieldset>
    </div>
  );
}
