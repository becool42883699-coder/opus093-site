/**
 * 見出しを1文字ずつ割る演出(Split.tsx / effects.ts)用の、改行してよい単位への分割。
 *
 * 文字ごとに inline-block で包むと、ブラウザの禁則処理が効かなくなり
 * 「、」「。」だけが次の行へ落ちる(実際に落ちた)。そこで先に文節に近い単位へまとめ、
 * その単位の中では改行させない(nowrap)。
 *
 * Intl.Segmenter は使わない。辞書がエンジンごとに違い、サーバー(Node)とブラウザで
 * 割り方が変わるとハイドレーションの不一致になるため。字種の切り替わりだけで決める:
 *  - 漢字・カタカナ・ひらがな・欧数字の連なりを1つの塊にする
 *  - 漢字/カタカナ/欧数字の直後のひらがな(送り仮名・助詞)は前へくっつける
 *  - 句読点・閉じ括弧・長音は前へ、開き括弧は次へくっつける
 */

type Kind = "kanji" | "kata" | "hira" | "latin" | "close" | "open" | "space" | "other";

function kindOf(ch: string): Kind {
  if (/\s/u.test(ch)) return "space";
  if (/[、。，．,.!?！？」』）)\]】〕…・:：;；]/u.test(ch)) return "close";
  if (/[「『（(\[【〔]/u.test(ch)) return "open";
  if (/[一-鿿々]/u.test(ch)) return "kanji";
  if (/[゠-ヿ]/u.test(ch)) return "kata"; // 長音「ー」もカタカナ扱い
  if (/[ぁ-ゟ]/u.test(ch)) return "hira";
  if (/[A-Za-z0-9\-&'’]/u.test(ch)) return "latin";
  return "other";
}

export function segmentText(text: string): string[] {
  /* 1) 同じ字種の連なりに割る */
  const runs: Array<{ k: Kind; t: string }> = [];
  for (const ch of Array.from(text)) {
    const k = kindOf(ch);
    const last = runs[runs.length - 1];
    if (last && last.k === k && k !== "open" && k !== "other") last.t += ch;
    else runs.push({ k, t: ch });
  }

  /* 2) 文節に近い単位へまとめる */
  const out: string[] = [];
  let lastKind: Kind | null = null;
  let carry = "";
  for (const { k, t } of runs) {
    if (k === "space") {
      if (carry) { out.push(carry); carry = ""; }
      out.push(" ");
      lastKind = "space";
      continue;
    }
    const prev = out.length ? out[out.length - 1] : "";
    const canJoin = prev !== "" && prev !== " " && !carry;
    const join = canJoin && (
      k === "close"
      || (k === "hira" && (lastKind === "kanji" || lastKind === "kata" || lastKind === "latin" || lastKind === "close"))
      || (k === "kanji" && lastKind === "kata")
    );
    if (join) {
      out[out.length - 1] = prev + t;
    } else if (k === "open") {
      carry += t;
    } else {
      out.push(carry + t);
      carry = "";
    }
    lastKind = k;
  }
  if (carry) out.push(carry);
  return out;
}
