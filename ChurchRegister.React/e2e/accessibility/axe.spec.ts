/**
 * Accessibility E2E Tests (axe-playwright)
 *
 * Runs axe-core WCAG 2.1 AA checks on every major route in the application.
 * Each test navigates to the route and asserts zero critical or serious
 * violations.
 *
 * Prerequisites:
 *   npm install -D axe-playwright
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

/**
 * Helper: navigate to a route, wait for it to stabilise, then run axe.
 */
async function checkPageA11y(
  page: import('@playwright/test').Page,
  route: string,
  waitForSelector?: string
): Promise<void> {
  await page.goto(route);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 15_000 });
  } else {
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  }
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    axeOptions: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
      // Disable rules that trigger on MUI internal library elements we cannot
      // control without forking the library:
      //   - aria-progressbar-name: LinearProgress/CircularProgress have no built-in label
      //   - color-contrast: MUI chip/badge colours often fail; tracked separately
      //   - aria-input-field-name: MUI Select combobox (div[role="combobox"]) lacks
      //     aria-labelledby association; tracked as MUI issue
      //   - label: MUI Switch input[role="switch"] doesn't get associated <label>
      //     even with inputProps aria-label; tracked as MUI issue
      rules: {
        'aria-progressbar-name': { enabled: false },
        'color-contrast': { enabled: false },
        'aria-input-field-name': { enabled: false },
        'label': { enabled: false },
      },
    },
    // Fail only on critical and serious violations
    violationMatcher: (violation) =>
      violation.impact === 'critical' || violation.impact === 'serious',
  });
}

test.describe('Accessibility – WCAG 2.1 AA', () => {
  test('Login page has no critical or serious violations', async ({ page }) => {
    // Login page is public — clear auth state for this test only
    await page.context().clearCookies();
    await checkPageA11y(
      page,
      '/login',
      'input[type="email"], input[name="email"]'
    );
  });

  test('Dashboard has no critical or serious violations', async ({ page }) => {
    await checkPageA11y(
      page,
      '/app/dashboard',
      'h1, h2, h3, h4, h5, h6'
    );
  });

  test('Church Members page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/members', '.MuiDataGrid-root');
  });

  test('Attendance page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/attendance', 'h1, h2, h3, h4');
  });

  test('Training page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/training', 'h1, h2, h3, h4');
  });

  test('Reminders page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/reminders', 'h1, h2, h3, h4');
  });

  test('Risk Assessments page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/risk-assessments', 'h1, h2, h3, h4');
  });

  test('Contributions page has no critical or serious violations', async ({
    page,
  }) => {
    await checkPageA11y(page, '/app/contributions', 'h1, h2, h3, h4');
  });
});
