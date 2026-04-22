# Gabriel Toth Portfolio

Personal portfolio and platform by Gabriel Toth Gonçalves - Full Stack Developer

🌐 **Live**: [https://www.gabrieltoth.com](https://www.gabrieltoth.com)  
📦 **Repository**: [GitHub](https://github.com/gabrieltoth/gabrieltoth.com)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
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

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Postgres**: localhost:5432
- **Redis**: localhost:6379

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

## ⚡ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (Postgres)
- **Authentication**: Google OAuth + Custom Auth
- **Payments**: Stripe, Monero
- **Deployment**: Vercel
- **i18n**: EN/PT-BR support

---

## 📚 Documentation

All documentation is in the `docs/` folder:

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Account Completion API endpoints
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Technical implementation details
- **[User Guide](docs/USER_GUIDE.md)** - User-facing documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment and rollback procedures
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[Database](docs/DATABASE_CONSTRAINTS.md)** - Database schema and constraints
- **[Credit System](docs/CREDIT_SYSTEM.md)** - Platform credit system

### Account Completion Flow

The Account Completion Flow enables legacy OAuth users to complete their account setup:

- **OAuth Integration**: Seamless integration with Google, Facebook, and TikTok
- **Multi-Step Form**: 3-step process (pre-filled data, new fields, verification)
- **Validation**: Comprehensive validation for password, phone, and birth date
- **Middleware**: Automatic redirection of incomplete accounts
- **Multilingual**: Support for EN, PT-BR, ES, and DE
- **Security**: Rate limiting, CSRF protection, input sanitization
- **Testing**: 88+ integration tests covering all scenarios

**Quick Links:**
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Implementation details
- [User Guide](docs/USER_GUIDE.md) - User instructions
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Deployment procedures

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
- `NODE_ENV` - Node environment (development/production)
- `DEBUG` - Server-side debug logging
- `NEXT_PUBLIC_DEBUG` - Client-side debug UI

#### Database
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `REDIS_URL` - Redis connection (optional, for caching)

#### Authentication & Registration
- `NEXT_PUBLIC_API_URL` - API endpoint URL (local: http://localhost:3000/api, production: https://api.production.com)
- `JWT_SECRET` - Secret key for signing JWT tokens during OAuth registration
- `BCRYPT_COST_FACTOR` - Password hashing cost (10-12, higher = more secure but slower)
- `SESSION_TIMEOUT` - Registration session timeout in milliseconds (default: 1800000 = 30 minutes)
- `VERIFICATION_TOKEN_EXPIRY` - Email verification link expiry in milliseconds (default: 86400000 = 24 hours)

#### Email Service (SMTP)
- `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (587 for TLS, 465 for SSL)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password or app-specific password
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
- Uses local API endpoints (http://localhost:3000/api)
- Supports simplified authentication for testing

**Cloud Deployment** (Vercel, AWS, etc.):
- Uses `.env.production` for configuration
- Connects to remote database
- Uses production API endpoints (https://api.production.com)
- Enforces HTTPS and security headers
- Uses production OAuth credentials

### Important Security Notes

⚠️ **Never commit `.env.local` to git** - it's in `.gitignore` for a reason!

- Keep `BCRYPT_COST_FACTOR` at 10 for development (faster), 12 for production (more secure)
- Use different `JWT_SECRET` for development and production
- Use test OAuth credentials for development, production credentials for deployment
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose to client
- Use app-specific passwords for SMTP (not your main password)
- Rotate `SMTP_PASSWORD` regularly
- Use strong, unique passwords for all services

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
