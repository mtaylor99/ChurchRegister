---
title: Contributions UI - Dedicated Financial Contributions Management Interface
version: 1.0
date_created: 2024-12-24
last_updated: 2024-12-24
owner: Church Register Development Team
tags: [design, ui, financial, contributions, navigation, role-based-access]
---

# Introduction

This specification defines the creation of a dedicated "Contributions" section in the Church Register application, providing a focused interface for managing financial contributions separate from the general member management interface. The new section will consolidate contribution viewing, financial transaction management, and batch processing capabilities into a single, role-restricted area.

## 1. Purpose & Scope

### Purpose

This specification defines the creation of a new "Contributions" navigation section that:

- Provides a dedicated interface for viewing and managing church member contributions
- Consolidates financial management actions (HSBC upload, batch entry, batch history) from the dashboard
- Restricts access to users with financial roles only
- Maintains separation of concerns between member administration and financial operations

### Scope

This specification covers:

- New "Contributions" navigation menu item in the left sidebar
- New Contributions page with filtered member grid showing financial data
- Migration of contribution-related actions from Members page to Contributions page
- Migration of financial widgets from Dashboard to Contributions page
- Role-based access control for all contribution-related interfaces
- Removal of contribution-related features from non-financial pages

### Out of Scope

- Modification of underlying contribution data structures
- Changes to contribution calculation logic
- New contribution processing features
- Changes to HSBC transaction processing
- Envelope batch processing logic changes

### Intended Audience

- Frontend developers implementing React components
- Backend developers ensuring proper role-based access
- UX designers reviewing interface changes
- QA engineers writing test cases
- System architects reviewing architectural changes

### Assumptions

- The Members management page already exists with full functionality
- Contribution history viewing is currently available from the Members grid
- Dashboard widgets for "Upload HSBC Statement", "Enter New Batch", and "View Batch History" already exist
- Role-based access control infrastructure is already implemented
- The `ThisYearsContribution` field is already available in the member data model

## 2. Definitions

### Acronyms & Abbreviations

- **RBAC**: Role-Based Access Control
- **HSBC**: Hong Kong and Shanghai Banking Corporation (bank statement source)
- **UI**: User Interface
- **API**: Application Programming Interface

### Domain-Specific Terms

- **Contributions Page**: New dedicated interface for viewing member contribution data
- **Financial Roles**: User roles authorized to access financial data (FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator)
- **ThisYearsContribution**: Calculated sum of all contributions made by a member in the current calendar year
- **Envelope Number**: Unique identifier assigned to members for cash contribution tracking
- **Batch Entry**: Process of manually entering multiple cash contributions from envelope collections
- **Batch History**: Historical record of all contribution batches entered into the system
- **HSBC Statement Upload**: Process of importing bank transactions from HSBC CSV files

### Navigation Structure

- **Primary Navigation**: Left sidebar navigation menu
- **Contributions Navigation Item**: New menu item between "Members" and existing items
- **Contributions Page Route**: `/app/contributions`

## 3. Requirements, Constraints & Guidelines

### Navigation Requirements

- **NAV-001**: System MUST add a new "Contributions" navigation item to the left sidebar
- **NAV-002**: Contributions navigation item MUST be positioned after "Members" in the navigation list
- **NAV-003**: Contributions navigation item MUST use an appropriate icon (e.g., AccountBalanceIcon or MoneyIcon)
- **NAV-004**: Contributions navigation item MUST only be visible to users with authorized financial roles
- **NAV-005**: System MUST navigate to `/app/contributions` when the Contributions menu item is clicked

### Role-Based Access Requirements

- **SEC-001**: Access to Contributions page MUST be restricted to users with one of the following roles:
  - FinancialViewer
  - FinancialContributor
  - FinancialAdministrator
  - SystemAdministrator
- **SEC-002**: Users without authorized roles MUST NOT see the Contributions navigation item
- **SEC-003**: Direct navigation to `/app/contributions` without proper role MUST redirect to unauthorized/403 page
- **SEC-004**: All API endpoints serving contribution data MUST enforce role-based authorization

### Contributions Page Layout Requirements

