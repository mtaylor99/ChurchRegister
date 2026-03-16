# ChurchRegister React Application

A modern, enterprise-grade React application for church membership, attendance, and financial management built with TypeScript, Material-UI, and React Query.

![Status: In Development](https://img.shields.io/badge/status-In%20Development-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1-purple)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Architecture](#architecture)

## 🎯 Overview

ChurchRegister is a comprehensive church management system that helps churches efficiently manage their members, track attendance, record contributions, and generate insightful reports. The React frontend provides an intuitive, responsive user interface with role-based access control.

### Key Capabilities

- **Member Management**: Complete CRUD operations for church members with detailed profiles
- **Attendance Tracking**: Record and analyze attendance for events and services
- **Financial Management**: Track contributions, envelope batches, and bank transactions
- **User Administration**: Manage users with role-based permissions
- **Dashboard Analytics**: Visual insights into church activities and trends
- **HSBC Integration**: Import and process bank statements

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with automatic token refresh
- 🎨 **Modern UI** - Material-UI components with responsive design
- 📊 **Data Grid** - Advanced grid with sorting, filtering, and pagination
- 🔄 **Real-time Updates** - React Query for intelligent data synchronization
- 🛡️ **Type Safety** - Full TypeScript coverage with strict mode
- 📱 **Mobile Friendly** - Responsive design for all screen sizes
- ♿ **Accessible** - WCAG 2.1 AA compliant with screen reader support

## 🛠️ Tech Stack

**Core:** React 19 • TypeScript 5.9 • Vite 7  
**UI:** Material-UI 7 • Emotion • Recharts  
**State:** React Query 5.90 • React Context  
**Routing:** React Router DOM 7  
**Forms:** React Hook Form • Yup validation  
**Testing:** Vitest • Playwright • Storybook

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- .NET 9.0 API (backend must be running)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.development
# Edit .env.development and set VITE_API_BASE_URL

# Start development server
npm run dev
```

Navigate to `http://localhost:3000`

### Environment Variables

| Variable            | Required | Default                 | Description     |
| ------------------- | -------- | ----------------------- | --------------- |
| `VITE_API_BASE_URL` | Yes      | `http://localhost:5502` | Backend API URL |

For complete environment variable documentation, see [Environment Variables](#-environment-variables-1) below.

## 💻 Development

### Available Scripts

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `npm run dev`           | Start development server  |
| `npm run build`         | Build for production      |
| `npm run preview`       | Preview production build  |
| `npm run lint`          | Check code quality        |
| `npm run format`        | Format code with Prettier |
| `npm run test`          | Run unit tests            |
| `npm run test:coverage` | Run tests with coverage   |
| `npm run storybook`     | Start Storybook           |

### Path Aliases

Clean imports using TypeScript path aliases:

```typescript
import { Button } from '@components/Button'; // src/components/
import { usePage } from '@hooks/usePage'; // src/hooks/
import { ApiClient } from '@services/api'; // src/services/
import { formatDate } from '@utils/formatDate'; // src/utils/
```

## 🔐 Environment Variables

The application uses environment variables for configuration. All variables are validated at startup using [Zod](https://zod.dev) for type safety and error prevention.

### Required Variables

| Variable                | Description                         | Example                        |
| ----------------------- | ----------------------------------- | ------------------------------ |
| `VITE_API_BASE_URL`     | Backend API base URL                | `http://localhost:5502`        |
| `VITE_AUTH_TOKEN_KEY`   | Local storage key for auth token    | `churchregister_auth_token`    |
| `VITE_AUTH_REFRESH_KEY` | Local storage key for refresh token | `churchregister_refresh_token` |

### Optional Variables

| Variable                | Description                          | Default       |
| ----------------------- | ------------------------------------ | ------------- |
| `VITE_API_TIMEOUT`      | API request timeout (milliseconds)   | `30000`       |
| `VITE_NODE_ENV`         | Environment mode                     | `development` |
| `VITE_ENABLE_DEVTOOLS`  | Enable React DevTools                | `false`       |
| `VITE_ENABLE_STORYBOOK` | Enable Storybook                     | `false`       |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking            | `false`       |
| `VITE_ENABLE_LOGGING`   | Enable console logging               | `true`        |
| `VITE_SENTRY_DSN`       | Sentry error tracking DSN (optional) | `""`          |
| `VITE_DEBUG_MODE`       | Enable debug mode                    | `false`       |

### Configuration Files

- **`.env.development`** - Local development configuration
- **`.env.production`** - Production build configuration
- **`.env.example`** - Template with all available variables

### Usage in Code

```typescript
// ✅ Correct: Use validated env object
import { env } from '@config/env';
const apiUrl = env.VITE_API_BASE_URL;

// ❌ Incorrect: Don't use import.meta.env directly
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

The validated `env` object provides:

- **Type safety**: TypeScript knows the exact type of each variable
- **Runtime validation**: Application fails fast with clear error messages if configuration is invalid
- **Default values**: Sensible defaults for optional variables
- **Helper functions**: `isDevelopment()`, `isProduction()`, `isTest()`

### Validation Errors

If required environment variables are missing or invalid, the application will fail to start with a clear error message:

```
❌ Environment variable validation failed:
VITE_API_BASE_URL: VITE_API_BASE_URL must be a valid URL
```

Check `src/config/env.ts` for the complete validation schema.

## 🧪 Testing

The application uses a comprehensive testing strategy with multiple layers:

### Unit & Component Tests (Vitest)

Unit tests use [Vitest](https://vitest.dev) with [Testing Library](https://testing-library.com) for component testing.

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Utilities

Custom test utilities in `src/test-utils/` simplify testing:

```typescript
import { render, screen, waitFor, createMockUser } from '@test-utils';

test('renders user profile', () => {
  const user = createMockUser({ firstName: 'John' });
  render(<UserProfile user={user} />);

  expect(screen.getByText('John')).toBeInTheDocument();
});
```

**Available utilities:**

- `render()` - Custom render with all providers (Query, Notification, Router)
- Mock data factories: `createMockUser()`, `createMockChurchMember()`, `createMockContribution()`, etc.
- MSW server for API mocking

### API Mocking (MSW)

[Mock Service Worker](https://mswjs.io) intercepts network requests in tests and development.

**In tests** - Handlers are automatically enabled via `setupTests.ts`:

```typescript
import { render, screen } from '@test-utils';
import { server } from '@test-utils';
import { http, HttpResponse } from 'msw';

test('fetches and displays users', async () => {
  // Override default handler for this test
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: 1, name: 'Test User' }]);
    })
  );

  render(<UsersList />);

  expect(await screen.findByText('Test User')).toBeInTheDocument();
});
```

**In development** - Enable MSW browser worker in `.env.development`:

```bash
VITE_ENABLE_MSW=true
```

Restart dev server to activate browser-side API mocking.

### E2E Tests (Playwright)

End-to-end tests use [Playwright](https://playwright.dev) to test complete user flows across browsers.

```bash
# Install browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth/login.spec.ts

