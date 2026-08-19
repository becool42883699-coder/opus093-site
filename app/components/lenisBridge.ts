/**
 * Lenis + GSAP ScrollTrigger の橋渡しを、ページで1つだけ持つための入れ物。
 *
 * トップページは「スクロール演出(TopMotion)」と「4幕エンジン体験(EngineScene)」の
 * 2つがスクロールに依存するが、Lenis を2つ作るとスクロールが震えて壊れる。
 * 所有者は TopMotion 1つに固定し、他はここから参照するだけにする。
 *
 * ヒーローの「サービス一覧へ」スキップリンクもここから Lenis を取り、
 * ピン区間を飛ばしてスムーズスクロールする。
 */

type LenisLike = {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; immediate?: boolean },
  ) => void;
};

let current: LenisLike | null = null;

export function setLenis(instance: LenisLike | null) {
  current = instance;
}

export function getLenis(): LenisLike | null {
  return current;
}

/**
 * 要素までスクロールする。Lenis があれば滑らかに、無ければネイティブで。
 * ピン区間を挟んでいても、対象要素の実座標へ飛ぶだけなのでピンは壊れない。
 */
export function scrollToElement(target: HTMLElement, offset = -72) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.1 });
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const y = target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}