- **UI-001**: Contributions page MUST follow the same layout pattern as the Members page
- **UI-002**: Page MUST include a header section with title and subtitle
- **UI-003**: Page header title MUST be "Church Member Contributions"
- **UI-004**: Page header subtitle MUST be "View contribution records, manage financial data, and process transactions"
- **UI-005**: Page MUST NOT include an "Add New Member" button
- **UI-006**: Page MUST include action buttons in the header area for:
  - Upload HSBC Statement
  - Enter New Batch
  - View Batch History

### Contributions Grid Requirements

- **GRID-001**: Contributions grid MUST display the following columns in order:
  1. Name (First Name + Last Name)
  2. Status (Member Status with visual chip/badge)
  3. Envelope Number
  4. This Year's Contribution
- **GRID-002**: Contributions grid MUST NOT display columns:
  - Member Since
  - Phone Number
  - Email Address
  - Roles
  - Baptised
  - Gift Aid
  - Any other member administration fields
- **GRID-003**: Name column MUST be sortable and support text search
- **GRID-004**: Status column MUST display with the same visual styling as Members page (colored chips)
- **GRID-005**: Envelope Number column MUST be sortable and filterable
- **GRID-006**: This Year's Contribution column MUST display currency formatted with £ symbol and 2 decimal places
- **GRID-007**: This Year's Contribution column MUST be sortable (default sort descending by contribution amount)
- **GRID-008**: Grid MUST support the same pagination options as Members grid (10, 20, 50, 100 rows per page)
- **GRID-009**: Grid MUST include search functionality across Name and Envelope Number fields
- **GRID-010**: Grid MUST include status filter dropdown matching Members page functionality
- **GRID-011**: Grid MUST support export functionality (CSV/Excel)

### Contributions Grid Actions Requirements

- **ACT-001**: Each row MUST include a context menu (three-dot menu icon) in the Actions column
- **ACT-002**: Context menu MUST include "View Contributions" action item
- **ACT-003**: "View Contributions" action MUST open the contribution history dialog for the selected member
- **ACT-004**: Context menu MUST NOT include "Edit Member" or "View Member Details" actions
- **ACT-005**: "View Contributions" action MUST be the only action available in the context menu
- **ACT-006**: Clicking "View Contributions" MUST open the same ContributionHistoryDialog component currently used in Members page

### Header Action Buttons Requirements

- **BTN-001**: "Upload HSBC Statement" button MUST be moved from Dashboard to Contributions page header
- **BTN-002**: "Enter New Batch" button MUST be moved from Dashboard to Contributions page header
- **BTN-003**: "View Batch History" button MUST be moved from Dashboard to Contributions page header
- **BTN-004**: Button styling MUST follow Material-UI contained button pattern
- **BTN-005**: Buttons MUST be arranged horizontally with appropriate spacing
- **BTN-006**: Button permissions MUST match existing dashboard widget permissions:
  - Upload HSBC Statement: FinancialContributor, FinancialAdministrator, SystemAdministrator
  - Enter New Batch: FinancialContributor, FinancialAdministrator, SystemAdministrator
  - View Batch History: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator
- **BTN-007**: Clicking each button MUST trigger the same functionality as dashboard widgets
- **BTN-008**: On mobile/tablet views, buttons MAY wrap to multiple rows or use dropdown menu

### Members Page Modifications Requirements

- **MEM-001**: "This Year's Contribution" column MUST be removed from Members page grid
- **MEM-002**: "View Contributions" action MUST be removed from Members page context menu
- **MEM-003**: All other Members page functionality MUST remain unchanged
- **MEM-004**: Members page MUST continue to support all member administration functions

### Dashboard Modifications Requirements

- **DASH-001**: "Upload HSBC Statement" widget MUST be removed from Dashboard
- **DASH-002**: "Enter New Batch" widget MUST be removed from Dashboard
- **DASH-003**: "View Batch History" widget MUST be removed from Dashboard
- **DASH-004**: Dashboard layout MUST be adjusted to accommodate widget removal
- **DASH-005**: Other dashboard widgets MUST remain functional and properly positioned

### Responsive Design Requirements

