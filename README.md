# Gabriel Toth Portfolio

Personal portfolio and platform by Gabriel Toth Gonçalves - Full Stack Developer

🌐 **Live**: [https://www.gabrieltoth.com](https://www.gabrieltoth.com)  
📦 **Repository**: [GitHub](https://github.com/gabrieltoth/gabrieltoth.com)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 24+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/gabrieltoth/gabrieltoth.com.git
cd gabrieltoth.com
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

1. Copy the example file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your values (see detailed instructions in the file)

3. **Minimum required** for basic development:

   ```env
   NODE_ENV=development
   DEBUG=true
   NEXT_PUBLIC_DEBUG=false
   ```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Setup (Optional)

If you prefer Docker:

### Step 1: Set Up Docker Environment

```bash
cp .env.docker.example .env.docker
```

### Step 2: Start Services

```bash
cd docker
docker compose up -d
```

### Step 3: Access Application

- **Frontend**: <http://localhost:3000>
- **Postgres**: localhost:5432

### Stop Services

```bash
docker compose down
```

---

## 📝 Available Scripts

### Development

```bash
npm run dev              # Start development server (Turbopack)
npm run build            # Build for production
npm run start            # Start production server
```

### Code Quality

```bash
npm run lint             # Check linting
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
npm run type-check       # Check TypeScript types
npm run spell-check      # Check spelling (EN + PT-BR)
```

### Testing

```bash
npm run test             # Run all tests
npm run test:unit        # Run unit tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:coverage    # Generate coverage report
npm run test:watch       # Run tests in watch mode
```

### Performance

```bash
npm run analyze          # Analyze bundle size
npm run lighthouse       # Run Lighthouse audits
npm run perf:full        # Full performance analysis
```

### Utilities

```bash
npm run clean            # Clean build files
```

---

## 🌐 Social Network Status

| Platform | Local Dev | Production | Setup | Cost |
|----------|-----------|------------|-------|------|
| **LinkedIn** | ✅ Works | ✅ Works | [Tutorial](#linkedin) | Free |
| **YouTube** | ✅ Works | ✅ Works | [Tutorial](#youtube) | Free |
| **TikTok** | ✅ Works | ✅ Works | [Tutorial](#tiktok) | Free |
| **Twitter/X** | ✅ Local only | ❌ Requires credits | [Tutorial](#twitterx) | ~$0.03/post (X API credits) |
| **Facebook** | ✅ Local only | ❌ Requires CNPJ | [Tutorial](#facebook) | Free (requires Meta Business acc.) |
| **Instagram** | ✅ Local only | ❌ Requires CNPJ | [Tutorial](#instagram) | Free (requires Meta Business acc.) |

### 📌 Important Notes

- **Twitter/X**: The X API v2 requires **Pay Per Use** enrollment. Each post consumes credits (~$0.015/credit, ~2 credits per post). You need to purchase credits on [console.x.com](https://console.x.com) for posting to work. See setup tutorial below.
- **Facebook/Instagram**: Require a **CNPJ** (Brazilian business ID) for Meta's **Advanced Access** (needed for publishing in production). In local development you can use `FACEBOOK_PAGE_ACCESS_TOKEN` and `INSTAGRAM_PAGE_ACCESS_TOKEN` env vars as a bypass.
- **LinkedIn, YouTube, TikTok**: Work fully in both local and production with proper OAuth credentials.

---

## ⚡ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (new-york, RSC enabled)
- **Icons**: Lucide React
- **Database**: Supabase Postgres (Free plan)
- **Authentication**: Custom Argon2id (no Supabase Auth)
- **i18n**: next-intl (4 locales: en, pt-BR, es, de)
- **Email**: Resend (Free plan)
- **Deployment**: Vercel + Cloudflare

---

## 📚 Documentation

Full documentation is on the [GitHub Wiki](https://github.com/GabrielToth/gabrieltoth.com/wiki):

- **[Home](https://github.com/GabrielToth/gabrieltoth.com/wiki)** — Index and navigation
- **[API](https://github.com/GabrielToth/gabrieltoth.com/wiki/API)** — Complete API reference
- **[API Auth](https://github.com/GabrielToth/gabrieltoth.com/wiki/API-Auth)** — Authentication endpoints
- **[Architecture](https://github.com/GabrielToth/gabrieltoth.com/wiki/Architecture)** — System architecture
- **[Deployment](https://github.com/GabrielToth/gabrieltoth.com/wiki/Deployment)** — Vercel/Cloudflare/Supabase setup
- **[Developer Guide](https://github.com/GabrielToth/gabrieltoth.com/wiki/Developer-Guide)** — Implementation details
- **[Testing Guide](https://github.com/GabrielToth/gabrieltoth.com/wiki/Testing-Guide)** — Test strategy

---

## 🔑 Environment Variables

### Quick Setup

1. Copy the example file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your values

3. See detailed instructions in:
   - `.env.local.example` - Local development (with setup tutorials)
   - `.env.production.example` - Production
   - `.env.docker.example` - Docker setup

### Environment Variables by Feature

#### General Settings

- `DEBUG` - Single debug flag (server logs + client UI via Next.js config)
- `NEXT_PUBLIC_APP_URL` - Public site URL; API is always `{APP_URL}/api`

#### Database

- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `REDIS_URL` - Redis connection (optional, for caching)

#### Authentication & Registration

- `JWT_SECRET` - Secret key for signing JWT tokens during OAuth registration
- `ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM` - Argon2id tuning (see `.env.local.example`)
- `SESSION_TIMEOUT` - Registration session timeout in milliseconds (default: 1800000 = 30 minutes)
- `VERIFICATION_TOKEN_EXPIRY` - Email verification link expiry in milliseconds (default: 86400000 = 24 hours)

#### Email (Resend)

- `RESEND_API_KEY` - Resend API key for transactional email
- `SMTP_FROM_EMAIL` - Sender email address
- `SMTP_FROM_NAME` - Sender display name

#### OAuth Providers

- `GOOGLE_CLIENT_ID` - Google OAuth client ID (server-side)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (client-side)
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - Google OAuth redirect URI

#### Third-Party Services

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` - Amazon Associates tag
- `MONERO_ADDRESS` - Monero wallet address
- `MONERO_VIEW_KEY` - Monero view key

### Cloud vs Local Configuration

The application supports both cloud and local deployment:

**Local Development** (npm run dev):

- Uses `.env.local` for configuration
- Connects to local PostgreSQL database
- Uses local API endpoints (<http://localhost:3000/api>)
- Supports simplified authentication for testing

**Cloud Deployment** (Vercel, AWS, etc.):

- Uses `.env.production` for configuration
- Connects to remote database
- Uses production API endpoints (<https://api.production.com>)
- Enforces HTTPS and security headers
- Uses production OAuth credentials

### Important Security Notes

⚠️ **Never commit `.env.local` to git** - it's in `.gitignore` for a reason!

- Use lower `ARGON2_*` values in `.env.test` for fast Vitest runs
- Use different `JWT_SECRET` for development and production
- Use test OAuth credentials for development, production credentials for deployment
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose to client
- Use app-specific passwords for SMTP (not your main password)
- Rotate `SMTP_PASSWORD` regularly
- Use strong, unique passwords for all services

---

## 🔑 Social Network Setup Tutorials

Each network requires its own developer app and credentials. Follow the tutorial for the networks you want to use.

---

### LinkedIn

**Status**: ✅ Works locally and in production (free)

1. **Go to** [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. **Create an app**: Click "Create app" → Name it → Select your LinkedIn page → Upload logo
3. **Get credentials**: Go to "Auth" tab → Copy `Client ID` and `Client Secret`
4. **Set redirect URI**: Add `http://localhost:3000/api/oauth/callback/linkedin`
5. **Configure in `.env.local`**:
   ```env
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/oauth/callback/linkedin
   ```

---

### YouTube

**Status**: ✅ Works locally and in production (free)

YouTube uses the **same Google Cloud OAuth credentials** as Google Sign-In — you just need to enable the YouTube Data API.

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project** (or create one)
3. **Enable YouTube Data API v3**: APIs & Services → Library → Search "YouTube Data API v3" → Enable
4. **Edit your OAuth 2.0 Client**: APIs & Services → Credentials → Click your Web client → Add redirect URIs:
   - `http://localhost:3000/api/oauth/callback/youtube`
5. **Configure in `.env.local`** (same values as Google OAuth):
   ```env
   YOUTUBE_CLIENT_ID=your-google-client-id
   YOUTUBE_CLIENT_SECRET=your-google-client-secret
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/oauth/callback/youtube
   ```

---

### TikTok

**Status**: ✅ Works locally and in production (free)

1. **Go to** [TikTok Developers](https://developers.tiktok.com/)
2. **Create an app**: Click "Create App" → Fill in details → Submit for review (automatic for basic scopes)
3. **Get credentials**: Go to "App Settings" → Copy `Client Key` and `Client Secret`
4. **Set redirect URI**: Add `http://localhost:3000/api/oauth/callback/tiktok`
5. **Configure in `.env.local`**:
   ```env
   TIKTOK_CLIENT_KEY=your-client-key
   TIKTOK_CLIENT_SECRET=your-client-secret
   TIKTOK_REDIRECT_URI=http://localhost:3000/api/oauth/callback/tiktok
   ```

---

### Twitter/X

**Status**: ✅ Local only — requires **Pay Per Use** credits (~$0.03/post)

> ⚠️ **Important**: X API v2 requires the app to be enrolled in a **Pay Per Use** project. The legacy free tier for posting was discontinued in February 2026. Each post costs credits (~$0.015/credit, ~2 credits per post).

#### Step 1: Create a Developer Account

1. **Go to** [console.x.com](https://console.x.com)
2. **Sign up** for a developer account (you need an X/Twitter account)
3. **Accept** the Developer Agreement
4. **Select** the **Pay Per Use** plan (this requires adding a payment method)

#### Step 2: Get the Organization ID

1. In the console, your URL will be: `https://console.x.com/accounts/{orgId}/...`
2. Copy the `{orgId}` number from the URL

#### Step 3: Create an App via API

Since the console UI creates standalone apps (not attached to projects), use the API:

```bash
# Get your auth cookie from the browser console:
# 1. Open chrome dev tools on console.x.com
# 2. Type: document.cookie
# 3. Copy the auth cookie

# Create the app with project enrollment:
curl -X POST "https://console.x.com/api/client-applications" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "appName": "my-app-name",
    "projectId": "your-pay-per-use-project-id",
    "enrollmentId": "your-pay-per-use-enrollment-id",
    "stage": "development"
  }'
```

> To find your `projectId` and `enrollmentId`, call:
> ```bash
> curl "https://console.x.com/api/accounts/{orgId}/projects"
> curl "https://console.x.com/api/accounts/{orgId}/structured-enrollments"
> ```

#### Step 4: Assign App to Project

```bash
curl -X POST "https://console.x.com/api/accounts/{orgId}/projects/{projectId}/client-applications/{appId}/connected" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"environment": "development"}'
```

#### Step 5: Get OAuth 1.0a Keys

1. Go to your app page in the console
2. Under "Keys and Tokens", generate:
   - **API Key** → `TWITTER_CLIENT_ID`
   - **API Key Secret** → `TWITTER_CLIENT_SECRET`
   - **Access Token** → `TWITTER_ACCESS_TOKEN` (optional — users get their own via OAuth)

#### Step 6: Configure in `.env.local`

```env
TWITTER_CLIENT_ID=your-consumer-key
TWITTER_CLIENT_SECRET=your-consumer-secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/oauth/callback/twitter
```

#### Step 7: Purchase Credits

1. Go to [console.x.com billing](https://console.x.com/accounts/{orgId}/billing/credits)
2. Purchase credits (minimum purchase applies)
3. Each text-only post costs ~$0.015 (1 credit)
4. Posts with links cost ~$0.20 (13 credits)

---

### Facebook

**Status**: ✅ Local only — requires **CNPJ** for production

> ⚠️ Facebook publishing requires Meta's **Advanced Access** for `pages_manage_posts` permission. This requires a **CNPJ** (Brazilian business ID) or equivalent business verification.

#### Local Development Setup (Bypass)

For local testing, use a long-lived Page Access Token:

1. **Go to** [developers.facebook.com](https://developers.facebook.com/)
2. **Create or select** a Facebook App
3. **Get credentials**: App Settings → Basic → Copy `App ID` and `App Secret`
4. **Get a Page Access Token** via [Graph API Explorer](https://developers.facebook.com/tools/explorer/):
   - Select your app
   - Request `pages_manage_posts` + `pages_read_engagement`
   - Click "Get Token" → Authorize
   - Call `GET /me/accounts` to get your Page ID and Page Access Token
5. **Configure in `.env.local`**:
   ```env
   FACEBOOK_APP_ID=your-app-id
   FACEBOOK_APP_SECRET=your-app-secret
   FACEBOOK_REDIRECT_URI=http://localhost:3000/api/oauth/callback/facebook
   FACEBOOK_PAGE_ID=your-page-id
   FACEBOOK_PAGE_ACCESS_TOKEN=your-long-lived-token
   ```

---

### Instagram

**Status**: ✅ Local only — requires **CNPJ** for production

> ⚠️ Instagram publishing requires the same Meta Advanced Access as Facebook, which needs a **CNPJ**. For local testing, use the long-lived access token bypass.

#### Local Development Setup (Bypass)

1. **Prerequisites**: A Facebook Page connected to an Instagram Business/Creator account
2. **Get your Instagram Business Account ID**:
   - In Graph API Explorer, call: `GET /{fb-page-id}?fields=instagram_business_account`
   - Copy the returned `instagram_business_account` ID
3. **Configure in `.env.local`** (uses the same Meta app as Facebook):
   ```env
   INSTAGRAM_APP_ID=your-facebook-app-id
   INSTAGRAM_APP_SECRET=your-facebook-app-secret
   INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/oauth/callback/instagram
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your-ig-business-id
   INSTAGRAM_PAGE_ACCESS_TOKEN=your-long-lived-fb-token
   ```

---

## 🧪 Testing

- **Unit/Component**: Vitest with coverage tracking
- **E2E**: Playwright for end-to-end testing
- **Coverage**: HTML and LCOV reports in `coverage/`

Run tests before committing:

```bash
npm run test
npm run test:coverage
```

---

## 🔒 Security

- HTTPS enforced in production
- HTTP-Only cookies for sessions
- CSRF protection on all state-changing requests
- Rate limiting on authentication endpoints
- Input sanitization and validation
- SQL injection prevention
- Comprehensive audit logging

---

## 📊 Performance

- Code splitting and dynamic imports
- Image optimization (WebP/AVIF)
- Compression enabled
- Lazy loading
- Web Vitals tracking
- Lighthouse CI with thresholds

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

For issues or questions:

- Open an issue on [GitHub](https://github.com/gabrieltoth/gabrieltoth.com/issues)
- Contact: [your-email@example.com](mailto:your-email@example.com)

---

**Made with ❤️ by Gabriel Toth**
