/**
 * Authentication E2E Tests
 *
 * Tests for user authentication flows:
 * - Login
 * - Registration
 * - Logout
 * - Password reset
 */

import { test, expect } from '../fixtures';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /sign in/i })
      ).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole('button', { name: /sign in/i })
      ).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/(dashboard|home)/);

      // Should display user menu
      await expect(page.getByTestId('user-menu')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);

      // Should display error message
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button[type="submit"]');

      // Should display validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should have link to registration', async ({ page }) => {
      const registerLink = page.getByRole('link', {
        name: /register|sign up/i,
      });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Registration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display registration form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /register|sign up/i })
      ).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password/i)).toBeVisible();
      await expect(
        page.getByRole('button', { name: /register|sign up/i })
      ).toBeVisible();
    });

    test('should register with valid details', async ({ page }) => {
      await page.fill('input[name="firstName"]', 'New');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard or confirmation page
      await expect(page).toHaveURL(/\/(dashboard|home|verify-email)/);
    });

    test('should validate password strength', async ({ page }) => {
      await page.fill('input[name="password"]', 'weak');
      await page.blur('input[name="password"]');

      // Should display password strength errors
      await expect(
        page.getByText(/password.*strong|6 characters/i)
      ).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      await page.blur('input[name="confirmPassword"]');

      // Should display mismatch error
      await expect(page.getByText(/passwords.*match/i)).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authPage }) => {
      // Login first
      await authPage.login();

      // Perform logout
      await authPage.logout();

      // Should redirect to login page
      await expect(authPage.page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should access protected route after login', async ({ authPage }) => {
      await authPage.login();

      await authPage.page.goto('/dashboard');

      // Should stay on dashboard
      await expect(authPage.page).toHaveURL(/\/dashboard/);
    });
  });
});
