# Best Practices - Kiro Agent

## 📋 General Instructions

### 1. Documentation
- **DO NOT** generate `.md` summary files after completing tasks
- **DO NOT** create change reports, summaries, or lists in `.md` format unless explicitly requested
- **ONLY** create `.md` files when the user explicitly asks for documentation
- **EXCEPTION**: Create `.md` files for new module documentation (e.g., API docs, feature guides)
- Summarize changes directly in the response using plain text

### 2. Git Commits and PRs
- Always use descriptive commit messages in English
- Prefer atomic commits (one change per commit)
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- **MANDATORY**: Include issue number: `fix(#123): description`
- **NEVER** use version as commit message (❌ `1.8.22`, ❌ `1.8.23`)
- Do not push automatically - always confirm before pushing
- Versioning is separate: use `npm version patch|minor|major` after commits

### 3. Code
- Maintain consistency with project style
- Follow existing naming conventions
- Do not add dependencies without confirming
- Always test before committing

### 4. Responses
- Be concise and direct
- Use lists and tables to organize information
- Show only what's essential
- If details are needed, the user will ask

### 5. Disposable Files
- Do not commit to git: change reports, summaries, task lists
- These files should be created ONLY if the user explicitly requests them
- Example: "create a report.md" or "document the changes"

## 🎯 Workflow

1. **Open GitHub Issue** (ALWAYS FIRST)
2. **Understand** the task
3. **Implement** the changes
4. **Test** if possible
5. **Summarize** in response (no .md)
6. **Make commit** with clear message referencing the issue
7. **Confirm** before push

---

## 🔴 CRITICAL RULE: GitHub Issues BEFORE Implementation

**MANDATORY**: Open a GitHub issue BEFORE suggesting or implementing any solution.

### Why?
- Documents the problem in detail
- Creates traceability
- Allows discussion before implementation
- Facilitates code review
- Maintains decision history

### When to Apply?
- ✅ Every time you identify a problem
- ✅ Every time you receive a task
- ✅ Every time you need to make code changes
- ✅ Even for small fixes

### When NOT to Apply?
- ❌ Only if the user explicitly says "no issue needed"
- ❌ Only if the issue already exists (reuse it)

### Mandatory Process

**STEP 1: Open Issue**
```
Title: [Type] Clear description of the problem
Description: Detail context, problem, impact, requirements
Labels: feature, bug, enhancement, etc.
```

**STEP 2: Wait for Confirmation**
- Wait for user to confirm the issue
- Or proceed if user authorizes

**STEP 3: Implement with Reference**
- Use issue number in all commits
- Format: `fix(#123): description`
- Close issue automatically: `Closes #123`

### Correct Example

```
❌ WRONG:
- User: "I need to fix the header"
- Kiro: [Implements directly]

✅ CORRECT:
- User: "I need to fix the header"
- Kiro: "I'll open a GitHub issue describing the problem"
- Kiro: [Opens issue #42 with details]
- Kiro: [Waits for confirmation or proceeds]
- Kiro: [Implements with commits referencing #42]
```

### Issue Template

```markdown
## Description
[Explain what needs to be done]

## Context
- Why is this important?
- What problem does it solve?
- Expected impact?

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Acceptance Criteria
- [ ] Feature X implemented
- [ ] Tests written
- [ ] Build passes
- [ ] Compatible with cloud and local

## Technical Notes
- Files affected
- Dependencies needed
- Possible impacts
```

## ✅ Checklist Before Responding

- [ ] Task completed?
- [ ] Build tested locally with `npm run build`?
- [ ] Code tested?
- [ ] Commit made?
- [ ] Do I need to generate .md? (Only if explicitly requested)
- [ ] Summary is clear and concise?

## 🔨 Mandatory Local Build

**ALWAYS** execute `npm run build` locally before commit/push:
- If it fails, fix the errors
- Try again until it passes
- Do not push code that doesn't compile
- This prevents breaking production deployment

## 📝 Correct Response Example

```
✅ Implemented successfully

Changes:
- File A: added function X
- File B: updated import Y
- File C: removed code Z

Commit: abc1234 - feat: implement feature X
Status: Ready for push
```

## ❌ Incorrect Response Example

```
[Generates CHANGES.md]
[Generates REPORT.md]
[Generates SUMMARY.md]
```

