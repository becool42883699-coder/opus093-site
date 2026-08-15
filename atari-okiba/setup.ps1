# あたり置き場 かんたんセットアップ（Windows / PowerShell 用）
#
# 使い方: atari-okiba フォルダの中で、PowerShell を開いて次を実行します。
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# ログイン → R2作成 → KV作成と設定反映 → 鍵の設定 → デプロイ まで自動で行います。

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$Bucket      = 'atari-okiba-files'
$KvBinding   = 'META'
$Config      = 'wrangler.jsonc'
$Placeholder = '00000000000000000000000000000000'

function Write-Line { Write-Host '----------------------------------------' }
function Write-Step($text) { Write-Host "> $text" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "  $text" -ForegroundColor Green }
function Write-Fail($text) { Write-Host $text -ForegroundColor Red }

Write-Line
Write-Host ' あたり置き場 セットアップ'
Write-Line
Write-Host ''

# --- 0. 前提チェック --------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail 'X Node.js が見つかりません。'
    Write-Host '  https://nodejs.org/ja から「LTS」版を入れて、PowerShell を開き直してください。'
    exit 1
}

$nodeMajor = (& node -e "console.log(process.versions.node.split('.')[0])").Trim()
if ([int]$nodeMajor -lt 20) {
    Write-Fail "X Node.js のバージョンが古すぎます（v$nodeMajor）。v20 以上が必要です。"
    Write-Host '  https://nodejs.org/ja から新しい LTS 版を入れ直してください。'
    exit 1
}

# --- 1. 依存パッケージ ------------------------------------------------------
Write-Step '部品を入れています（少し時間がかかります）…'
& npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Fail 'X npm install に失敗しました。'; exit 1 }
Write-Ok '完了。'
Write-Host ''

# --- 2. Cloudflare ログイン -------------------------------------------------
$who = (& npx wrangler whoami 2>&1 | Out-String)
if ($who -match 'You are logged in') {
    Write-Step 'Cloudflare には既にログイン済みです。'
} else {
    Write-Step 'Cloudflare にログインします。ブラウザが開くので「Allow」を押してください。'
    & npx wrangler login
    if ($LASTEXITCODE -ne 0) { Write-Fail 'X ログインに失敗しました。'; exit 1 }
}
Write-Host ''

# --- 3. R2 バケット ---------------------------------------------------------
Write-Step "R2バケット（$Bucket）を確認しています…"
$bucketList = (& npx wrangler r2 bucket list 2>&1 | Out-String)
if ($bucketList -match [regex]::Escape($Bucket)) {
    Write-Ok '既にあります。作成をスキップしました。'
} else {
    $createOut = (& npx wrangler r2 bucket create $Bucket 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Fail 'X R2バケットを作成できませんでした。'
        Write-Host '  R2は最初に一度だけ、ダッシュボードでの有効化が必要です:'
        Write-Host '    https://dash.cloudflare.com/ → 左メニュー「R2」→ 案内に従って有効化'
        Write-Host ''
        Write-Host '  wrangler からのエラー:'
        foreach ($errLine in ($createOut -split "`r?`n")) { Write-Host "    $errLine" }
        exit 1
    }
    Write-Ok '作成しました。'
}

# --- 4. KV ネームスペース ---------------------------------------------------
Write-Step "KVネームスペース（$KvBinding）を確認しています…"
$kvId = ''
$kvList = (& npx wrangler kv namespace list 2>&1 | Out-String)

# "id":"...", "title":"atari-okiba-META" の組を探す（順序はどちらでも拾えるようにする）
$kvPattern = 'atari-okiba-' + $KvBinding
foreach ($m in [regex]::Matches($kvList, '\{[^{}]*\}')) {
    if ($m.Value -match [regex]::Escape($kvPattern)) {
        if ($m.Value -match '"id"\s*:\s*"([0-9a-f]{32})"') { $kvId = $Matches[1]; break }
    }
}

if ($kvId) {
    Write-Ok "既にあります（id: $kvId）。作成をスキップしました。"
} else {
    Write-Host '  作成します…'
    $kvOut = (& npx wrangler kv namespace create $KvBinding 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        Write-Fail 'X KVネームスペースを作成できませんでした。wrangler からのエラー:'
        Write-Host $kvOut
        exit 1
    }
    if ($kvOut -match '([0-9a-f]{32})') {
        $kvId = $Matches[1]
        Write-Ok "作成しました（id: $kvId）。"
    } else {
        Write-Fail 'X 作成はできましたが、id を読み取れませんでした。'
        Write-Host "  次の出力から32桁の id を探し、$Config の `"id`": `"$Placeholder`" と置き換えてください。"
        Write-Host $kvOut
        exit 1
    }
}

# --- wrangler.jsonc に反映 --------------------------------------------------
$configText = Get-Content $Config -Raw
if ($configText.Contains($Placeholder)) {
    # Set-Content -Encoding utf8 は Windows PowerShell 5.1 だと BOM が付き、
    # wrangler の設定読み込みが壊れることがあるため .NET で BOM なし保存する
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $fullPath = (Resolve-Path $Config).Path
    [System.IO.File]::WriteAllText($fullPath, ($configText -replace $Placeholder, $kvId), $utf8NoBom)
    Write-Step "$Config にKVのidを書き込みました。"
} elseif ($configText.Contains($kvId)) {
    Write-Step "$Config は既に正しいidになっています。"
} else {
    Write-Step "$Config には別のidが設定済みです。そのまま使用します。"
}
Write-Host ''

# --- 5. 管理トークン --------------------------------------------------------
Write-Step '管理画面の鍵（ADMIN_TOKEN）を設定します。'
# RandomNumberGenerator::Fill は Windows PowerShell 5.1（.NET Framework）に無いため、
# 確実に存在する Node の crypto を使う
$token = (& node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))").Trim()

$token | & npx wrangler secret put ADMIN_TOKEN | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail 'X 鍵の設定に失敗しました。手動で次を実行してください:'
    Write-Host '    npx wrangler secret put ADMIN_TOKEN'
    exit 1
}

Write-Line
Write-Host ' 管理画面の鍵（この画面にしか出ません。今すぐ控えてください）'
Write-Host ''
Write-Host "   $token" -ForegroundColor Yellow
Write-Host ''
Write-Line
Write-Host ''

# --- 6. デプロイ ------------------------------------------------------------
Write-Step '公開します…'
& npx wrangler deploy
if ($LASTEXITCODE -ne 0) { Write-Fail 'X デプロイに失敗しました。'; exit 1 }

Write-Host ''
Write-Line
Write-Host ' 完了しました。表示された https://atari-okiba.〇〇.workers.dev の'
Write-Host ' 末尾に /admin を付けて開き、上の鍵を貼り付けてログインしてください。'
Write-Line
