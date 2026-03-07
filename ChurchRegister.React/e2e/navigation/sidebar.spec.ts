/**
 * Sidebar Navigation E2E Tests
 *
 * Verifies that the persistent sidebar renders all expected navigation
 * items and that clicking each one routes to the correct page.
 * Tests run with the global authenticated session.
 */

import { test, expect } from '@playwright/test';

/** Navigation items that all authenticated users can see (admin role). */
const NAV_ITEMS = [
  { label: 'Dashboard',        url: /\/app\/dashboard/ },
  { label: 'Reminders',        url: /\/app\/reminders/ },
  { label: 'Attendance',       url: /\/app\/attendance/ },
  { label: 'Members',          url: /\/app\/members/ },
  { label: 'Training',         url: /\/app\/training/ },
  { label: 'Risk Assessments', url: /\/app\/risk-assessments/ },
  { label: 'Contributions',    url: /\/app\/contributions/ },
  { label: 'Administration',   url: /\/app\/administration/ },
] as const;

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForURL(/\/app\/dashboard/);
  });

  // Generate a test for every navigation item
  for (const item of NAV_ITEMS) {
    test(`navigates to ${item.label}`, async ({ page }) => {
      await page.getByRole('button', { name: item.label, exact: true }).click();
      await expect(page).toHaveURL(item.url, { timeout: 10_000 });
    });
  }

  test('shows "Logged in as" label in the sidebar footer', async ({ page }) => {
    await expect(page.getByText('Logged in as')).toBeVisible();
  });

  test('shows the app name "Church Register" in the drawer header', async ({
    page,
  }) => {
    await expect(page.getByText('Church Register').first()).toBeVisible();
  });

  test('account menu button is visible in the AppBar', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'account menu' })
    ).toBeVisible();
  });
});