---

## 🚀 Implementation Finalization Workflow

**MANDATORY** to follow this cycle after completing any feature/spec implementation:

### 1️⃣ General Tests (Test ENTIRE site)
```bash
npm run test                        # Run all tests
npm run test:coverage               # Generate coverage report
```
- Verify all tests pass
- Review test coverage
- Fix any failing tests before proceeding

### 2️⃣ Performance/Speed Tests
```bash
npm run lighthouse                  # Run Lighthouse audit
npm run perf:full                   # Complete performance analysis
npm run analyze                     # Analyze bundle size
```
- Check Core Web Vitals (LCP, FID, CLS)
- Analyze bundle size
- Document performance metrics

### 3️⃣ Decision: Performance Acceptable?

**YES - Performance OK:**
- Proceed to step 4 (Code Formatting)

**NO - Performance Poor:**
- Make commit: `fix: performance improvements`
- Create separate commit for optimizations
- Execute optimizations (code splitting, lazy loading, etc.)
- Return to step 2 (Performance Tests)
- Repeat until targets are met

### 4️⃣ Code Formatting and Standardization
```bash
npm run format                      # Format code with Prettier
npm run lint:fix                    # Fix ESLint issues
npm run type-check                  # Verify TypeScript types
```
- Code will be formatted automatically
- Linting errors will be fixed
- TypeScript types will be validated

### 5️⃣ Spelling and Dictionary Verification
```bash
npm run spell-check                 # Check spelling
```
- If unknown words found:
  - Add to project dictionary (`.cspell.json` or similar)
  - Or fix the spelling if it's a real error
  - Run again until it passes

### 6️⃣ Storybook Documentation
```bash
npm run storybook                   # Start Storybook
```
- Create/update stories for new components
- Document props and behaviors
- Add usage examples
- Verify stories render correctly

### 7️⃣ Final Build
```bash
npm run build                       # Build for production
```
- Verify build completes without errors
- Review warnings (if any)
- Confirm bundle size is acceptable

### 8️⃣ Final Tests (Complete Cycle)
```bash
npm run test                        # All tests again
npm run test:e2e                    # E2E tests (if applicable)
npm run lighthouse                  # Final performance
```
- Ensure everything still works after formatting
- Verify final performance
- Confirm no regressions were introduced

### 9️⃣ Commit and Push
```bash
git add .                           # Add all changes
git commit -m "feat: complete feature X"  # Descriptive message
git push -u origin feature-branch   # Push to repository
```

### Recommended Commit Messages

**IMPORTANT**: Each commit must include the issue number and describe the specific change.

**Initial implementation:**
```
feat(#123): implement dashboard redesign components
```

**Performance improvements:**
```
perf(#123): optimize bundle size and lazy load components
```

**Formatting and linting:**
```
style(#123): format code and fix linting issues
```

**Documentation:**
```
docs(#123): add Storybook stories for dashboard components
```

**Tests:**
```
test(#123): add comprehensive test coverage for components
```

**Bug fix:**
```
fix(#123): remove header from registration flow
```

**Refactoring:**
```
refactor(#123): extract validation logic to utilities
```

**NEVER commit like this:**
```
❌ 1.8.22 - Version as name
❌ 1.8.23 - Version as name
❌ fix: remove header - Missing issue number
❌ Update code - Missing commit type
❌ WIP - Too vague
```

### ❌ INCORRECT Examples

```
❌ 1.8.22 - NEVER use version as commit name
❌ 1.8.23 - NEVER use version as commit name
❌ fix: remove header - Missing issue number
❌ Update code - Missing commit type
❌ WIP - Too vague
```

### ✅ MANDATORY Commit Format

**ALWAYS** use this format:
```
<type>(#<issue-number>): <description>
```

**Correct examples:**
```
fix(#42): remove header from registration flow
feat(#123): add WhatsApp integration
perf(#156): optimize bundle size
docs(#89): add Storybook stories
test(#201): add comprehensive test coverage
style(#45): format code and fix linting issues
refactor(#78): extract validation logic to utilities
```

**CRITICAL RULE**: Commit name MUST NEVER be just the version (1.8.22, 1.8.23, etc.). Version is incremented SEPARATELY after commit using `npm version patch|minor|major`.

---

