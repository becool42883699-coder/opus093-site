#!/usr/bin/env node
/**
 * build-migiwa.mjs — 査読済みの本文(copy.json)から 汀ノ庭 の本文HTMLを組む
 *
 * 本文を手でHTMLへ貼ると、直すたびに貼り直しになって必ずズレる。
 * 生成元は copy.json 1つにして、HTMLはそこから作る。
 *
 * 仮の記述(provisional)はブロックに data-provisional として残す。
 * <html data-draft="1"> の間だけ画面に印が出る。確定したら属性を1つ外す。
 * 地の文に紛れたまま公開されるのが一番危ないので、機械で追える形にしておく。
 *
 *   node scripts/build-migiwa.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR  = path.join(ROOT, 'public/migiwa');
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'copy.json'), 'utf8'));

/* site.config.js から未確定の連絡先を読む。JSで書いてあるので素朴に抜く。
   宛先が空のものは「押せるのに何も起きないボタン」にせず、準備中と明記する。
   導線が壊れているのと、まだ用意できていないのとは別物なので、書き分ける。 */
const cfgSrc = fs.readFileSync(path.join(DIR, 'site.config.js'), 'utf8');
const cfg = (k) => (cfgSrc.match(new RegExp(k + `\\s*:\\s*'([^']*)'`)) || [])[1] || '';
const LINK = {
  line: cfg('line'), mail: cfg('mail'), form: cfg('formAction'),
};

const by = {};
for (const c of data.copy) by[c.key] = c;
const blk = (ref) => {
  const [k, id] = ref.split('#');
  return (by[k]?.blocks || []).find(b => b.id === id);
};

