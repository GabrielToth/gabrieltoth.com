# Orchestrator Service
# Runs the agentic orchestration system 24/7 as a Windows service

$SERVICE_NAME = "GabrielToth-Orchestrator"
$PROJECT_DIR = "C:\Users\User\Documents\Github\gabrieltoth.com"
$NODE_PATH = "C:\nvm4w\nodejs\node.exe"
$NPX_PATH = "C:\nvm4w\nodejs\node_modules\npm\bin\npx-cli.js"

# Bug Hunter Service
$SCRIPT_PATH = "$PROJECT_DIR\src\orchestration\bug-hunter-service.ts"
$LOG_DIR = "$PROJECT_DIR\logs"
$LOG_FILE = "$LOG_DIR\orchestrator-service.log"

if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
}

function Write-ServiceLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $LOG_FILE -Value $logMessage
    Write-Host $logMessage
}

Write-ServiceLog "Starting Orchestrator Service..."
Write-ServiceLog "Project: $PROJECT_DIR"
Write-ServiceLog "Script: $SCRIPT_PATH"

Set-Location $PROJECT_DIR

$env:BASE_URL = "http://localhost:3000"
$env:NODE_ENV = "production"

Write-ServiceLog "Launching Bug Hunter with tsx..."

& $NODE_PATH $NPX_PATH tsx $SCRIPT_PATH 2>&1 | ForEach-Object {
    Write-ServiceLog $_
}

Write-ServiceLog "Service stopped."
