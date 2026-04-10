/**
 * Dashboard E2E Tests
 *
 * Verifies that the dashboard page loads correctly for an authenticated
 * user, displays the key metric cards, and handles navigation.
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('renders the Dashboard heading in the AppBar', async () => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('displays Sunday Morning Service attendance card', async () => {
    await expect(dashboardPage.sundayMorningCard).toBeVisible();
  });

  test('displays Sunday Evening Service attendance card', async () => {
    await expect(dashboardPage.sundayEveningCard).toBeVisible();
  });

  test('displays Church Members metric card', async () => {
    await expect(dashboardPage.churchMembersCard).toBeVisible();
  });

  test('refresh button triggers a data reload', async ({ page }) => {
    await expect(dashboardPage.refreshButton).toBeVisible();
    await dashboardPage.refreshButton.click();
    // Cards should still be visible after the reload
    await expect(dashboardPage.sundayMorningCard).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ browser }) => {
    // Create a fresh context with no saved auth state and no cookies
    const freshContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const freshPage = await freshContext.newPage();

    await freshPage.goto('/app/dashboard');
    await expect(freshPage).toHaveURL(/\/login/);

    await freshContext.close();
  });
});
