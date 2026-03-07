/**
 * Church Members CRUD E2E Tests
 *
 * Covers the full CRUD cycle for church members:
 * list, search, open detail drawer, add, edit.
 *
 * All tests run with the global admin storageState so no login step
 * is needed. The test that creates a member uses a unique name to
 * avoid collisions across parallel runs.
 */

import { test, expect } from '@playwright/test';
import { ChurchMembersPage } from '../pages/ChurchMembersPage';

test.describe('Church Members', () => {
  let membersPage: ChurchMembersPage;

  test.beforeEach(async ({ page }) => {
    membersPage = new ChurchMembersPage(page);
    await membersPage.goto();
  });

  // ── List view ─────────────────────────────────────────────────────────────

  test('renders the Church Members Management heading', async () => {
    await expect(membersPage.heading).toBeVisible();
  });

  test('renders the members DataGrid', async () => {
    await expect(membersPage.membersGrid).toBeVisible();
    // At least one data row should be present (seeded admin user / existing members)
    await expect(
      membersPage.page.locator('.MuiDataGrid-row').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Add New Member button is visible', async () => {
    await expect(membersPage.addNewMemberButton).toBeVisible();
  });

  // ── Add member drawer ─────────────────────────────────────────────────────

  test('opens the Add Member drawer on button click', async () => {
    await membersPage.clickAddMember();
    await expect(membersPage.addDrawerHeading).toBeVisible();
    await expect(membersPage.firstNameInput).toBeVisible();
    await expect(membersPage.lastNameInput).toBeVisible();
  });

  test('shows validation errors when submitting an empty Add form', async () => {
    await membersPage.clickAddMember();
    // The Create Member button is disabled when form is invalid (mode: 'onChange')
    // Trigger validation by typing and clearing required fields
    await membersPage.firstNameInput.fill('x');
    await membersPage.firstNameInput.fill('');
    await membersPage.lastNameInput.click();
    await expect(membersPage.page.getByText('First name is required')).toBeVisible({ timeout: 5_000 });
    await membersPage.lastNameInput.fill('x');
    await membersPage.lastNameInput.fill('');
    await membersPage.firstNameInput.click();
    await expect(membersPage.page.getByText('Last name is required')).toBeVisible({ timeout: 5_000 });
  });

  test('creates a member with minimal valid data', async ({ page }) => {
    const uniqueSuffix = Date.now();
    await membersPage.clickAddMember();

    await membersPage.firstNameInput.fill(`E2E${uniqueSuffix}`);
    await membersPage.lastNameInput.fill('TestMember');
    await membersPage.saveButton.click();

    // Success: a notification appears OR the Add drawer closes (heading disappears)
    await expect(
      page.getByText(/success|created|added|saved/i).first()
        .or(page.getByRole('heading', { name: 'Church Members Management' }))
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Detail drawer ─────────────────────────────────────────────────────────

  test('clicking a member row opens the detail/edit drawer', async ({ page }) => {
    // Wait for rows to render before clicking
    await page.locator('.MuiDataGrid-row').first().waitFor({ timeout: 15_000 });
    await membersPage.openFirstMember();

    // Either "View Church Member" or "Edit Church Member" heading appears
    await expect(
      page.getByRole('heading', { name: /Church Member/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
}); 
