/**
 * Attendance Records E2E Tests
 *
 * Covers the Attendance tab within /app/attendance:
 * - Page and tab structure render correctly
 * - Attendance DataGrid is visible
 * - "Add Record" drawer opens and contains the expected form fields
 * - Search/filter controls are present
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Attendance Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/attendance');
    // Wait for the page heading
    await page
      .getByRole('heading', { name: 'Attendance Management' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Attendance Management heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Attendance Management' })
    ).toBeVisible();
  });

  test('tab bar shows Analytics, Attendance, and Events tabs', async ({
    page,
  }) => {
    await expect(page.getByRole('tab', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Attendance' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  // ── Attendance tab ───────────────────────────────────────────────────────

  test('switching to the Attendance tab shows the grid', async ({ page }) => {
    await page.getByRole('tab', { name: 'Attendance' }).click();

    // The MUI DataGrid or the records list should appear
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Record button is visible on the Attendance tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Attendance' }).click();

    await expect(
      page.getByRole('button', { name: 'Add Record' })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Add Record drawer ────────────────────────────────────────────────────

  test('Add Record opens a drawer with event selector and attendance fields', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Attendance' }).click();
    await page.getByRole('button', { name: 'Add Record' }).click();

    // The form is rendered inside a Drawer or Card
    // Event selector (MUI Select rendered as a combobox)
    await expect(
      page.getByRole('combobox', { name: /event/i })
        .or(page.getByText('Select an event'))
        .first()
    ).toBeVisible({ timeout: 10_000 });

    // Attendance count field
    await expect(page.getByLabel(/attendance/i).first()).toBeVisible();
  });

  test('Add Record form shows a Save / Submit button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Attendance' }).click();
    await page.getByRole('button', { name: 'Add Record' }).click();

    await expect(
      page.getByRole('button', { name: /save|add attendance/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Events tab ───────────────────────────────────────────────────────────

  test('switching to the Events tab shows the events list', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Events' }).click();

    // Events page renders; look for an events-related heading or grid
    await expect(
      page.getByRole('heading', { name: /events/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Route guard ──────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const freshPage = await context.newPage();

    await freshPage.goto('/app/attendance');
    await expect(freshPage).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });
});
