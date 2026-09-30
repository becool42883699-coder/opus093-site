"use client";

import { type FormEvent } from "react";
import { ArrowGlyph, PhoneGlyph } from "../components/trx/Icon";
import PageHero from "../components/trx/PageHero";
import SubPage from "../components/trx/SubPage";
import { HOURS, MAIL, TEL, TEL_HREF } from "../components/trx/site";
import site from "../components/trx/site.module.css";
import sub from "../components/trx/sub.module.css";
import { faq } from "./faq";

/* 送信先サーバーを持たない静的サイトなので、入力内容をメールソフトに渡す */
function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const d = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`Webサイトからのお問い合わせ：${d.get("subject") || "ご相談"}`);
  const body = encodeURIComponent([
    `お名前：${d.get("name") || ""}`,
    `会社名：${d.get("company") || ""}`,
    `電話番号：${d.get("phone") || ""}`,
    `メール：${d.get("email") || ""}`,
    "",
    String(d.get("message") || ""),
  ].join("\n"));
  window.location.href = `mailto:${MAIL}?subject=${subject}&body=${body}`;
}

export default function ContactPage() {
  return (
    <SubPage current="/contact" footerCta={false}>
      <PageHero
        index="06" en="Contact"
        ja={[["現場のことなら、"], [{ text: "お気軽に。", em: true }]]}
        lead="修理・施工・出張対応など、現場のことならお気軽にご相談ください。お見積りは無料です。"
      />

      <section className={`${site.section} ${site.light} ${site.lift}`} data-surface="light" aria-labelledby="direct-title">
        <div className={sub.split}>
          <div className={sub.sticky}>
            <p className={site.label}><span>(01)</span>Direct — お電話</p>
            <h2 id="direct-title" className={site.h2} style={{ marginTop: 24, fontSize: "clamp(2rem, 4.4vw, 4.4rem)" }} data-x-split>
              お急ぎの方は、<br /><em>お電話を。</em>
            </h2>
            <a className={sub.telBig} href={TEL_HREF}><PhoneGlyph />{TEL}</a>
            <div className={sub.meta}>
              <span>営業時間 {HOURS}</span>
              <a href={`mailto:${MAIL}`}>{MAIL}</a>
              <span>対応エリア: 福岡県(北九州市・福岡市ほか全域)/山口県(下関市ほか全域)。その他の地域もご相談ください。出張修理・持込修理どちらも対応します。</span>
            </div>
          </div>

          <form className={sub.form} onSubmit={submit} aria-labelledby="form-title">
            <p className={site.label} id="form-title"><span>(02)</span>Form — フォームで相談</p>
            <div className={sub.formGrid}>
              <label className={sub.field}><span>お名前<b>必須</b></span><input name="name" autoComplete="name" required /></label>
              <label className={sub.field}><span>会社名</span><input name="company" autoComplete="organization" /></label>
              <label className={sub.field}><span>電話番号</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label className={sub.field}><span>メールアドレス<b>必須</b></span><input name="email" type="email" autoComplete="email" required /></label>
            </div>
            <label className={sub.field}>
              <span>ご相談内容</span>
              <select name="subject" defaultValue="修理・施工のご相談">
                <option>修理・施工のご相談</option>
                <option>出張対応について</option>
                <option>持込修理について</option>
                <option>採用について</option>
                <option>その他</option>
              </select>
            </label>
            <label className={sub.field}><span>お問い合わせ内容<b>必須</b></span><textarea name="message" rows={7} required /></label>
            <p className={sub.formNote}>送信ボタンを押すと、入力内容を記したメールが開きます。内容を確認してから送信してください。</p>
            <button className={site.pill} type="submit">メール内容を確認する<ArrowGlyph className={site.pillArrow} /></button>
          </form>
        </div>
      </section>

      <section className={site.section} aria-labelledby="faq-title">
        <div className={site.head}>
          <p className={site.label}><span>(03)</span>FAQ — よくあるご質問</p>
          <h2 id="faq-title" className={site.h2} data-x-split>よくある、<br /><em>ご質問。</em></h2>
        </div>
        <div className={sub.faq}>
          {faq.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary><span>Q{String(i + 1).padStart(2, "0")}</span><span>{q}</span><i aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </SubPage>
  );
}
