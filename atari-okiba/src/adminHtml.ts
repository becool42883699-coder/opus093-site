/**
 * 管理画面(1枚HTML)。ビルド工程を持たないため、TypeScriptの文字列として保持し
 * wranglerの標準バンドルだけで配信できるようにしている。
 *
 * 注意: このテンプレートリテラル内ではバッククォート・「$」+「{」・バックスラッシュを
 * 使用しないこと(エスケープ事故防止のため、内側のJSは文字列連結スタイルで書く)。
 * __CSP_NONCE__ は配信時にリクエストごとのnonceへ置換される。
 */
export const ADMIN_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>あたり置き場</title>
<link rel="icon" href="data:,">
<style>
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  margin: 0; background: #f5f5f4; color: #1c1917; line-height: 1.6;
}
header { max-width: 760px; margin: 0 auto; padding: 20px 16px 0; }
h1 { font-size: 22px; margin: 0; }
.sub { color: #78716c; margin: 4px 0 0; font-size: 13px; }
main { max-width: 760px; margin: 0 auto; padding: 16px; }
.card { background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.card h2 { font-size: 16px; margin: 0 0 12px; }
.form-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.form-row label { display: block; font-size: 12px; color: #57534e; }
.form-row input { display: block; margin-top: 4px; padding: 8px; font-size: 14px; border: 1px solid #d6d3d1; border-radius: 6px; width: 180px; }
button { padding: 8px 16px; font-size: 14px; border: 1px solid #1c1917; background: #1c1917; color: #fff; border-radius: 6px; cursor: pointer; }
button:hover { opacity: 0.85; }
button.small { padding: 4px 10px; font-size: 12px; }
button.ghost { background: #fff; color: #1c1917; border-color: #d6d3d1; }
.hint { font-size: 12px; color: #a8a29e; margin: 8px 0 0; }
.project-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
.project-head h2 { margin: 0; }
.slug { font-size: 12px; color: #78716c; font-family: ui-monospace, Menlo, Consolas, monospace; }
.url-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
.latest-url { font-size: 13px; word-break: break-all; color: #2563eb; }
.meta-line { font-size: 12px; color: #78716c; margin-top: 6px; }
.versions { margin-top: 6px; font-size: 12px; }
.vlabel { color: #78716c; }
.vlink { margin-right: 8px; color: #2563eb; }
.dropzone { border: 2px dashed #d6d3d1; border-radius: 8px; padding: 20px; text-align: center; color: #78716c; margin-top: 12px; font-size: 13px; }
.dropzone.drag { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.dropzone button { margin-top: 8px; }
.hidden-input { display: none; }
.msg { font-size: 13px; margin-top: 8px; color: #15803d; min-height: 1.2em; }
.msg.error { color: #b91c1c; }
.tools { margin-top: 10px; }
.empty { color: #78716c; font-size: 14px; }
</style>
</head>
<body>
<header>
  <h1>あたり置き場</h1>
  <p class="sub">HTML一式をフォルダごとドロップすると、確認用URLを発行します</p>
</header>
<main>
  <section class="card">
    <h2>新規案件</h2>
    <div class="form-row">
      <label>スラッグ(URLの一部)
        <input id="new-slug" placeholder="acme-lp" autocomplete="off" autocapitalize="off" spellcheck="false">
      </label>
      <label>表示名
        <input id="new-name" placeholder="ACME様 LP" autocomplete="off">
      </label>
      <label>閲覧パスワード(空欄なら誰でも閲覧可)
        <input id="new-password" type="text" autocomplete="off">
      </label>
      <button id="create-btn" type="button">作成</button>
    </div>
    <p class="hint">スラッグは英小文字・数字・ハイフン(1〜63文字)。URLは /p/スラッグ/ になります。</p>
  </section>
  <div id="global-msg" class="msg"></div>
  <section id="projects"></section>
</main>
<script nonce="__CSP_NONCE__">
'use strict';
(function () {
  var SLUG_RE = new RegExp('^[a-z0-9][a-z0-9-]{0,62}$');
  var JUNK = { '.DS_Store': true, 'Thumbs.db': true, 'desktop.ini': true };

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function setMsg(target, text, isError) {
    target.textContent = text || '';
    target.className = isError ? 'msg error' : 'msg';
  }

  function api(method, path, body) {
    var opts = { method: method, headers: { 'X-Atari-Admin': '1' } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(path, opts).then(function (res) {
      return res.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
        if (!res.ok) {
          throw new Error((data && data.error) ? data.error : ('HTTP ' + res.status));
        }
        return data;
      });
    });
  }

  function putFile(path, file) {
    return fetch(path, { method: 'PUT', headers: { 'X-Atari-Admin': '1' }, body: file }).then(function (res) {
      if (res.ok) return;
      return res.text().then(function (t) {
        var msg = 'HTTP ' + res.status;
        try { var d = JSON.parse(t); if (d && d.error) msg = d.error; } catch (e) {}
        throw new Error(msg);
      });
    });
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('ja-JP');
  }

  function projectUrl(slug) { return location.origin + '/p/' + slug + '/'; }
  function versionUrl(slug, v) { return location.origin + '/p/' + slug + '/v/' + v + '/'; }

  function copyText(text, statusEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { setMsg(statusEl, 'URLをコピーしました'); },
        function () { window.prompt('コピーしてください', text); }
      );
    } else {
      window.prompt('コピーしてください', text);
    }
  }

  // --- フォルダ走査 (Drag & Drop) ---

  function entryFile(entry) {
    return new Promise(function (resolve, reject) { entry.file(resolve, reject); });
  }

  // readEntries は一度に最大100件しか返さないため、空になるまで繰り返す
  function readAllEntries(dirEntry) {
    var reader = dirEntry.createReader();
    var all = [];
    return new Promise(function (resolve, reject) {
      function next() {
        reader.readEntries(function (batch) {
          if (batch.length === 0) { resolve(all); return; }
          for (var i = 0; i < batch.length; i++) all.push(batch[i]);
          next();
        }, reject);
      }
      next();
    });
  }

  function walkEntry(entry, strip, out) {
    if (entry.isFile) {
      return entryFile(entry).then(function (file) {
        var rel = entry.fullPath || ('/' + file.name);
        if (strip !== '' && rel.indexOf(strip) === 0) rel = rel.slice(strip.length);
        while (rel.charAt(0) === '/') rel = rel.slice(1);
        if (rel !== '') out.push({ path: rel, file: file });
      });
    }
    if (entry.isDirectory) {
      return readAllEntries(entry).then(function (children) {
        var p = Promise.resolve();
        children.forEach(function (child) {
          p = p.then(function () { return walkEntry(child, strip, out); });
        });
        return p;
      });
    }
    return Promise.resolve();
  }

  function collectFromDrop(dataTransfer) {
    var entries = [];
    for (var i = 0; i < dataTransfer.items.length; i++) {
      var item = dataTransfer.items[i];
      if (item.kind === 'file' && item.webkitGetAsEntry) {
        var entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }
    if (entries.length === 0) return Promise.resolve([]);
    // 単一フォルダのドロップなら、そのフォルダ名の階層を剥がしてルート直下に展開する
    var strip = (entries.length === 1 && entries[0].isDirectory) ? (entries[0].fullPath + '/') : '';
    var out = [];
    var p = Promise.resolve();
    entries.forEach(function (entry) {
      p = p.then(function () { return walkEntry(entry, strip, out); });
    });
    return p.then(function () { return out; });
  }

  // --- フォルダ選択 (input webkitdirectory) ---

  function collectFromInput(input) {
    var out = [];
    for (var i = 0; i < input.files.length; i++) {
      var f = input.files[i];
      var rel = f.webkitRelativePath || f.name;
      var idx = rel.indexOf('/');
      // webkitRelativePath は「選択フォルダ名/…」で始まるため先頭の階層を剥がす
      if (f.webkitRelativePath && idx >= 0) rel = rel.slice(idx + 1);
      if (rel !== '') out.push({ path: rel, file: f });
    }
    return out;
  }

  function filterJunk(list) {
    return list.filter(function (item) {
      if (!item.path || item.path.length > 1024) return false;
      var segs = item.path.split('/');
      return !JUNK[segs[segs.length - 1]];
    });
  }

  // --- アップロード(1ファイルずつ直列) ---

  var uploading = false;

  function upload(slug, items, statusEl) {
    if (uploading) {
      setMsg(statusEl, '別のアップロードが進行中です。完了までお待ちください。', true);
      return Promise.resolve();
    }
    var files = filterJunk(items);
    if (files.length === 0) {
      setMsg(statusEl, 'アップロードできるファイルがありません。フォルダごとドロップしてください。', true);
      return Promise.resolve();
    }
    uploading = true;
    var version = 0;
    setMsg(statusEl, '新しいバージョンを準備中…');
    return api('POST', '/api/projects/' + slug + '/versions').then(function (data) {
      version = data.version;
      var p = Promise.resolve();
      files.forEach(function (item, idx) {
        p = p.then(function () {
          setMsg(statusEl, 'アップロード中 (' + (idx + 1) + '/' + files.length + '): ' + item.path);
          return putFile(
            '/api/projects/' + slug + '/versions/' + version + '/files?path=' + encodeURIComponent(item.path),
            item.file
          );
        });
      });
      return p;
    }).then(function () {
      setMsg(statusEl, '公開処理中…');
      return api('POST', '/api/projects/' + slug + '/versions/' + version + '/finalize', { fileCount: files.length });
    }).then(function (data) {
      uploading = false;
      // loadProjects() はカードDOM(statusElを含む)を作り直すため、成功メッセージは
      // 再描画で消えない #global-msg に出す(公開URLはカードに恒常表示される)
      return loadProjects().then(function () {
        setMsg($('global-msg'), 'v' + data.version + ' を公開しました(' + data.fileCount + 'ファイル)');
      });
    }).catch(function (err) {
      uploading = false;
      setMsg(statusEl, 'エラー: ' + err.message + ' — この版は公開されていません(最新URLは以前のままです)', true);
    });
  }

  // --- 描画(動的な値は必ずtextContent経由で挿入する) ---

  function renderProject(p) {
    var card = el('section', 'card project');
    var head = el('div', 'project-head');
    var title = el('h2', null, p.name + (p.hasPassword ? ' 🔒' : ''));
    head.appendChild(title);
    head.appendChild(el('span', 'slug', '/p/' + p.slug + '/'));
    card.appendChild(head);

    var statusEl = el('div', 'msg');

    if (p.latestVersion > 0) {
      var urlRow = el('div', 'url-row');
      var link = el('a', 'latest-url', projectUrl(p.slug));
      link.href = projectUrl(p.slug);
      link.target = '_blank';
      link.rel = 'noopener';
      urlRow.appendChild(link);
      var copyBtn = el('button', 'small ghost', 'コピー');
      copyBtn.type = 'button';
      copyBtn.addEventListener('click', function () { copyText(projectUrl(p.slug), statusEl); });
      urlRow.appendChild(copyBtn);
      card.appendChild(urlRow);
      card.appendChild(el('div', 'meta-line', '最新: v' + p.latestVersion + ' ・ 更新: ' + fmtDate(p.updatedAt)));
      if (p.versions && p.versions.length > 0) {
        var vrow = el('div', 'versions');
        vrow.appendChild(el('span', 'vlabel', '履歴: '));
        for (var i = p.versions.length - 1; i >= 0; i--) {
          var v = p.versions[i];
          var va = el('a', 'vlink', 'v' + v.version);
          va.href = versionUrl(p.slug, v.version);
          va.target = '_blank';
          va.rel = 'noopener';
          va.title = fmtDate(v.uploadedAt) + ' ・ ' + v.fileCount + 'ファイル';
          vrow.appendChild(va);
        }
        card.appendChild(vrow);
      }
    } else {
      card.appendChild(el('div', 'meta-line', 'まだアップロードがありません。下にフォルダをドロップすると v1 が公開されます。'));
    }

    var drop = el('div', 'dropzone');
    drop.appendChild(el('div', null, 'ここにフォルダをドロップ'));
    var pickBtn = el('button', 'small ghost', 'フォルダを選択');
    pickBtn.type = 'button';
    var input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('multiple', '');
    input.className = 'hidden-input';
    pickBtn.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      var items = collectFromInput(input);
      input.value = '';
      upload(p.slug, items, statusEl);
    });
    drop.appendChild(pickBtn);
    drop.appendChild(input);
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('drag');
      collectFromDrop(e.dataTransfer).then(function (items) {
        return upload(p.slug, items, statusEl);
      }).catch(function (err) {
        setMsg(statusEl, 'エラー: ' + err.message, true);
      });
    });
    card.appendChild(drop);
    card.appendChild(statusEl);

    var tools = el('div', 'tools');
    var pwBtn = el('button', 'small ghost', p.hasPassword ? '閲覧パスワード変更・解除' : '閲覧パスワード設定');
    pwBtn.type = 'button';
    pwBtn.addEventListener('click', function () {
      var pw = window.prompt('新しい閲覧パスワード(空欄で保護解除)');
      if (pw === null) return;
      api('PATCH', '/api/projects/' + p.slug, { password: pw }).then(function () {
        setMsg(statusEl, pw === '' ? '閲覧パスワードを解除しました' : '閲覧パスワードを設定しました');
        return loadProjects();
      }).catch(function (err) { setMsg(statusEl, 'エラー: ' + err.message, true); });
    });
    tools.appendChild(pwBtn);
    card.appendChild(tools);
    return card;
  }

  function loadProjects() {
    return api('GET', '/api/projects').then(function (data) {
      var wrap = $('projects');
      wrap.textContent = '';
      var list = (data && data.projects) ? data.projects : [];
      if (list.length === 0) {
        wrap.appendChild(el('p', 'empty', '案件がまだありません。上のフォームから作成してください。'));
      }
      list.forEach(function (p) { wrap.appendChild(renderProject(p)); });
      if (data && data.truncated) {
        wrap.appendChild(el('p', 'hint', '案件が多いため一部のみ表示しています(上限40件)。'));
      }
    }).catch(function (err) {
      setMsg($('global-msg'), '一覧の取得に失敗しました: ' + err.message + '(ページを再読み込みしてください)', true);
    });
  }

  $('create-btn').addEventListener('click', function () {
    var slug = $('new-slug').value.trim();
    var name = $('new-name').value.trim();
    var password = $('new-password').value;
    var gm = $('global-msg');
    if (!SLUG_RE.test(slug)) {
      setMsg(gm, 'スラッグは英小文字・数字・ハイフンで1〜63文字にしてください(先頭は英数字)。', true);
      return;
    }
    api('POST', '/api/projects', { slug: slug, name: name, password: password }).then(function () {
      $('new-slug').value = '';
      $('new-name').value = '';
      $('new-password').value = '';
      setMsg(gm, '案件「' + (name || slug) + '」を作成しました');
      return loadProjects();
    }).catch(function (err) { setMsg(gm, 'エラー: ' + err.message, true); });
  });

  // ページ全体へのドロップでブラウザがファイルを開いてしまうのを防ぐ
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  loadProjects();
})();
</script>
</body>
</html>
`;
