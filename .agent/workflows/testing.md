---
description: Testing workflow before any commit
---

# Testing Workflow

## Execution Order

### 1. Check if it Builds

```bash
// turbo
npm run build
```

If it fails, fix errors before proceeding.

### 2. Check TypeScript Types

```bash
// turbo
npm run type-check
```

### 3. Run Linter

```bash
// turbo
npm run lint
```

### 4. Run Existing Unit Tests

```bash
// turbo
npm run test
```

### 5. If You Created New Features, Create Unit Tests

- Tests should be in `src/__tests__/`
- Follow pattern: `[file-name].test.ts`
- Cover success and failure cases

### 6. Run E2E Tests (if you changed UI)

```bash
npm run test:e2e
```

---

## Approval Criteria

- ✅ Build passes without errors
- ✅ No TypeScript errors
- ✅ No critical ESLint warnings
- ✅ All tests pass
- ✅ Test coverage >= 80% for new files
