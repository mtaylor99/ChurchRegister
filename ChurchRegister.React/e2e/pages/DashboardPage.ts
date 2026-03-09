/**
 * DashboardPage – Page Object Model
 *
 * Encapsulates locators for the /app/dashboard route so tests stay
 * resilient to minor markup changes.
 */

import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  // Top-level heading shown in the AppBar
  readonly heading: Locator;

  // Metric cards on the dashboard
  readonly sundayMorningCard: Locator;
  readonly sundayEveningCard: Locator;
  readonly bibleStudyCard: Locator;
  readonly churchMembersCard: Locator;
  readonly newMembersCard: Locator;

  // Refresh button (IconButton with Refresh icon)
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Dashboard', exact: true });
    // Target h6 headings specifically to avoid strict-mode violations from
    // duplicate text in chart/widget sections that use different heading levels
    this.sundayMorningCard = page.getByRole('heading', { name: 'Sunday Morning Service', level: 6 });
    this.sundayEveningCard = page.getByRole('heading', { name: 'Sunday Evening Service', level: 6 });
    this.bibleStudyCard = page.getByRole('heading', { name: 'Bible Study', level: 6 });
    this.churchMembersCard = page.getByRole('heading', { name: 'Church Members', level: 6 });
    this.newMembersCard = page.getByRole('heading', { name: 'New Members', level: 6 });
    // Icon-only refresh button identified by its aria-label
    this.refreshButton = page.getByRole('button', { name: 'Refresh dashboard' });
  }

  /** Navigate directly to the dashboard and wait for data to load. */
  async goto(): Promise<void> {
    await this.page.goto('/app/dashboard');
    // Wait for auth check to complete and dashboard heading to appear
    await this.heading.waitFor({ timeout: 15_000 });
    // Wait for API data to load (Last updated timestamp is set after the stats API call)
    await this.page.getByText(/Last updated:/).waitFor({ timeout: 10_000 });
  }
}
