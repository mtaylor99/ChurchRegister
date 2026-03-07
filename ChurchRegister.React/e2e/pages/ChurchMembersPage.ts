/**
 * ChurchMembersPage – Page Object Model
 *
 * Encapsulates all locators and actions for the /app/members route.
 */

import { type Page, type Locator } from '@playwright/test';

export class ChurchMembersPage {
  readonly page: Page;

  // Page heading (h4 inside the page body)
  readonly heading: Locator;

  // Primary action button
  readonly addNewMemberButton: Locator;

  // Search / filter input rendered by ChurchMemberGrid's toolbar
  readonly searchInput: Locator;

  // The MUI DataGrid root element
  readonly membersGrid: Locator;

  // The drawer that slides in for add / edit / view
  readonly memberDrawer: Locator;

  // Drawer heading shown when adding a new member
  readonly addDrawerHeading: Locator;

  // Add-member form fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;

  // Submit button inside the add form
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: 'Church Members Management',
    });
    this.addNewMemberButton = page.getByRole('button', {
      name: 'Add New Member',
    });
    // MUI DataGrid renders a toolbar with a search (QuickFilter) input
    this.searchInput = page.getByPlaceholder(/search/i).first();
    this.membersGrid = page.locator('.MuiDataGrid-root').first();
    this.memberDrawer = page.getByRole('presentation').filter({
      has: page.getByRole('heading', { name: /Church Member/i }),
    });
    this.addDrawerHeading = page.getByRole('heading', {
      name: 'Add New Church Member',
    });
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    // The LoadingButton has the text "Create Member" inside the add form
    this.saveButton = page.getByRole('button', { name: /create member/i });
  }

  /** Navigate to the Church Members page. */
  async goto(): Promise<void> {
    await this.page.goto('/app/members');
    // Wait until the heading is visible (page has mounted)
    await this.heading.waitFor({ timeout: 15_000 });
  }

  /** Open the "Add New Member" drawer. */
  async clickAddMember(): Promise<void> {
    await this.addNewMemberButton.click();
    await this.addDrawerHeading.waitFor({ timeout: 10_000 });
  }

  /**
   * Open the detail/edit drawer for the first member in the grid.
   * The grid renders rows as role="row" — index 0 is the header row,
   * so index 1 is the first data row.
   */
  async openFirstMember(): Promise<void> {
    const firstRow = this.page
      .locator('.MuiDataGrid-row')
      .first();
    await firstRow.click();
  }

  /** Type a search term into the DataGrid toolbar quick-filter. */
  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }
}
