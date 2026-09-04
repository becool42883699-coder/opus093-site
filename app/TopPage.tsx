"use client";

/**
 * トップページ。TRX-4 の4幕エンジン体験を主役に据え、その下に従来の各セクションを繋げる。
 *
 * 体験より先に「電話したい客」を取りこぼさないことを優先している:
 *  - 固定ヘッダーの電話ボタンは全スクロール位置で押せる(ピン区間中も消えない)
 *  - ヒーローの電話ボタンはHTMLとして即時表示。演出のフェードイン対象にしない
 *  - ヒーローの「サービス一覧へ」でピン区間を飛ばして下のセクションへ行ける
 *
 * 4幕の本文・ラベル・諸元は静的HTMLで出し切るので、JS無効・reduced-motion・
 * WebGL2非対応でも全部読める。演出を出せる環境かどうかは、初回ペイント前に
 * 下の MOTION_PROBE が html[data-engine-motion] を立てて決める(レイアウトが飛ばない)。
 */

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import TopMotion from "./components/TopMotion";
import { scrollToElement } from "./components/lenisBridge";
import EngineSceneMount from "./components/engine/EngineSceneMount";
import eng from "./components/engine/engine.module.css";

/* 初回ペイント前に走らせる。EngineScene と同じ条件で判定する。 */
const MOTION_PROBE = `try{
var r=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,g=false;
try{g=!!document.createElement('canvas').getContext('webgl2')}catch(e){}
if(!r&&g)document.documentElement.setAttribute('data-engine-motion','on')}catch(e){}`;

const TEL = "090-7531-5428";
const TEL_HREF = "tel:09075315428";

const navItems = [
  ["トップ", "/"],
  ["サービス", "/service"],
  ["施工実績", "/works"],
  ["会社概要", "/company"],
  ["採用情報", "/recruit"],
  ["お問い合わせ", "/contact"],
];

const CHAPTERS = [
  { n: "01", head: <>鉄の<em>塊。</em></>, cap: "20万キロ働いた鋳鉄のブロック。面研とラインボーリングで、もう一度ゼロへ戻す。" },
  { n: "02", head: <>透視<em>する。</em></>, cap: "外装がガラスに変わる。クランクはあなたのスクロールと連動し、カムがバルブを叩き、上死点で点火する。" },
  { n: "03", head: <>手で、<em>組む。</em></>, cap: "1,214点。ロッドキャップを外し、ヘッドを吊り上げ、クランクを降ろす——そして全ボルトを規定トルクで組み戻す。" },
  { n: "04", head: <><em>始動。</em></>, cap: "規定トルクで組み、火を入れる。クランキング——初爆——安定回転。納車まで、あと少し。" },
];

const CHAPTER_NAV = ["01 鉄の塊", "02 透視", "03 手組み", "04 始動"];

const LABELS = [
  { i: 1, cls: "lbl1" as const, b: "ツインカム", rest: " — DOHC 16V" },
  { i: 2, cls: "lbl2" as const, b: "ピストンピン", rest: " — フルフロート" },
  { i: 3, cls: "lbl3" as const, b: "ロッドキャップ", rest: " — 規定トルク管理" },
];

const SPECS = [
  { v: <>TRX-4</>, l: "直列4気筒 DOHC 16V" },
  { v: <>1,998<small> CC</small></>, l: "排気量" },
  { v: <>10.8<small> : 1</small></>, l: "圧縮比（ブループリント処理）" },
  { v: <>1,214</>, l: "部品点数 — すべて手組み" },
];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function Brand() {
  return (
    <a className={eng.brand} href="#top" aria-label="T-REX トップへ">
      <span className={eng.tx} aria-hidden="true">TX</span>T-REX
    </a>
  );
}

function SiteBrand() {
  return (
    <a className="brand" href="#top" aria-label="T-REX トップへ">
      <span className="brandMark" aria-hidden="true"><Image src="/icons/brand-tx.svg" alt="" width={48} height={48} /></span>
      <span className="brandType"><strong>T-REX</strong><small>T-REX CO., LTD.</small></span>
    </a>
  );
}

function UiIcon({ name, className = "" }: { name: string; className?: string }) {
  return <Image className={`uiIcon ${className}`} src={`/icons/${name}.svg`} alt="" width={48} height={48} aria-hidden="true" />;
}