const NOTES = [];
const strip = (text, where) => String(text || '')
  .replace(/<!--\s*反論:([\s\S]*?)-->/g, (_, m) => { NOTES.push({ where, text: m.trim() }); return ''; })
  .trim();

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const t = (s, w) => esc(strip(s, w));
const paras = (body, w) => strip(body, w).split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p)}</p>`).join('\n          ');

/* provisional は where にブロックの見出しや id の断片が入っている。
   総当たりで照合し、当たったブロックへ理由をぶら下げる。 */
function provisionalFor(key, b){
  const hits = (by[key]?.provisional || []).filter(p => {
    const w = (p.where || '') + ' ' + (p.text || '');
    return w.includes(b.heading) || w.includes(b.id) ||
           (b.eyebrow && w.includes(b.eyebrow));
  });
  return hits;
}

function grouped(items){
  const out = [];
  for (const it of items || []) {
    const g = it.group || '';
    const last = out[out.length - 1];
    if (last && last.g === g) last.items.push(it);
    else out.push({ g, items: [it] });
  }
  return out;
}

/* 連絡の方法は、宛先が決まっていれば a、決まっていなければ準備中の表示にする */
/* ★ 前方一致だけだと広すぎる。サービス名「LINEで相談してもらう仕組みづくり」まで
   自社の窓口と誤判定し、提供している仕事に「準備中」が付いていた。
   窓口として扱うのは、その3語だけで完結している項目に限る。 */
const isContactTitle = (s) => /^(LINE|フォーム|メール)$/.test(String(s).trim());
function contactRow(it, w){
  const key = /LINE/i.test(it.title) ? 'line' : /メール/.test(it.title) ? 'mail'
            : /フォーム/.test(it.title) ? 'form' : '';
  const href = key === 'line' ? LINK.line
             : key === 'mail' ? (LINK.mail ? 'mailto:' + LINK.mail : '')
             : key === 'form' ? (LINK.form ? '#contact-form' : '') : '';
  const dt = href
    ? `<a class="go" href="${esc(href)}">${t(it.title, w)} <em>↗</em></a>`
    : `${t(it.title, w)} <span class="soon mono">準備中</span>`;
  return `
            <div class="row${href ? '' : ' is-soon'}">
              <dt>${dt}</dt>
              <dd>${t(it.text, w)}</dd>
            </div>`;
}

function defList(b, w){
  return grouped(b.items).map(g => {
    const gh = g.g ? `<p class="glabel mono">${esc(g.g)}</p>` : '';
    const isContact = /連絡の方法/.test(g.g);
    /* ★ 宛先が1つも決まっていないときは、その状態を先に1行で言う。
       「準備中」バッジが3つ並ぶだけだと、準備中の店ではなく
       壊れたサイトに見える。1つでも開いたらこの行は自動で消える。 */
    const soonNote = (isContact && !LINK.line && !LINK.mail && !LINK.form)
      ? `<p class="soonNote">下の3つは、いま用意しているところです。開いたらここに出します。</p>\n          `
      : '';
    const rows = g.items.map(it => (isContact || isContactTitle(it.title)) ? contactRow(it, w) : `
            <div class="row${it.emphasis ? ' is-key' : ''}">
              <dt>${href(it.title)
                ? `<a class="go" href="${esc(href(it.title))}">${t(it.title, w)} <em>↗</em></a>`
                : t(it.title, w)}</dt>
              <dd>${t(it.text, w)}</dd>
            </div>`).join('');
    return `${gh}\n          ${soonNote}<dl class="dl">${rows}
          </dl>`;
  }).join('\n          ');
}

/* 本文から張るリンク。項目名で引く(本文側にURLを書かせない) */
/* 値はTOPから見た相対パス。実績ページは1階層深いので base で寄せる。 */
const LINKS = {
  '制作実績を見る': './works/',
  '制作実績': './works/',
  'トップ': './',
  'トップへ戻る': './',
  'お問い合わせ': '#contact',
  '相談する': '#contact',
  '実績一覧へ戻る': './works/#works-index',
  'GARAGE BeCool': '../becool/',
  'T-REX CO., LTD.': '../',
  '汀ノ庭': './',
};
let BASE = '';           // 実績ページを組む間だけ '../' が入る
/* 相対パスの連結。文字列を素朴に足すと '../' + '../becool/' が
   '.../becool/' に化ける(実際に化けて404になった)。
   アンカーだけのリンクも、下の階層からはTOPを指し直す必要がある。 */
const href = (title) => {
  const v = LINKS[title];
  if (!v) return '';
  if (/^(https?:|mailto:)/.test(v)) return v;
  if (v.startsWith('#')) return BASE ? BASE + v : v;
  if (!BASE) return v;
  return BASE + v.replace(/^\.\//, '');
};

/* 実績の画面。scripts/shrink-shots.mjs が作る。
   ポートフォリオなので、文字より先にこれを見せる。
   幅を明示して読み込み中のガタつきを止める。 */
const SHOTS = {
  'work-becool': { key:'becool', alt:'GARAGE BeCool のトップページ' },
  'work-trex':   { key:'trex',   alt:'T-REX CO., LTD. のトップページ' },
  'work-migiwa': { key:'migiwa', alt:'汀ノ庭 のトップページ' },
};
/* PCの画面(横長)を枠に収めて出す。スマホの実機スクショは縦1688pxあり、
   端末の幅いっぱいに出すと1枚で約1900pxになる。並べるとそれだけで
   ページが数万pxになるので、一覧と大見出しでは使わない。
   スマホ表示は各実績の詳細で、電話機の形の小さい枠に入れて見せる。 */
const pic = (base, key, alt, cls) => `
            <figure class="${cls}">
              <img src="${base}shots/${key}-pc.webp" width="1720" height="1075"
                   alt="${esc(alt)}" loading="lazy" decoding="async">
            </figure>`;
const picSp = (base, key, alt) => `
            <figure class="shot-sp">
              <img src="${base}shots/${key}-sp.webp" width="780" height="1688"
                   alt="${esc(alt)}" loading="lazy" decoding="async">
              <figcaption class="mono">スマートフォン</figcaption>
            </figure>`;
function shot(id, base){
  /* TOPの実績は2件を並べて見せる。文字だけの一覧より、
     何を作る人なのかが1画面で伝わる。 */
  if (id === 'works-header'){
    return `\n          <div class="shots shots-3">`
      + pic(base, 'becool', 'GARAGE BeCool のトップページ', 'shot')
      + pic(base, 'trex',   'T-REX CO., LTD. のトップページ', 'shot')
      + pic(base, 'migiwa', '汀ノ庭 のトップページ', 'shot')
      + `\n          </div>`;
  }
  if (id === 'works-lead'){
    /* ★ 実績が本文の先頭に来たので、ここが訪問者の見る最初の中身になる。
       3件とも出す(3件目＝このサイト自身)。文字だけの一覧より、
       何を作る人なのかが1画面で伝わる。 */
    return `\n          <div class="shots shots-3">`
      + pic(base, 'becool', 'GARAGE BeCool のトップページ', 'shot')
      + pic(base, 'trex',   'T-REX CO., LTD. のトップページ', 'shot')
      + pic(base, 'migiwa', '汀ノ庭 のトップページ', 'shot')
      + `\n          </div>`;
  }
  const s = SHOTS[id];
  if (!s) return '';
  return `\n          <div class="shot-pair">`
    + pic(base, s.key, s.alt, 'shot shot-lead')
    + picSp(base, s.key, s.alt.replace('トップページ', 'トップページ(スマートフォン)'))
    + `\n          </div>`;
}

const ALL_PROV = [];
function renderBlock(key, ref, level){
  const b = blk(ref);
  if (!b) return '';
  const w = b.heading;
  const prov = provisionalFor(key, b);
  prov.forEach(p => ALL_PROV.push({ block: b.heading, ...p }));
  const attr = prov.length
    ? ` data-provisional="${esc(prov.map(p => p.why).join(' / ').slice(0, 400))}"`
    : '';
  const H = level === 2 ? 'h2' : 'h3';
  /* ★ 節のidと同じ名前のブロックがある(faq / news / contact)。
     接頭辞を付けないと文書内に同じidが2つできて、#contact の
     リンクがどちらへ飛ぶか不定になる。 */
  let out = `\n        <div class="blk" id="blk-${esc(b.id)}"${attr}>`;
  if (b.eyebrow) out += `\n          <p class="eyebrow mono">${esc(b.eyebrow)}</p>`;
  out += `\n          <${H}>${t(b.heading, w)}</${H}>`;
  out += shot(b.id, BASE || './');
  if (b.lead) out += `\n          <p class="blead">${t(b.lead, w)}</p>`;
  if (b.body) out += `\n          ${paras(b.body, w)}`;
  if (b.items?.length) out += `\n          ${defList(b, w)}`;
  out += `\n        </div>`;
  return out;
}

/* TOPの本文。大見出し(h2)1つに、続くブロックをh3でぶら下げる */
/* ★ ホームページであって読み物ではない。順番は「訪問者が判断する順」。
   以前は自己説明(思想2806 + できること1884 + AI2506 + SEO1855 = 7051字)を
   読ませてから、6番目にやっと実績が543字で出ていた。証拠を先に出す。
   落とした節: ai / seo / faq / news。
   - ai と seo は service#services の中に1行ずつ既に入っているので中身は消えない
   - faq 10問は site.config.js が自分で「未確定」と印を付けた事業上の約束
     (納期・修正回数・交通費)。消せば字数と риск が同時に落ちる
   - お知らせは知らせることが1件も無い。空の欄はHPでは信用を減らす */
const TOP_SECTIONS = [
  { id: 'works',      key: 'works-contact', refs: ['works-contact#works-lead','works-contact#works-this-site'] },
  { id: 'service',    key: 'service',       refs: ['service#services'] },
  { id: 'flow',       key: 'seo-flow',      refs: ['seo-flow#flow-prepare','seo-flow#flow-duration','seo-flow#flow-running-cost'] },
  { id: 'philosophy', key: 'shiso',         refs: ['shiso#rashisa'] },
  { id: 'contact',    key: 'works-contact', refs: ['works-contact#contact'] },
  { id: 'about',      key: 'works-contact', refs: ['works-contact#footer'] },
];

const topHtml = TOP_SECTIONS.map(s =>
  `\n      <section id="${s.id}" data-reveal>` +
  s.refs.map((r, i) => renderBlock(s.key, r, i === 0 ? 2 : 3)).join('') +
  `\n      </section>`).join('');

BASE = '../';
const worksHtml = (by['works-page']?.blocks || [])
  .map((b, i) => renderBlock('works-page', `works-page#${b.id}`, i === 0 ? 2 : 3)).join('');
