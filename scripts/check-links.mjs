#!/usr/bin/env node
/* check-links.mjs — 汀ノ庭の2ページのリンクを実際に辿って確かめる。
   相対パスは1本間違えても見た目では気付けない。実際に '../' の連結が
   '.../' に化けて404になったのをこれで拾った。
   out/ を作ってから: node scripts/check-links.mjs */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.env.LINK_ROOT
  || new URL('../out/', import.meta.url).pathname.replace(/\/$/, '');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
  const f=path.join(ROOT,u);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('404');}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
await new Promise(r=>srv.listen(8270,'127.0.0.1',r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1400,height:900}});
const pg=await ctx.newPage();
let bad=0;
for (const page of ['/migiwa/','/migiwa/works/']){
  await pg.goto('http://127.0.0.1:8270'+page,{waitUntil:'load'});
  await pg.waitForTimeout(600);
  const hrefs=await pg.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>({raw:a.getAttribute('href'),abs:a.href,txt:a.textContent.trim().slice(0,18)})));
  console.log('\n=== '+page+' ('+hrefs.length+'本) ===');
  for (const h of hrefs){
    if (h.raw.startsWith('#')){
      const ok=await pg.evaluate(id=>!!document.querySelector(id), h.raw);
      console.log((ok?'  OK  ':'  NG  ')+h.raw+'  '+h.txt); if(!ok) bad++;
      continue;
    }
    const res=await ctx.request.get(h.abs).catch(()=>null);
    const st=res?res.status():0;
    console.log(((st>=200&&st<400)?'  OK  ':'  NG  ')+st+' '+h.raw+'  '+h.txt);
    if(!(st>=200&&st<400)) bad++;
  }
}
console.log('\n壊れているリンク: '+bad+'本');
await b.close(); srv.close();
process.exit(bad?1:0);
