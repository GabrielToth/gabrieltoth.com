# MASTER ROADMAP - GABRIELTOTH.COM

> **Status:** ACTIVE (Single Source of Truth)  
> **Last Updated:** August 2026  
> **Version:** 1.25.0

---

## 🚀 PHASE 1: UI/UX & High-Contrast Visual Cleanups (COMPLETED / VERIFIED)
- [x] Fix low-contrast card badges (light text on light backgrounds in pricing/benefits).
- [x] Standardize monochrome/white icons across hero and SEO sections (remove raw colored emojis from badges & titles across all 5 locales).
- [x] Standardize card number indicators with high-contrast text (`text-primary-foreground`).
- [x] Clean 138 decorative emoji icons from translation strings across `en`, `pt-BR`, `es`, `de`, `fr`.

---

## 🛠️ PHASE 2: Alternative Social Media Automation & Scraping Infrastructure
- [x] **Twitter/X Scraping & Web Automation Strategy:**
  - Integrated/planned headless browser scraper via Puppeteer / Playwright / Selenium with stealth flags (`--disable-blink-features=AutomationControlled`, custom UA rotation, canvas/webgl fingerprint spoofing).
  - Cookie/Session Token Pooling per user account (Auth tokens `auth_token`, `ct0`).
- [x] **Facebook & Instagram Automation Strategy:**
  - Session cookie handling (`ds_user_id`, `sessionid`) for Private Web API endpoints.
  - Multi-session concurrency pool using proxy rotation (residential HTTP/SOCKS5 proxies).
- [x] **Kwai Automation Strategy:**
  - Mobile web endpoint scraping and session signature bypass.
- [x] **Universal Multi-User Scaling Architecture (1,000+ Active Users & 1,000+ Channel Clones):**
  - Queue management via Redis + BullMQ for scheduled uploads/scrapes.
  - Rate limiting per proxy IP and per account session token.

---

## 📊 PHASE 3: Owner/Dev Telemetry & Analytics Dashboard
- [x] **Admin Insights Dashboard:**
  - Consolidated metrics view for Dev/Owner at `/dashboard/admin-telemetry`.
  - Real-time revenue tracking, active user sessions, API error rates, credits consumption, and channel clone jobs.

---

## 🌐 PHASE 4: Strict i18n & Audit System
- [x] Zero missing/extra keys across all 5 locales (`en`, `pt-BR`, `es`, `de`, `fr`).
- [x] Automated parameter consistency via `scripts/i18n/check-params.mjs`.
- [x] `docs/I18N_AUDIT.md` maintenance script `scripts/gen-i18n-audit.mjs`.

---

## 💡 TOP 50 PLATFORM IMPROVEMENTS & FEATURE SUGGESTIONS

### 🔴 High Impact / High Urgency (Phase A)
1. **BullMQ / Redis Task Queue for Video Reposting:** Decouple video upload background jobs from Vercel serverless functions.
2. **Headless Browser Proxy Mesh:** Residential proxy pool rotation for Instagram/Twitter scraping without IP bans.
3. **Session Cookie Vault with AES-256 Encryption:** Secure user session tokens (`ct0`, `sessionid`, `auth_token`).
4. **Owner/Admin Telemetry Dashboard (`/admin/telemetry`):** Comprehensive metrics on user signups, MRR, credit usage, and failed jobs.
5. **Real-time Live Chat Sentiment Analysis:** AI classification of Twitch/Kick/YouTube unified chat streams.
6. **Multi-Platform Stream Health Telemetry:** Consolidated WebSocket for drops, bitrate spikes, and encoder issues.
7. **Automated Subtitle & Shorts Clipper (Local OSS Stack):** Extract highlights from VODs and output vertical 9:16 Shorts with auto-captioning using local FFmpeg/Whisper pipeline (never paid services).
8. **Automated Repost Rule Engine:** Trigger reposting to TikTok/Reels when a YouTube Short crosses X views.
9. **Single-Sign-On (SSO) Enterprise SAML/OIDC Support:** OAuth2 & OIDC enterprise provider connections.
10. ~~Webhook Notification System~~ (REMOVED: Discord stream notifications already exist via external bot; Telegram/webhooks not needed — Discord is only used for audit logs.)
11. **Granular Credit Management & Cost Breakdown:** Real-time credit deduction logger per user operation.
12. **Automated Thumbnail Generator:** Canvas-based dynamic text overlay for uploaded video thumbnails.
13. **Multi-Account OAuth Token Auto-Refresher:** Proactive background job refreshing expiring access/refresh tokens.
14. **Custom Domain Support for Creator Portfolios:** Allow creators to route `creatorname.com` to their hosted page.
15. **Cross-Platform Content Calendar View:** Drag-and-drop calendar view for scheduled posts across all platforms.

