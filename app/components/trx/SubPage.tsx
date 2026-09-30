import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import SiteMotion from "./SiteMotion";
import { NAV } from "./site";
import { breadcrumbLd, JsonLd } from "../TrmSeo";

/** サブページの外枠。ヘッダー / main#top / フッター / モーション / パンくずの構造化データ */
export default function SubPage({ current, footerCta = true, children }: { current: string; footerCta?: boolean; children: ReactNode }) {
  const item = NAV.find((n) => n.href === current);
  return (
    <>
      {item && <JsonLd data={breadcrumbLd(item.label, item.href)} />}
      <SiteHeader current={current} />
      <main id="top" data-x-site>{children}</main>
      <SiteFooter cta={footerCta} />
      <SiteMotion />
    </>
  );
}
