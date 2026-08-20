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
const isContactTitle = (s) => /^(LINE|フォーム|メール)/.test(String(s));
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
    const rows = g.items.map(it => (isContact || isContactTitle(it.title)) ? contactRow(it, w) : `
            <div class="row${it.emphasis ? ' is-key' : ''}">
              <dt>${href(it.title)
                ? `<a class="go" href="${esc(href(it.title))}">${t(it.title, w)} <em>↗</em></a>`
                : t(it.title, w)}</dt>
              <dd>${t(it.text, w)}</dd>
            </div>`).join('');
    return `${gh}\n          <dl class="dl">${rows}
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
    return `\n          <div class="shots">`
      + pic(base, 'becool', 'GARAGE BeCool のトップページ', 'shot')
      + pic(base, 'trex',   'T-REX CO., LTD. のトップページ', 'shot')
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
  let out = `\n        <div class="blk" id="${esc(b.id)}"${attr}>`;
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
const TOP_SECTIONS = [
  { id: 'philosophy', key: 'shiso',    refs: ['shiso#rashisa','shiso#miru-kiku','shiso#otoshikomi','shiso#design-de-owaranai','shiso#issho-ni'] },
  { id: 'service',    key: 'service',  refs: ['service#services','service#service-style'] },
  { id: 'ai',         key: 'ai',       refs: ['ai#ai-intro','ai#ai-examples','ai#ai-value','ai#ai-flow','ai#ai-note'] },
  { id: 'seo',        key: 'seo-flow', refs: ['seo-flow#seo-intro','seo-flow#seo-tasks','seo-flow#seo-ranking'] },
  { id: 'works',      key: 'works-contact', refs: ['works-contact#works-lead','works-contact#works-this-site'] },
  { id: 'flow',       key: 'seo-flow', refs: ['seo-flow#flow-intro','seo-flow#flow-steps','seo-flow#flow-prepare','seo-flow#flow-duration','seo-flow#flow-running-cost'] },
  { id: 'faq',        key: 'faq',      refs: ['faq#faq'] },
  { id: 'news',       key: 'works-contact', refs: ['works-contact#news'] },
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

console.log(`TOP ${topHtml.length}字 / 実績 ${worksHtml.length}字`);
console.log(`印を付けたブロック ${new Set(ALL_PROV.map(p => p.block)).size}件 / チェック項目 ${uniq.length}件 / 反論メモ ${NOTES.length}件`);
