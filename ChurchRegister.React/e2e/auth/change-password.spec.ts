/**
 * Change Password E2E Tests
 *
 * Verifies the Change Password drawer that is opened from the account
 * menu in the application layout. Tests run with the global authenticated
 * session (storageState set in playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

test.describe('Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForURL(/\/app\/dashboard/);

    // Open the account menu and navigate to Change Password
    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Change Password' }).click();
  });

  test('shows the Change Password drawer', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Change Password', exact: true })
    ).toBeVisible();

    // All three password fields must be present
    await expect(page.getByLabel('Current Password')).toBeVisible();
    await expect(page.getByLabel('New Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm New Password')).toBeVisible();
  });

  test('shows validation error when passwords do not match', async ({
    page,
  }) => {
    await page.getByLabel('Current Password').fill('OldPassword1!');
    await page.getByLabel('New Password', { exact: true }).fill('NewPassword123!@');
    await page.getByLabel('Confirm New Password').fill('DifferentPassword1!@');

    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('shows validation error for a password that is too short', async ({
    page,
  }) => {
    await page.getByLabel('Current Password').fill('OldPassword1!');
    await page.getByLabel('New Password', { exact: true }).fill('Short1!');
    await page.getByLabel('Confirm New Password').fill('Short1!');

    await page.getByRole('button', { name: 'Change Password' }).click();

    // Drawer validates minimum 12 characters
    await expect(page.getByText(/at least 12 characters/i).first()).toBeVisible();
  });

  test('close button dismisses the drawer', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Drawer heading disappears after cancel
    await expect(
      page.getByRole('heading', { name: 'Change Password', exact: true })
    ).not.toBeVisible();
  });
});
