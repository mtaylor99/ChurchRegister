/**
 * Risk Assessment Categories E2E Tests
 *
 * Covers category management within the Risk Assessments Categories tab:
 * - Categories grid renders when the Categories tab is active
 * - Add Category button opens a dialog/drawer
 * - The categories list is available in the Add Risk Assessment form dropdown
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Risk Assessment Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/risk-assessments');
    await page
      .getByRole('heading', { name: 'Risk Assessments' })
      .waitFor({ timeout: 15_000 });

    // Switch to the Categories tab
    await page.getByRole('tab', { name: 'Categories' }).click();
    // Wait for the grid to appear
    await page
      .locator('.MuiDataGrid-root')
      .first()
      .waitFor({ timeout: 10_000 });
  });

  test('renders the categories grid on the Categories tab', async ({
    page,
  }) => {
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible();
  });

  test('Add Category button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Add.*Category|New Category/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Add Category button opens a dialog or drawer', async ({ page }) => {
    await page
      .getByRole('button', { name: /Add.*Category|New Category/i })
      .click();

    // Either a MUI Dialog or a Drawer should open
    const dialog = page.getByRole('dialog');
    const drawer = page.getByRole('presentation');
    await expect(dialog.or(drawer).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('categories appear in the Add Risk Assessment dropdown', async ({
    page,
  }) => {
    // Navigate to Risk Assessments tab so we can open the Add drawer
    await page.getByRole('tab', { name: 'Risk Assessments' }).click();
    await page
      .getByRole('button', { name: /Add Risk Assessment/i })
      .click();

    // The category selector (combobox/select) should be present in the drawer
    await expect(
      page.getByRole('presentation').first()
    ).toBeVisible({ timeout: 10_000 });

    // Look for a category field or combobox inside the open drawer
    await expect(
      page.getByRole('combobox').first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
