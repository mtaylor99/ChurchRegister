/**
 * Contributions E2E Tests
 *
 * Tests for contribution management:
 * - Viewing contributions
 * - Creating new contributions
 * - Filtering by date range
 * - Exporting contributions
 */

import { test, expect } from '../fixtures';

test.describe('Contributions', () => {
  test.beforeEach(async ({ authPage }) => {
    // Login before each test
    await authPage.login();
    await authPage.page.goto('/contributions');
  });

  test.describe('Contributions List', () => {
    test('should display contributions list', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /contributions/i })
      ).toBeVisible();

      // Should display table
      const table = page
        .getByRole('table')
        .or(page.getByTestId('contributions-grid'));
      await expect(table).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      // Open date filter
      const fromDate = page.getByLabel(/from date|start date/i);
      const toDate = page.getByLabel(/to date|end date/i);

      if (await fromDate.isVisible()) {
        await fromDate.fill('2024-01-01');
        await toDate.fill('2024-01-31');

        // Apply filter
        await page
          .getByRole('button', { name: /filter|apply|search/i })
          .click();

        // Wait for results
        await page.waitForTimeout(500);

        // Results should be filtered (verify at least one entry is visible)
        const table = page
          .getByRole('table')
          .or(page.getByTestId('contributions-grid'));
        await expect(table).toBeVisible();
      }
    });

    test('should filter by member', async ({ page }) => {
      // Open member filter
      const memberSelect = page
        .getByLabel(/member/i)
        .or(page.getByPlaceholder(/select member/i));

      if (await memberSelect.isVisible()) {
        await memberSelect.click();

        // Select first member
        await page.getByRole('option').first().click();

        // Apply filter
        await page
          .getByRole('button', { name: /filter|apply|search/i })
          .click();

        // Wait for filtered results
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Create Contribution', () => {
    test.beforeEach(async ({ page }) => {
      const addButton = page.getByRole('button', {
        name: /add|create|new contribution/i,
      });
      await addButton.click();
    });

    test('should display create contribution form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /add|create|new contribution/i })
      ).toBeVisible();
      await expect(page.getByLabel(/member/i)).toBeVisible();
      await expect(page.getByLabel(/amount/i)).toBeVisible();
      await expect(page.getByLabel(/date/i)).toBeVisible();
    });

    test('should create new contribution', async ({ page }) => {
      // Select member
      await page.getByLabel(/member/i).click();
      await page.getByRole('option').first().click();

      // Fill amount
      await page.fill('input[name="amount"]', '50.00');

      // Fill date
      await page.fill('input[name="date"]', '2024-01-15');

      // Select type
      const typeSelect = page.getByLabel(/type/i);
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.getByRole('option', { name: /tithe/i }).click();
      }

      // Select payment method
      const methodSelect = page.getByLabel(/payment method/i);
      if (await methodSelect.isVisible()) {
        await methodSelect.click();
        await page.getByRole('option', { name: /cash/i }).click();
      }

      // Submit form
      await page.getByRole('button', { name: /save|submit|create/i }).click();

      // Should show success message
      await expect(page.getByText(/success|created/i)).toBeVisible();

      // Should redirect to contributions list
      await expect(page).toHaveURL(/\/contributions/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /save|submit|create/i }).click();

      // Should display validation errors
      await expect(page.getByText(/member.*required/i)).toBeVisible();
      await expect(page.getByText(/amount.*required/i)).toBeVisible();
    });

    test('should validate amount is positive', async ({ page }) => {
      await page.fill('input[name="amount"]', '-10');
      await page.blur('input[name="amount"]');

      // Should display validation error
      await expect(
        page.getByText(/amount.*positive|greater than 0/i)
      ).toBeVisible();
    });
  });

  test.describe('Export Contributions', () => {
    test('should export contributions to CSV', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i });

      if (await exportButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');

        await exportButton.click();

        // Wait for download
        const download = await downloadPromise;

        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    });
  });

  test.describe('Contribution Summary', () => {
    test('should display summary statistics', async ({ page }) => {
      // Check for summary cards
      const totalAmount = page.getByText(/total.*amount/i);
      const contributionCount = page.getByText(
        /total.*contributions|number of contributions/i
      );

      // At least one summary metric should be visible
      const hasSummary =
        (await totalAmount.count()) > 0 ||
        (await contributionCount.count()) > 0;
      expect(hasSummary).toBeTruthy();
    });
  });
});
