param(
    [switch]$SkipGitPull
)

$ErrorActionPreference = "Stop"
$root = "C:\Users\pentester-01\meta-publisher"

Write-Host "=== Meta Publisher Update ===" -ForegroundColor Cyan

# 1. Pull latest from repo
if (-not $SkipGitPull) {
    Write-Host "[1/4] Pulling latest code from GitHub..." -ForegroundColor Yellow
    $repoDir = "C:\Users\pentester-01\gabrieltoth.com"
    if (-not (Test-Path $repoDir)) {
        git clone https://github.com/GabrielToth/gabrieltoth.com.git $repoDir 2>&1 | Out-Null
    }
    Set-Location $repoDir
    git checkout main 2>&1 | Out-Null
    git pull origin main 2>&1 | Out-Null
} else {
    Write-Host "[1/4] Skipping git pull" -ForegroundColor Yellow
}

# 2. Copy updated files
Write-Host "[2/4] Copying meta-publisher files..." -ForegroundColor Yellow
$src = if (-not $SkipGitPull) { "C:\Users\pentester-01\gabrieltoth.com\meta-publisher" } else { $root }
Copy-Item "$src\server\index.js" "$root\server\index.js" -Force
Copy-Item "$src\worker\index.js" "$root\worker\index.js" -Force
Copy-Item "$src\worker\publish-meta.js" "$root\worker\publish-meta.js" -Force
Write-Host "  Files copied."

# 3. Install deps if needed
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
Set-Location "$root\server"
npm install --silent 2>&1 | Out-Null
Set-Location "$root\worker"
npm install --silent 2>&1 | Out-Null
Write-Host "  Dependencies OK."

# 4. Restart services
Write-Host "[4/4] Restarting services..." -ForegroundColor Yellow
Restart-Service -Name "MetaPubServer" -Force
Restart-Service -Name "MetaPubWorker" -Force
Start-Sleep -Seconds 3

$srv = Get-Service "MetaPubServer"
$wrk = Get-Service "MetaPubWorker"
$chr = Get-Service "ChromeDebug"

Write-Host "=== Status ===" -ForegroundColor Cyan
Write-Host "ChromeDebug : $($chr.Status)" -ForegroundColor $(if ($chr.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "MetaPubServer : $($srv.Status)" -ForegroundColor $(if ($srv.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "MetaPubWorker : $($wrk.Status)" -ForegroundColor $(if ($wrk.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "Done!" -ForegroundColor Green
