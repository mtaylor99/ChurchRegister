/**
 * Church Members E2E Tests
 *
 * Tests for church member management:
 * - Viewing member list
 * - Creating new members
 * - Editing member details
 * - Deleting members
 * - Searching and filtering
 */

import { test, expect } from '../fixtures';

test.describe('Church Members', () => {
  test.beforeEach(async ({ authPage }) => {
    // Login before each test
    await authPage.login();
    await authPage.page.goto('/church-members');
  });

  test.describe('Member List', () => {
    test('should display members list', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /church members/i })
      ).toBeVisible();

      // Should display table or grid
      const table = page
        .getByRole('table')
        .or(page.getByTestId('members-grid'));
      await expect(table).toBeVisible();
    });

    test('should search for members', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('John');

      // Wait for search results
      await page.waitForTimeout(500);

      // Should filter results
      await expect(page.getByText(/john/i)).toBeVisible();
    });

    test('should paginate through members', async ({ page }) => {
      // Check if pagination exists
      const nextButton = page.getByRole('button', { name: /next/i });

      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should navigate to page 2
        await expect(page).toHaveURL(/page=2/);
      }
    });

    test('should open member details', async ({ page }) => {
      // Click first member row
      const firstRow = page.getByRole('row').nth(1);
      await firstRow.click();

      // Should navigate to member details page
      await expect(page).toHaveURL(/\/church-members\/\d+/);
    });
  });

  test.describe('Create Member', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByRole('button', { name: /add|create|new member/i })
        .click();
    });

    test('should display create member form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /add|create|new member/i })
      ).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should create new member', async ({ page }) => {
      // Fill form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Member');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="phoneNumber"]', '555-0100');
      await page.fill('input[name="dateOfBirth"]', '1980-01-15');

      // Submit form
      await page.getByRole('button', { name: /save|submit|create/i }).click();

      // Should show success message
      await expect(page.getByText(/success|created/i)).toBeVisible();

      // Should redirect to members list or detail page
      await expect(page).toHaveURL(/\/church-members/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /save|submit|create/i }).click();

      // Should display validation errors
      await expect(page.getByText(/first name.*required/i)).toBeVisible();
      await expect(page.getByText(/last name.*required/i)).toBeVisible();
    });

    test('should cancel creation', async ({ page }) => {
      await page.getByRole('button', { name: /cancel/i }).click();

      // Should return to members list
      await expect(page).toHaveURL(/\/church-members$/);
    });
  });

  test.describe('Edit Member', () => {
    test('should edit existing member', async ({ page }) => {
      // Open first member
      await page.getByRole('row').nth(1).click();

      // Click edit button
      await page.getByRole('button', { name: /edit/i }).click();

      // Update fields
      await page.fill('input[name="firstName"]', 'Updated');

      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show success message
      await expect(page.getByText(/success|updated/i)).toBeVisible();
    });
  });

  test.describe('Delete Member', () => {
    test('should delete member with confirmation', async ({ page }) => {
      // Open first member
      await page.getByRole('row').nth(1).click();

      // Click delete button
      await page.getByRole('button', { name: /delete/i }).click();

      // Should show confirmation dialog
      await expect(
        page.getByText(/are you sure|confirm delete/i)
      ).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

      // Should show success message
      await expect(page.getByText(/success|deleted/i)).toBeVisible();

      // Should return to members list
      await expect(page).toHaveURL(/\/church-members$/);
    });
  });
});
