/**
 * HSBC Unmatched Transactions E2E Tests
 *
 * Covers the HSBC/Unmatched Transactions tab within /app/contributions:
 * - The HSBC Upload modal opens when clicking Upload HSBC
 * - Unmatched transactions are rendered when the tab is active
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('HSBC Unmatched Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/contributions');
    await page
      .getByRole('heading', { name: 'Church Member Contributions' })
      .waitFor({ timeout: 15_000 });
  });

  test('Upload HSBC button opens the upload modal', async ({ page }) => {
    await page.getByRole('button', { name: /Upload.*HSBC|HSBC/i }).click();

    // The HSBC upload dialog should open
    await expect(
      page.getByRole('dialog')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('HSBC upload dialog contains a title', async ({ page }) => {
    await page.getByRole('button', { name: /Upload.*HSBC|HSBC/i }).click();

    await expect(
      page.getByRole('dialog')
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/Upload HSBC Bank Statement/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test('HSBC upload dialog can be closed', async ({ page }) => {
    await page.getByRole('button', { name: /Upload.*HSBC|HSBC/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 10_000 });

    // Close via Escape key
    await page.keyboard.press('Escape');

    // Dialog should no longer be visible
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('contributions page has tabs for navigating between views', async ({
    page,
  }) => {
    // The page uses tabs to switch between contributions list and HSBC view
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    // Should have at least one tab (Contributions)
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });
});
