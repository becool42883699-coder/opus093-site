"use client";

/**
 * 「ただいま営業中 / 本日の営業は終了」をその場で判定して出すバッジ。
 * 営業時間は 10:00〜20:00・年中無休(沼店/中吉田店 共通)。
 *
 * - 日本時間(JST)で判定する。閲覧者の端末が海外時刻でも店の時間で正しく出す。
 * - SSRとクライアントで表示がズレないよう、初回描画では何も出さず
 *   マウント後に確定させる(hydrationミスマッチ回避)。
 * - 1分ごとに更新。アンマウントでタイマー解除。
 */

/* マウント後に判定を確定させる必要があるため(SSRでは時刻を確定できない)。 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import styles from "./becool.module.css";

const OPEN_H = 10;
const CLOSE_H = 20;

/** JSTの「その日の分」に変換した現在時刻 */
function jstMinutes(now: Date): number {
  // UTC基準からJST(+9h)へ。端末のタイムゾーン設定に依存しない。
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const jst = new Date(utc + 9 * 60 * 60_000);
  return jst.getHours() * 60 + jst.getMinutes();
}

export default function OpenStatus() {
  const [state, setState] = useState<null | { open: boolean; label: string }>(null);

  useEffect(() => {
    const calc = () => {
      const m = jstMinutes(new Date());
      const open = m >= OPEN_H * 60 && m < CLOSE_H * 60;
      let label: string;
      if (open) {
        const left = CLOSE_H * 60 - m;
        label = left <= 60 ? `まもなく閉店（${CLOSE_H}:00まで）` : `ただいま営業中（${CLOSE_H}:00まで）`;
      } else {
        label = m < OPEN_H * 60 ? `本日 ${OPEN_H}:00 から営業` : `本日の営業は終了（明日 ${OPEN_H}:00 から）`;
      }
      setState({ open, label });
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, []);

  // 判定前は場所だけ確保して何も出さない(レイアウトのガタつき防止)
  if (!state) return <span className={styles.openBadge} data-pending="true" aria-hidden="true" />;

  return (
    <span className={styles.openBadge} data-open={state.open ? "true" : "false"}>
      <span className={styles.openDot} aria-hidden="true" />
      {state.label}
    </span>
  );
}
