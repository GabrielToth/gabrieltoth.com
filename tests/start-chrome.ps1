$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$CdpPort = 9222

Write-Host "Killing existing Chrome instances..."
taskkill /F /IM chrome.exe 2>$null
Start-Sleep 2

Write-Host "Starting Chrome with remote debugging on port $CdpPort ..."
Start-Process -FilePath $ChromePath -ArgumentList "--remote-debugging-port=$CdpPort --no-first-run --no-default-browser-check"

Start-Sleep 2
Write-Host "Chrome ready. Run: npx tsx tests/auth-flow.cdp.ts"
