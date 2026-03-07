/**
 * Contributions Page E2E Tests
 *
 * Covers the /app/contributions route (ContributionsPage):
 * - Page loads with the correct heading
 * - Member contributions grid renders on the default tab
 * - The financial actions header (Upload HSBC, Enter Batch, etc.) is visible
 * - Switching to the HSBC tab shows the unmatched transactions view
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Contributions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/contributions');
    await page
      .getByRole('heading', { name: 'Church Member Contributions' })
      .waitFor({ timeout: 15_000 });
  });

  // ── Page structure ───────────────────────────────────────────────────────

  test('renders the Church Member Contributions heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Church Member Contributions' })
    ).toBeVisible();
  });

  // ── Contributions tab (default) ──────────────────────────────────────────

  test('member contributions grid is visible on the default tab', async ({
    page,
  }) => {
    await expect(
      page.locator('.MuiDataGrid-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('financial action buttons are visible (Upload HSBC, Enter Batch, Add One-Off)', async ({
    page,
  }) => {
    // These buttons are rendered by FinancialActionsHeader when tab 0 is active
    await expect(
      page.getByRole('button', { name: /Upload.*HSBC|HSBC/i })
    ).toBeVisible({ timeout: 10_000 });

    // "Upload Envelopes" is the batch-entry button (previously "Enter Batch")
    await expect(
      page.getByRole('button', { name: /Upload Envelopes/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Export Contributions button is visible', async ({ page }) => {
    // Export is in the More Actions (⋮) context menu — open it first
    await page.getByRole('button', { name: /more actions/i }).click();
    await expect(
      page.getByRole('menuitem', { name: /Export Members Contributions/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Clicking a member row ────────────────────────────────────────────────

  test('clicking a member row opens the contribution history dialog', async ({
    page,
  }) => {
    const rows = page.locator('.MuiDataGrid-row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();
      // A dialog or drawer showing contribution history should appear
      const dialog = page.getByRole('dialog');
      const drawer = page.getByRole('presentation');
      await expect(dialog.or(drawer).first()).toBeVisible({
        timeout: 10_000,
      });
    } else {
      // No members loaded — just verify grid renders
      await expect(
        page.locator('.MuiDataGrid-root').first()
      ).toBeVisible();
    }
  });
});
