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

- **[API Documentation](docs/API.md)** - All API endpoints organized by category
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[Database](docs/DATABASE_CONSTRAINTS.md)** - Database schema and constraints
- **[Deployment](docs/DEPLOYMENT_ARCHITECTURE.md)** - Deployment guide
- **[Credit System](docs/CREDIT_SYSTEM.md)** - Platform credit system

---

## 🔑 Environment Variables

See detailed instructions in:
- `.env.local.example` - Local development
- `.env.production.example` - Production
- `.env.docker.example` - Docker setup

Each file contains step-by-step tutorials on how to obtain every required variable.

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
