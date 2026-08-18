import type { Metadata } from "next";
import Link from "next/link";
import styles from "../components/engine/engine.module.css";
import EngineSceneMount from "../components/engine/EngineSceneMount";

/* TRX-4 オーバーホールのストーリーページ。
   マークアップはサーバー側で出し切る(JS無効・クローラでも4幕の本文が読める)。
   WebGLとGSAPは EngineSceneMount 配下のクライアントコンポーネントだけが持ち、
   この静的DOMを data-* 属性で拾って動かす(app/components/TrmMotion.tsx と同じ流儀)。 */

export const metadata: Metadata = {
  title: "TRX-4 オーバーホール | T-REX CO., LTD.",
  description:
    "20万キロ走った直列4気筒を、鉄の塊から始動まで。板金塗装・荷台換装だけでなく、トラックの心臓部までT-REXが面倒を見ます。写真を一枚も使わない、コードで描いたエンジンのストーリー。",
  alternates: { canonical: "/engine/" },
  openGraph: {
    title: "TRX-4 オーバーホール | T-REX CO., LTD.",
    description: "鉄の塊から始動まで。エンジンオーバーホールの現場をスクロールでご覧ください。",
    url: "/engine/",
    type: "article",
  },
};

const CHAPTERS = [
  {
    n: "01",
    head: <>鉄の<em>塊。</em></>,
    cap: "20万キロ働いた鋳鉄のブロック。面研とラインボーリングで、もう一度ゼロへ戻す。",
  },
  {
    n: "02",
    head: <>透視<em>する。</em></>,
    cap: "外装がガラスに変わる。クランクはあなたのスクロールと連動し、カムがバルブを叩き、上死点で点火する。",
  },
  {
    n: "03",
    head: <>手で、<em>組む。</em></>,
    cap: "1,214点。ロッドキャップを外し、ヘッドを吊り上げ、クランクを降ろす——そして全ボルトを規定トルクで組み戻す。",
  },
  {
    n: "04",
    head: <><em>始動。</em></>,
    cap: "規定トルクで組み、火を入れる。クランキング——初爆——安定回転。納車まで、あと少し。",
  },
];

const NAV = ["01 鉄の塊", "02 透視", "03 手組み", "04 始動"];

const LABELS = [
  { i: 1, cls: "lbl1", b: "ツインカム", rest: " — DOHC 16V" },
  { i: 2, cls: "lbl2", b: "ピストンピン", rest: " — フルフロート" },
  { i: 3, cls: "lbl3", b: "ロッドキャップ", rest: " — 規定トルク管理" },
] as const;

const SPECS = [
  { v: <>TRX-4</>, l: "直列4気筒 DOHC 16V" },
  { v: <>1,998<small> CC</small></>, l: "排気量" },
  { v: <>10.8<small> : 1</small></>, l: "圧縮比（ブループリント処理）" },
  { v: <>1,214</>, l: "部品点数 — すべて手組み" },
];

export default function EnginePage() {
  return (
    <div className={styles.page} data-engine-page>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.tx}>TX</span>T-REX
        </div>
        <ul className={styles.chapnav} aria-hidden="true">
          {NAV.map((label, i) => (
            <li key={label} data-chapnav={i}>{label}</li>
          ))}
        </ul>
        <div className={styles.chapnow} data-chapnow aria-hidden="true">01 — 鉄の塊</div>
      </header>
      <div className={styles.progress} data-progress aria-hidden="true" />

      <section className={styles.hero}>
        <p className={styles.eyebrow} data-rise>T-REX CO., LTD. — NEVER STOP THE SITE</p>
        <h1 data-rise>現場を、<br /><span>止めない。</span></h1>
        <p className={styles.lede} data-rise>
          板金塗装・荷台改装・出張修理。トラックの心臓部——エンジンまで、T-REXは面倒を見ます。
          スクロールで、オーバーホールの現場をご覧ください。写真は一枚も使っていません。すべてコードで描いたエンジンです。
        </p>
        <div className={styles.cue} data-rise><i /> SCROLL</div>
      </section>

      <div className={styles.stageWrap} data-stage-wrap>
        <div className={styles.stage} data-stage>
          <EngineSceneMount />
          <div className={styles.vin} data-vin aria-hidden="true" />
          {CHAPTERS.map((c, i) => (
            <div className={styles.chapter} key={c.n} data-ch={i + 1}>
              <div className={styles.num} aria-hidden="true">{c.n}</div>
              <h2>{c.head}</h2>
              <p className={`${styles.serif} ${styles.cap}`}>{c.cap}</p>
            </div>
          ))}
          {LABELS.map((l) => (
            <div className={`${styles.lbl} ${styles[l.cls]}`} key={l.i} data-lbl={l.i} aria-hidden="true">
              <b>{l.b}</b>{l.rest}<i />
            </div>
          ))}
        </div>
      </div>

      <section className={styles.spec}>
        <p className={styles.k}>05 — 諸元 / SPECIFICATIONS</p>
        <div className={styles.grid}>
          {SPECS.map((s) => (
            <div className={styles.cell} key={s.l} data-cell>
              <div className={styles.v}>{s.v}</div>
              <div className={styles.l}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className={styles.cta}>
          <Link className={styles.btn} href="/contact">オーバーホールを相談する</Link>
          <span className={`${styles.price} ${styles.serif}`}>¥480,000〜 — 3年保証</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <b>制作メモ。</b>
        このページのエンジンは写真ではなく、ブラウザ上でリアルタイムに描いている3Dです。
        始動シーンはクランキング→初爆→安定回転を実時間で回しています。バルブ16本はカムに叩かれて実際に動き、
        ピストンはクランク機構の物理式でリアルタイム計算しています。T-REX WORKS制作。
      </footer>
    </div>
  );
}