- **RES-001**: Contributions page MUST be fully responsive for desktop, tablet, and mobile viewports
- **RES-002**: Grid columns MUST adjust appropriately for smaller screens
- **RES-003**: Header action buttons MUST stack or use overflow menu on mobile devices
- **RES-004**: Search and filter controls MUST remain accessible on all screen sizes

### Performance Requirements

- **PERF-001**: Contributions grid MUST load within 2 seconds for datasets up to 1000 members
- **PERF-002**: Grid pagination MUST not re-fetch all data when changing pages
- **PERF-003**: Contribution calculations MUST be performed server-side, not client-side
- **PERF-004**: Grid filtering and sorting MUST be performed server-side for large datasets

### Accessibility Requirements

- **ACC-001**: All interactive elements MUST be keyboard accessible
- **ACC-002**: Color-coded status indicators MUST include text labels
- **ACC-003**: Action buttons MUST include appropriate ARIA labels
- **ACC-004**: Grid MUST support screen reader navigation
- **ACC-005**: Focus indicators MUST be clearly visible

### Constraints

- **CON-001**: Changes MUST NOT break existing Members page functionality
- **CON-002**: Changes MUST NOT alter underlying contribution calculation logic
- **CON-003**: Changes MUST NOT modify database schema or API contracts
- **CON-004**: Changes MUST maintain consistent look-and-feel with existing application
- **CON-005**: Migration MUST be completed without data loss or downtime

### Guidelines

- **GUD-001**: Use existing React components and patterns where possible
- **GUD-002**: Follow established Material-UI theming and styling conventions
- **GUD-003**: Maintain consistent naming conventions across components
- **GUD-004**: Ensure proper error handling and loading states
- **GUD-005**: Add appropriate logging for debugging and monitoring
- **GUD-006**: Document component props and interfaces using TypeScript
- **GUD-007**: Write unit tests for new components and modified logic

## 4. Interfaces & Data Contracts

### Navigation Item Interface

```typescript
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[]; // Required roles for visibility
  badge?: string | number;
  disabled?: boolean;
}

// New Contributions Navigation Item
const contributionsNavItem: NavigationItem = {
  id: "contributions",
  label: "Contributions",
  icon: <AccountBalanceIcon />,
  path: "/app/contributions",
  roles: [
    "FinancialViewer",
    "FinancialContributor",
    "FinancialAdministrator",
    "SystemAdministrator",
  ],
};
```

### Contributions Grid Data Interface

```typescript
interface ContributionMemberDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string; // Computed: firstName + lastName
  statusId: number;
  statusName: string;
  statusColor: string; // For chip styling
  envelopeNumber: string | null;
  thisYearsContribution: number; // Decimal currency amount
}

interface ContributionGridQuery {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  envelopeNumberFilter?: string;
}

interface ContributionGridResponse {
  data: ContributionMemberDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### API Endpoints

```typescript
// GET /api/contributions/members
// Query Parameters: page, pageSize, searchTerm, statusFilter, sortBy, sortDirection
// Returns: ContributionGridResponse
// Authorization: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator

// GET /api/contributions/member/{memberId}/history
// Query Parameters: startDate, endDate, page, pageSize
// Returns: MemberContributionHistoryResponse
// Authorization: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator
```

### Component Interface Definitions

```typescript
// ContributionsPage Component
interface ContributionsPageProps {
  // No props - uses authentication context for role checking
}

// ContributionMemberGrid Component
interface ContributionMemberGridProps {
  onViewContributions: (member: ContributionMemberDto) => void;
  initialQuery?: Partial<ContributionGridQuery>;
}

