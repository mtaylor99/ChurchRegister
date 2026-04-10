/**
 * Reminders E2E Tests
 *
 * Covers the /app/reminders route (RemindersPage):
 * - Page loads and heading renders
 * - Reminders grid renders on the default tab
 * - Create Reminder button opens a drawer
 * - Categories tab is navigable and shows the category grid
 * - Create Category button is present on the Categories tab
 * - Export button is present on the Reminders tab
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/reminders');
    await page
      .getByRole('heading', { name: 'Reminders Management' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Reminders Management heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Reminders Management' })
    ).toBeVisible();
  });

  test('shows Reminders and Categories tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Reminders' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Categories' })).toBeVisible();
  });

  // ── Reminders tab ────────────────────────────────────────────────────────

  test('Reminders tab shows the reminders grid', async ({ page }) => {
    // Default tab is Reminders (index 0)
    // When data exists, the DataGrid renders; when empty, "No reminders found" is shown
    const grid = page.locator('.MuiDataGrid-root');
    const emptyMsg = page.getByText(/No reminders found/i);
    await expect(grid.or(emptyMsg).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Create Reminder button is visible on the Reminders tab', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /Create Reminder/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Export button is visible on the Reminders tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Export$/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Create Reminder opens a drawer', async ({ page }) => {
    await page.getByRole('button', { name: /Create Reminder/i }).click();

    // Drawer should open — look for a form element or any presentation role
    await expect(page.getByRole('presentation').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── Categories tab ───────────────────────────────────────────────────────

  test('switching to Categories tab shows the category grid', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Categories' }).click();

    await expect(page.locator('.MuiDataGrid-root').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Create Category button is visible on the Categories tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Categories' }).click();

    await expect(
      page.getByRole('button', { name: /Create Category/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Create Category opens a drawer', async ({ page }) => {
    await page.getByRole('tab', { name: 'Categories' }).click();
    await page.getByRole('button', { name: /Create Category/i }).click();

    await expect(page.getByRole('presentation').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
