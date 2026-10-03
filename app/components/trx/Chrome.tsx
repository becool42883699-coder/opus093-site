"use client";

/**
 * 全ページ共通の「画面の外側」の演出。SiteMotion が1つだけ描く。
 *
 *  1. ページ遷移の幕: サイト内リンク(NAV の6ページ)を押すと濃紺の幕が下から上がり、
 *     行き先の名前を出してから遷移し、新しいページで幕が上へ抜ける。
 *     - Next の <Link> より先に(window の capture で)クリックを受け、幕を上げてから
 *       同じリンクをもう一度 click() して Link 自身に遷移させる(basePath・prefetch・スクロールは Link 任せ)。
 *     - 幕の状態は <html> の data-x-leaving / data-x-entering。html はページをまたいで残るので、
 *       新しいページの幕は「閉じた状態」で生まれ、1フレーム描いてから抜ける。
 *     - reduced-motion・修飾キー付き・別タブ・ページ内リンク・NAV 以外の行き先では何もしない。
 *     - 遷移が4秒たっても起きなければ普通のページ移動に切り替える(幕が残り続けない)。
 *  2. カーソルの輪(マウスの端末のみ): 本物のカーソルは残したまま、少し遅れて輪が追う。
 *     リンクの上で広がり、data-cursor="view|drag" の上ではラベル付きの円になる。"hide" で消える。
 *
 * どちらも JS 無効では存在しない(幕は visibility:hidden、輪は display:none のまま)。
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { Logo } from "./Icon";
import { BASE_PATH, NAV } from "./site";
import c from "./chrome.module.css";

/* 遷移中の行き先。モジュールはクライアント遷移をまたいで生きているので、新しいページへ渡せる */
let pending: { en: string; n: string } | null = null;
/* 幕を抜き終えたら属性を外すタイマー。遷移直後はコンポーネントが一度描き直されることがあり、
   アンマウントで消すと外し損ねて幕が残るので、モジュール側で持って消さない */
let enteringTimer = 0;

const normalize = (pathname: string) => {
  let p = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  p = p.replace(/\/+$/, "");
  return p || "/";
};

const CURSOR_LABEL: Record<string, string> = { view: "View", drag: "Drag" };

export default function SiteChrome() {
  const en = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const ringLabel = useRef<HTMLSpanElement>(null);

  /* ---- 新しいページ: 閉じた幕を1フレーム描いてから上へ抜く ---- */
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-x-leaving")) return;
    if (pending) {
      if (en.current) en.current.textContent = pending.en;
      if (num.current) num.current.textContent = pending.n;
    }
    /* 幕の裏で先頭へ戻す。前のページの Lenis が残したスクロール位置を引き継がない */
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        html.removeAttribute("data-x-leaving");
        html.setAttribute("data-x-entering", "");
        pending = null;
        window.clearTimeout(enteringTimer);
        enteringTimer = window.setTimeout(() => html.removeAttribute("data-x-entering"), 1300);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- 今のページ: リンクを押したら幕を上げてから遷移 ---- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    let bypass = false;
    let go = 0;
    let failsafe = 0;

    const onClick = (event: MouseEvent) => {
      if (bypass || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = normalize(url.pathname);
      if (to === normalize(window.location.pathname)) return;
      const index = NAV.findIndex((item) => item.href === to);
      if (index < 0) return;

      event.preventDefault();
      event.stopPropagation();
      if (html.hasAttribute("data-x-leaving")) return;
      pending = { en: NAV[index].en, n: `${String(index + 1).padStart(2, "0")} / ${String(NAV.length).padStart(2, "0")}` };
      if (en.current) en.current.textContent = pending.en;
      if (num.current) num.current.textContent = pending.n;
      html.removeAttribute("data-x-entering");
      html.setAttribute("data-x-leaving", "");
      go = window.setTimeout(() => {
        bypass = true;
        link.click();
        bypass = false;
        failsafe = window.setTimeout(() => window.location.assign(link.href), 4000);
      }, 640);
    };
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.clearTimeout(go);
      window.clearTimeout(failsafe);
    };
  }, []);

  /* ---- カーソルの輪(マウスのみ) ---- */
  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    html.setAttribute("data-x-cursor", "");

    let x = -200;
    let y = -200;
    let cx = x;
    let cy = y;
    let raf = 0;
    let shown = false;

    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!shown) {
        shown = true;
        cx = x;
        cy = y;
        el.dataset.on = "true";
      }
      kick();
    };
    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const zone = target?.closest?.("[data-cursor]");
      const kind = zone?.getAttribute("data-cursor") ?? (target?.closest?.("a, button, summary, label, select, [role='button']") ? "link" : "");
      el.dataset.state = kind;
      if (ringLabel.current) ringLabel.current.textContent = CURSOR_LABEL[kind] ?? "";
    };
    const onLeave = () => {
      shown = false;
      el.dataset.on = "false";
    };
    const onDown = () => (el.dataset.down = "true");
    const onUp = () => (el.dataset.down = "false");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      html.removeAttribute("data-x-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div className={c.curtain} aria-hidden="true">
        <div className={c.curtainGrid} />
        <div className={c.curtainBody}>
          <Logo className={c.curtainLogo} />
          <span className={c.curtainEn} ref={en} />
          <span className={c.curtainNum} ref={num} />
        </div>
        <div className={c.curtainBar}><i /></div>
      </div>
      <div className={c.grain} aria-hidden="true" />
      <div className={c.ring} ref={ring} aria-hidden="true">
        <span ref={ringLabel} />
      </div>
    </>
  );
}
