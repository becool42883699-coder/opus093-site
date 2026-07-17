"use client";

/**
 * TrmFx — T-REX cinematic FX layer(全ページ共通・layout.tsxから1箇所マウント)
 * -------------------------------------------------------------------------
 * TrmMotion(サブページ)/ page.tsx(トップ)の既存モーションと重複しない
 * 追加演出のみを担当する。クラスはすべて trm- 接頭辞。
 *
 * 全ページ: 初回ローディング演出 / カスタムカーソル(PC・ファインポインタのみ)
 * トップのみ: ヘッダー表示切替 / h1文字分割 / ヒーロー3D傾き / 数値カウンター /
 *            SVG線画描画 / aboutSceneクリップリビール / CTA強調 / ページ遷移フェード
 *
 * 方針: 初期状態はJS実行後にのみ適用(JS無効でも全文閲覧可)。
 *       prefers-reduced-motion では演出を全停止。
 */

import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";

const LOADER_KEY = "trm-loader-shown";

export default function TrmFx() {
  const [loaderPhase, setLoaderPhase] = useState<"hidden" | "shown" | "leaving">("hidden");

  /* ---- 1. 初回ローディング演出(セッション内1回のみ・約1.6秒) ---- */
  useLayoutEffect(() => {
    let frame = 0;
    let leaveTimer = 0;
    let doneTimer = 0;
    try {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const alreadyShown = window.sessionStorage.getItem(LOADER_KEY);
      // 読み込みに時間が掛かった後(コンテンツ表示後)に被せない
      const freshEnough = performance.now() < 3000;
      if (reduceMotion || alreadyShown || !freshEnough) return;
      window.sessionStorage.setItem(LOADER_KEY, "1");
      // ヒーロー演出側がローダー分の遅延を判断できるよう目印を付ける
      document.documentElement.dataset.trmLoading = "1";
      // rAFは次の描画前に発火するためフラッシュなしで表示できる
      frame = window.requestAnimationFrame(() => setLoaderPhase("shown"));
      leaveTimer = window.setTimeout(() => setLoaderPhase("leaving"), 1250);
      doneTimer = window.setTimeout(() => {
        setLoaderPhase("hidden");
        delete document.documentElement.dataset.trmLoading;
      }, 1800);
    } catch {
      /* sessionStorage不可(プライベートモード等)は演出なしで続行 */
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      delete document.documentElement.dataset.trmLoading;
    };
  }, []);

  /* ---- 2. カスタムカーソル + トップページ専用演出 ---- */
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const isTop = !!document.querySelector("main#top");
      const disposers: Array<() => void> = [];

      /* ---- 2-0. スクロール中に発光するページ枠(全ページ・全デバイス) ---- */
      {
        const frameEl = document.createElement("div");
        frameEl.className = "trm-frame";
        frameEl.setAttribute("aria-hidden", "true");
        document.body.appendChild(frameEl);
        let glow = 0;
        let lastY = window.scrollY;
        let frameRaf = 0;
        const decay = () => {
          glow = Math.max(0, glow - 0.026);
          frameEl.style.opacity = glow < 0.015 ? "0" : glow.toFixed(3);
          frameRaf = glow > 0.015 ? window.requestAnimationFrame(decay) : 0;
        };
        const onFrameScroll = () => {
          const y = window.scrollY;
          glow = Math.min(1, glow + Math.abs(y - lastY) / 260);
          lastY = y;
          if (!frameRaf) frameRaf = window.requestAnimationFrame(decay);
        };
        window.addEventListener("scroll", onFrameScroll, { passive: true });
        disposers.push(() => {
          window.removeEventListener("scroll", onFrameScroll);
          if (frameRaf) window.cancelAnimationFrame(frameRaf);
          frameEl.remove();
        });
      }

      if (!finePointer && !isTop) {
        cleanup = () => disposers.forEach((d) => d());
        return;
      }

      const { gsap } = await import("gsap");
      if (cancelled) {
        disposers.forEach((d) => d());
        return;
      }

      /* ---- 2-1. カスタムカーソル(PCのみ・システムカーソルは隠さない) ---- */
      if (finePointer) {
        const dot = document.createElement("div");
        dot.className = "trm-cursorDot";
        const ring = document.createElement("div");
        ring.className = "trm-cursorRing";
        dot.setAttribute("aria-hidden", "true");
        ring.setAttribute("aria-hidden", "true");
        document.body.append(ring, dot);

        const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
        const ringX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3.out" });
        const ringY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3.out" });
        let visible = false;
        const onMove = (event: MouseEvent) => {
          if (!visible) {
            visible = true;
            gsap.set([dot, ring], { x: event.clientX, y: event.clientY });
            gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
          }
          dotX(event.clientX);
          dotY(event.clientY);
          ringX(event.clientX);
          ringY(event.clientY);
        };
        const isInteractive = (target: EventTarget | null) =>
          target instanceof Element && !!target.closest("a, button, input, select, textarea, label");
        const onOver = (event: MouseEvent) => {
          ring.classList.toggle("trm-cursorActive", isInteractive(event.target));
        };
        const onLeaveDoc = () => {
          visible = false;
          gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 });
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("mouseover", onOver, { passive: true });
        document.documentElement.addEventListener("mouseleave", onLeaveDoc);
        disposers.push(() => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseover", onOver);
          document.documentElement.removeEventListener("mouseleave", onLeaveDoc);
          ring.remove();
          dot.remove();
        });
      }

      /* ---- トップページ専用(サブページはTrmMotionが担当) ---- */
      if (!isTop) {
        cleanup = () => disposers.forEach((d) => d());
        return;
      }

      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) {
        disposers.forEach((d) => d());
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      /* ---- 2-2. ヘッダーのスクロール方向連動 表示/非表示 ---- */
      const header = document.querySelector<HTMLElement>("header.siteHeader");
      if (header) {
        let lastY = window.scrollY;
        let armed = false;
        const onDirection = () => {
          const y = window.scrollY;
          if (y > 280 && !armed) {
            // 入場アニメーション(fill:both)がtransformを固定するため解除してから制御
            armed = true;
            header.style.animation = "none";
            header.classList.add("trm-headerAware");
          }
          if (!armed) return;
          if (y > lastY + 6 && y > 280) header.classList.add("trm-headerHidden");
          else if (y < lastY - 6 || y <= 280) header.classList.remove("trm-headerHidden");
          lastY = y;
        };
        window.addEventListener("scroll", onDirection, { passive: true });
        disposers.push(() => {
          window.removeEventListener("scroll", onDirection);
          header.classList.remove("trm-headerAware", "trm-headerHidden");
          header.style.removeProperty("animation");
        });
      }

      /* ---- 2-3. ヒーローh1の文字分割(SR用テキストはaria-labelで保持) ---- */
      const heroTitle = document.querySelector<HTMLElement>(".hero h1");
      const chars: HTMLElement[] = [];
      if (heroTitle && !heroTitle.dataset.trmSplit) {
        const originalHtml = heroTitle.innerHTML;
        heroTitle.dataset.trmSplit = "1";
        heroTitle.setAttribute("aria-label", heroTitle.textContent ?? "");
        // 既存CSSの入場アニメーション(heroCopyIn)と二重にならないよう解除
        heroTitle.style.animation = "none";
        Array.from(heroTitle.childNodes).forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // <em>等の装飾要素は分割せず1ユニットで動かす
            // (background-clip:text はtransformされた子孫グリフを描画できないため)
            const el = node as HTMLElement;
            if (el.tagName === "BR" || !(el.textContent ?? "").trim()) return;
            el.classList.add("trm-char");
            el.setAttribute("aria-hidden", "true");
            chars.push(el);
            return;
          }
          if (node.nodeType !== Node.TEXT_NODE) return;
          const fragment = document.createDocumentFragment();
          for (const ch of Array.from(node.textContent ?? "")) {
            const span = document.createElement("span");
            span.className = "trm-char";
            span.setAttribute("aria-hidden", "true");
            span.textContent = ch === " " ? "\u00A0" : ch;
            fragment.appendChild(span);
            chars.push(span);
          }
          heroTitle.replaceChild(fragment, node);
        });
        disposers.push(() => {
          heroTitle.innerHTML = originalHtml;
          heroTitle.removeAttribute("aria-label");
          heroTitle.style.removeProperty("animation");
          delete heroTitle.dataset.trmSplit;
        });
      }

      /* ---- 2-4. 数値カウンター(.stats dt 内の実数値のみ) ---- */
      const counterRestores: Array<() => void> = [];
      const counterSpans: Array<{ el: HTMLElement; target: number }> = [];
      document.querySelectorAll<HTMLElement>(".heroProof .stats dt").forEach((dt) => {
        const originalHtml = dt.innerHTML;
        let found = false;
        Array.from(dt.childNodes).forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          const text = node.textContent ?? "";
          if (!/\d/.test(text)) return;
          const fragment = document.createDocumentFragment();
          for (const part of text.split(/(\d+)/)) {
            if (/^\d+$/.test(part)) {
              const span = document.createElement("span");
              span.textContent = part;
              counterSpans.push({ el: span, target: Number(part) });
              fragment.appendChild(span);
              found = true;
            } else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          }
          dt.replaceChild(fragment, node);
        });
        if (found) counterRestores.push(() => { dt.innerHTML = originalHtml; });
      });
      disposers.push(() => counterRestores.forEach((r) => r()));

      /* ---- 2-5. GSAPコンテキスト(スクロール連動群) ---- */
      // 初回ローダー表示中はヒーロー演出をローダー明けまで遅らせる
      const loaderDelay = document.documentElement.dataset.trmLoading ? 1.15 : 0;
      const ctx = gsap.context(() => {
        // 文字分割の入場(奥からせり上がり)
        if (chars.length) {
          gsap.from(chars, {
            yPercent: 108,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.035,
            delay: 0.25 + loaderDelay,
          });
        }

        // 数値カウンター(実在データのみ・入場リビールに同期)
        counterSpans.forEach(({ el, target }) => {
          const state = { value: 0 };
          gsap.to(state, {
            value: target,
            duration: 1.3,
            delay: 0.85 + loaderDelay,
            ease: "power2.out",
            onUpdate: () => { el.textContent = String(Math.round(state.value)); },
          });
        });

        // SVG線画: スクロールで描画し、一度描いたら停止
        const lineArt = document.querySelectorAll<SVGPathElement>(".trm-lineArt path");
        if (lineArt.length) {
          lineArt.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          });
          gsap.to(lineArt, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: "power2.inOut",
            stagger: 0.14,
            scrollTrigger: { trigger: ".aboutScene", start: "top 78%", once: true },
          });
        }

        // 画像クリップリビール(aboutSceneを左からワイプ)
        const aboutScene = document.querySelector<HTMLElement>(".aboutScene");
        if (aboutScene) {
          gsap.fromTo(aboutScene,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 1.15,
              ease: "power4.inOut",
              scrollTrigger: { trigger: aboutScene, start: "top 82%", once: true },
            });
        }

        // フッター直前CTAの強調(電話番号ポップ + 送信ボタンの発光)
        gsap.from(".contactIntro .phone a", {
          scale: 0.9,
          autoAlpha: 0,
          duration: 0.8,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".contactSection", start: "top 70%", once: true },
        });
        const submitButton = document.querySelector<HTMLElement>(".contactForm button");
        if (submitButton) {
          ScrollTrigger.create({
            trigger: ".contactForm",
            start: "top 75%",
            once: true,
            onEnter: () => submitButton.classList.add("trm-ctaGlow"),
          });
        }
      });
      disposers.push(() => ctx.revert());

      /* ---- 2-6. ヒーローの3D傾き(最大約3度・PCのみ) ---- */
      const heroSection = document.querySelector<HTMLElement>(".hero");
      const heroContent = document.querySelector<HTMLElement>(".heroContent");
      if (finePointer && heroSection && heroContent) {
        gsap.set(heroContent, { transformPerspective: 950 });
        const rotX = gsap.quickTo(heroContent, "rotationX", { duration: 0.7, ease: "power3.out" });
        const rotY = gsap.quickTo(heroContent, "rotationY", { duration: 0.7, ease: "power3.out" });
        const onTilt = (event: MouseEvent) => {
          const rect = heroSection.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          rotY(nx * 3.2);
          rotX(ny * -2.6);
        };
        const onTiltLeave = () => { rotX(0); rotY(0); };
        heroSection.addEventListener("mousemove", onTilt, { passive: true });
        heroSection.addEventListener("mouseleave", onTiltLeave);
        disposers.push(() => {
          heroSection.removeEventListener("mousemove", onTilt);
          heroSection.removeEventListener("mouseleave", onTiltLeave);
        });
      }

      /* ---- 2-7. マグネティックボタン(トップのみ・サブページはTrmMotionが担当) ---- */
      if (finePointer) {
        const magnets = Array.from(document.querySelectorAll<HTMLElement>(
          ".heroActions a, .headerCta, .outlineButton, .contactForm button"
        ));
        magnets.forEach((el) => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
          const onMove = (event: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            xTo(Math.max(-8, Math.min(8, dx * 0.18)));
            yTo(Math.max(-6, Math.min(6, dy * 0.22)));
          };
          const onLeave = () => { xTo(0); yTo(0); };
          el.addEventListener("mousemove", onMove);
          el.addEventListener("mouseleave", onLeave);
          disposers.push(() => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
          });
        });
      }

      /* ---- 2-8. ページ遷移フェード(内部リンクのみ・トップはプレーンaタグ) ---- */
      const onLinkClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element | null)?.closest?.("a");
        if (!link || link.target || !link.getAttribute("href")?.startsWith("/")) return;
        event.preventDefault();
        document.documentElement.classList.add("trm-pageExit");
        window.setTimeout(() => { window.location.href = link.href; }, 240);
      };
      document.addEventListener("click", onLinkClick);
      const onPageShow = () => document.documentElement.classList.remove("trm-pageExit");
      window.addEventListener("pageshow", onPageShow);
      disposers.push(() => {
        document.removeEventListener("click", onLinkClick);
        window.removeEventListener("pageshow", onPageShow);
        document.documentElement.classList.remove("trm-pageExit");
      });

      cleanup = () => disposers.forEach((d) => d());
    };

    setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (loaderPhase === "hidden") return null;

  return (
    <div className={loaderPhase === "leaving" ? "trm-loader trm-loaderLeaving" : "trm-loader"} aria-hidden="true">
      <div className="trm-loaderInner">
        <Image src="/icons/brand-tx.svg" alt="" width={64} height={64} priority />
        <span className="trm-loaderType">T-REX</span>
        <span className="trm-loaderBar"><i /></span>
      </div>
    </div>
  );
}