function Arrow() {
  return <UiIcon name="arrow-right" className="arrow" />;
}

export default function TopPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Webサイトからのお問い合わせ：${String(data.get("subject") || "ご相談")}`);
    const body = encodeURIComponent([
      `お名前：${String(data.get("name") || "")}`,
      `会社名：${String(data.get("company") || "")}`,
      `電話番号：${String(data.get("phone") || "")}`,
      `メールアドレス：${String(data.get("email") || "")}`,
      "",
      String(data.get("message") || ""),
    ].join("\n"));
    window.location.href = `mailto:info@t-rex-works.com?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  /* ピン区間を飛ばして下のセクションへ。Lenis があれば滑らかに送る */
  const skipToSections = () => {
    const target = document.getElementById("service");
    if (target) scrollToElement(target, -72);
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MOTION_PROBE }} />

      <header className={`${eng.tokens} ${eng.header}`}>
        <Brand />
        <ul className={eng.chapnav} aria-hidden="true">
          {CHAPTER_NAV.map((label, i) => <li key={label} data-chapnav={i}>{label}</li>)}
        </ul>
        <div className={eng.chapnow} data-chapnow aria-hidden="true">01 — 鉄の塊</div>
        <div className={eng.headerRight}>
          <nav className={eng.navLinks} aria-label="メインナビゲーション">
            {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
          {/* 命綱。全スクロール位置で押せる */}
          <a className={eng.tel} href={TEL_HREF} aria-label={`電話でお問い合わせ ${TEL}`}>
            <PhoneIcon />
            <span className={eng.telLead}>電話</span>
            <span className={eng.telNum}>{TEL}</span>
          </a>
          <button
            className={eng.menuButton}
            type="button"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <nav
        id="main-navigation"
        className={`${eng.tokens} ${eng.mobileNav}`}
        data-open={menuOpen ? "true" : "false"}
        aria-label="メインナビゲーション"
        aria-hidden={!menuOpen}
      >
        <button className={eng.mobileClose} type="button" aria-label="メニューを閉じる" onClick={() => setMenuOpen(false)}>×</button>
        {navItems.map(([label, href]) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>{label}</Link>
        ))}
        <a className={eng.tel} href={TEL_HREF} tabIndex={menuOpen ? 0 : -1}>
          <PhoneIcon /><span className={eng.telNum}>{TEL}</span>
        </a>
      </nav>

      <main id="top" className="trexHome">
        <div className={eng.page} data-engine-page>
          {/* スクロール進行バー。position:fixed なのでDOM上の位置は見た目に影響しない */}
          <div className={eng.progress} data-progress aria-hidden="true" />
          <section className={eng.hero} aria-labelledby="hero-title">
            <p className={eng.eyebrow} data-hero-rise>T-REX CO., LTD. — NEVER STOP THE SITE</p>
            <h1 id="hero-title" data-hero-rise>現場を、<br /><span>止めない。</span></h1>
            <p className={eng.lede} data-hero-rise>
              板金塗装・荷台換装・修理・出張修理。トラックの心臓部——エンジンまで、T-REXが確かな仕事で応えます。
              福岡・山口を中心に、現場へ駆けつけます。
            </p>
            <div className={eng.heroActions}>
              <a className={eng.heroTel} href={TEL_HREF}>
                <PhoneIcon />
                {TEL}
                <small>9:00〜18:00</small>
              </a>
              <Link className={eng.heroGhost} href="/contact">仕事を相談する</Link>
            </div>
            <button className={eng.skip} type="button" onClick={skipToSections}>
              サービス一覧へ<i aria-hidden="true" />
            </button>
            <div className={eng.cue} aria-hidden="true"><i /> SCROLL</div>
          </section>

          <div className={eng.stageWrap} data-stage-wrap>
            <div className={eng.stage} data-stage>
              <EngineSceneMount />
              <div className={eng.vin} aria-hidden="true" />
              <div className={eng.loadTrack} aria-hidden="true">
                <span className={eng.loadFill} data-engine-progress />
              </div>
              {CHAPTERS.map((c, i) => (
                <div className={eng.chapter} key={c.n} data-ch={i + 1}>
                  <div className={eng.num} aria-hidden="true">{c.n}</div>
                  <h2>{c.head}</h2>
                  <p className={`${eng.serif} ${eng.cap}`}>{c.cap}</p>
                </div>
              ))}
              {LABELS.map((l) => (
                <div className={`${eng.lbl} ${eng[l.cls]}`} key={l.i} data-lbl={l.i} aria-hidden="true">
                  <b>{l.b}</b>{l.rest}<i />
                </div>
              ))}
            </div>
          </div>

          <section className={eng.spec} aria-labelledby="engine-spec-title">
            <p className={eng.k} id="engine-spec-title">05 — 諸元 / SPECIFICATIONS</p>
            <div className={eng.grid}>
              {SPECS.map((s) => (
                <div className={eng.cell} key={s.l} data-cell>
                  <div className={eng.v}>{s.v}</div>
                  <div className={eng.l}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className={eng.cta}>
              <Link className={eng.btn} href="/contact">オーバーホールを相談する</Link>
              <span className={`${eng.price} ${eng.serif}`}>¥480,000〜 — 3年保証</span>
            </div>
          </section>
        </div>

        <section className="proofZone" aria-label="T-REXの実績">
          <div className="heroProof">
            <dl className="stats">
              <div><dt>9–18<small>時</small></dt><dd>営業時間</dd></div>
              <div><dt>2025<small>年</small></dt><dd>1月設立</dd></div>
              <div><dt>2<small>県</small></dt><dd>福岡・山口を中心に対応</dd></div>
            </dl>
            <ul className="chips">
              <li><UiIcon name="location-pin" /> その他地域も応相談</li>
              <li><UiIcon name="rapid-response-tools" /> 出張修理対応</li>
              <li><UiIcon name="shield-quality" /> 持込修理可能</li>
            </ul>
          </div>
        </section>

        <section className="contentSection services" id="service" aria-labelledby="service-title">
          <div className="sectionIntro"><p>SERVICE</p><h2 id="service-title">事業内容</h2><span data-reveal>現場のあらゆるニーズに、<br />専門性とスピードで応える。</span></div>
          <div className="serviceGrid" id="service-content">{[['01','板金塗装','美しく、使い出しの外観へ。損傷の修復もお任せください。','spray-gun'],['02','荷台換装・修理','用途に合わせた荷台の換装・修理で、作業効率と安全性を向上。','cargo-conversion'],['03','出張修理','現場まで駆けつけ、迅速に対応。ダウンタイムを最小限に。','rapid-response-tools'],['04','車両陸送・軽運送','車両や資材の陸送・軽運送に、安全かつ丁寧に対応します。','mobile-repair-truck']].map(([n,t,d,icon]) => <article className="serviceCard" key={n}><b>{n}</b><div className="serviceIcon"><UiIcon name={icon} /></div><h3>{t}</h3><p>{d}</p><Link href="/contact" aria-label={`${t}について相談する`}><Arrow /></Link></article>)}</div>
        </section>
        <section className="contentSection equipment" id="equipment" aria-labelledby="equipment-title">
          <div className="sectionIntro"><p>EQUIPMENT</p><h2 id="equipment-title">対応車両</h2><span data-reveal>大型ダンプからクレーン付き特装車まで。<br />架装・修理・塗装に対応します。</span></div>
          <div className="equipmentBody">
            <ul className="equipmentSpecs">
              <li><b>荷台換装</b><span>用途に合わせた架装・載せ替えに対応</span></li>
              <li><b>板金塗装</b><span>全塗装から部分補修まで</span></li>
              <li><b>出張・持込修理</b><span>現場でも工場でも対応可能</span></li>
            </ul>
          </div>
        </section>
        <section className="wipeZone" aria-hidden="true">
          <div className="wipePanel"><p className="wipeLabel">PROJECT FILE</p></div>
        </section>
        <section className="contentSection works" id="works" aria-labelledby="works-title">
          <div className="sectionIntro"><p>WORKS</p><h2 id="works-title">施工実績</h2><span data-reveal>一つひとつの仕事が、<br />私たちの誇りです。</span></div>
          <div className="workGrid">{[['荷台換装・修理','大型ダンプ 荷台換装・修理','2024.05','/works-photo-2.webp'],['車両陸送・軽運送','車両陸送・軽運送対応','2024.04','/works-photo-6.webp'],['板金塗装','特殊車両 全塗装','2024.03','/works-photo-4.webp'],['出張修理','建設機械 油圧部修理','2024.02','/works-photo-3.webp']].map(([tag,title,date,photo],i) => <article className={`workCard work${i+1}`} key={title}><div className="workScene"><Image src={photo} alt={title} width={870} height={653} sizes="(max-width: 767px) 72vw, 25vw" /></div><div><small>{tag}</small><h3>{title}</h3><time>{date}</time><Link href="/contact" aria-label={`${title}の詳細`}><Arrow /></Link></div></article>)}</div>
        </section>
        <section className="aboutSection" id="about" aria-labelledby="about-title">
          <div className="aboutCopy"><p className="sectionLabel">ABOUT</p><h2 id="about-title">T-REXについて</h2><p data-reveal>T-REX CO., LTD.は、現場の最前線を支えるプロフェッショナル集団です。お客様の課題に真摯に向き合い、スピード・品質・安全のすべてに妥協せず、信頼されるパートナーであり続けます。</p><Link className="outlineButton" href="/company">会社概要を見る <Arrow /></Link></div>
          <div className="aboutScene" aria-hidden="true">
            <svg className="trm-lineArt" viewBox="0 0 800 560" preserveAspectRatio="xMidYMax slice" focusable="false">
              <path d="M0 470 H800" />
              <path d="M60 470 V330 H150 V470 M78 352 H132 M78 386 H132 M78 420 H132" />
              <path d="M150 470 V392 H232 V470 M168 414 H214 M168 442 H214" />
              <path d="M640 470 V302 H726 V470 M658 326 H708 M658 360 H708 M658 394 H708 M658 428 H708" />
              <path d="M330 470 V120 M318 470 V440 M342 470 V440" />
              <path d="M330 120 L620 152 M330 120 L240 134" />
              <path d="M330 78 V120 M330 78 L620 152 M330 78 L240 134" />
              <path d="M540 143 V222 M526 222 H554 M526 222 V244 H554 V222" />
            </svg>
            <div className="aboutSceneType"><span>FIELD</span><strong>PARTNER</strong><small>T-REX CO., LTD.</small></div>
            <Image className="aboutMascot" src="/hero-trex-v3-cropped.webp" alt="" width={1008} height={1013} sizes="(max-width: 767px) 88vw, 42vw" />
            <div className="aboutSceneBadge"><UiIcon name="location-pin" /><span>FUKUOKA / YAMAGUCHI</span><b>現場へ、駆けつける。</b></div>
          </div>
          <ul className="aboutFeatures"><li><UiIcon name="calendar-experience" /><b>2025年1月設立</b><span>現場に根ざしたサービスを提供</span></li><li><UiIcon name="location-pin" /><b>福岡・山口を中心に対応</b><span>その他地域も可能な限り対応</span></li><li><UiIcon name="clock-fast" /><b>出張修理可能</b><span>現場へ伺い迅速に対応</span></li><li><UiIcon name="shield-safety" /><b>持込修理可能</b><span>車両・機械の持ち込みに対応</span></li></ul>
        </section>
        <section className="companySection" id="company" aria-labelledby="company-title">
          <div className="companyHeading"><p className="sectionLabel">COMPANY</p><h2 id="company-title">会社情報</h2><p data-reveal>福岡県・山口県を中心に、建設・土木・運送の現場を支えます。</p></div>
          <dl className="companyProfile">
            <div><dt>代表者</dt><dd>中津留 龍也</dd></div>
            <div><dt>電話番号</dt><dd><a href={TEL_HREF}>{TEL}</a></dd></div>
            <div><dt>FAX番号</dt><dd>093-967-2347</dd></div>
            <div><dt>メールアドレス</dt><dd><a href="mailto:info@t-rex-works.com">info@t-rex-works.com</a></dd></div>
            <div><dt>営業時間</dt><dd>9:00〜18:00</dd></div>
            <div><dt>定休日</dt><dd>祝日・日曜日・土曜日（営業日あり）</dd></div>
            <div><dt>設立年月</dt><dd>2025年1月</dd></div>
            <div><dt>資本金</dt><dd>300万円</dd></div>
            <div><dt>法人番号</dt><dd>8290801031174</dd></div>
          </dl>
          <div className="businessScope">
            <div><UiIcon name="location-pin" /><h3>営業・対応範囲</h3><p>福岡県・山口県を中心に、その他の地域も可能な限り対応します。出張修理・持込修理ともに可能です。</p></div>
            <div><UiIcon name="gear-technology" /><h3>主な取引先業種</h3><p>建設機械リース会社、解体業、建設業、土木業、運送業</p></div>
          </div>
          <article className="representativeMessage">
            <p className="sectionLabel">MESSAGE</p><h3>代表あいさつ</h3><p>現場で生まれる一つひとつの課題に誠実に向き合い、確かな技術と迅速な対応で、お客様の仕事を支えてまいります。</p><strong>代表　中津留 龍也</strong>
          </article>
          <div className="mapPending" aria-label="Googleマップ設置予定"><UiIcon name="location-pin" /><div><strong>Google Map</strong><span>所在地情報を確認後、地図を表示します。</span></div></div>
        </section>
        <section className="contactSection" id="contact" aria-labelledby="contact-title">
          <div className="contactIntro"><p className="sectionLabel">CONTACT</p><h2 id="contact-title">お問い合わせ</h2><span data-reveal>現場のことなら、T-REXにご相談ください。</span><div className="phone"><small><UiIcon name="phone" /> お電話でのお問い合わせ</small><a href={TEL_HREF}>{TEL}</a><span>営業時間 9:00〜18:00</span></div><a className="mailAddress" href="mailto:info@t-rex-works.com"><UiIcon name="mail" /> info@t-rex-works.com</a><p className="trm-areaNote">対応エリア: 福岡県(北九州市・福岡市ほか全域)/山口県(下関市ほか全域)。その他の地域もご相談ください。出張修理・持込修理どちらも対応します。</p></div>
          <form className="contactForm" onSubmit={handleContactSubmit}>
            <label>お名前<span>必須</span><input name="name" autoComplete="name" required /></label>
            <label>会社名<input name="company" autoComplete="organization" /></label>
            <label>電話番号<input name="phone" type="tel" autoComplete="tel" /></label>
            <label>メールアドレス<span>必須</span><input name="email" type="email" autoComplete="email" required /></label>
            <label>ご相談内容<select name="subject" defaultValue="修理・施工のご相談"><option>修理・施工のご相談</option><option>出張対応について</option><option>持込修理について</option><option>その他</option></select></label>
            <label className="formMessage">お問い合わせ内容<span>必須</span><textarea name="message" rows={6} required /></label>
            <button type="submit">メール内容を確認する <Arrow /></button>
          </form>
        </section>
      </main>

      <footer className="siteFooter">
        <SiteBrand />
        <div><Link href="/service">サービス</Link><Link href="/works">施工実績</Link><Link href="/company">会社概要</Link><Link href="/recruit">採用情報</Link><Link href="/contact">お問い合わせ</Link></div>
        <p className="creditNote">
          エンジンの3Dは写真ではなく、ブラウザ上でリアルタイムに描いています。
          This work is based on{" "}
          <a href="https://sketchfab.com/3d-models/inline-4-engine-block-diagram-see-through-cf087cd5f8ff4dd495576d206a6dafcf" rel="noopener noreferrer" target="_blank">&quot;Inline 4 engine block diagram (see through)&quot;</a>{" "}
          by <a href="https://sketchfab.com/Lame3dModels" rel="noopener noreferrer" target="_blank">Lame3D models</a>{" "}
          and <a href="https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0" rel="noopener noreferrer" target="_blank">&quot;Rigged 4-Cylinder Engine (FREE)&quot;</a>{" "}
          by <a href="https://sketchfab.com/david.gnzlv" rel="noopener noreferrer" target="_blank">david.gnzlv</a>, licensed under{" "}
          <a href="http://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer" target="_blank">CC-BY-4.0</a>. 環境マップは Poly Haven「quarry_01」(CC0)。
        </p>
        <small>© T-REX CO., LTD. All Rights Reserved.</small>
      </footer>

      <TopMotion />
    </>
  );
}
