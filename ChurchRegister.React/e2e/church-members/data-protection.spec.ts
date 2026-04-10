/**
 * Data Protection E2E Tests
 *
 * Verifies the GDPR Data Protection Consent drawer for a church member.
 * Opens the drawer via the grid action menu and validates the consent
 * checkboxes are visible.
 *
 * Tests run with the global admin storageState.
 */

import { test, expect } from '@playwright/test';
import { ChurchMembersPage } from '../pages/ChurchMembersPage';

test.describe('Data Protection Consent', () => {
  test.beforeEach(async ({ page }) => {
    const membersPage = new ChurchMembersPage(page);
    await membersPage.goto();

    // Wait for the grid to render at least one data row
    await page.locator('.MuiDataGrid-row').first().waitFor({ timeout: 15_000 });
  });

  test('Data Protection Consent drawer can be opened from the grid', async ({
    page,
  }) => {
    // Hover the first data row to reveal the actions column
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await firstRow.hover();

    // Click the actions button in the actions cell (MoreIcon button)
    const actionsButton = page.locator('.MuiDataGrid-actionsCell button').first();
    await actionsButton.waitFor({ state: 'visible', timeout: 10_000 });
    await actionsButton.click();

    // Click the Manage GDPR menu item
    await page.getByRole('menuitem', { name: /manage gdpr/i }).click();

    // The drawer heading should appear
    await expect(
      page.getByRole('heading', { name: /Data Protection Consent/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Consent Permissions section contains the six GDPR checkboxes', async ({
    page,
  }) => {
    // Open data protection drawer for first member
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await firstRow.hover();
    const actionsButton = page.locator('.MuiDataGrid-actionsCell button').first();
    await actionsButton.waitFor({ state: 'visible', timeout: 10_000 });
    await actionsButton.click();
    await page.getByRole('menuitem', { name: /manage gdpr/i }).click();
    await page
      .getByRole('heading', { name: /Data Protection Consent/i })
      .waitFor({ timeout: 10_000 });

    // All six consent labels should be present — match actual drawer text
    await expect(page.getByText(/my name to be included/i).first()).toBeVisible();
    await expect(page.getByText(/pastoral situations|illness.*hospital/i).first()).toBeVisible();
    await expect(
      page.getByText(/photo.*printed.*materials|printed.*church.*materials/i).first()
    ).toBeVisible();
    await expect(page.getByText(/facebook|online.*platforms/i).first()).toBeVisible();
    await expect(page.getByText(/group.*crowd.*photos|appear.*incidentally/i).first()).toBeVisible();
    await expect(page.getByText(/child.*name.*photo|my child/i).first()).toBeVisible();
  });

  test('Save Changes button is present in the drawer', async ({ page }) => {
    const firstRow = page.locator('.MuiDataGrid-row').first();
    await firstRow.hover();
    const actionsButton = page.locator('.MuiDataGrid-actionsCell button').first();
    await actionsButton.waitFor({ state: 'visible', timeout: 10_000 });
    await actionsButton.click();
    await page.getByRole('menuitem', { name: /manage gdpr/i }).click();
    await page
      .getByRole('heading', { name: /Data Protection Consent/i })
      .waitFor({ timeout: 10_000 });

    await expect(
      page.getByRole('button', { name: /save changes/i })
    ).toBeVisible();
  });
});
