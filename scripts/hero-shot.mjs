/* hero-shot.mjs — ヒーローを「実際に出るもの全部入り」で撮り、寸法を出す。
   ★ HUDを隠さないこと。隠して撮ると見出し・CTAの無い絵になり、
     構図の判断を誤る(実際に「カードが遠すぎる」の判断を1往復無駄にした)。

     node scripts/probe.mjs --view=mobile  --tier=high --script=scripts/hero-shot.mjs
     node scripts/probe.mjs --view=desktop --tier=high --script=scripts/hero-shot.mjs

   出力: artifacts/hero-<view>.png と、カードの画面上の寸法・CTA下端。
   カードを寄せる/離すときは「幅の割合」と「ctaBottom」を必ず一緒に見る
   (solvePortraitLift が仰角を解くので、大きくすると空が増える)。 */
export default async function (page, h){
  await page.evaluate(() => scrollTo(0,0));
  await h.settle(null, 40000);
  await page.addStyleTag({ content: '#diag{display:none !important}' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `artifacts/hero-${h.VIEW}.png` });
  console.log(JSON.stringify(await page.evaluate(() => {
    const r = document.getElementById('cta')?.getBoundingClientRect();
    const c = window.__diag.cardRects && window.__diag.cardRects[0];
    return { ih:innerHeight, iw:innerWidth,
             ctaBottom: r ? Math.round(r.bottom) : null,
             card: c ? {x:Math.round(c.x), y:Math.round(c.y),
                        w:Math.round(c.w), h:Math.round(c.h)} : null,
             幅の割合: c ? +(c.w/innerWidth*100).toFixed(1) : null };
  })));
}
