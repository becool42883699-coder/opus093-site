/**
 * T-REX v2 のスクロール演出。DOM の data-x-* 属性だけを見て動く(クラス名では引かない)。
 *
 *   data-x-split[="load"]   見出しを1文字ずつマスクからせり上げる。"load" は読込直後に再生
 *   data-x-reveal[="load"|"stagger"]  フェードアップ。stagger は子要素を順に
 *   data-x-clip[="load"]    画像を下からのクリップで開き、中の画像を縮めながら見せる
 *   data-x-parallax="n"     スクロールに合わせて ±n% 動かす
 *   data-x-words            文章を読む速さで1文字ずつ点灯させる(スクラブ)
 *   data-x-marquee          無限に流れる帯。スクロールの速さで加速し、向きも追従する
 *   data-x-hscroll          横スクロールのギャラリー(PC幅のみピン留め)
 *   data-x-preview          リストのホバーでカーソルに画像を追従させる(マウスのみ)
 *   data-x-magnetic         ボタンがカーソルに少し吸い寄せられる(マウスのみ)
 *   data-x-hero             ヒーローの退場(中のメディアを拡大・本文を持ち上げる)
 *   data-x-wordmark         フッターの巨大ロゴのせり上がり
 *
 * 初期状態(隠す・ずらす)は全て gsap.from で JS 実行後に付ける。
 * JS無効・reduced-motion ではどの要素も最初から読める状態のまま。
 */

import type { gsap as GsapType } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import { segmentText } from "./segment";

type Gsap = typeof GsapType;
type ST = typeof ScrollTriggerType;

const EASE = "expo.out";

/** テキストノードを1文字ずつ span に割る。元の HTML を返すので cleanup で戻せる。
 *  mask=true なら文字ごとに overflow:hidden の器で包む(せり上げ用)。 */
function splitChars(el: HTMLElement, mask: boolean): { chars: HTMLElement[]; restore: () => void } {
  const original = el.innerHTML;
  const label = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const chars: HTMLElement[] = [];

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (!text.trim()) continue;
        const frag = document.createDocumentFragment();
        /* 改行してよい単位(文節に近いまとまり)ごとに nowrap で包む。segment.ts 参照 */
        for (const token of segmentText(text)) {
          if (token === " ") {
            frag.appendChild(document.createTextNode(" "));
            continue;
          }
          const word = document.createElement("span");
          word.className = mask ? "x-word" : "x-run";
          for (const ch of Array.from(token)) {
            const c = document.createElement("span");
            c.className = "x-c";
            c.textContent = ch;
            if (mask) {
              const m = document.createElement("span");
              m.className = "x-m";
              m.appendChild(c);
              word.appendChild(m);
            } else {
              word.appendChild(c);
            }
            chars.push(c);
          }
          frag.appendChild(word);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== "BR") {
        walk(child);
      }
    }
  };
  walk(el);

  /* 読み上げは元の文で。割った span は読ませず、見えない元の文を1つ添える
     (<p> の aria-label は読み上げソフトが無視することが多いため使わない) */
  if (!el.closest("[aria-hidden='true']")) {
    el.querySelectorAll(".x-word, .x-run").forEach((w) => w.setAttribute("aria-hidden", "true"));
    const sr = document.createElement("span");
    sr.className = "x-sr";
    sr.textContent = label;
    el.appendChild(sr);
  }
  return {
    chars,
    restore: () => {
      el.innerHTML = original;
    },
  };
}

