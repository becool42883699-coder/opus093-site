/* sea-shots.mjs — 海だけを潜航の4点で撮る。「海が嘘くさい」の原因を探す時の目。
   本文とHUDを消して撮るので、水そのものだけが写る。

     node scripts/probe.mjs --view=desktop --tier=high --script=scripts/sea-shots.mjs
     node scripts/sea-profile.mjs artifacts/sea-desktop-0_14.png

   ★ ヘッドレスChromiumは既定で reduced-motion なので probe.mjs 経由で使うこと
     （probe.mjs が no-preference を立てている）。 */
const POINTS = [0.0, 0.06, 0.14, 0.30];

export default async function (page, h){
  const span = await page.evaluate(() =>
    document.getElementById('spacer').offsetHeight - innerHeight);
  await page.addStyleTag({ content: '#content,#hud,#diag{display:none !important}' });
  for (const p of POINTS){
    await page.evaluate(v => scrollTo(0, v), Math.round(span * p));
    await h.settle(null, 60000);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `artifacts/sea-${h.VIEW}-${String(p).replace('.','_')}.png` });
    console.log(p + ' ' + JSON.stringify(await page.evaluate(() => ({
      dive:+__diag.dive.toFixed(3), camY:+__diag.seam.camY.toFixed(2),
      hz:Math.round(__diag.seam.horizonPx), sky:__diag.fish.sky }))));
  }
  if (h.errors.length) console.log('ERR ' + JSON.stringify(h.errors.slice(0,3)));
}
