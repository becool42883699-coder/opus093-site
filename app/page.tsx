"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const navItems = [
  ["サービス", "/service"],
  ["施工実績", "/works"],
  ["会社案内", "/about"],
  ["会社情報", "/company"],
  ["採用情報", "/recruit"],
  ["お問い合わせ", "/contact"],
];

function Brand() {
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

export default function Home() {
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

  useEffect(() => {
    let cleanup = () => {};

    const setupMotion = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      gsap.registerPlugin(ScrollTrigger);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const lenis = reduceMotion || coarsePointer ? null : new Lenis({
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
      }

      document.documentElement.classList.add("motionReady");

      const ctx = gsap.context(() => {
        if (reduceMotion) {
          gsap.set("[data-reveal], .serviceCard, .workCard, .aboutFeatures li", { clearProps: "all" });
          return;
        }

        if (!coarsePointer) {
        gsap.to(".heroContent", {
          yPercent: -18,
          opacity: 0.42,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
        });

        gsap.to(".heroProof", {
          yPercent: -10,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: 0.7 },
        });

        gsap.to(".hero", {
          backgroundPosition: "68% 58%",
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
        });
        }

        gsap.utils.toArray<HTMLElement>("main > section:not(.hero), .siteFooter").forEach((section) => {
          const children = Array.from(section.children);
          gsap.from(children, {
            y: 54,
            opacity: 0,
            duration: 1,
            stagger: 0.11,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 82%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>(".sectionIntro h2, .sectionLabel + h2, .companyHeading h2").forEach((heading) => {
          gsap.from(heading, {
            yPercent: 110,
            opacity: 0,
            duration: 0.95,
            ease: "power4.out",
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>(".serviceCard, .workCard, .aboutFeatures li").forEach((card, index) => {
          gsap.from(card, {
            y: 42,
            rotateX: coarsePointer ? 0 : 7,
            opacity: 0,
            duration: 0.85,
            delay: (index % 4) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>(".workScene").forEach((scene) => {
          gsap.fromTo(scene, { scale: 1.1 }, {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: 1 },
          });
        });

        gsap.to(".aboutMascot", {
          yPercent: -9,
          rotate: -1.4,
          ease: "none",
          scrollTrigger: { trigger: ".aboutSection", start: "top bottom", end: "bottom top", scrub: 1 },
        });

        gsap.to(".aboutSceneType", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: ".aboutSection", start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });

      ScrollTrigger.refresh();
      cleanup = () => {
        ctx.revert();
        if (lenis) {
          lenis.off("scroll", onLenisScroll);
          lenis.destroy();
          gsap.ticker.remove(raf);
        }
        document.documentElement.classList.remove("motionReady");
      };
    };

    setupMotion();
    return () => cleanup();
  }, []);

  useEffect(() => {
    let frame = 0;
    const updatePageLight = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const intensity = Math.pow(progress, 1.35);
      document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
      document.documentElement.style.setProperty("--page-light", (intensity * 0.42).toFixed(3));
      document.documentElement.style.setProperty("--page-light-deep", (intensity * 0.28).toFixed(3));
      document.documentElement.style.setProperty("--page-dark-top", (0.78 - intensity * 0.77).toFixed(3));
      document.documentElement.style.setProperty("--page-dark-bottom", (0.88 - intensity * 0.86).toFixed(3));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updatePageLight);
    };

    updatePageLight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--scroll-progress");
      document.documentElement.style.removeProperty("--page-light");
      document.documentElement.style.removeProperty("--page-light-deep");
      document.documentElement.style.removeProperty("--page-dark-top");
      document.documentElement.style.removeProperty("--page-dark-bottom");
    };
  }, []);

  return (
    <>
      <header className="siteHeader">
        <Brand />
        <nav className={menuOpen ? "mainNav isOpen" : "mainNav"} aria-label="メインナビゲーション" id="main-navigation">
          {navItems.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
          <Link className="headerCta" href="/contact" onClick={() => setMenuOpen(false)}>お問い合わせ</Link>
        </nav>
        <button className="menuButton" type="button" aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="heroContent">
            <p className="eyebrow"><span /> NEVER STOP THE SITE</p>
            <h1 id="hero-title">現場を止めない、<br /><em>圧倒的</em>な力。</h1>
            <p className="brandHeadline">T-REX<br />CO., LTD.</p>
            <p className="lead">技術と情熱で、お客様の「困った」に応える。<br />板金塗装・荷台換装・修理・出張修理まで、<br className="desktopBreak" />T-REXが確かな仕事で応えます。</p>
            <div className="heroActions">
              <Link className="primaryButton" href="/service">事業内容を見る <Arrow /></Link>
              <Link className="secondaryButton" href="/contact">仕事を相談する <UiIcon name="chat-consultation" className="buttonIcon" /></Link>
            </div>
          </div>

          <div className="heroProof" aria-label="T-REXの実績">
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
          <a className="scrollCue" href="#service"><span>SCROLL</span><i /></a>
        </section>

        <section className="contentSection services" id="service" aria-labelledby="service-title">
          <div className="sectionIntro"><p>SERVICE</p><h2 id="service-title">事業内容</h2><span>現場のあらゆるニーズに、<br />専門性とスピードで応える。</span></div>
          <div className="serviceGrid" id="service-content">{[['01','板金塗装','美しく、使い出しの外観へ。損傷の修復もお任せください。','spray-gun'],['02','荷台換装・修理','用途に合わせた荷台の換装・修理で、作業効率と安全性を向上。','cargo-conversion'],['03','出張修理','現場まで駆けつけ、迅速に対応。ダウンタイムを最小限に。','rapid-response-tools'],['04','車両陸送・軽運送','車両や資材の陸送・軽運送に、安全かつ丁寧に対応します。','mobile-repair-truck']].map(([n,t,d,icon]) => <article className="serviceCard" key={n}><b>{n}</b><div className="serviceIcon"><UiIcon name={icon} /></div><h3>{t}</h3><p>{d}</p><Link href="/contact" aria-label={`${t}について相談する`}><Arrow /></Link></article>)}</div>
        </section>
        <section className="contentSection works" id="works" aria-labelledby="works-title">
          <div className="sectionIntro"><p>WORKS</p><h2 id="works-title">施工実績</h2><span>一つひとつの仕事が、<br />私たちの誇りです。</span></div>
          <div className="workGrid">{[['荷台換装・修理','大型ダンプ 荷台換装・修理','2024.05'],['車両陸送・軽運送','車両陸送・軽運送対応','2024.04'],['板金塗装','特殊車両 全塗装','2024.03'],['出張修理','建設機械 油圧部修理','2024.02']].map(([tag,title,date],i) => <article className={`workCard work${i+1}`} key={title}><div className="workScene"><span /><i /></div><div><small>{tag}</small><h3>{title}</h3><time>{date}</time><Link href="/contact" aria-label={`${title}の詳細`}><Arrow /></Link></div></article>)}</div>
        </section>
        <section className="aboutSection" id="about" aria-labelledby="about-title">
          <div className="aboutCopy"><p className="sectionLabel">ABOUT</p><h2 id="about-title">T-REXについて</h2><p>T-REX CO., LTD.は、現場の最前線を支えるプロフェッショナル集団です。お客様の課題に真摯に向き合い、スピード・品質・安全のすべてに妥協せず、信頼されるパートナーであり続けます。</p><Link className="outlineButton" href="/contact">会社案内を見る <Arrow /></Link></div>
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
          <div className="companyHeading"><p className="sectionLabel">COMPANY</p><h2 id="company-title">会社情報</h2><p>福岡県・山口県を中心に、建設・土木・運送の現場を支えます。</p></div>
          <dl className="companyProfile">
            <div><dt>代表者</dt><dd>中津留 龍也</dd></div>
            <div><dt>電話番号</dt><dd><a href="tel:09075315428">090-7531-5428</a></dd></div>
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
          <div className="contactIntro"><p className="sectionLabel">CONTACT</p><h2 id="contact-title">お問い合わせ</h2><span>現場のことなら、T-REXにご相談ください。</span><div className="phone"><small><UiIcon name="phone" /> お電話でのお問い合わせ</small><a href="tel:09075315428">090-7531-5428</a><span>営業時間 9:00〜18:00</span></div><a className="mailAddress" href="mailto:info@t-rex-works.com"><UiIcon name="mail" /> info@t-rex-works.com</a></div>
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
      <footer className="siteFooter"><Brand /><div><Link href="/service">サービス</Link><Link href="/works">施工実績</Link><Link href="/about">会社案内</Link><Link href="/company">会社情報</Link><Link href="/recruit">採用情報</Link><Link href="/contact">お問い合わせ</Link></div><small>© T-REX CO., LTD. All Rights Reserved.</small></footer>
    </>
  );
}