BASE = '';

fs.writeFileSync(path.join(DIR, '.content.html'), topHtml);
fs.writeFileSync(path.join(DIR, '.works.html'), worksHtml);

/* ★ 生成物を手でHTMLへ貼り直さない。貼り直しは必ずズレる
   (このファイルの冒頭がそもそもそう書いてあるのに、最後の1歩だけ手作業で残っていた)。
   印で挟んだ範囲をそのまま差し替える。印が無ければ黙って通さず落とす。 */
function inject(file, tag, html){
  const p = path.join(DIR, file);
  const src = fs.readFileSync(p, 'utf8');
  const open = new RegExp(`([ \\t]*)<!--\\s*build-migiwa:${tag}:start[^>]*-->`);
  const close = new RegExp(`[ \\t]*<!--\\s*build-migiwa:${tag}:end\\s*-->`);
  const mo = open.exec(src), mc = close.exec(src);
  if (!mo || !mc || mc.index < mo.index){
    console.error(`${file} に build-migiwa:${tag} の印が無い。手で貼らずに印を戻すこと。`);
    process.exit(4);
  }
  const head = src.slice(0, mo.index + mo[0].length);
  const tail = src.slice(mc.index);
  const next = head + html + '\n' + tail;
  if (next === src) return 0;
  fs.writeFileSync(p, next);
  return 1;
}
const wrote = inject('index.html', 'top', topHtml) + inject('works/index.html', 'works', worksHtml);

