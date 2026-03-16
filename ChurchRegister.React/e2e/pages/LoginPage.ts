/**
 * LoginPage – Page Object Model
 *
 * Encapsulates all locators and actions for the /login route so that
 * test files never hard-code selectors directly.
 */

import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Welcome Back' });
    // Real LoginPage uses StyledTextField with label props (no explicit id)
    this.emailInput = page.getByLabel('Email Address');
    this.passwordInput = page.locator('input[type="password"]');
    this.rememberMeCheckbox = page.getByRole('checkbox', {
      name: /remember me/i,
    });
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
  }

  /** Navigate directly to the login page. */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Fill the form and click Sign In.
   * Does NOT wait for navigation so callers can assert different outcomes.
   */
  async fillAndSubmit(email: string, password: string): Promise<void> {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Perform a full login and wait until the dashboard is loaded.
   * Use this in global-setup, not in the login-spec tests.
   */
  async loginAs(email: string, password: string): Promise<void> {
    await this.fillAndSubmit(email, password);
    await this.page.waitForURL(/\/app\/dashboard/, { timeout: 30_000 });
  }
}