// Header Action Buttons
interface FinancialActionsHeaderProps {
  onUploadHsbc: () => void;
  onEnterBatch: () => void;
  onViewBatchHistory: () => void;
  userRoles: string[]; // For conditional button rendering
}
```

## 5. Acceptance Criteria

### Navigation Acceptance Criteria

- **AC-001**: Given a user with FinancialViewer role, When viewing the sidebar navigation, Then the "Contributions" menu item is visible
- **AC-002**: Given a user with FinancialContributor role, When viewing the sidebar navigation, Then the "Contributions" menu item is visible
- **AC-003**: Given a user with FinancialAdministrator role, When viewing the sidebar navigation, Then the "Contributions" menu item is visible
- **AC-004**: Given a user with SystemAdministrator role, When viewing the sidebar navigation, Then the "Contributions" menu item is visible
- **AC-005**: Given a user without financial roles, When viewing the sidebar navigation, Then the "Contributions" menu item is NOT visible
- **AC-006**: Given a user with FinancialViewer role, When clicking the "Contributions" menu item, Then the user navigates to `/app/contributions`
- **AC-007**: Given a user without financial roles, When attempting to directly access `/app/contributions`, Then the user is redirected to a 403 Unauthorized page

### Contributions Page Acceptance Criteria

- **AC-008**: Given a user on the Contributions page, When the page loads, Then the header displays "Church Member Contributions"
- **AC-009**: Given a user on the Contributions page, When the page loads, Then the subtitle displays "View contribution records, manage financial data, and process transactions"
- **AC-010**: Given a user on the Contributions page, When viewing the page, Then NO "Add New Member" button is visible
- **AC-011**: Given a user with FinancialContributor role, When viewing the Contributions page header, Then "Upload HSBC Statement", "Enter New Batch", and "View Batch History" buttons are visible
- **AC-012**: Given a user with FinancialViewer role, When viewing the Contributions page header, Then only "View Batch History" button is visible

### Contributions Grid Acceptance Criteria

- **AC-013**: Given a user on the Contributions page, When viewing the grid, Then columns are: Name, Status, Envelope Number, This Year's Contribution
- **AC-014**: Given a user on the Contributions page, When viewing the grid, Then member administration columns (Phone, Email, Roles, etc.) are NOT displayed
- **AC-015**: Given a member with £1,250.50 in contributions, When viewing the grid, Then "This Year's Contribution" displays as "£1,250.50"
- **AC-016**: Given a member with no contributions, When viewing the grid, Then "This Year's Contribution" displays as "£0.00"
- **AC-017**: Given a user on the Contributions page, When clicking a column header, Then the grid sorts by that column
- **AC-018**: Given a user viewing the grid, When typing in the search box, Then the grid filters by Name and Envelope Number
- **AC-019**: Given a user viewing the grid, When selecting a status filter, Then the grid shows only members with that status
- **AC-020**: Given a user viewing the grid, When changing page size, Then the grid displays the selected number of rows per page

### Grid Actions Acceptance Criteria

- **AC-021**: Given a member row in the grid, When viewing the Actions column, Then a context menu icon (three dots) is visible
- **AC-022**: Given a member row in the grid, When clicking the context menu icon, Then a menu opens with "View Contributions" option
- **AC-023**: Given the context menu is open, When clicking "View Contributions", Then the contribution history dialog opens for that member
- **AC-024**: Given the contribution history dialog, When viewing contributions, Then the dialog displays the same interface as from the Members page
- **AC-025**: Given the context menu, When viewing available actions, Then "Edit Member" and "View Details" actions are NOT present

### Button Functionality Acceptance Criteria

- **AC-026**: Given a user with FinancialContributor role, When clicking "Upload HSBC Statement", Then the HSBC upload modal opens
- **AC-027**: Given a user with FinancialContributor role, When clicking "Enter New Batch", Then the batch entry modal opens
- **AC-028**: Given a user with FinancialViewer role, When clicking "View Batch History", Then the batch history page/modal opens
- **AC-029**: Given a user completes HSBC upload, When returning to Contributions page, Then the grid refreshes to show updated contributions
- **AC-030**: Given a user completes batch entry, When returning to Contributions page, Then the grid refreshes to show updated contributions

### Members Page Modifications Acceptance Criteria

- **AC-031**: Given a user on the Members page, When viewing the grid, Then "This Year's Contribution" column is NOT visible
- **AC-032**: Given a member row on Members page, When opening the context menu, Then "View Contributions" action is NOT visible
- **AC-033**: Given a user on the Members page, When performing any other action, Then all existing member management functions work correctly

### Dashboard Modifications Acceptance Criteria

- **AC-034**: Given a user viewing the Dashboard, When the page loads, Then the "Upload HSBC Statement" widget is NOT visible
- **AC-035**: Given a user viewing the Dashboard, When the page loads, Then the "Enter New Batch" widget is NOT visible
- **AC-036**: Given a user viewing the Dashboard, When the page loads, Then the "View Batch History" widget is NOT visible
- **AC-037**: Given a user viewing the Dashboard, When the page loads, Then all other widgets display correctly in updated layout

### Responsive Design Acceptance Criteria

- **AC-038**: Given a user on mobile device, When viewing Contributions page, Then the grid displays appropriately with horizontal scroll if needed
- **AC-039**: Given a user on tablet device, When viewing Contributions page, Then action buttons stack or use overflow menu
- **AC-040**: Given a user on desktop, When resizing browser window, Then the page layout adjusts smoothly

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Component rendering, prop handling, event handlers, data transformation
- **Integration Tests**: Navigation flow, role-based access, API integration, state management
- **End-to-End Tests**: Complete user workflows, cross-page navigation, data consistency

### Testing Frameworks

- **Frontend**: React Testing Library, Jest, MSW (Mock Service Worker) for API mocking
- **Backend**: MSTest, FluentAssertions, Moq, WebApplicationFactory for integration tests
- **E2E**: Playwright or Cypress for full workflow testing

### Test Coverage Requirements

- **Unit Test Coverage**: Minimum 80% for new components
- **Integration Test Coverage**: All API endpoints and role-based access scenarios
- **E2E Test Coverage**: Critical user paths (view contributions, upload HSBC, batch entry)

### Key Test Scenarios

```typescript
// Example Unit Test Structure
describe("ContributionsPage", () => {
  it("should render page header with correct title", () => {});
  it("should render action buttons for FinancialContributor role", () => {});
  it("should NOT render Upload button for FinancialViewer role", () => {});
  it("should render ContributionMemberGrid with correct props", () => {});
});

