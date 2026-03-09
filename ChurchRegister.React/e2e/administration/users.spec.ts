/**
 * Administration - User Management E2E Tests
 *
 * Covers the /app/administration/users route (AdministrationPage, Users tab):
 * - Page loads with the "Administration" heading
 * - User Management tab is visible and active by default
 * - User management grid renders
 * - Invite/Add User button is present
 * - Districts tab is navigable
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Administration - User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/administration/users');
    await page
      .getByRole('heading', { name: 'Administration' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Administration heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Administration' })
    ).toBeVisible();
  });

  test('shows User Management and Districts tabs', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: /User Management/i })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Districts/i })
    ).toBeVisible();
  });

  // ── User Management tab ───────────────────────────────────────────────────

  test('user management grid is visible on the default tab', async ({
    page,
  }) => {
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Invite User button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Invite.*User|Add.*User|New User/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Invite User button opens a dialog or drawer', async ({ page }) => {
    await page
      .getByRole('button', { name: /Invite.*User|Add.*User|New User/i })
      .click();

    const dialog = page.getByRole('dialog');
    const drawer = page.getByRole('presentation');
    await expect(dialog.or(drawer).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── Districts tab ─────────────────────────────────────────────────────────

  test('switching to Districts tab shows the districts grid', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: /Districts/i }).click();

    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── URL for districts tab ─────────────────────────────────────────────────

  test('clicking Districts tab updates the URL query parameter', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: /Districts/i }).click();

    await expect(page).toHaveURL(/tab=districts/, { timeout: 5_000 });
  });
});
