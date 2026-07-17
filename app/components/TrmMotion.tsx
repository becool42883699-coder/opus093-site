"use client";

/**
 * TrmMotion — T-REX Motion layer for subpages
 * -------------------------------------------------
 * トップページ(app/page.tsx)と同じ Lenis + GSAP ScrollTrigger 構成を
 * サブページに提供する共通レイヤー。DOMは描画しない(return null)。
 *
 * 設計方針:
 * - 既存マークアップを変更せず、構造セレクタで対象を拾う
 * - 初期状態は gsap.from() で JS 実行後にのみ適用 → JS無効でも全文閲覧可
 * - prefers-reduced-motion では演出を全停止(進行バーの変数更新のみ)
 * - クラス/データ属性はすべて trm- 接頭辞で衝突回避
 */

import { useEffect } from "react";

export default function TrmMotion() {
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const disposers: Array<() => void> = [];

      /* ---- 1. スクロール進行バー(CSS変数を更新、描画は globals.css の body::after) ---- */
      let frame = 0;
      const updateProgress = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        document.documentElement.style.setProperty("--scroll-progress", p.toFixed(3));
        frame = 0;
      };
      const onNativeScroll = () => {
        if (!frame) frame = window.requestAnimationFrame(updateProgress);
      };
      updateProgress();
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      window.addEventListener("resize", onNativeScroll);
      disposers.push(() => {
        window.removeEventListener("scroll", onNativeScroll);
        window.removeEventListener("resize", onNativeScroll);
        if (frame) window.cancelAnimationFrame(frame);
        document.documentElement.style.removeProperty("--scroll-progress");
      });

      /* ---- 2. ページ入場フェード ---- */
      const mainEl = document.querySelector<HTMLElement>("main");
      mainEl?.classList.add("trm-pageIn");
      disposers.push(() => mainEl?.classList.remove("trm-pageIn"));

      /* ---- 3. ヘッダーのスクロール方向連動 表示/非表示 ---- */
      const header = document.querySelector<HTMLElement>("header");
      if (header && !reduceMotion) {
        const pos = window.getComputedStyle(header).position;
        if (pos === "sticky" || pos === "fixed") {
          header.classList.add("trm-headerAware");
          let lastY = window.scrollY;
          const onDirection = () => {
            const y = window.scrollY;
            if (y > lastY + 6 && y > 280) header.classList.add("trm-headerHidden");
            else if (y < lastY - 6 || y <= 280) header.classList.remove("trm-headerHidden");
            lastY = y;
          };
          window.addEventListener("scroll", onDirection, { passive: true });
          disposers.push(() => {
            window.removeEventListener("scroll", onDirection);
            header.classList.remove("trm-headerAware", "trm-headerHidden");
          });
        }
      }

      /* ---- 4. Lenis スムーススクロール(トップページと同一設定) ---- */
      // スマホはネイティブスクロールに任せる(タッチへの割り込みが操作感を悪化させるため)
      const lenis = reduceMotion || coarsePointer
        ? null
        : new Lenis({
            duration: coarsePointer ? 0.85 : 1.15,
            smoothWheel: !coarsePointer,
            wheelMultiplier: 0.88,
            touchMultiplier: 1,
          });
      const onLenisScroll = () => ScrollTrigger.update();
      const raf = (time: number) => lenis?.raf(time * 1000);
      if (lenis) {
        lenis.on("scroll", onLenisScroll);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        disposers.push(() => {
          lenis.off("scroll", onLenisScroll);
          gsap.ticker.remove(raf);
          lenis.destroy();
        });

        // ページ内アンカー(#positions 等)を Lenis で滑らかに
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
        const onAnchor = (event: Event) => {
          const link = event.currentTarget as HTMLAnchorElement;
          const target = link.hash ? document.querySelector<HTMLElement>(link.hash) : null;
          if (!target) return;
          event.preventDefault();
          lenis.scrollTo(target, { offset: -96 });
        };
        anchors.forEach((a) => a.addEventListener("click", onAnchor));
        disposers.push(() => anchors.forEach((a) => a.removeEventListener("click", onAnchor)));
      }

      document.documentElement.classList.add("motionReady");
      disposers.push(() => document.documentElement.classList.remove("motionReady"));

      /* ---- 5. ヒーロー見出しの文字分割(表示中のh1のみ・SR用テキストは保持) ---- */
      const heroSection = document.querySelector<HTMLElement>("main section");
      const heroTitle = heroSection?.querySelector<HTMLElement>("h1") ?? null;
      const chars: HTMLElement[] = [];
      let charCleanup = () => {};
      const titleVisible = !!heroTitle && heroTitle.offsetWidth > 10 && heroTitle.offsetHeight > 10;
      if (heroTitle && titleVisible && !reduceMotion && !heroTitle.dataset.trmSplit) {
        const originalHtml = heroTitle.innerHTML;
        heroTitle.dataset.trmSplit = "1";
        heroTitle.setAttribute("aria-label", heroTitle.textContent ?? "");
        Array.from(heroTitle.childNodes).forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          const text = node.textContent ?? "";
          const fragment = document.createDocumentFragment();
          for (const ch of Array.from(text)) {
            const span = document.createElement("span");
            span.className = "trm-char";
            span.setAttribute("aria-hidden", "true");
            span.textContent = ch === " " ? "\u00A0" : ch;
            fragment.appendChild(span);
            chars.push(span);
          }
          heroTitle.replaceChild(fragment, node);
        });
        charCleanup = () => {
          heroTitle.innerHTML = originalHtml;
          heroTitle.removeAttribute("aria-label");
          delete heroTitle.dataset.trmSplit;
        };
      }

      /* ---- 6. GSAPタイムライン群 ---- */
      const ctx = gsap.context(() => {
        if (reduceMotion) return;

        // 6-1. ヒーロー入場
        if (heroSection) {
          if (chars.length) {
            gsap.from(chars, {
              yPercent: 105,
              autoAlpha: 0,
              duration: 0.85,
              ease: "power4.out",
              stagger: 0.032,
              delay: 0.18,
            });
          }
          const heroIntro = heroSection.querySelectorAll<HTMLElement>(":scope div > p, :scope div > span");
          if (heroIntro.length) {
            gsap.from(heroIntro, {
              y: 26,
              autoAlpha: 0,
              duration: 0.9,
              stagger: 0.12,
              ease: "power3.out",
              delay: 0.1,
            });
          }
          // 背景の巨大アウトライン文字(T-REX)= 入場 + パララックス
          const bigType = heroSection.querySelector<HTMLElement>(":scope > b");
          if (bigType) {
            gsap.from(bigType, { autoAlpha: 0, xPercent: 8, duration: 1.4, ease: "power3.out", delay: 0.2 });
            gsap.to(bigType, {
              yPercent: -16,
              ease: "none",
              scrollTrigger: { trigger: heroSection, start: "top top", end: "bottom top", scrub: 1 },
            });
          }
        }

        // 6-2. セクションごとのリビール(ヒーロー以外・一度きり)
        gsap.utils.toArray<HTMLElement>("main section").slice(1).forEach((section) => {
          const children = Array.from(section.children) as HTMLElement[];
          if (!children.length) return;
          gsap.from(children, {
            y: 48,
            opacity: 0,
            duration: 1,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 82%", once: true },
          });
        });

        // 6-3. 見出しh2のせり上がり
        gsap.utils.toArray<HTMLElement>("main section h2").forEach((heading) => {
          gsap.from(heading, {
            yPercent: 60,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          });
        });

        // 6-4. カード類(記事カード / サービスカード)の3Dスタッガー
        gsap.utils
          .toArray<HTMLElement>('main section article, main section a[class*="card"]')
          .forEach((card, index) => {
            gsap.from(card, {
              y: 42,
              rotateX: finePointer ? 6 : 0,
              opacity: 0,
              duration: 0.85,
              delay: (index % 4) * 0.06,
              ease: "power3.out",
              scrollTrigger: { trigger: card, start: "top 90%", once: true },
            });
          });

        // 6-5. 会社概要dlの行スタッガー
        gsap.utils.toArray<HTMLElement>("main dl > div").forEach((row, index) => {
          gsap.from(row, {
            y: 24,
            opacity: 0,
            duration: 0.7,
            delay: (index % 6) * 0.05,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 92%", once: true },
          });
        });

        // 6-6. お問い合わせフォームの項目スタッガー
        gsap.utils.toArray<HTMLElement>("main form label").forEach((field, index) => {
          gsap.from(field, {
            y: 22,
            opacity: 0,
            duration: 0.6,
            delay: (index % 6) * 0.05,
            ease: "power2.out",
            scrollTrigger: { trigger: field, start: "top 94%", once: true },
          });
        });
      });

      /* ---- 7. マグネティックCTA(PC・ファインポインタのみ) ---- */
      if (finePointer && !reduceMotion) {
        const magnets = Array.from(
          document.querySelectorAll<HTMLElement>('a[class*="cta" i], main form button')
        );
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
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener("mousemove", onMove);
          el.addEventListener("mouseleave", onLeave);
          disposers.push(() => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
          });
        });
      }

      /* ---- 8. 画像読み込み後のトリガー再計算 ---- */
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      disposers.push(() => window.removeEventListener("load", onLoad));
      ScrollTrigger.refresh();

      cleanup = () => {
        ctx.revert();
        charCleanup();
        disposers.forEach((dispose) => dispose());
      };
    };

    setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