describe("ContributionMemberGrid", () => {
  it("should render grid with Name, Status, Envelope, Contribution columns", () => {});
  it("should format currency with £ symbol and 2 decimals", () => {});
  it("should handle search filtering correctly", () => {});
  it("should handle sort by contribution amount", () => {});
  it("should open contribution history when action clicked", () => {});
});

// Example Integration Test
describe("Contributions API Authorization", () => {
  it("should allow FinancialViewer to access contributions endpoint", async () => {});
  it("should deny access to user without financial roles", async () => {});
  it("should return 403 for unauthorized direct navigation", async () => {});
});

// Example E2E Test
describe("Contributions User Workflow", () => {
  it("should navigate from Members to Contributions and view member contributions", async () => {
    // 1. Login as FinancialViewer
    // 2. Verify Contributions menu item visible
    // 3. Click Contributions navigation
    // 4. Verify page loads with grid
    // 5. Click View Contributions on a member
    // 6. Verify contribution history dialog opens
  });

  it("should upload HSBC statement and see updated contributions", async () => {
    // 1. Login as FinancialContributor
    // 2. Navigate to Contributions
    // 3. Click Upload HSBC Statement
    // 4. Upload valid CSV file
    // 5. Verify success message
    // 6. Verify grid refreshes with new data
  });
});
```

### CI/CD Integration

- **Automated Test Runs**: On every pull request and merge to main branch
- **Test Reporting**: Generate coverage reports and test results in pipeline
- **Quality Gates**: Minimum 80% coverage required for PR approval
- **Performance Testing**: Monitor page load times and grid rendering performance

## 7. Rationale & Context

### Design Decisions

#### Separation of Concerns

**Decision**: Create a separate Contributions section instead of adding filters to Members page.

**Rationale**:

- Financial data access requires different permissions than member administration
- Reduces cognitive load by focusing each interface on specific tasks
- Allows financial users to work without exposure to sensitive member administration functions
- Enables future expansion of financial features without cluttering member management

#### Column Selection for Contributions Grid

**Decision**: Display only Name, Status, Envelope Number, and This Year's Contribution.

**Rationale**:

- These are the minimum fields needed for contribution viewing and verification
- Envelope Number is critical for matching cash contributions to members
- This Year's Contribution provides immediate insight into giving patterns
- Status indicates if member is active for contribution tracking
- Excludes personal contact info not needed for financial processing

#### Moving Financial Widgets from Dashboard

**Decision**: Consolidate Upload HSBC Statement, Enter New Batch, and View Batch History into Contributions page.

**Rationale**:

- Reduces dashboard clutter for users without financial roles
- Provides context-appropriate location for financial actions
- Users processing contributions can access tools without navigation
- Maintains security by keeping financial tools in role-restricted area

#### Single Action in Grid Context Menu

**Decision**: Include only "View Contributions" in the context menu, excluding member edit/view.

**Rationale**:

- Maintains focus on financial operations
- Prevents confusion between member administration and contribution viewing
- Reduces accidental navigation to member details when working with financial data
- Users needing member details can switch to Members page

### Architectural Considerations

#### Reuse of Existing Components

- ContributionHistoryDialog component reused from Members page
- HSBC upload modal reused from dashboard
- Batch entry and history components reused from dashboard
- Material-UI grid patterns consistent with Members page

#### State Management

- React Query for server state management (consistent with existing patterns)
- Local component state for UI interactions (drawer open/close, filters)
- Navigation state managed by React Router
- Role information from authentication context

#### API Strategy

- New endpoint `/api/contributions/members` for contribution-focused member data
- Reuse existing contribution history endpoint
- Server-side filtering, sorting, and pagination for performance
- Role-based authorization at API level

### User Experience Considerations

#### Progressive Enhancement

- Core functionality works without JavaScript (server-rendered grid)
- Enhanced interactions (sorting, filtering) require JavaScript
- Mobile-first responsive design

#### Accessibility

- Keyboard navigation for all actions
- Screen reader support for grid and dialogs
- High contrast mode support
- Focus management for modal dialogs

#### Performance

- Virtual scrolling for large datasets (if needed)
- Debounced search to reduce API calls
- Optimistic updates for better perceived performance
- Loading states to provide feedback during async operations

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Authentication Service - Required for role-based access control and user identity verification

### Third-Party Services

- **SVC-001**: HSBC Bank API/CSV Import - Existing integration for importing bank statement data
- **SVC-002**: Material-UI Component Library - UI framework for consistent component styling and behavior

### Infrastructure Dependencies

- **INF-001**: ASP.NET Core Web API - Backend API serving contribution data
- **INF-002**: Entity Framework Core - Database access layer for contribution and member data
- **INF-003**: React Router - Client-side routing for navigation between pages
- **INF-004**: FastEndpoints Framework - API endpoint structure and authorization

### Data Dependencies

- **DAT-001**: ChurchMember Database Table - Source of member information
- **DAT-002**: ChurchMemberContributions Table - Source of contribution transaction data
- **DAT-003**: HSBCBankCreditTransactions Table - Source of imported bank transactions
- **DAT-004**: EnvelopeBatches Table - Source of manually entered cash contribution batches
- **DAT-005**: AspNetRoles and AspNetUserRoles Tables - Source of user role assignments

### Technology Platform Dependencies

- **PLT-001**: React 18+ - Frontend framework requirement
- **PLT-002**: TypeScript - Type safety and development experience
- **PLT-003**: .NET 8 - Backend runtime platform
- **PLT-004**: SQL Server - Database platform

### Compliance Dependencies

- **COM-001**: Role-Based Access Control (RBAC) - Financial data access must comply with defined role permissions
- **COM-002**: Data Protection Principles - Financial data must be accessed only by authorized personnel

## 9. Examples & Edge Cases

### Example: Contributions Page for FinancialViewer Role

```tsx
// User sees page with limited actions
<ContributionsPage>
  <PageHeader
    title="Church Member Contributions"
    subtitle="View contribution records, manage financial data, and process transactions"
  >
    {/* FinancialViewer only sees View Batch History button */}
    <Button onClick={handleViewBatchHistory}>View Batch History</Button>
  </PageHeader>

  <ContributionMemberGrid
    columns={["Name", "Status", "Envelope Number", "This Year's Contribution"]}
    onViewContributions={handleViewContributions}
  />