## 📋 Complete Finalization Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Test coverage acceptable (> 80%)
- [ ] Performance within targets (LCP < 2.5s, etc.)
- [ ] Code formatted (`npm run format`)
- [ ] Linting fixed (`npm run lint:fix`)
- [ ] TypeScript types validated (`npm run type-check`)
- [ ] Spelling verified (`npm run spell-check`)
- [ ] Storybook stories created/updated
- [ ] Build completes without errors (`npm run build`)
- [ ] Final tests pass
- [ ] Commit made with descriptive message
- [ ] Push completed to repository

---

## 🔄 GitHub Workflow: Issues → PRs → Commits

**MANDATORY** for all implementations:

### 1️⃣ Create GitHub Issue

**Title:** Descriptive and concise
```
[Feature] Add WhatsApp Integration
[Bug] Fix dashboard performance on mobile
[Enhancement] Improve accessibility compliance
```

**Detailed Description:**
```markdown
## Description
Explain what needs to be done and why.

## Context
- Why is this important?
- What problem does it solve?
- Expected impact?

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Acceptance Criteria
- [ ] Feature X implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Performance within targets
- [ ] Compatible with cloud and local versions

## Technical Notes
- Files to be modified
- Dependencies needed
- Possible impacts

## References
- Links to documentation
- Related issues
- Related PRs
```

**Labels:** `feature`, `bug`, `enhancement`, `documentation`, `performance`, `accessibility`

**Assignee:** Assign to yourself

**Milestone:** Select corresponding milestone

### 2️⃣ Create Branch and PR

```bash
# Create branch from issue
git checkout -b feature/issue-123-whatsapp-integration

# Push initial branch (no commits yet)
git push -u origin feature/issue-123-whatsapp-integration
```

**Create PR on GitHub:**
- Title: `[PR #123] Add WhatsApp Integration`
- Description: Reference the issue: `Closes #123`
- Linked Issues: Select the created issue
- Reviewers: Assign reviewers if needed

### 3️⃣ Execute Implementation Workflow

Follow the finalization workflow (previous section) making commits:

```bash
# Commit 1: Initial implementation
git commit -m "feat(#123): implement WhatsApp integration core"

# Commit 2: Tests
git commit -m "test(#123): add comprehensive tests for WhatsApp integration"

# Commit 3: Performance
git commit -m "perf(#123): optimize WhatsApp integration performance"

# Commit 4: Documentation
git commit -m "docs(#123): add Storybook stories and API documentation"

# Commit 5: Formatting
git commit -m "style(#123): format code and fix linting issues"
```

**Mandatory Commit Format:**
```
<type>(#<issue-number>): <description>

<body>

Closes #<issue-number>
```

Example:
```
feat(#123): add WhatsApp integration

- Implement WhatsApp API connection
- Add message sending functionality
- Create WhatsApp channel management UI

Closes #123
```

### 4️⃣ Push and Merge

```bash
# Push all commits
git push origin feature/issue-123-whatsapp-integration

# Wait for reviewer approval
# Merge via GitHub UI (Squash or Create a merge commit)
```

**Checklist before Merge:**
- [ ] All tests pass
- [ ] CI/CD pipeline passed
- [ ] Code review approved
- [ ] No conflicts with main
- [ ] Performance within targets
- [ ] Compatible with cloud and local versions

---

## 📌 Cloud vs Local Compatibility

**MANDATORY** for ALL implementations:

### Cloud Version
- Hosted on server (Vercel, AWS, etc.)
- Access via public URL
- Remote database
- OAuth/JWT authentication
- Production environment variables

### Local Version
- Run locally (`npm run dev`)
- Local database (SQLite, PostgreSQL local)
- Simplified authentication for testing
- Environment variables in `.env.local`

### Compatibility Checklist

- [ ] Code works in both versions
- [ ] Environment variables configured correctly
- [ ] Database works in both
- [ ] Authentication works in both
- [ ] External APIs have fallback for local
- [ ] Tests pass in both versions
- [ ] Performance acceptable in both

### Compatible Code Example

```typescript
// ✅ GOOD - Works in both versions
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export async function fetchData() {
  const response = await fetch(`${apiUrl}/data`)
  return response.json()
}
```

```typescript
// ❌ BAD - Only works in production
const apiUrl = 'https://api.production.com/api'

export async function fetchData() {
  const response = await fetch(`${apiUrl}/data`)
  return response.json()
}
```

