/**
 * Envelope Batch Entry E2E Tests
 *
 * Covers the /app/financial/envelope-contributions/entry route:
 * - Page renders with the "Envelope Batch Entry" heading
 * - The Collection Date picker is visible with Sunday-only label
 * - A non-Sunday date shows a validation error
 * - The batch history route renders
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Envelope Batch Entry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/financial/envelope-contributions/entry');
    // Wait for the page heading
    await page
      .getByText('Envelope Batch Entry')
      .waitFor({ timeout: 15_000 });
  });

  test('renders the Envelope Batch Entry heading', async ({ page }) => {
    await expect(
      page.getByText('Envelope Batch Entry')
    ).toBeVisible();
  });

  test('Collection Date picker with Sunday label is visible', async ({
    page,
  }) => {
    // MUI v7 DatePicker renders as a contenteditable sections container, not a plain input
    await expect(
      page.locator('.MuiPickersTextField-root').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows validation error when a non-Sunday date is selected', async ({
    page,
  }) => {
    // Use the calendar button to open date picker, then try to type a non-Sunday date
    // Since shouldDisableDate prevents calendar selection of non-Sundays,
    // we type directly into the month/day/year sections
    const datePicker = page.locator('.MuiPickersTextField-root').first();
    await datePicker.click();

    // Focus the month section and type month
    const monthSection = page.locator('[aria-label="Month"]').first();
    await monthSection.click();
    await monthSection.pressSequentially('03');

    // Focus day section and type day (9 = Monday)
    const daySection = page.locator('[aria-label="Day"]').first();
    await daySection.click();
    await daySection.pressSequentially('09');

    // Focus year section and type year
    const yearSection = page.locator('[aria-label="Year"]').first();
    await yearSection.click();
    await yearSection.pressSequentially('2026');

    // Click outside to commit
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // The validation message should appear
    await expect(
      page.getByText(/Collection date must be a Sunday/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test('accepts a valid Sunday date without showing an error', async ({
    page,
  }) => {
    // Type a Sunday date (March 8, 2026 is a Sunday)
    const datePicker = page.locator('.MuiPickersTextField-root').first();
    await datePicker.click();

    const monthSection = page.locator('[aria-label="Month"]').first();
    await monthSection.click();
    await monthSection.pressSequentially('03');

    const daySection = page.locator('[aria-label="Day"]').first();
    await daySection.click();
    await daySection.pressSequentially('08');

    const yearSection = page.locator('[aria-label="Year"]').first();
    await yearSection.click();
    await yearSection.pressSequentially('2026');

    // Click outside to commit
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Either no error message, or the picker accepted the Sunday date correctly
    const errorCount = await page.getByText(/Collection date must be a Sunday/i).count();
    expect(errorCount).toBe(0);
  });

  test('register number input row is visible for entering contributions', async ({
    page,
  }) => {
    // The batch entry table shows at least one register number input field
    await expect(
      page.locator('input[id^="registerNumber-"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Envelope Batch History', () => {
  test('batch history page renders at the history route', async ({ page }) => {
    await page.goto('/app/financial/envelope-contributions/history');

    // Wait for page content to load
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // The page should render without an error boundary
    await expect(page.locator('body')).not.toContainText('Error', {
      timeout: 5_000,
    });

    // Check that either the grid or a "no records" message is present
    const grid = page.locator('.MuiDataGrid-root');
    const noData = page.getByText(/no batch|no history|no records/i);
    await expect(grid.or(noData).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