</ContributionsPage>
```

### Example: Grid Row Data Display

```typescript
// Member with contributions
{
  id: 123,
  fullName: "John Smith",
  statusName: "Active",
  statusColor: "success",
  envelopeNumber: "E-045",
  thisYearsContribution: 2450.75 // Displayed as £2,450.75
}

// Member without contributions
{
  id: 456,
  fullName: "Jane Doe",
  statusName: "Active",
  statusColor: "success",
  envelopeNumber: null, // Displayed as empty or "N/A"
  thisYearsContribution: 0.00 // Displayed as £0.00
}

// Inactive member with past contributions
{
  id: 789,
  fullName: "Robert Brown",
  statusName: "Inactive",
  statusColor: "default",
  envelopeNumber: "E-012",
  thisYearsContribution: 0.00 // Displayed as £0.00 (no current year contributions)
}
```

### Example: Navigation Item with Role Check

```typescript
// Sidebar navigation configuration
const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: "/app/dashboard",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <AttendanceIcon />,
    path: "/app/attendance",
  },
  {
    id: "members",
    label: "Members",
    icon: <MembersIcon />,
    path: "/app/members",
  },
  {
    id: "contributions",
    label: "Contributions",
    icon: <AccountBalanceIcon />,
    path: "/app/contributions",
    roles: [
      "FinancialViewer",
      "FinancialContributor",
      "FinancialAdministrator",
      "SystemAdministrator",
    ],
  },
  // ... other items
];