/* --- 公開前チェックリスト --- */
const uniq = [];
const seen = new Set();
for (const c of data.copy) for (const p of (c.provisional || [])) {
  const k = (p.where || '') + '|' + (p.text || '').slice(0, 60);
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push({ section: c.label, ...p });
}
const bySec = {};
for (const p of uniq) (bySec[p.section] = bySec[p.section] || []).push(p);

fs.writeFileSync(path.join(DIR, '公開前チェック.md'),
`# 公開前チェック — 汀ノ庭

本文は「仮でいいから草案を作っておいて」という指示で書いたもの。
**下の項目は事業上の約束になる。公開前に必ず本人が確認すること。**

確認が済んだ項目は行頭の \`[ ]\` を \`[x]\` にする。
全部済んだら \`index.html\` の \`<html data-draft="1">\` から \`data-draft\` を外す。
外すまでは、画面上で該当ブロックの左に印が出る。

合計 **${uniq.length}件**

${Object.entries(bySec).map(([sec, ps]) =>
`## ${sec}（${ps.length}件）

${ps.map(p => `- [ ] **${p.where}**
  - 文言: ${String(p.text).replace(/\n/g, ' ').slice(0, 220)}
  - 理由: ${String(p.why).replace(/\n/g, ' ').slice(0, 260)}`).join('\n')}`).join('\n\n')}
`);

fs.writeFileSync(path.join(DIR, 'NOTES.md'),
`# 制作メモ

## 査読で採らなかった指摘と、その理由

書き手が査読に反論した箇所。公開するHTMLには出さないが、
後から「なぜこう書いたか」を辿れるように残す。

${NOTES.map(n => `### ${n.where}\n\n${n.text}\n`).join('\n')}
`);

console.log(`TOP ${topHtml.length}字 / 実績 ${worksHtml.length}字 / 差し替え ${wrote}ファイル`);
console.log(`印を付けたブロック ${new Set(ALL_PROV.map(p => p.block)).size}件 / チェック項目 ${uniq.length}件 / 反論メモ ${NOTES.length}件`);
