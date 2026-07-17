import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./subpage.module.css";
import TrmMotion from "./TrmMotion";
import TrmMenu from "./TrmMenu";

const nav = [
  ["サービス", "/service"], ["施工実績", "/works"], ["会社案内", "/about"],
  ["会社情報", "/company"], ["採用情報", "/recruit"], ["お問い合わせ", "/contact"],
];

export function SubHeader({ active }: { active?: string }) {
  return <header className={styles.header}>
    <TrmMotion />
    <Link className={styles.brand} href="/"><Image src="/icons/brand-tx.svg" alt="" width={46} height={46}/><span><strong>T-REX</strong><small>T-REX CO., LTD.</small></span></Link>
    <nav>{nav.map(([label, href]) => <Link key={href} className={active===href?styles.active:""} href={href}>{label}</Link>)}</nav>
    <Link className={styles.cta} href="/contact">お問い合わせ</Link>
    <TrmMenu />
  </header>;
}

export function SubHero({ en, ja, lead, children }: { en:string; ja:ReactNode; lead:ReactNode; children?:ReactNode }) {
  return <section className={styles.hero}><div><p>{en}</p><h1>{ja}</h1><span>{lead}</span></div><b aria-hidden="true">T-REX</b>{children}</section>;
}

export function SubFooter() {
  return <footer className={styles.footer}><Link className={styles.brand} href="/"><Image src="/icons/brand-tx.svg" alt="" width={46} height={46}/><span><strong>T-REX</strong><small>T-REX CO., LTD.</small></span></Link><div>{nav.map(([l,h])=><Link key={h} href={h}>{l}</Link>)}</div><small>© T-REX CO., LTD. All Rights Reserved.</small></footer>;
}

export { styles };
