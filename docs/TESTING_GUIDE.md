# Testing Guide

## Overview

This guide outlines the testing strategy for the Dashboard Redesign project, including unit tests, integration tests, and E2E tests.

## Test Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   └── DashboardLayout.test.tsx
│   ├── publish/
│   │   ├── PublishContainer.tsx
│   │   └── PublishContainer.test.tsx
│   └── ...
├── __tests__/
│   ├── components/
│   ├── integration/
│   └── ...
└── ...

tests/
├── dashboard.spec.ts
├── publish.spec.ts
├── insights.spec.ts
└── settings.spec.ts
```

## Unit Tests

### Purpose
Test individual components and functions in isolation.

### Tools
- Vitest
- React Testing Library
- Jest DOM

### Running Tests
```bash
npm run test:unit                   # Run all unit tests
npm run test:unit -- --watch        # Watch mode
npm run test:coverage               # Generate coverage report
```

### Example Unit Test
```typescript
import { render, screen } from '@testing-library/react'
import { DashboardLayout } from './DashboardLayout'

describe('DashboardLayout', () => {
  it('should render sidebar and main content', () => {
    render(
      <DashboardLayout activeTab="publish">
        <div>Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should have proper semantic HTML structure', () => {
    const { container } = render(
      <DashboardLayout activeTab="publish">
        <div>Test Content</div>
      </DashboardLayout>
    )

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })
})
```

### Best Practices
- Test behavior, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock external dependencies
- Keep tests focused and isolated

## Integration Tests

### Purpose
Test how multiple components work together.

### Tools
- Vitest
- React Testing Library
- MSW (Mock Service Worker)

### Running Tests
```bash
npm run test:unit -- src/__tests__/integration/
```

### Example Integration Test
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsContainer } from './SettingsContainer'

describe('Settings Integration', () => {
  it('should update user profile', async () => {
    const user = userEvent.setup()
    render(<SettingsContainer />)

    // Fill form
    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
    })
  })
})
```

### Best Practices
- Test complete user workflows
- Mock API responses
- Test error scenarios
- Verify data flow between components
- Test form submissions

## E2E Tests

### Purpose
Test complete user journeys from start to finish.

### Tools
- Playwright
- Chromium, Firefox, WebKit

### Running Tests
```bash
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:headed             # Run with browser UI
npm run test:e2e:report             # View HTML report
```

### Example E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('should complete publish workflow', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard')

  // Click Publish tab
  await page.click('[role="tab"]:has-text("Publish")')

  // Create new post
  await page.click('button:has-text("New Post")')
  await page.fill('[name="title"]', 'My First Post')
  await page.fill('[name="content"]', 'This is my first post')

  // Select channels
  await page.click('[name="facebook"]')
  await page.click('[name="instagram"]')

  // Schedule post
  await page.fill('[name="scheduledAt"]', '2024-12-31')

  // Submit
  await page.click('button:has-text("Schedule")')

  // Verify success
  await expect(page).toHaveText('Post scheduled successfully')
})
```

### Best Practices
- Test complete user journeys
- Use realistic data
- Test error scenarios
- Verify UI updates
- Test across browsers

## Accessibility Tests

### Purpose
Ensure WCAG 2.1 AA compliance.

### Tools
- axe-core
- React Testing Library
- Playwright

### Running Tests
```bash
npm run test:unit -- src/__tests__/components/dashboard-accessibility.test.tsx
```

### Example Accessibility Test
```typescript
import { render } from '@testing-library/react'
import { DashboardLayout } from './DashboardLayout'

describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    const { container } = render(
      <DashboardLayout activeTab="publish">
        <div>Test Content</div>
      </DashboardLayout>
    )

    const hamburgerButton = container.querySelector(
      'button[aria-label="Toggle sidebar"]'
    )
    expect(hamburgerButton).toBeInTheDocument()
  })

  it('should have visible focus indicators', () => {
    const { container } = render(
      <DashboardLayout activeTab="publish">
        <div>Test Content</div>
      </DashboardLayout>
    )

    const button = container.querySelector('button')
    expect(button).toHaveClass('focus:ring-2')
  })
})
```

## Performance Tests

### Purpose
Ensure performance targets are met.

### Tools
- Lighthouse
- Web Vitals
- Performance Observer

### Running Tests
```bash
npm run lighthouse                  # Run Lighthouse audit
npm run perf:full                   # Full performance analysis
```

### Metrics
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTI: < 3.5s

## Test Coverage

### Current Coverage
```
Statements   : 85% ( 1234/1450 )
Branches     : 78% ( 456/585 )
Functions    : 82% ( 234/285 )
Lines        : 84% ( 1200/1428 )
```

### Coverage Goals
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Generate Coverage Report
```bash
npm run test:coverage
```

## Continuous Integration

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run test:coverage
```

## Debugging Tests

### Debug Unit Tests
```bash
npm run test:unit -- --inspect-brk
```

### Debug E2E Tests
```bash
npm run test:e2e -- --debug
```

### View Test Report
```bash
npm run test:e2e:report
```

## Common Issues

### Tests Timing Out
- Increase timeout: `test.setTimeout(10000)`
- Check for infinite loops
- Verify API mocks are working

### Tests Failing Intermittently
- Check for race conditions
- Use `waitFor` for async operations
- Verify test isolation

### Tests Failing in CI
- Check environment variables
- Verify dependencies are installed
- Check for timing issues

## Best Practices

### General
- Write tests as you write code
- Keep tests focused and isolated
- Use descriptive test names
- Mock external dependencies
- Test behavior, not implementation

### Unit Tests
- Test one thing per test
- Use semantic queries
- Mock child components
- Test edge cases
- Test error states

### Integration Tests
- Test complete workflows
- Mock API responses
- Test error scenarios
- Verify data flow
- Test form submissions

### E2E Tests
- Test user journeys
- Use realistic data
- Test across browsers
- Verify UI updates
- Test error scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated:** 2024
**Version:** 1.0.0
