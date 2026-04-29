---
description: Production deployment workflow
---

# Deployment Workflow

## Prerequisites

1. All tests must pass (see `/testing`)
2. Code reviewed and approved
3. Branch updated with `main`

## Deployment Steps

### 1. Update Version

```bash
npm version patch  # or minor/major according to semver
```

### 2. Create Semantic Commit

Format: `<type>(<scope>): <description>`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

Example:

```bash
git add .
git commit -m "feat(credits): implement bandwidth usage deduction"
```

### 3. Push to Repository

```bash
git push origin main
```

### 4. Check Automatic Deployment

- Vercel will deploy automatically
- Monitor at: https://vercel.com/gabrieltoth

### 5. Validate in Production

- Access https://gabrieltoth.com
- Test implemented functionality
- Check error logs

---

## In Case of Failure

Follow: `.agent/EMERGENCY_ROLLBACK.md`
