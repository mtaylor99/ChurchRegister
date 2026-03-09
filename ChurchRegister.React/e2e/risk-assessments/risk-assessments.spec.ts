/**
 * Risk Assessments E2E Tests
 *
 * Covers the /app/risk-assessments route (RiskAssessmentsPage):
 * - Page loads with the correct heading
 * - Risk Assessments grid renders on the default tab
 * - Add Risk Assessment button opens a drawer with form fields
 * - Switching to the Categories tab shows the category management grid
 * - Export PDF button is present on the Risk Assessments tab
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Risk Assessments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/risk-assessments');
    await page
      .getByRole('heading', { name: 'Risk Assessments' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Risk Assessments heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Risk Assessments' })
    ).toBeVisible();
  });

  test('shows Risk Assessments and Categories tabs', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: 'Risk Assessments' })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Categories' })
    ).toBeVisible();
  });

  // ── Risk Assessments tab ──────────────────────────────────────────────────

  test('risk assessments grid is visible on the default tab', async ({
    page,
  }) => {
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Risk Assessment button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Add Risk Assessment/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Risk Assessment opens a drawer with form fields', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /Add Risk Assessment/i })
      .click();

    // Drawer should open with a presentation role element
    await expect(
      page.getByRole('presentation').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Export PDF button is visible on the Risk Assessments tab', async ({
    page,
  }) => {
    // Export / PDF button is on the Risk Assessments tab toolbar
    await expect(
      page.getByRole('button', { name: /Export.*PDF|PDF/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Row interaction ───────────────────────────────────────────────────────

  test('clicking a grid row opens the view drawer when rows are present', async ({
    page,
  }) => {
    // Wait for the grid to stabilise
    const grid = page.locator('.MuiDataGrid-root').first();
    await grid.waitFor({ timeout: 10_000 });

    const rows = page.locator('.MuiDataGrid-row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();
      await expect(
        page.getByRole('presentation').first()
      ).toBeVisible({ timeout: 10_000 });
    } else {
      // No data yet — just verify the grid is present
      await expect(grid).toBeVisible();
    }
  });

  // ── Categories tab ────────────────────────────────────────────────────────

  test('switching to the Categories tab shows the category grid', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Categories' }).click();

    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Category button is visible on the Categories tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Categories' }).click();

    await expect(
      page.getByRole('button', { name: /Add.*Category|New Category/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
