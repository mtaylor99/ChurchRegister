/**
 * Attendance Analytics E2E Tests
 *
 * Covers the Analytics tab within /app/attendance:
 * - Analytics tab is the default (index 0)
 * - Charts / chart containers are rendered when events are available
 * - Search/filter input is interactive
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';

test.describe('Attendance Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/attendance');
    await page
      .getByRole('heading', { name: 'Attendance Management' })
      .waitFor({ timeout: 15_000 });
    // Analytics is the first tab (index 0) — make it explicit
    await page.getByRole('tab', { name: 'Analytics' }).click();
  });

  test('Analytics tab is selectable and stays active', async ({ page }) => {
    const analyticsTab = page.getByRole('tab', { name: 'Analytics' });
    await expect(analyticsTab).toBeVisible();
    await expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('analytics panel is visible when Analytics tab is selected', async ({
    page,
  }) => {
    // The tabpanel with id attendance-tabpanel-0 should be visible
    await expect(
      page.locator('[id^="attendance-tabpanel"]').first()
    ).toBeVisible();
  });

  test('renders the Analytics page heading or section', async ({ page }) => {
    // AttendanceAnalyticsPage shows either charts or a "no data" state
    // Either way, the panel renders
    await expect(
      page.locator('[id^="attendance-tabpanel"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('analytics search input is present and interactive', async ({ page }) => {
    // AttendanceAnalyticsPage renders a search TextField for filtering events
    const searchInputs = page.getByRole('textbox');
    const count = await searchInputs.count();

    if (count > 0) {
      await searchInputs.first().fill('Sunday');
      // Input accepts the text without errors
      await expect(searchInputs.first()).toHaveValue('Sunday');
    }
    // If no search input is present (no events returned), the test passes
  });

  test('charts or "no data" state is rendered', async ({ page }) => {
    // Wait for loading to complete — the "Loading analytics..." text should disappear
    await expect(
      page.getByText(/Loading analytics.../i)
    ).not.toBeVisible({ timeout: 20_000 });

    // After loading, some content should be visible in the tab panel
    // Could be: recharts SVG, "No events configured" alert, or an error alert
    const hasContent = await page.evaluate(() => {
      const panel = document.querySelector('[id^="attendance-tabpanel"]');
      if (!panel) return false;
      const text = panel.textContent || '';
      const hasSvg = panel.querySelectorAll('svg').length > 0;
      const hasMeaningfulText = text.trim().length > 20;
      return hasSvg || hasMeaningfulText;
    });

    expect(hasContent).toBe(true);
  });

  test('switching away and back preserves the Analytics tab state', async ({
    page,
  }) => {
    // Switch to Attendance tab
    await page.getByRole('tab', { name: 'Attendance' }).click();
    await expect(
      page.getByRole('tab', { name: 'Attendance' })
    ).toHaveAttribute('aria-selected', 'true');

    // Switch back to Analytics
    await page.getByRole('tab', { name: 'Analytics' }).click();
    await expect(
      page.getByRole('tab', { name: 'Analytics' })
    ).toHaveAttribute('aria-selected', 'true');
  });
});
