/**
 * Logout E2E Tests
 *
 * Verifies the logout flow starting from an authenticated session
 * (storageState set globally in playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    // Wait for the authenticated page to render
    await page.waitForURL(/\/app\/dashboard/);
  });

  test('can log out via the account menu', async ({ page }) => {
    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('shows the login page heading after logout', async ({ page }) => {
    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await page.waitForURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
  });

  test('redirects to login when a protected route is visited after logout', async ({
    page,
  }) => {
    // Log out
    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await page.waitForURL(/\/login/);

    // Attempt direct navigation to a protected route
    await page.goto('/app/members');
    await expect(page).toHaveURL(/\/login/);
  });
});
