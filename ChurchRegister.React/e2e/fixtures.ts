/**
 * Shared Playwright Fixtures
 *
 * Custom fixtures for Playwright tests to reduce boilerplate
 * and provide consistent test setup.
 *
 * @see https://playwright.dev/docs/test-fixtures
 */

import { test as base, Page } from '@playwright/test';

/**
 * Test user credentials
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@churchregister.com',
    password: 'AdminPassword123!',
  },
  user: {
    email: 'admin@churchregister.com',
    password: 'AdminPassword123!',
  },
} as const;

/**
 * Custom page fixture with authentication helpers
 */
export interface AuthPage {
  page: Page;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<{ authPage: AuthPage }>({
  authPage: async ({ page }, use) => {
    const authPage: AuthPage = {
      page,

      /**
       * Login helper
       * Navigates to login page and performs login
       */
      login: async (
        email = TEST_USERS.user.email,
        password = TEST_USERS.user.password
      ) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for navigation to complete
        await page.waitForURL(/^\/(dashboard|home)/);
      },

      /**
       * Logout helper
       * Navigates to logout or clears authentication
       */
      logout: async () => {
        // Click user menu
        await page.click('[data-testid="user-menu"]');
        // Click logout button
        await page.click('[data-testid="logout-button"]');

        // Wait for redirect to login
        await page.waitForURL(/\/login/);
      },
    };

    await use(authPage);
  },
});

export { expect } from '@playwright/test';
