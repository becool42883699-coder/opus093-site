/**
 * T-REX サイト共通の定数。電話番号・ナビ・アセットのパスはここにだけ書く。
 * 表記を変える時はここを直せば全ページに行き渡る。
 */

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
/** public/ 配下のファイルを basePath 付きで参照する(CSSの url() や <video> 用) */
export const asset = (path: string) => `${BASE_PATH}${path}`;

export const TEL = "090-7531-5428";
export const TEL_HREF = "tel:09075315428";
export const FAX = "093-967-2347";
export const MAIL = "info@t-rex-works.com";
export const HOURS = "9:00〜18:00";
export const HOLIDAYS = "祝日・日曜日・土曜日（営業日あり）";

export type NavItem = { label: string; en: string; href: string };

export const NAV: NavItem[] = [
  { label: "トップ", en: "Top", href: "/" },
  { label: "サービス", en: "Services", href: "/service" },
  { label: "施工実績", en: "Works", href: "/works" },
  { label: "会社概要", en: "Company", href: "/company" },
  { label: "採用情報", en: "Recruit", href: "/recruit" },
  { label: "お問い合わせ", en: "Contact", href: "/contact" },
];