---

## 📦 Semantic Versioning Rules

**MANDATORY** for all changes:

### Current Version: 1.10.7

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR (X.0.0)**: Breaking changes, large feature removals, major refactors
  - Example: Remove dashboard completely, change API structure
  - Increment when: Changes break compatibility

- **MINOR (0.X.0)**: New features, small removals (not entire categories/pages)
  - Example: Add new form field, new component
  - Increment when: Add functionality without breaking compatibility

- **PATCH (0.0.X)**: Bug fixes only, performance improvements, documentation
  - Example: Fix email validation, optimize performance
  - Increment when: Only fixes and improvements without new features

### ⚠️ IMPORTANT: Versioning is SEPARATE from Commit Messages

**NEVER** use version as commit name:
```bash
❌ WRONG - Commit with version as name:
git commit -m "1.8.22"
git commit -m "1.8.23"
git commit -m "1.8.26"

✅ CORRECT - Commit with issue number and description:
git commit -m "fix(#42): remove header from registration flow"
git commit -m "feat(#123): add new dashboard component"
git commit -m "perf(#156): optimize bundle size"
```

### Mandatory Rule: Increment Version AFTER Commits

**Correct workflow:**

```bash
# 1. Make code changes
# 2. Make commit with descriptive message and issue number
git commit -m "fix(#42): remove header from registration flow"

# 3. THEN increment version (separate)
npm version patch  # 1.8.25 → 1.8.26

# 4. Push with tags
git push origin feature-branch --tags
```

**Example with Versioning:**
```bash
# Make changes
git add .

# Commit with issue number (NEVER version)
git commit -m "feat(#123): add new dashboard component"

# Increment version (choose patch/minor/major)
npm version minor  # 1.8.26 → 1.9.0

# Push with tags
git push origin feature-branch --tags
```

### Versioning Checklist

- [ ] Commit made with descriptive message and issue number (NOT version)
- [ ] Identified type of change (bug fix, feature, breaking change)
- [ ] Executed `npm version patch|minor|major` AFTER commit
- [ ] Version in `package.json` incremented correctly
- [ ] Git tag created automatically
- [ ] Push completed with `--tags`

---

## 🐳 Docker Container Requirements

**CRITICAL**: Local tests and development REQUIRE Docker containers running.

### Required Containers

Before running tests or development, ensure these containers are running:

- **PostgreSQL Database**: Main database
- **Redis Cache**: Cache and session storage
- **SMTP Server** (MailHog or similar): Email testing
- **Backend Services**: Containerized backend services

### Start Containers

```bash
# Start all containers (docker-compose)
docker-compose up -d

# Check container status
docker-compose ps

# View container logs
docker-compose logs -f
```

### Pre-Test Verification

**MANDATORY** before running tests:

```bash
# Check if containers are running
docker-compose ps

# Check database connectivity
npm run db:check

# Check Redis connectivity
npm run redis:check
```

### Docker Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker-compose up -d` executed
- [ ] All containers have status "Up"
- [ ] Database is accessible
- [ ] Redis is accessible
- [ ] SMTP server is accessible

### Docker Troubleshooting

**Containers won't start:**
```bash
# Clean up old containers
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start again
docker-compose up -d
```

**Database won't connect:**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres
```

**Redis won't connect:**
```bash
# Check Redis logs
docker-compose logs redis

# Restart container
docker-compose restart redis
```

---

## 🗄️ Database Migration Workflow (Supabase)

**CRITICAL**: Correct workflow for database modifications.

### Philosophy: Schema Dump Instead of Accumulated Migrations

Instead of maintaining multiple incremental migrations, use a **single schema dump** that represents the complete database state.

### Mandatory Workflow

#### 1️⃣ Create Temporary Migration

```bash
# Create migration for your changes
npx supabase migration new add_my_feature

# Edit the created SQL file
# supabase/migrations/TIMESTAMP_add_my_feature.sql
```

#### 2️⃣ Apply Migration Locally

```bash
# Apply migration to local database
npx supabase db push
```

#### 3️⃣ Generate TypeScript Types (MANDATORY)

```bash
# Generate types from current schema
npx supabase gen types typescript --local > src/types/supabase.ts

