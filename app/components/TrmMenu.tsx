"use client";

/**
 * TrmMenu — サブページ共通のハンバーガーメニュー
 * パネルはcreatePortalでbody直下に描画する。
 * (ヘッダー内に置くとiOSのbackdrop-filterバグでfixedが親基準に化けるため)
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const items = [
  ["サービス", "/service"],
  ["施工実績", "/works"],
  ["会社案内", "/about"],
  ["会社情報", "/company"],
  ["採用情報", "/recruit"],
  ["お問い合わせ", "/contact"],
];

export default function TrmMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <>
      <button
        className="trm-subMenuButton"
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        aria-controls="trm-subnav"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      {mounted &&
        createPortal(
          <nav className={open ? "trm-subNav isOpen" : "trm-subNav"} id="trm-subnav" aria-label="メニュー">
            {items.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a className="headerCta" href="/contact" onClick={() => setOpen(false)}>お問い合わせ</a>
          </nav>,
          document.body
        )}
    </>
  );
}
