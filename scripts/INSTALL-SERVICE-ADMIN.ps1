# Install Orchestrator Service - Run as Administrator
# Right-click → Run with PowerShell (Admin)

$ErrorActionPreference = "Stop"

$NSSM = "C:\nssm-2.24\win64\nssm.exe"
$SERVICE_NAME = "GabrielToth-Orchestrator"
$PROJECT_DIR = "C:\Users\User\Documents\Github\gabrieltoth.com"
$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$TSX_PATH = "C:\Users\User\AppData\Roaming\npm\node_modules\tsx\dist\cli.mjs"
$SCRIPT_PATH = "$PROJECT_DIR\src\orchestration\bug-hunter-service.ts"

Write-Host "=== Installing Orchestrator Service ===" -ForegroundColor Cyan

# Check NSSM
if (-not (Test-Path $NSSM)) {
    Write-Host "Downloading NSSM..." -ForegroundColor Yellow
    $url = "https://nssm.cc/release/nssm-2.24.zip"
    $zip = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri $url -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath "C:\" -Force
    Remove-Item $zip
}

# Remove existing service if present
$existing = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing service..." -ForegroundColor Yellow
    & $NSSM stop $SERVICE_NAME
    & $NSSM remove $SERVICE_NAME confirm
    Start-Sleep -Seconds 2
}

# Create logs directory
$logDir = "$PROJECT_DIR\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Install service
Write-Host "Installing service..." -ForegroundColor Yellow
& $NSSM install $SERVICE_NAME $NODE_PATH $TSX_PATH $SCRIPT_PATH
& $NSSM set $SERVICE_NAME AppDirectory $PROJECT_DIR
& $NSSM set $SERVICE_NAME DisplayName "Gabriel Toth Orchestrator"
& $NSSM set $SERVICE_NAME Description "24/7 Bug Hunter and Orchestration System"
& $NSSM set $SERVICE_NAME Start SERVICE_AUTO_START
& $NSSM set $SERVICE_NAME AppStdout "$logDir\orchestrator-stdout.log"
& $NSSM set $SERVICE_NAME AppStderr "$logDir\orchestrator-stderr.log"
& $NSSM set $SERVICE_NAME AppRotateFiles 1
& $NSSM set $SERVICE_NAME AppRotateBytes 1048576
& $NSSM set $SERVICE_NAME AppEnvironmentExtra "NODE_ENV=production" "BASE_URL=http://localhost:3000"

Write-Host "`nService installed successfully!" -ForegroundColor Green
Write-Host "Starting service..." -ForegroundColor Yellow
& $NSSM start $SERVICE_NAME

Start-Sleep -Seconds 3

$service = Get-Service $SERVICE_NAME
Write-Host "`n=== Service Status ===" -ForegroundColor Cyan
Write-Host "Name: $($service.Name)" -ForegroundColor White
Write-Host "Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "StartType: $($service.StartType)" -ForegroundColor White
Write-Host "`nLogs: $logDir" -ForegroundColor Gray

if ($service.Status -ne 'Running') {
    Write-Host "`nService not running. Check logs for errors." -ForegroundColor Red
    Write-Host "Logs location: $logDir" -ForegroundColor Yellow
} else {
    Write-Host "`nService is running! Bug Hunter is now 24/7." -ForegroundColor Green
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