# Verify file was created
cat src/types/supabase.ts
```

**Why this is CRITICAL?**
- ✅ Keeps TypeScript synchronized with database
- ✅ Prevents type errors in queries
- ✅ Improves IDE autocomplete
- ✅ Detects problems at compile time

#### 4️⃣ Test Changes

```bash
# Run all tests
npm run test

# Verify TypeScript types
npm run type-check

# Build to ensure it compiles
npm run build
```

#### 5️⃣ Create Complete Schema Dump (CRITICAL)

```bash
# Dump complete schema (replaces migrations)
npx supabase db dump --schema public --schema auth > supabase/schema.sql

# Verify file was created
cat supabase/schema.sql
```

**What this does?**
- Creates single SQL file with ENTIRE current schema
- Includes all tables, indexes, RLS policies, functions, triggers
- Represents complete database state
- **Replaces need for multiple migrations**

#### 6️⃣ Delete Old Migrations (MANDATORY)

```bash
# Delete ALL old migrations
rm supabase/migrations/*.sql

# OR move to backup if you want to keep history
mkdir -p supabase/migrations_backup
mv supabase/migrations/*.sql supabase/migrations_backup/
```

**Why delete?**
- ✅ Avoids confusion about actual database state
- ✅ `schema.sql` is single source of truth
- ✅ Old migrations may have conflicts or be outdated
- ✅ Simplifies setup for new developers

#### 7️⃣ Commit Changes

```bash
# Add schema dump and types
git add supabase/schema.sql
git add src/types/supabase.ts

# Remove old migrations from git
git rm supabase/migrations/*.sql

# Commit with descriptive message
git commit -m "feat(#123): add my_feature to database schema

- Added new tables: table_a, table_b
- Updated RLS policies for table_x
- Generated TypeScript types
- Replaced migrations with schema dump"

# Increment version
npm version minor  # or patch/major depending on change

# Push with tags
git push origin feature-branch --tags
```

#### 8️⃣ Apply to Production

```bash
# Option 1: Via Supabase CLI
npx supabase db push --project-ref your-project-ref

# Option 2: Via Supabase Dashboard
# Settings > Database > SQL Editor
# Copy and paste content of supabase/schema.sql
# Execute the SQL
```

### Database Migration Checklist

- [ ] Docker containers running (`docker-compose ps`)
- [ ] Temporary migration created and applied locally
- [ ] TypeScript types generated (`src/types/supabase.ts` exists)
- [ ] Tests pass (`npm run test`)
- [ ] Build passes (`npm run build`)
- [ ] Schema dump created (`supabase/schema.sql`)
- [ ] Old migrations deleted (`supabase/migrations/*.sql` removed)
- [ ] Commit made with schema.sql and types
- [ ] Version incremented
- [ ] Applied to production

### New Developer Setup

With schema dump workflow, new developers only need:

```bash
# 1. Clone repository
git clone repo-url

# 2. Install dependencies
npm install

# 3. Start Supabase local
npx supabase start

# 4. Apply complete schema (single file)
npx supabase db reset

# 5. Done! Database is in correct state
```

### Schema Dump Workflow Advantages

✅ **Simplicity**: One SQL file instead of dozens of migrations  
✅ **Clarity**: `schema.sql` shows exact current state  
✅ **Fewer Errors**: No risk of conflicting migrations  
✅ **Fast Setup**: New devs apply one file only  
✅ **Easy Maintenance**: No need to manage migration history  
✅ **Types Always Updated**: Workflow forces type generation  

### Complete Example

```bash
# 1. Create temporary migration
npx supabase migration new add_posts_table

# 2. Edit SQL
# supabase/migrations/20260428120000_add_posts_table.sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# 3. Apply locally
npx supabase db push

# 4. Generate types (MANDATORY)
npx supabase gen types typescript --local > src/types/supabase.ts

# 5. Test
npm run test
npm run build

# 6. Create schema dump
npx supabase db dump --schema public > supabase/schema.sql

# 7. Delete migrations
rm supabase/migrations/*.sql

# 8. Commit
git add supabase/schema.sql src/types/supabase.ts
git rm supabase/migrations/*.sql
git commit -m "feat(#123): add posts table to schema"
npm version minor

# 9. Push
git push origin feature-branch --tags
```

---

**Last updated:** April 28, 2026
