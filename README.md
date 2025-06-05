# Gabriel Toth Portfolio

Personal portfolio of Gabriel Toth Gonçalves - Full Stack Developer

## 🚀 Demo

- **Production**: [https://gabrieltoth.com](https://gabrieltoth.com)
- **Repository**: [GitHub](https://github.com/gabrieltoth)

## ⚡ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel
- **Internationalization**: EN/PT-BR support

## 🛠️ Development Tools

- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Spell Check**: CSpell (EN + PT-BR)
- **Git Hooks**: Husky + lint-staged
- **Type Checking**: TypeScript strict mode

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/gabrieltoth/gabrieltoth.com.git

# Navigate to directory
cd gabrieltoth.com

# Install dependencies
npm install

# Run in development
npm run dev
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server (Turbopack)

# Build and Deploy
npm run build            # Generate production build
npm run start            # Start production server

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Auto fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
npm run type-check       # Check TypeScript types
npm run spell-check      # Check spelling
npm run test:all         # Run all quality tests

# Utilities
npm run clean            # Clean build files
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Header, Footer, etc.
│   └── sections/       # Page sections
└── lib/                # Utilities and configurations
    └── utils.ts        # Utility functions (cn, etc.)
```

## 🎨 Style Configuration

- **Indentation**: 4 spaces
- **Quotes**: Single for strings, double for JSX
- **Semicolon**: Always required
- **Trailing comma**: In multi-line objects/arrays
- **Line length**: Maximum 120 characters

## 🔍 Features

- ✅ Responsive design (mobile-first)
- ✅ Dark/light mode
- ✅ SEO optimization
- ✅ Optimized performance
- ✅ Accessibility (a11y)
- ✅ PWA ready
- ✅ Core Web Vitals optimized

## 🌐 Internationalization

The project supports multiple languages:

- **English** (en) - Default
- **Portuguese Brazilian** (pt-BR)

## 🌍 Language Policy

- **Code**: All variables, functions, classes, and comments in English
- **Documentation**: README, code comments, JSDoc in English
- **Git**: Commit messages, branch names, PR descriptions in English
- **Portuguese**: Only for user-facing content translations

## 📝 Contribution

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Commit Convention

```
type: short description

- Detailed description when needed
- Use conventional commit types: feat, fix, docs, style, refactor, test, chore
- ALL commit messages in English
```

## 📄 License

This project is under the MIT license. See the [LICENSE](LICENSE) file for more details.

## 👤 Author

**Gabriel Toth Gonçalves**

- Website: [gabrieltoth.com](https://gabrieltoth.com)
- GitHub: [@gabrieltoth](https://github.com/gabrieltoth)
- LinkedIn: [Gabriel Toth](https://linkedin.com/in/gabriel-toth)

---

Made with ❤️ by Gabriel Toth
