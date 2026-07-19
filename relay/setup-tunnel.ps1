param(
    [string]$TunnelName = "gabrieltoth-relay",
    [string]$Domain = "relay.gabrieltoth.com",
    [string]$RelayPort = "3100"
)

$ErrorActionPreference = "Stop"

function Log($msg) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan
}

function CheckLastExit {
    if (-not $?) { throw "Last command failed" }
}

Log "=== Cloudflare Tunnel Setup for Relay Server ==="
Log "Tunnel: $TunnelName"
Log "Domain: $Domain"
Log "Relay port: $RelayPort"

# ─── Step 1: Check cloudflared ────────────────────────────
Log "Step 1: Checking cloudflared..."

$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
    Log "cloudflared not found. Installing via winget..."
    winget install --id Cloudflare.cloudflared --silent
    CheckLastExit
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + $env:Path
    Log "cloudflared installed. Please restart PowerShell and re-run this script."
    exit 1
}

$version = & cloudflared --version
Log "cloudflared found: $version"

# ─── Step 2: Authenticate ─────────────────────────────────
Log "Step 2: Authenticating cloudflared with Cloudflare..."
Log "A browser window will open. Log in to Cloudflare and authorize."
& cloudflared tunnel login
CheckLastExit
Log "Authentication complete."

# ─── Step 3: Create tunnel ────────────────────────────────
Log "Step 3: Creating tunnel '$TunnelName'..."
$existing = & cloudflared tunnel list 2>&1 | Select-String $TunnelName
if ($existing) {
    Log "Tunnel '$TunnelName' already exists. Skipping creation."
} else {
    & cloudflared tunnel create $TunnelName
    CheckLastExit
    Log "Tunnel created."
}

# ─── Step 4: Get tunnel ID ────────────────────────────────
Log "Step 4: Getting tunnel ID..."
$list = & cloudflared tunnel list --output json
$tunnels = $list | ConvertFrom-Json
$tunnel = $tunnels | Where-Object { $_.Name -eq $TunnelName } | Select-Object -First 1
if (-not $tunnel) {
    throw "Tunnel '$TunnelName' not found in list"
}
$tunnelId = $tunnel.Id
$tunnelFile = "$env:USERPROFILE\.cloudflared\$tunnelId.json"
Log "Tunnel ID: $tunnelId"

# ─── Step 5: Write config.yml ─────────────────────────────
Log "Step 5: Writing config.yml..."
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
$config = @"
tunnel: $tunnelId
credentials-file: $tunnelFile

ingress:
  - hostname: $Domain
    service: http://localhost:$RelayPort
    originRequest:
      noTLSVerify: true
  - service: http_status:404
"@
Set-Content -Path $configPath -Value $config -Encoding UTF8
Log "Config written to $configPath"

# ─── Step 6: Route DNS ────────────────────────────────────
Log "Step 6: Routing DNS for $Domain -> tunnel..."
& cloudflared tunnel route dns $TunnelName $Domain
CheckLastExit
Log "DNS routed."

# ─── Step 7: Install as Windows service ───────────────────
Log "Step 7: Installing cloudflared as Windows service..."
$existingSvc = Get-Service cloudflared -ErrorAction SilentlyContinue
if ($existingSvc) {
    Log "Service 'cloudflared' already exists. Stopping + restarting..."
    & cloudflared service uninstall
    CheckLastExit
}
& cloudflared service install
CheckLastExit
Start-Service cloudflared
CheckLastExit
Log "Service installed and started."

# ─── Verify ────────────────────────────────────────────────
Start-Sleep -Seconds 3
$svc = Get-Service cloudflared
Log "Service status: $($svc.Status)"
Log ""
Log "=== Setup complete ==="
Log "Next steps on your dev machine:"
Log "1. Set Vercel env: vercel env add NEXT_PUBLIC_RELAY_WS_URL wss://$Domain"
Log "2. Remove old env: vercel env rm YOUTUBE_RELAY_WS_URL"
Log "3. Redeploy: vercel --prod"
Log ""
Log "Your relay server is now accessible at: wss://$Domain"
