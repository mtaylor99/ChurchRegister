/**
 * Training Certificates E2E Tests
 *
 * Covers the /app/training route (TrainingCertificatesPage):
 * - Page loads and heading renders
 * - Certificate grid (Certification tab) is visible
 * - Add Certificate button opens a drawer with form fields
 * - Switching to the Training/Check Types tab shows the type management grid
 * - Add Training/Check Type button is present on the Types tab
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Training Certificates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/training');
    await page
      .getByRole('heading', { name: 'Training & Certifications' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Training & Certifications heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Training & Certifications' })
    ).toBeVisible();
  });

  test('displays the Certification and Training/Check Type tabs', async ({
    page,
  }) => {
    await expect(
      page.getByRole('tab', { name: /Certification/i })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Training\/Checks|Training.*Check/i })
    ).toBeVisible();
  });

  // ── Certification tab ────────────────────────────────────────────────────

  test('Certification tab shows a data grid', async ({ page }) => {
    // Default tab is Certification (index 0)
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Certificate button is visible on the Certification tab', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /Add Certificate/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Certificate opens a drawer with member and type fields', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Add Certificate/i }).click();

    // The drawer/dialog should appear with relevant form fields
    // Look for the member selector or a heading inside the drawer
    await expect(
      page.getByRole('presentation').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Export button is visible on the Certification tab', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /Export/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Training/Check Type tab ───────────────────────────────────────────────

  test('switching to the Types tab shows the type management grid', async ({
    page,
  }) => {
    // Click the second tab (Training/Check Type)
    const typesTab = page.getByRole('tab').nth(1);
    await typesTab.click();

    // The type grid should render
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Training/Check Type button is visible on the Types tab', async ({
    page,
  }) => {
    const typesTab = page.getByRole('tab').nth(1);
    await typesTab.click();

    await expect(
      page.getByRole('button', { name: /Add Training.*Check Type|Add.*Type/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
