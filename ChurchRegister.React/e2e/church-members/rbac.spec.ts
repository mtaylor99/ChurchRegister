/**
 * Church Members RBAC E2E Tests
 *
 * Verifies that a user without the ChurchMembers.View permission cannot access
 * the /app/members route. The admin account used by global-setup HAS this
 * permission, so these tests use a fresh browser context (no auth state) to
 * simulate an unauthenticated user, and verify that the route guard redirects
 * to /login.
 *
 * If a separate limited-permission test user is ever added to fixtures, these
 * tests can be extended to validate the "Access Denied" in-page component.
 */

import { test, expect } from '@playwright/test';

test.describe('Church Members – Route Guard (RBAC)', () => {
  test('unauthenticated user is redirected to /login when visiting /app/members', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto('/app/members');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test('authenticated admin can access /app/members', async ({ page }) => {
    // Uses global storageState – admin has ChurchMembers.View permission
    await page.goto('/app/members');
    await expect(page).toHaveURL(/\/app\/members/);
    await expect(
      page.getByRole('heading', { name: 'Church Members Management' })
    ).toBeVisible({ timeout: 15_000 });
  });
});
