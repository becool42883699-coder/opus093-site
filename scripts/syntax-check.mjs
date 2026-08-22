/* index.html の中に直書きした module スクリプトを構文チェックする。
   ブラウザを立てる前にここで落としたほうが速い。 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const files = process.argv.slice(2);
let bad = 0;
for (const f of files){
  const s = fs.readFileSync(f, 'utf8');
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m, n = 0;
  while ((m = re.exec(s))){
    n++;
    const attrs = m[1], body = m[2];
    if (/\bsrc=/.test(attrs)) continue;
    if (/type\s*=\s*"(application\/ld\+json|importmap)"/.test(attrs)) continue;
    const tmp = path.join(os.tmpdir(), `sx-${path.basename(f)}-${n}.mjs`);
    fs.writeFileSync(tmp, body);
    try { execFileSync(process.execPath, ['--check', tmp], { stdio:'pipe' }); }
    catch (e){ bad++; console.log(`${f} script#${n}:\n${e.stderr.toString().split('\n').slice(0,6).join('\n')}`); }
    fs.unlinkSync(tmp);
  }
}
console.log(bad ? `構文エラー ${bad} 件` : '構文OK');
process.exit(bad ? 1 : 0);
