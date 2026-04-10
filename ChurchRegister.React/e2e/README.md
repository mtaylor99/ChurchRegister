# Playwright E2E Tests

End-to-end tests for the Church Register React application powered by [Playwright](https://playwright.dev).

## Directory Structure

```
e2e/
├── .auth/                  # Saved auth state (git-ignored)
│   └── admin.json          # Created by global-setup.ts at runtime
├── auth/
│   ├── login.spec.ts       # Login form tests (unauthenticated)
│   ├── logout.spec.ts      # Logout flow tests
│   └── change-password.spec.ts  # Change Password drawer tests
├── dashboard/
│   └── dashboard.spec.ts   # Dashboard page tests
├── navigation/
│   └── sidebar.spec.ts     # Sidebar navigation tests
├── pages/                  # Page Object Models
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── helpers/
│   └── api-seed.ts         # API helpers for test data seeding
├── church-members/         # (Phase 3)
│   └── crud.spec.ts
├── contributions/          # (Phase 5)
│   └── create.spec.ts
├── fixtures.ts             # Shared fixtures and test users
└── global-setup.ts         # Runs once – logs in and saves auth state
```

## Prerequisites

| Service              | URL                       | How to start                        |
|----------------------|---------------------------|-------------------------------------|
| React dev server     | http://localhost:3000      | `npm run dev` (auto-started by Playwright) |
| .NET API             | http://localhost:5502      | Start `ChurchRegister.ApiService` manually or via Aspire |

> The Playwright `webServer` config will automatically start the React dev server.  
> **The API must already be running before you execute the tests.**

## Running Tests

```bash
# Run all E2E tests (headless, all browsers)
npm run test:e2e

# Interactive UI mode (great for debugging)
npm run test:e2e:ui

# Step-by-step debug mode
npm run test:e2e:debug

# Run a specific spec file
npx playwright test e2e/auth/login.spec.ts

# Run tests for a single browser
npx playwright test --project=chromium
```

## Authentication Strategy

`global-setup.ts` runs once before all suites. It:
1. Launches a Chromium browser
2. Logs in as the admin user
3. Saves the full browser storage state to `e2e/.auth/admin.json`

Every test project then injects that state via `storageState` in `playwright.config.ts`, so **tests start already authenticated** without hitting the login page again.

**Tests that need an unauthenticated context** (e.g. `login.spec.ts`) override it:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });
```

## Environment Variables

Create a `.env.test` file (never commit it) to override defaults:

```env
PLAYWRIGHT_BASE_URL=http://localhost:5173
PLAYWRIGHT_API_URL=http://localhost:5502
TEST_ADMIN_EMAIL=admin@churchregister.com
TEST_ADMIN_PASSWORD=AdminPassword123!
```

## CI Notes

When `CI=true`:
- `retries` is set to 2
- `workers` is limited to 1
- `reuseExistingServer` is disabled (Playwright always starts a fresh dev server)
- The GitHub reporter is enabled for inline annotations