### 🟡 Medium Impact / Moderate Complexity (Phase B)
16. **Twitch / Kick Bot Automation Rules:** Custom auto-replies triggered by chat keywords or channel point redemptions.
17. **Automated DM & Engagement Bot:** Send welcome DMs to new X/Instagram followers via session token automation.
18. **SEO Structured Data Auto-Generator:** Generate Schema.org JSON-LD dynamically for all video and creator pages.
19. **Audio Normalization Pipeline:** FFmpeg loudness normalization (LUFS -14) before uploading VODs.
20. **Video Watermark Auto-Removal & Re-branding:** Clean platform watermarks prior to multi-posting.
21. **Channel Grouping & Team Roles:** Granular RBAC permissions for managers, editors, and creators.
22. **Audience Demographics Aggregator:** Combined age/country demographic chart across YouTube & Meta.
23. **Stream Title & Category Preset Library:** One-click title/category push across Twitch, YouTube, Kick, and Facebook.
24. **Multi-Stream Audio Track Selector:** Separate desktop and mic audio tracks for OBS web popouts.
25. **AI Post Caption Rewriter:** Multi-tone AI generator (viral, corporate, casual) tailored for each network.
26. **Automated Copyright & Content ID Scanner:** Check audio tracks against public copyright databases prior to upload.
27. **Affiliate Link Click Analytics:** Track outbound clicks on Amazon Affiliate shortlinks.
28. **Stream Overlay Widget Builder:** Custom HTML/CSS overlays for follower goals, chat boxes, and alerts.
29. **Real-Time Stream Relay (RTMP Mirroring):** Relay single RTMP input stream to multiple target RTMP servers.
30. **Automated Account Health Audit:** Flag shadowbanned or restricted social media accounts.

### 🟢 Long-term / Future Innovations (Phase C)
31. **Desktop Companion App (Tauri / Electron):** Local RTMP relay and hardware-accelerated local video rendering.
32. **Decentralized Storage Backup (Arweave / IPFS):** Permanent archive for creator VOD highlights.
33. **Monero / Crypto Payment Gateway Integration:** Zero-fee crypto subscriptions and credit top-ups.
34. **AI Avatar Video Generator:** Create short update videos from text prompts using synthetic avatars.
35. **Multi-Language Voice Doubling:** AI voice cloning to dub videos into Spanish, French, and German automatically.
36. **Interactive Viewer Polling Widget:** Unified polling system across Twitch and YouTube chats.
37. **Twitch Clip Auto-Compilation:** Monthly automated compilation of top 10 clipped moments.
38. **Social Media Trend Predictor:** Scrape trending hashtags across TikTok and X for content ideas.
39. **Sponsorship Earnings Tracker:** Record incoming sponsor payments and calculate ROI per platform post.
40. **Mobile App (React Native):** On-the-go stream monitoring and rapid post scheduling.
41. **Custom Webhook Triggers for IFTTT / Zapier:** Integrate with 1,000+ external SaaS tools.
42. **Automated Account Warm-up Bot:** Human-like activity simulation for new social accounts to build trust scores.
43. **Video Thumbnail A/B Testing:** Automatically swap video thumbnails after 48h if CTR is below target.
44. **Community Discord Bot Sync:** Auto-post live status and upload announcements to user Discord servers.
45. **VOD Chapter Generator:** Automatically generate timestamp chapters based on speech pauses and topics.
46. **Creator Income Tax Calculator:** Summarize ad revenue, affiliate income, and credit costs for tax filings.
47. **Automated Backup & Export Tool:** Export all creator metadata, captions, and VODs in single ZIP.
48. **Dynamic Pricing Calculator:** Calculate custom agency pricing based on connected channel counts.
49. **Live Stream Donation Alerts Integration:** Native alert overlays for Stripe and PayPal tips.
50. **Platform API Rate Limit Heatmap:** Visual monitoring of user API quota consumption across all platforms.

---

## 🗓️ CURRENT SPRINT (Last updated: 2026-09-01)
### Active & Pending
- **#419: i18n untranslated English strings** — Fix 15 files ('en' identical strings) across pt-BR/ES/DE/FR in editors.json, dashboard.json, publish.json, etc.
- **#420: Dependency Security Audit** — Resolve remaining 7 high Dependabot vulnerabilities (npm audit fix --force for safe deps).
- **#421: MapLibre/Nominatim Location Search** — Feature for settings (open-source map widget, self-hostable tiles if needed).
- **#422: Meta Publishing External Solution** — No CNPJ. No Official API. Research & implement the cheapest/only local-supported auto-poster for Main + IG Business via browser automation ONLY. No need for official Meta Developer Portal changes (Phase: Local Chrome Debug Server).
