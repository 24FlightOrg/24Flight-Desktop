<#
.SYNOPSIS
  Patches the files needed to build electron-overlay-window on VS2026 with clang-cl,
  then rebuilds the native module.

.DESCRIPTION
  Applies three patches (each idempotent - safe to re-run):
    1. @electron/node-gyp/lib/find-visualstudio.js - adds VS2026 (version 18) detection
    2. electron-overlay-window/binding.gyp         - disables clang toolset default
    3. electron-overlay-window/src/lib/windows.c    - fixes CreateDIBSection pointer cast

  Then runs `npx node-gyp rebuild` inside node_modules/electron-overlay-window.

.PARAMETER ProjectRoot
  Path to your project root (the folder containing package.json / node_modules).
  Defaults to the current directory.

.EXAMPLE
  .\fix-overlay-window-build.ps1
  .\fix-overlay-window-build.ps1 -ProjectRoot "C:\Users\dev\Documents\24Flight\24Flight-Desktop"
#>

param(
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$findVsPath     = Join-Path $ProjectRoot "node_modules\@electron\node-gyp\lib\find-visualstudio.js"
$overlayDir     = Join-Path $ProjectRoot "node_modules\electron-overlay-window"
$bindingGypPath = Join-Path $overlayDir "binding.gyp"
$windowsCPath   = Join-Path $overlayDir "src\lib\windows.c"

function Patch-FindVisualStudio {
    param([string]$Path)
    if (-not (Test-Path $Path)) { Write-Warning "Not found, skipping: $Path"; return }

    $content = Get-Content $Path -Raw
    $orig = $content

    $content = $content -replace "findVSFromSpecifiedLocation\(\[2019, 2022\]\)", "findVSFromSpecifiedLocation([2019, 2022, 2025, 2026])"
    $content = $content -replace "findNewVSUsingSetupModule\(\[2019, 2022\]\)", "findNewVSUsingSetupModule([2019, 2022, 2025, 2026])"
    $content = $content -replace "findNewVS\(\[2019, 2022\]\)", "findNewVS([2019, 2022, 2025, 2026])"

    if ($content -notmatch "ret\.versionMajor === 18") {
        $content = $content -replace `
            "(if \(ret\.versionMajor === 17\) \{\r?\n\s*ret\.versionYear = 2022\r?\n\s*return ret\r?\n\s*\})", `
            "`$1`n    if (ret.versionMajor === 18) {`n      ret.versionYear = 2026`n      return ret`n    }"
    }

    if ($content -notmatch "versionYear === 2026") {
        $content = $content -replace `
            "(\} else if \(versionYear === 2022\) \{\r?\n\s*return 'v143'\r?\n\s*\})", `
            "`$1 else if (versionYear === 2026) {`n      return 'v145'`n    }"
    }

    if ($content -ne $orig) {
        Set-Content -Path $Path -Value $content -NoNewline
        Write-Host "Patched: $Path" -ForegroundColor Green
    } else {
        Write-Host "Already patched (or pattern not found): $Path" -ForegroundColor Yellow
    }
}

function Patch-BindingGyp {
    param([string]$Path)
    if (-not (Test-Path $Path)) { Write-Warning "Not found, skipping: $Path"; return }

    $content = Get-Content $Path -Raw
    if ($content -match "'clang'\s*:\s*0" -or $content -match "'clang%'\s*:\s*0") {
        Write-Host "Already patched: $Path" -ForegroundColor Yellow
        return
    }

    $content = $content -replace "^\{", "{`n  'variables': {`n    'clang': 0`n  },"
    Set-Content -Path $Path -Value $content -NoNewline
    Write-Host "Patched: $Path" -ForegroundColor Green
}

function Patch-WindowsC {
    param([string]$Path)
    if (-not (Test-Path $Path)) { Write-Warning "Not found, skipping: $Path"; return }

    $content = Get-Content $Path -Raw
    $old = "CreateDIBSection(dcSrc, (BITMAPINFO*)&bi, DIB_RGB_COLORS, &bmpData, NULL, 0)"
    $new = "CreateDIBSection(dcSrc, (BITMAPINFO*)&bi, DIB_RGB_COLORS, (void**)&bmpData, NULL, 0)"

    if ($content.Contains($old)) {
        $content = $content.Replace($old, $new)
        Set-Content -Path $Path -Value $content -NoNewline
        Write-Host "Patched: $Path" -ForegroundColor Green
    } elseif ($content.Contains($new)) {
        Write-Host "Already patched: $Path" -ForegroundColor Yellow
    } else {
        Write-Warning "Expected CreateDIBSection line not found in $Path - check it manually"
    }
}

Write-Host "=== Patching files ===" -ForegroundColor Cyan
Patch-FindVisualStudio -Path $findVsPath
Patch-BindingGyp        -Path $bindingGypPath
Patch-WindowsC          -Path $windowsCPath

Write-Host "`n=== Rebuilding electron-overlay-window ===" -ForegroundColor Cyan
if (-not (Test-Path $overlayDir)) {
    throw "electron-overlay-window folder not found at $overlayDir"
}

Push-Location $overlayDir
try {
    npx node-gyp rebuild
    if ($LASTEXITCODE -ne 0) {
        throw "node-gyp rebuild failed with exit code $LASTEXITCODE"
    }
    Write-Host "`nBuild succeeded!" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "`n=== Persist patches so they survive npm install ===" -ForegroundColor Cyan
Write-Host "  npx patch-package @electron/node-gyp"
Write-Host "  npx patch-package electron-overlay-window"
Write-Host "  (and add `"postinstall`": `"patch-package`" to your package.json scripts)"