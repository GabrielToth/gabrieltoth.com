# Meta Publisher — Setup Guide

## Architecture

```
Site (Vercel)
  └── POST /api/meta/publish → creates task in Supabase
  └── Frontend uploads video to .203 via tus (or provides SMB path)

.203 (pentester-01)
  ├── meta-publisher/server/  → HTTP tus upload server + Express
  │   ├── index.js
  │   └── package.json
  │
  └── meta-publisher/worker/  → Polls Supabase, runs browser automation
      ├── index.js           → Polling loop
      ├── publish-meta.js    → Puppeteer-core + Stealth
      └── package.json
```

## Prerequisites (on .203)

1. Node.js >= 18 (already installed)
2. Chrome (latest) — already installed and logged into Meta Business Suite
3. Cloudflare Tunnel (optional, for remote upload)

## Chrome Setup

### Option A: Chrome 144+ (native remote debugging)

1. Open Chrome
2. Go to `chrome://inspect/#remote-debugging`
3. Click **Allow** (the toggle to enable remote debugging)
4. Keep Chrome open and logged into https://business.facebook.com/

### Option B: Command-line flag (any Chrome version)

Create a shortcut or startup script:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

Then log into https://business.facebook.com/ manually.

## Server Setup

```powershell
cd C:\meta-publisher\server
copy .env.example .env
# Edit .env with your Supabase credentials
npm install
npm start
```

The server listens on `http://0.0.0.0:3001`.

## Worker Setup

```powershell
cd C:\meta-publisher\worker
copy .env.example .env
# Edit .env with your Supabase credentials
npm install
npm start
```

## Cloudflare Tunnel (for remote upload)

```powershell
# Install cloudflared
winget install Cloudflare.cloudflared

# Create tunnel
cloudflared tunnel create meta-pub

# Route DNS
cloudflared tunnel route dns meta-pub pub.yourdomain.com

# Run
cloudflared tunnel run meta-pub --url http://localhost:3001
```

### Optional: Run as Windows Services

Use NSSM (Non-Sucking Service Manager) to run server + worker as services:

```powershell
nssm install MetaPublisherServer "C:\Program Files\nodejs\node.exe" "C:\meta-publisher\server\index.js"
nssm install MetaPublisherWorker "C:\Program Files\nodejs\node.exe" "C:\meta-publisher\worker\index.js"
```

## Verifying

1. Server health: `curl http://localhost:3001/health`
2. Chrome debugging: Open `http://localhost:9222/json/version` in browser
3. Worker logs: Check `C:\meta-publisher\worker\logs\`
