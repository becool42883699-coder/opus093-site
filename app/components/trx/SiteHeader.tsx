"use client";

/**
 * 全ページ共通の固定ヘッダーとメニュー。
 *
 * 命綱: 電話ボタンはどのスクロール位置・どの画面幅でも押せる。隠す演出を入れない。
 * JS無効でも読めるよう、既定は「不透明の帯」。ページ先頭にいる間だけ JS が
 * data-top を立てて透明にする(暗いヒーローの上に載るため)。
 *
 * chapters を渡すとトップの4幕用の章ナビを出す。EngineScene が
 * [data-chapnav] / [data-chapnow] を document から引いて書き換える。
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BrandMark, PhoneGlyph } from "./Icon";
import { HOURS, MAIL, NAV, TEL, TEL_HREF } from "./site";
import { getLenis } from "../lenisBridge";
import s from "./site.module.css";

export default function SiteHeader({ current = "/", chapters }: { current?: string; chapters?: string[] }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  /* 先頭にいる間だけ透明。rAF で間引く */
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    let frame = 0;
    /* ヘッダーの下にある面の色(data-surface)に合わせて帯の色を切り替える。
       明るい面の上で暗い半透明の帯を重ねると、濁ったグレーになるため */
    const surfaces = Array.from(document.querySelectorAll<HTMLElement>("[data-surface]"));
    const update = () => {
      frame = 0;
      el.dataset.top = window.scrollY < 24 ? "true" : "false";
      const line = el.offsetHeight - 1;
      let surface = "dark";
      for (const sec of surfaces) {
        const r = sec.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) {
          surface = sec.dataset.surface || "dark";
          break;
        }
      }
      el.dataset.surface = surface;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    menuButton.current?.focus();
  }, []);

  /* メニューを開いている間は背面のスクロールを止め、Esc で閉じる */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    getLenis()?.stop?.();
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      getLenis()?.start?.();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <header ref={header} className={s.header} data-site-header>
        <Link className={s.brand} href="/" aria-label="T-REX トップへ">
          <BrandMark className={s.brandMark} />
          <span className={s.brandType}>T-REX<small>CO., LTD.</small></span>
        </Link>

        {chapters && (
          <>
            <ol className={s.chapnav} aria-hidden="true">
              {chapters.map((label, i) => <li key={label} data-chapnav={i}>{label}</li>)}
            </ol>
            <div className={s.chapnow} data-chapnow aria-hidden="true">{chapters[0]}</div>
          </>
        )}

        <nav className={s.nav} aria-label="メインナビゲーション">
          {NAV.slice(1).map((item) => (
            <Link key={item.href} href={item.href} aria-current={current === item.href ? "page" : undefined}>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={s.headerActions}>
          {/* 命綱。全スクロール位置で押せる */}
          <a className={s.tel} href={TEL_HREF} aria-label={`電話でお問い合わせ ${TEL}`}>
            <PhoneGlyph className={s.telGlyph} />
            <span className={s.telNum}>{TEL}</span>
          </a>
          <button
            ref={menuButton}
            className={s.menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            <span className={s.menuLabel}>Menu</span>
            <span className={s.menuLines} aria-hidden="true"><i /><i /></span>
            <span className={s.srOnly}>を開く</span>
          </button>
        </div>
      </header>

      <div
        id="site-menu"
        className={s.menu}
        data-open={open ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="サイトメニュー"
        aria-hidden={!open}
        inert={!open}
      >
        <div className={s.menuTop}>
          <span className={s.menuIndex}>(Menu)</span>
          <button ref={closeButton} className={s.menuClose} type="button" onClick={close} tabIndex={open ? 0 : -1}>
            Close<span className={s.srOnly}>メニューを閉じる</span>
          </button>
        </div>
        <nav className={s.menuNav} aria-label="サイトメニュー">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              aria-current={current === item.href ? "page" : undefined}
              style={{ "--i": i } as CSSProperties}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              <span className={s.menuJa}>{item.label}</span>
              <span className={s.menuEn} aria-hidden="true">{item.en}</span>
            </Link>
          ))}
        </nav>
        <div className={s.menuInfo}>
          <a className={s.menuTel} href={TEL_HREF} tabIndex={open ? 0 : -1}>
            <PhoneGlyph className={s.telGlyph} />{TEL}
          </a>
          <p>営業時間 {HOURS}<br />福岡県・山口県を中心に出張対応</p>
          <a href={`mailto:${MAIL}`} tabIndex={open ? 0 : -1}>{MAIL}</a>
        </div>
      </div>
    </>
  );
}