// Navigation item filtering logic
const visibleItems = navigationItems.filter((item) => {
  if (!item.roles) return true; // No role restriction
  return item.roles.some((role) => userRoles.includes(role));
});
```

### Edge Cases

#### Edge Case 1: User with Multiple Roles

**Scenario**: User has both MemberAdministrator and FinancialViewer roles.

**Expected Behavior**:

- User sees both Members and Contributions navigation items
- User can access both pages
- Each page shows appropriate actions for respective permissions
- Members page does NOT show contribution actions
- Contributions page shows only FinancialViewer-level actions

#### Edge Case 2: Member with Null Envelope Number

**Scenario**: Church member has no envelope number assigned.

**Expected Behavior**:

- Grid displays empty cell or "Not Assigned" text
- Sorting by envelope number places nulls at the end
- Search by envelope number does not return members with null values
- Member still appears in grid with other valid data

#### Edge Case 3: Member with Zero Contributions

**Scenario**: Active member has made no contributions in current year.

**Expected Behavior**:

- Grid displays "£0.00" in This Year's Contribution column
- Member still appears in grid (not filtered out)
- Sorting by contribution amount works correctly with zero values
- "View Contributions" action still available but shows empty history for current year

#### Edge Case 4: Year Boundary Transition

**Scenario**: User views Contributions page on January 1st, previous year contributions exist.

**Expected Behavior**:

- This Year's Contribution resets to show only current calendar year
- Previous year totals no longer appear in grid
- Contribution history dialog still shows previous years when date range selected
- No data loss; only current year display changes

#### Edge Case 5: Concurrent HSBC Upload

**Scenario**: Two users upload HSBC statements simultaneously.

**Expected Behavior**:

- Both uploads process successfully (backend handles concurrency)
- Both users see success messages
- Grid refreshes for both users showing combined results
- No duplicate contributions created (backend enforces transaction ID uniqueness)

#### Edge Case 6: Mobile View with Long Names

**Scenario**: Member has very long name on mobile device.

**Expected Behavior**:

- Name column truncates with ellipsis
- Tooltip shows full name on hover/tap
- Grid remains usable with horizontal scroll if needed
- Action menu remains accessible

#### Edge Case 7: User Loses Financial Role

**Scenario**: User is viewing Contributions page when role is revoked.

**Expected Behavior**:

- On next API request, user receives 403 Unauthorized
- Application redirects to unauthorized page with clear message
- Navigation menu updates to remove Contributions item
- User retains access to other authorized pages

#### Edge Case 8: Large Dataset Performance

**Scenario**: Church has 5000+ members in database.

**Expected Behavior**:

- Grid uses server-side pagination (maximum 100 per page)
- Initial load returns only first page of results
- Search and filter performed server-side for performance
- Grid remains responsive with loading indicators during data fetch
- Virtual scrolling may be implemented if client-side performance degrades

## 10. Validation Criteria

### Functional Validation

- **VAL-001**: Navigation item appears only for users with authorized roles
- **VAL-002**: Contributions page loads successfully with correct header and buttons
- **VAL-003**: Grid displays exactly four columns: Name, Status, Envelope Number, This Year's Contribution
- **VAL-004**: Currency values formatted correctly with £ symbol and two decimal places
- **VAL-005**: Context menu contains only "View Contributions" action
- **VAL-006**: Contribution history dialog opens when action clicked
- **VAL-007**: HSBC upload button triggers upload modal
- **VAL-008**: Batch entry button triggers batch entry dialog
- **VAL-009**: Batch history button navigates to/opens batch history view
- **VAL-010**: Members page no longer shows This Year's Contribution column
- **VAL-011**: Members page no longer shows View Contributions action
- **VAL-012**: Dashboard no longer shows removed financial widgets

### Security Validation

- **VAL-013**: FinancialViewer role can access Contributions page
- **VAL-014**: FinancialContributor role can access Contributions page
- **VAL-015**: FinancialAdministrator role can access Contributions page
- **VAL-016**: SystemAdministrator role can access Contributions page
- **VAL-017**: MemberAdministrator role (without financial role) CANNOT access Contributions page
- **VAL-018**: Unauthenticated users CANNOT access Contributions page
- **VAL-019**: API endpoints enforce role-based authorization
- **VAL-020**: Direct URL access without proper role returns 403

### Data Integrity Validation

- **VAL-021**: This Year's Contribution matches sum of current year contributions
- **VAL-022**: Grid data matches underlying database records
- **VAL-023**: Filtering returns correct subset of members
- **VAL-024**: Sorting orders data correctly
- **VAL-025**: Pagination returns correct pages without duplicates or gaps

### UI/UX Validation

- **VAL-026**: Page layout matches Members page design pattern
- **VAL-027**: Grid is fully responsive on mobile, tablet, and desktop
- **VAL-028**: Action buttons display correctly for each role level
- **VAL-029**: Loading states display during async operations
- **VAL-030**: Error messages display clearly when operations fail
- **VAL-031**: Success messages confirm completed actions
- **VAL-032**: Keyboard navigation works for all interactive elements
- **VAL-033**: Screen readers can access all content and actions

### Performance Validation

- **VAL-034**: Page initial load completes within 2 seconds
- **VAL-035**: Grid sorting completes within 1 second
- **VAL-036**: Grid filtering completes within 1 second
- **VAL-037**: Pagination navigation completes within 500ms
- **VAL-038**: No memory leaks during repeated navigation
- **VAL-039**: Grid handles 1000+ members without performance degradation

### Regression Validation

- **VAL-040**: All existing Members page functionality remains operational
- **VAL-041**: All existing Dashboard widgets (non-financial) remain operational
- **VAL-042**: Contribution calculation logic unchanged
- **VAL-043**: No breaking changes to API contracts
- **VAL-044**: Existing tests continue to pass

## 11. Related Specifications / Further Reading

### Related Specifications

- [Church Members Management Feature Specification](church-members-spec.md) - Base member management functionality
- [Church Member Contributions Processing and Tracking](member-contributions-spec.md) - Contribution data processing and calculation
- [HSBC Bank Statement Import](hsbc-transactions-spec.md) - HSBC statement upload and transaction processing
- [Envelope Contribution Batch Processing](envelope-contribution-spec.md) - Manual batch entry for cash contributions

### Technical Documentation

- [Material-UI Data Grid Documentation](https://mui.com/x/react-data-grid/) - Component library for grid implementation
- [React Router Documentation](https://reactrouter.com/) - Client-side routing patterns
- [FastEndpoints Authorization](https://fast-endpoints.com/docs/security) - Backend authorization patterns
- [ASP.NET Core Role-Based Authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/roles) - Role-based access control

### Design Resources

- Application Theme and Style Guide (internal)
- Church Register UX Patterns (internal)
- Accessibility Guidelines (WCAG 2.1 Level AA)
