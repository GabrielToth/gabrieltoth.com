# OmniRoute Auto-Start - Run as Administrator
# Creates a Scheduled Task to start OmniRoute on boot

$ErrorActionPreference = "Stop"

$TASK_NAME = "OmniRoute-AutoStart"
$OMNIROUTE_DIR = "C:\Users\User\Documents\Github\OmniRoute"
$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$NPM_PATH = "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"

Write-Host "=== Creating OmniRoute Auto-Start Task ===" -ForegroundColor Cyan

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

# Create action
$action = New-ScheduledTaskAction -Execute $NODE_PATH -Argument "$NPM_PATH run dev" -WorkingDirectory $OMNIROUTE_DIR

# Create trigger (at startup, 30 second delay)
$trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 30)

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartInterval (New-TimeSpan -Minutes 5) -RestartCount 3

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

# Register task
Register-ScheduledTask -TaskName $TASK_NAME -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Auto-starts OmniRoute dev server on boot"

Write-Host "`n✅ Task created successfully!" -ForegroundColor Green
Write-Host "OmniRoute will start automatically after the next reboot." -ForegroundColor White
Write-Host "`nTo test now, run:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