export function initEffects(gsap: Gsap, ScrollTrigger: ST): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return () => {};
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const disposers: Array<() => void> = [];
  const root = document.documentElement;
  root.dataset.xMotion = "on";
  disposers.push(() => delete root.dataset.xMotion);

  const ctx = gsap.context(() => {
    /* ---- 見出しの文字せり上げ ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-split]").forEach((el) => {
      const { chars, restore } = splitChars(el, true);
      disposers.push(restore);
      const onLoad = el.dataset.xSplit === "load";
      gsap.from(chars, {
        yPercent: 118,
        rotate: 4,
        duration: 1.25,
        ease: EASE,
        stagger: Math.min(0.035, 0.6 / Math.max(1, chars.length)),
        delay: onLoad ? 0.15 : 0,
        scrollTrigger: onLoad ? undefined : { trigger: el, start: "top 88%", once: true },
      });
    });

    /* ---- フェードアップ ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-reveal]").forEach((el) => {
      const mode = el.dataset.xReveal;
      const targets = mode === "stagger" ? Array.from(el.children) : el;
      gsap.from(targets, {
        y: 56,
        autoAlpha: 0,
        duration: 1.3,
        ease: EASE,
        stagger: 0.09,
        delay: mode === "load" ? 0.45 : 0,
        scrollTrigger: mode === "load" ? undefined : { trigger: el, start: "top 90%", once: true },
      });
    });

    /* ---- 画像のクリップリビール ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-clip]").forEach((el) => {
      const onLoad = el.dataset.xClip === "load";
      const media = el.querySelector("img, video");
      const tl = gsap.timeline({
        delay: onLoad ? 0.35 : 0,
        scrollTrigger: onLoad ? undefined : { trigger: el, start: "top 88%", once: true },
      });
      tl.from(el, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
      if (media) tl.from(media, { scale: 1.35, duration: 2, ease: EASE }, 0);
    });

    /* ---- パララックス ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-parallax]").forEach((el) => {
      const amount = Number(el.dataset.xParallax) || 10;
      gsap.fromTo(
        el,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    /* ---- 文章を1文字ずつ点灯 ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-words]").forEach((el) => {
      const { chars, restore } = splitChars(el, false);
      disposers.push(restore);
      gsap.fromTo(
        chars,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 52%", scrub: 0.6 },
        },
      );
    });

    /* ---- マーキー ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-marquee]").forEach((el) => {
      const tracks = el.querySelectorAll<HTMLElement>("[data-x-track]");
      if (!tracks.length) return;
      const speed = Number(el.dataset.xMarquee) || 38; // 1周の秒数
      const loop = gsap.to(tracks, { xPercent: -100, duration: speed, ease: "none", repeat: -1 });
      let dir = 1;
      const settle = gsap.quickTo(loop, "timeScale", { duration: 0.9, ease: "power3.out" });
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction;
          const boost = 1 + Math.min(5, Math.abs(self.getVelocity()) / 260);
          loop.timeScale(boost * dir);
          settle(dir);
        },
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      });
    });

    /* ---- ヒーローの退場 ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-hero]").forEach((hero) => {
      const media = hero.querySelector<HTMLElement>("[data-x-hero-media]");
      const body = hero.querySelector<HTMLElement>("[data-x-hero-body]");
      const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      if (media) gsap.to(media, { scale: 1.12, yPercent: 10, ease: "none", scrollTrigger: st });
      if (body) gsap.to(body, { yPercent: -14, ease: "none", scrollTrigger: st });
    });

    /* ---- フッターの巨大ロゴ ---- */
    gsap.utils.toArray<HTMLElement>("[data-x-wordmark]").forEach((el) => {
      gsap.from(el, {
        yPercent: 60,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true },
      });
    });

    /* ---- 横スクロールのギャラリー(900px以上) ----
       上に4幕エンジンのピンがあるので、refreshPriority を下げて
       エンジン側のピンの後に測り直させる(順番が逆だと開始位置がずれる)。 */
    const mm = gsap.matchMedia();
    disposers.push(() => mm.revert());
    mm.add("(min-width: 900px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-x-hscroll]").forEach((section) => {
        const track = section.querySelector<HTMLElement>("[data-x-hscroll-track]");
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
        });
        const bar = section.querySelector<HTMLElement>("[data-x-hscroll-bar]");
        if (bar) {
          gsap.fromTo(bar, { scaleX: 0 }, {
            scaleX: 1, ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, scrub: true, refreshPriority: -1 },
          });
        }
        track.querySelectorAll<HTMLElement>("[data-x-hscroll-img]").forEach((img) => {
          gsap.fromTo(img, { xPercent: -8 }, {
            xPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement ?? img,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          });
        });
      });
    });
  });
  disposers.push(() => ctx.revert());

  /* ---- ホバーで画像が追従するリスト(マウスのみ) ---- */
  if (fine) {
    document.querySelectorAll<HTMLElement>("[data-x-preview]").forEach((list) => {
      const box = list.querySelector<HTMLElement>("[data-x-preview-box]");
      if (!box) return;
      const imgs = Array.from(box.querySelectorAll<HTMLElement>("[data-x-preview-img]"));
      const xTo = gsap.quickTo(box, "x", { duration: 0.7, ease: "power3.out" });
      const yTo = gsap.quickTo(box, "y", { duration: 0.7, ease: "power3.out" });
      const rTo = gsap.quickTo(box, "rotate", { duration: 0.9, ease: "power3.out" });
      let lastX = 0;
      const onMove = (event: MouseEvent) => {
        const rect = list.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        xTo(x);
        yTo(y);
        rTo(Math.max(-8, Math.min(8, (event.clientX - lastX) * 0.6)));
        lastX = event.clientX;
      };
      const show = (i: number) => {
        box.dataset.on = "true";
        imgs.forEach((img, j) => (img.dataset.on = j === i ? "true" : "false"));
      };
      const hide = () => (box.dataset.on = "false");
      const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-x-preview-row]"));
      const enters = rows.map((row, i) => {
        const fn = () => show(i);
        row.addEventListener("mouseenter", fn);
        return () => row.removeEventListener("mouseenter", fn);
      });
      list.addEventListener("mousemove", onMove);
      list.addEventListener("mouseleave", hide);
      disposers.push(() => {
        enters.forEach((off) => off());
        list.removeEventListener("mousemove", onMove);
        list.removeEventListener("mouseleave", hide);
      });
    });

    /* ---- マグネティックボタン ---- */
    document.querySelectorAll<HTMLElement>("[data-x-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const onMove = (event: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((event.clientX - (rect.left + rect.width / 2)) * 0.22);
        yTo((event.clientY - (rect.top + rect.height / 2)) * 0.3);
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
        gsap.set(el, { clearProps: "transform" });
      });
    });
  }

  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);
  disposers.push(() => window.removeEventListener("load", onLoad));
  /* Webフォントで行の高さが変わると開始位置がずれるので、揃ってから測り直す */
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  ScrollTrigger.refresh();

  return () => {
    for (let i = disposers.length - 1; i >= 0; i--) disposers[i]();
  };
}