# Debug tests
npx playwright test --debug
```

**Test structure:**

- `e2e/auth/` - Authentication flows (login, register, logout)
- `e2e/church-members/` - Member management CRUD operations
- `e2e/contributions/` - Contributions and financial features
- `e2e/fixtures.ts` - Shared test helpers and authentication fixtures

**Example E2E test:**

```typescript
import { test, expect } from '../fixtures';

test('user can login and view dashboard', async ({ authPage }) => {
  await authPage.login('test@example.com', 'AdminPassword123!');

  await expect(authPage.page).toHaveURL(/\/dashboard/);
  await expect(authPage.page.getByText('Welcome')).toBeVisible();
});
```

### Storybook

Interactive component development and documentation with [Storybook](https://storybook.js.org).

```bash
# Start Storybook
npm run storybook

# Build Storybook static site
npm run build-storybook
```

Navigate to `http://localhost:6006` to explore components in isolation.

### Test Coverage Goals

- **Unit tests**: 70%+ coverage for utilities, hooks, and business logic
- **Component tests**: Key user-facing components
- **E2E tests**: Critical user journeys (auth, CRUD operations)

View coverage report after running `npm run test:coverage` - opens in browser.

## 📦 Building for Production

```bash
npm run build
npm run preview  # Test production build
```

Build output in `dist/` includes:

- Code splitting for vendor libraries
- Tree shaking and minification
- Bundle analysis report (`dist/stats.html`)

## 🏗️ Architecture

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for detailed documentation on:

- Component architecture
- State management strategy
- Routing conventions
- Authentication flow
- Error handling patterns

---

**Built with ❤️ for churches by the ChurchRegister team**
