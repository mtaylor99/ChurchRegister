/**
 * Administration - Register Numbers E2E Tests
 *
 * Covers the /app/administration/register-numbers route (GenerateRegisterNumbers):
 * - Page renders with the "Generate New Membership Numbers" heading
 * - Year context is visible
 * - Generate / preview button is present
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Administration - Register Numbers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/administration/register-numbers');
    // Wait for the component to mount — look for the section heading
    await page
      .getByRole('heading', { name: /Generate New Membership Numbers/i })
      .first()
      .waitFor({ timeout: 15_000 });
  });

  test('renders the Generate New Membership Numbers heading', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /Generate New Membership Numbers/i }).first()
    ).toBeVisible();
  });

  test('displays the current or target year', async ({ page }) => {
    // The component generates numbers for the NEXT calendar year
    const targetYear = (new Date().getFullYear() + 1).toString();
    await expect(
      page.getByText(new RegExp(targetYear)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Generate or Preview button is present', async ({ page }) => {
    // The page shows either a Generate button or a Preview button
    // depending on whether numbers have already been generated
    const generateBtn = page.getByRole('button', {
      name: /Generate|Generate Numbers/i,
    });
    const previewBtn = page.getByRole('button', {
      name: /Preview|View Preview/i,
    });

    await expect(generateBtn.or(previewBtn).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('preview grid or already-generated alert is visible', async ({
    page,
  }) => {
    // Either the preview grid is rendered or an "Already Generated" alert is shown
    const grid = page.locator('.MuiDataGrid-root');
    const alreadyGenerated = page.getByText(/already generated/i);
    const previewGrid = page.getByText(/preview/i);

    await expect(grid.or(alreadyGenerated).or(previewGrid).first()).toBeVisible(
      { timeout: 10_000 }
    );
  });
});
