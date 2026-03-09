/**
 * Login E2E Tests
 *
 * Tests the /login page in isolation. These tests intentionally clear
 * the global storageState so they can exercise the unauthenticated flow.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TEST_USERS } from '../fixtures';

// Clear the global auth state – login tests must start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('displays the login form', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('redirects to dashboard on valid credentials', async ({ page }) => {
    await loginPage.emailInput.fill(TEST_USERS.admin.email);
    await loginPage.passwordInput.fill(TEST_USERS.admin.password);
    await loginPage.submitButton.click();

    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15_000 });
  });

  test('stays on login page with invalid credentials', async ({ page }) => {
    await loginPage.emailInput.fill('nobody@example.com');
    await loginPage.passwordInput.fill('WrongPassword1!');
    await loginPage.submitButton.click();

    // Should remain on login
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation error when email is empty', async ({ page }) => {
    await loginPage.passwordInput.fill('SomePassword1!');
    await loginPage.submitButton.click();

    // react-hook-form / yup renders an error message for the email field
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });

  test('shows validation error when password is empty', async ({ page }) => {
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.submitButton.click();

    await expect(page.getByText(/password/i).first()).toBeVisible();
  });

  test('unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
