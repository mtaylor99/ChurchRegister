/**
 * Error Pages E2E Tests
 *
 * Covers all error routes defined in App.tsx:
 * - /error/404 renders the Not Found page (404, "Page Not Found")
 * - /error/500 renders the Server Error page (500, "Internal Server Error")
 * - /error/unauthorized renders the Unauthorized page (401/403, "Access Denied")
 * - An unknown route renders the 404 page (catch-all)
 *
 * Tests run with the global admin storageState (most pages are public).
 */

import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  // ── 404 Not Found ────────────────────────────────────────────────────────

  test.describe('404 Not Found', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/error/404');
    });

    test('renders the 404 error code', async ({ page }) => {
      await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 });
    });

    test('renders the Page Not Found title', async ({ page }) => {
      await expect(
        page.getByText('Page Not Found')
      ).toBeVisible({ timeout: 10_000 });
    });

    test('Go Home button navigates to the dashboard', async ({ page }) => {
      await page.getByRole('button', { name: /go home|home/i }).click();
      await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15_000 });
    });
  });

  // ── 500 Server Error ─────────────────────────────────────────────────────

  test.describe('500 Internal Server Error', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/error/500');
    });

    test('renders the 500 error code', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '500', exact: true })).toBeVisible({ timeout: 10_000 });
    });

    test('renders the Internal Server Error title', async ({ page }) => {
      await expect(
        page.getByText('Internal Server Error')
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── Unauthorized ──────────────────────────────────────────────────────────

  test.describe('Unauthorized', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/error/unauthorized');
    });

    test('renders an authorization error code (401 or 403)', async ({
      page,
    }) => {
      // The error code is 401 when requiresLogin, 403 otherwise
      const code401 = page.getByText('401');
      const code403 = page.getByText('403');
      await expect(code401.or(code403).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test('renders an authorization-related title', async ({ page }) => {
      await expect(
        page.getByText(/Access Denied|Unauthorized|Login Required/i)
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── Unknown route / catch-all ────────────────────────────────────────────

  test('navigating to an unknown route renders the 404 page', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Page Not Found')).toBeVisible({
      timeout: 10_000,
    });
  });
});
