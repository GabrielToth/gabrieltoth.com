# Install Orchestrator as Windows Service using NSSM

$SERVICE_NAME = "GabrielToth-Orchestrator"
$PROJECT_DIR = "C:\Users\User\Documents\Github\gabrieltoth.com"
$SCRIPT_PATH = "$PROJECT_DIR\scripts\orchestrator-service.ps1"
$NSSM_PATH = "C:\ProgramData\chocolatey\bin\nssm.exe"

Write-Host "🔧 Installing Orchestrator Service..."

if (-not (Test-Path $NSSM_PATH)) {
    Write-Host "❌ NSSM not found. Installing via Chocolatey..."
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Chocolatey not installed. Install from: https://chocolatey.org/install"
        exit 1
    }
    choco install nssm -y
}

$existingService = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠️  Service already exists. Removing..."
    & $NSSM_PATH stop $SERVICE_NAME
    & $NSSM_PATH remove $SERVICE_NAME confirm
}

Write-Host "📦 Creating service..."
& $NSSM_PATH install $SERVICE_NAME PowerShell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$SCRIPT_PATH`""

& $NSSM_PATH set $SERVICE_NAME AppDirectory $PROJECT_DIR
& $NSSM_PATH set $SERVICE_NAME DisplayName "Gabriel Toth Orchestrator"
& $NSSM_PATH set $SERVICE_NAME Description "24/7 Agentic orchestration + bug hunter"
& $NSSM_PATH set $SERVICE_NAME Start SERVICE_AUTO_START

& $NSSM_PATH set $SERVICE_NAME AppStdout "$PROJECT_DIR\logs\orchestrator-stdout.log"
& $NSSM_PATH set $SERVICE_NAME AppStderr "$PROJECT_DIR\logs\orchestrator-stderr.log"

& $NSSM_PATH set $SERVICE_NAME AppStdoutCreationDisposition 4
& $NSSM_PATH set $SERVICE_NAME AppStderrCreationDisposition 4

Write-Host "🚀 Starting service..."
& $NSSM_PATH start $SERVICE_NAME

Start-Sleep -Seconds 3

$status = & $NSSM_PATH status $SERVICE_NAME
Write-Host "✅ Service status: $status"

Write-Host ""
Write-Host "Service commands:"
Write-Host "  Start:   nssm start $SERVICE_NAME"
Write-Host "  Stop:    nssm stop $SERVICE_NAME"
Write-Host "  Restart: nssm restart $SERVICE_NAME"
Write-Host "  Status:  nssm status $SERVICE_NAME"
Write-Host "  Logs:    Get-Content $PROJECT_DIR\logs\orchestrator-service.log -Tail 50 -Wait"
