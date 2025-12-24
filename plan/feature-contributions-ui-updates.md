---
goal: Implement Dedicated Contributions UI with Role-Based Financial Management Interface
version: 1.0
date_created: 2024-12-24
last_updated: 2024-12-24
owner: Church Register Development Team
status: "Planned"
tags: [feature, ui, financial, contributions, navigation, react, typescript]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan defines the step-by-step process for creating a dedicated "Contributions" section in the Church Register application. The feature will provide a focused, role-restricted interface for viewing and managing church member contributions, consolidating financial management actions from the dashboard, and maintaining separation of concerns between member administration and financial operations.

The implementation follows the specification defined in [contributions-ui-updates-spec.md](../spec/contributions-ui-updates-spec.md) and will be executed in multiple phases to ensure systematic delivery and testing.

## 1. Requirements & Constraints

### Core Requirements

- **REQ-001**: Create new Contributions navigation item visible only to financial roles (FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministrator)
- **REQ-002**: Implement Contributions page with dedicated grid showing Name, Status, Envelope Number, This Year's Contribution
- **REQ-003**: Move "Upload HSBC Statement", "Enter New Batch", and "View Batch History" buttons from Dashboard to Contributions page header
- **REQ-004**: Remove "This Year's Contribution" column and "View Contributions" action from Members page
- **REQ-005**: Remove financial widgets from Dashboard page
- **REQ-006**: Implement role-based button visibility (FinancialViewer sees only View Batch History; FinancialContributor/Administrator see all buttons)
- **REQ-007**: Maintain existing ContributionHistoryDialog component functionality
- **REQ-008**: Ensure all changes maintain existing functionality in Members and Dashboard pages

### Security Requirements

- **SEC-001**: Enforce role-based access at both route and API levels
- **SEC-002**: Redirect unauthorized users to 403 Unauthorized page when accessing /app/contributions
- **SEC-003**: Hide navigation item from users without financial roles
- **SEC-004**: Validate user roles on all contribution-related API endpoints

### Technical Constraints

- **CON-001**: Must not modify existing API contracts or database schema
- **CON-002**: Must maintain backward compatibility with existing financial components
- **CON-003**: Must follow existing Material-UI and React patterns in the codebase
- **CON-004**: Must use TypeScript for all new components with proper type definitions
- **CON-005**: Must not introduce breaking changes to Members or Dashboard pages

### UI/UX Guidelines

- **GUD-001**: Follow existing grid layout patterns from ChurchMembersPage
- **GUD-002**: Maintain consistent styling with Material-UI theme
- **GUD-003**: Ensure responsive design for mobile, tablet, and desktop
- **GUD-004**: Provide appropriate loading states and error handling
- **GUD-005**: Use existing component libraries and avoid duplication

### Performance Constraints

- **PERF-001**: Grid must load within 2 seconds for datasets up to 1000 members
- **PERF-002**: Use server-side pagination, filtering, and sorting
- **PERF-003**: Avoid client-side calculation of contribution totals

## 2. Implementation Steps

### Implementation Phase 1: Backend API Preparation

**GOAL-001**: Ensure backend API endpoints exist and support contribution-focused member data retrieval with proper role-based authorization

| Task     | Description                                                                                                                                                                                                                                                                     | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Verify existing `/api/contributions/members` endpoint or create new endpoint in `ChurchRegister.ApiService/Endpoints/Financial/` to return ContributionMemberDto with fields: id, firstName, lastName, statusId, statusName, statusColor, envelopeNumber, thisYearsContribution | ✅        | 2024-12-24 |
| TASK-002 | Ensure endpoint supports query parameters: page, pageSize, searchTerm, statusFilter, sortBy, sortDirection                                                                                                                                                                      | ✅        | 2024-12-24 |
| TASK-003 | Add role-based authorization to endpoint requiring one of: FinancialViewer, FinancialContributor, FinancialAdministrator, SystemAdministration (use `Roles()` method in FastEndpoints)                                                                                          | ✅        | 2024-12-24 |
| TASK-004 | Verify endpoint returns paginated response with: data array, totalCount, page, pageSize, totalPages                                                                                                                                                                             | ✅        | 2024-12-24 |
| TASK-005 | Test endpoint with Postman or similar tool to verify role enforcement and data structure                                                                                                                                                                                        | ✅        | 2024-12-24 |
| TASK-006 | Document API endpoint in code comments with example request/response                                                                                                                                                                                                            | ✅        | 2024-12-24 |

### Implementation Phase 2: TypeScript Types and Interfaces

**GOAL-002**: Define all TypeScript interfaces and types for contributions feature to ensure type safety across components

| Task     | Description                                                                                                                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Create `ChurchRegister.React/src/types/contributions.ts` file if it doesn't exist                                                                                                                                                                              | ✅        | 2024-12-24 |
| TASK-008 | Define `ContributionMemberDto` interface with properties: id (number), firstName (string), lastName (string), fullName (string), statusId (number), statusName (string), statusColor (string), envelopeNumber (string \| null), thisYearsContribution (number) | ✅        | 2024-12-24 |
| TASK-009 | Define `ContributionGridQuery` interface with properties: page (number), pageSize (number), searchTerm? (string), statusFilter? (number), sortBy? (string), sortDirection? ('asc' \| 'desc'), envelopeNumberFilter? (string)                                   | ✅        | 2024-12-24 |
| TASK-010 | Define `ContributionGridResponse` interface with properties: data (ContributionMemberDto[]), totalCount (number), page (number), pageSize (number), totalPages (number)                                                                                        | ✅        | 2024-12-24 |
| TASK-011 | Define `ContributionMemberGridProps` interface with properties: onViewContributions ((member: ContributionMemberDto) => void), initialQuery? (Partial<ContributionGridQuery>)                                                                                  | ✅        | 2024-12-24 |
| TASK-012 | Define `FinancialActionsHeaderProps` interface with properties: onUploadHsbc (() => void), onEnterBatch (() => void), onViewBatchHistory (() => void), userRoles (string[])                                                                                    | ✅        | 2024-12-24 |
| TASK-013 | Export all interfaces from `ChurchRegister.React/src/types/index.ts`                                                                                                                                                                                           | ✅        | 2024-12-24 |

### Implementation Phase 3: API Service Layer

**GOAL-003**: Create API service functions for fetching contribution member data with proper error handling and type safety

| Task     | Description                                                                                                                                                                         | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-014 | Create `ChurchRegister.React/src/services/api/contributionsApi.ts` file                                                                                                             | ✅        | 2024-12-24 |
| TASK-015 | Import axios instance from existing API configuration and contribution types                                                                                                        | ✅        | 2024-12-24 |
| TASK-016 | Implement `getContributionMembers(query: ContributionGridQuery): Promise<ContributionGridResponse>` function that calls `/api/contributions/members` endpoint with query parameters | ✅        | 2024-12-24 |
| TASK-017 | Add proper error handling with try-catch and meaningful error messages                                                                                                              | ✅        | 2024-12-24 |
| TASK-018 | Add request/response logging for debugging (conditional on environment)                                                                                                             | ✅        | 2024-12-24 |
| TASK-019 | Export contributionsApi object with all methods                                                                                                                                     | ✅        | 2024-12-24 |
| TASK-020 | Update `ChurchRegister.React/src/services/api/index.ts` to export contributionsApi                                                                                                  | ✅        | 2024-12-24 |

### Implementation Phase 4: Contributions Member Grid Component

**GOAL-004**: Create reusable ContributionMemberGrid component following existing ChurchMemberGrid patterns with contribution-specific columns

| Task     | Description                                                                                                                                                                                                                                                                                                                                                           | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-021 | Create `ChurchRegister.React/src/components/Contributions/ContributionMemberGrid.tsx` file                                                                                                                                                                                                                                                                            | ✅        | 2024-12-24 |
| TASK-022 | Import required dependencies: React, DataGrid components from @mui/x-data-grid, Material-UI components, React Query, contribution types, contributionsApi                                                                                                                                                                                                             | ✅        | 2024-12-24 |
| TASK-023 | Implement ContributionMemberGrid component with props from ContributionMemberGridProps interface                                                                                                                                                                                                                                                                      | ✅        | 2024-12-24 |
| TASK-024 | Add state management for pagination (page, pageSize), sorting (sortModel), filtering (searchTerm, statusFilter)                                                                                                                                                                                                                                                       | ✅        | 2024-12-24 |
| TASK-025 | Implement React Query hook (useQuery) to fetch contribution members data with proper cache key including all query parameters                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-026 | Define DataGrid columns array with 4 columns: Name (field: 'fullName', width: 250, sortable), Status (field: 'statusName', width: 150, renderCell with colored Chip), Envelope Number (field: 'envelopeNumber', width: 180, sortable), This Year's Contribution (field: 'thisYearsContribution', width: 200, sortable, renderCell with currency formatting £X,XXX.XX) | ✅        | 2024-12-24 |
| TASK-027 | Add Actions column with GridActionsCellItem for "View Contributions" using MoreVert icon and Menu component                                                                                                                                                                                                                                                           | ✅        | 2024-12-24 |
| TASK-028 | Implement handleViewContributions function that calls onViewContributions prop with selected member                                                                                                                                                                                                                                                                   | ✅        | 2024-12-24 |
| TASK-029 | Add search TextField above grid with debounced onChange handler (300ms delay)                                                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-030 | Add status filter Select dropdown above grid matching Members page pattern                                                                                                                                                                                                                                                                                            | ✅        | 2024-12-24 |
| TASK-031 | Implement pagination controls using DataGrid's built-in pagination with rowsPerPageOptions: [10, 20, 50, 100]                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-032 | Add loading state display with LinearProgress component when query is loading                                                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-033 | Add error state display with Alert component when query fails                                                                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-034 | Add empty state display when no data returned                                                                                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-035 | Style component with Material-UI sx prop matching ChurchMemberGrid aesthetics                                                                                                                                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-036 | Add comprehensive TypeScript types and JSDoc comments                                                                                                                                                                                                                                                                                                                 | ✅        | 2024-12-24 |

### Implementation Phase 5: Financial Actions Header Component

**GOAL-005**: Create reusable header component with financial action buttons (Upload HSBC, Enter Batch, View History) with role-based visibility

| Task     | Description                                                                                                                                                                           | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-037 | Create `ChurchRegister.React/src/components/Contributions/FinancialActionsHeader.tsx` file                                                                                            | ✅        | 2024-12-24 |
| TASK-038 | Import required dependencies: React, Material-UI Box, Button, Stack components, icons (CloudUpload, AddCircle, History)                                                               | ✅        | 2024-12-24 |
| TASK-039 | Implement FinancialActionsHeader component with props from FinancialActionsHeaderProps interface                                                                                      | ✅        | 2024-12-24 |
| TASK-040 | Create helper function `canUploadOrEnterBatch(userRoles: string[]): boolean` that returns true if roles include FinancialContributor, FinancialAdministrator, or SystemAdministration | ✅        | 2024-12-24 |
| TASK-041 | Create helper function `canViewBatchHistory(userRoles: string[]): boolean` that returns true if roles include any financial role                                                      | ✅        | 2024-12-24 |
| TASK-042 | Render Stack component with direction="row" and spacing={2} for horizontal button layout                                                                                              | ✅        | 2024-12-24 |
| TASK-043 | Conditionally render "Upload HSBC Statement" Button (variant="contained", startIcon={CloudUploadIcon}) if canUploadOrEnterBatch returns true, onClick calls onUploadHsbc prop         | ✅        | 2024-12-24 |
| TASK-044 | Conditionally render "Enter New Batch" Button (variant="contained", startIcon={AddCircleIcon}) if canUploadOrEnterBatch returns true, onClick calls onEnterBatch prop                 | ✅        | 2024-12-24 |
| TASK-045 | Conditionally render "View Batch History" Button (variant="outlined", startIcon={HistoryIcon}) if canViewBatchHistory returns true, onClick calls onViewBatchHistory prop             | ✅        | 2024-12-24 |
| TASK-046 | Add responsive styling with sx prop: buttons wrap to multiple rows on mobile (flexWrap: 'wrap')                                                                                       | ✅        | 2024-12-24 |
| TASK-047 | Add TypeScript types and JSDoc comments                                                                                                                                               | ✅        | 2024-12-24 |

### Implementation Phase 6: Contributions Page Component

**GOAL-006**: Create main ContributionsPage component integrating grid, header actions, and contribution history dialog with role-based access

| Task     | Description                                                                                                                                                                                                                              | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-048 | Create `ChurchRegister.React/src/pages/Financial/ContributionsPage.tsx` file (create Financial directory if needed)                                                                                                                      | ✅        | 2024-12-24 |
| TASK-049 | Import required dependencies: React, Material-UI components (Box, Typography, CircularProgress), useAuth hook, ContributionMemberGrid, FinancialActionsHeader, ContributionHistoryDialog, HsbcUploadModal, EnvelopeBatchEntry components | ✅        | 2024-12-24 |
| TASK-050 | Implement ContributionsPage functional component with no props                                                                                                                                                                           | ✅        | 2024-12-24 |
| TASK-051 | Use useAuth hook to get current user's roles array                                                                                                                                                                                       | ✅        | 2024-12-24 |
| TASK-052 | Add state for contribution history dialog: contributionDialogOpen (boolean), selectedMember (ContributionMemberDto \| null)                                                                                                              | ✅        | 2024-12-24 |
| TASK-053 | Add state for HSBC upload modal: hsbcUploadModalOpen (boolean)                                                                                                                                                                           | ✅        | 2024-12-24 |
| TASK-054 | Add state for batch entry: batchEntryOpen (boolean)                                                                                                                                                                                      | ✅        | 2024-12-24 |
| TASK-055 | Implement handleViewContributions function that sets selectedMember and opens contribution dialog                                                                                                                                        | ✅        | 2024-12-24 |
| TASK-056 | Implement handleUploadHsbc function that opens HSBC upload modal                                                                                                                                                                         | ✅        | 2024-12-24 |
| TASK-057 | Implement handleEnterBatch function that opens/navigates to batch entry                                                                                                                                                                  | ✅        | 2024-12-24 |
| TASK-058 | Implement handleViewBatchHistory function that navigates to /app/financial/envelope-contributions/history                                                                                                                                | ✅        | 2024-12-24 |
| TASK-059 | Implement handleCloseContributionDialog function that closes dialog and resets selectedMember                                                                                                                                            | ✅        | 2024-12-24 |
| TASK-060 | Implement handleHsbcUploadSuccess function that closes modal and triggers grid refresh via React Query invalidation                                                                                                                      | ✅        | 2024-12-24 |
| TASK-061 | Render page layout: Box container with padding (py: 2, px: { xs: 2, sm: 3, md: 4 })                                                                                                                                                      | ✅        | 2024-12-24 |
| TASK-062 | Render page header: Box with flexbox (display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start')                                                                                                                        | ✅        | 2024-12-24 |
| TASK-063 | Render header left section: Typography h4 "Church Member Contributions" and subtitle "View contribution records, manage financial data, and process transactions"                                                                        | ✅        | 2024-12-24 |
| TASK-064 | Render header right section: FinancialActionsHeader component with userRoles prop and event handlers                                                                                                                                     | ✅        | 2024-12-24 |
| TASK-065 | Render ContributionMemberGrid component with onViewContributions prop and initialQuery for default sorting                                                                                                                               | ✅        | 2024-12-24 |
| TASK-066 | Render ContributionHistoryDialog component with open, onClose, memberId, and memberName props                                                                                                                                            | ✅        | 2024-12-24 |
| TASK-067 | Render HsbcUploadModal component with open, onClose, and onSuccess props                                                                                                                                                                 | ✅        | 2024-12-24 |
| TASK-068 | Add error boundary wrapper for graceful error handling                                                                                                                                                                                   | ✅        | 2024-12-24 |
| TASK-069 | Add comprehensive TypeScript types and JSDoc comments                                                                                                                                                                                    | ✅        | 2024-12-24 |
| TASK-070 | Export ContributionsPage as default export                                                                                                                                                                                               | ✅        | 2024-12-24 |

### Implementation Phase 7: Navigation Integration

**GOAL-007**: Add Contributions navigation item to sidebar with role-based visibility and routing configuration

| Task     | Description                                                                                                                                                                                                                                                                                              | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-071 | Open `ChurchRegister.React/src/components/Layout/Sidebar.tsx` file                                                                                                                                                                                                                                       | ✅        | 2024-12-24 |
| TASK-072 | Import AccountBalanceIcon from '@mui/icons-material'                                                                                                                                                                                                                                                     | ✅        | 2024-12-24 |
| TASK-073 | Add new NavigationItem to defaultNavigationItems array after 'members' item with properties: id: 'contributions', label: 'Contributions', icon: <AccountBalanceIcon />, path: '/app/contributions', roles: ['FinancialViewer', 'FinancialContributor', 'FinancialAdministrator', 'SystemAdministration'] | ✅        | 2024-12-24 |
| TASK-074 | Update renderNavigationList function to check item.roles and filter based on user's current roles (integrate with auth context)                                                                                                                                                                          | ✅        | 2024-12-24 |
| TASK-075 | Verify navigation item only renders for users with financial roles                                                                                                                                                                                                                                       | ✅        | 2024-12-24 |
| TASK-076 | Test navigation item click navigates to /app/contributions                                                                                                                                                                                                                                               | ✅        | 2024-12-24 |

### Implementation Phase 8: Routing Configuration

**GOAL-008**: Configure React Router to handle /app/contributions route with role-based protection

| Task     | Description                                                                                                                                                              | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-077 | Open `ChurchRegister.React/src/App.tsx` file                                                                                                                             | ✅        | 2024-12-24 |
| TASK-078 | Import ContributionsPage component from './pages/Financial/ContributionsPage'                                                                                            | ✅        | 2024-12-24 |
| TASK-079 | Add new Route element in the /app Routes section after members route with path="contributions"                                                                           | ✅        | 2024-12-24 |
| TASK-080 | Wrap Route with ProtectedFinancialRoute component with requiredRoles prop: ['SystemAdministration', 'FinancialViewer', 'FinancialContributor', 'FinancialAdministrator'] | ✅        | 2024-12-24 |
| TASK-081 | Set featureName prop to "contributions management" for clear error messages                                                                                              | ✅        | 2024-12-24 |
| TASK-082 | Verify route renders ContributionsPage component as child                                                                                                                | ✅        | 2024-12-24 |
| TASK-083 | Test route protection: unauthorized users redirected to /error/unauthorized                                                                                              | ✅        | 2024-12-24 |

### Implementation Phase 9: Remove Contributions from Members Page

**GOAL-009**: Remove This Year's Contribution column and View Contributions action from ChurchMembersPage grid

| Task     | Description                                                                                                | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-084 | Open `ChurchRegister.React/src/components/ChurchMembers/ChurchMemberGrid.tsx` file                         | ✅        | 2024-12-24 |
| TASK-085 | Locate columns definition array in ChurchMemberGrid component                                              | ✅        | 2024-12-24 |
| TASK-086 | Remove column definition for 'thisYearsContribution' field (entire column object)                          | ✅        | 2024-12-24 |
| TASK-087 | Locate Actions column GridActionsCellItem array                                                            | ✅        | 2024-12-24 |
| TASK-088 | Remove "View Contributions" GridActionsCellItem (icon: AccountBalanceIcon, label: 'View Contributions')    | ✅        | 2024-12-24 |
| TASK-089 | Remove associated state and handler functions for contribution history dialog if only used for this action | ✅        | 2024-12-24 |
| TASK-090 | Test ChurchMemberGrid renders without This Year's Contribution column                                      | ✅        | 2024-12-24 |
| TASK-091 | Test Actions menu does not show View Contributions option                                                  | ✅        | 2024-12-24 |
| TASK-092 | Verify all other grid functionality remains intact (Edit, View Details, etc.)                              | ✅        | 2024-12-24 |

### Implementation Phase 10: Remove Financial Widgets from Dashboard

**GOAL-010**: Remove Upload HSBC Statement, Enter New Batch, and View Batch History widgets from DashboardPage

| Task     | Description                                                                                                | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-093 | Open `ChurchRegister.React/src/pages/DashboardPage.tsx` file                                               | ✅        | 2024-12-24 |
| TASK-094 | Locate BankStatementImportWidget component rendering (likely in a grid or card layout)                     | ✅        | 2024-12-24 |
| TASK-095 | Remove <BankStatementImportWidget /> JSX element and surrounding Box/Grid wrapper                          | ✅        | 2024-12-24 |
| TASK-096 | Locate EnvelopeContributionWidget component rendering                                                      | ✅        | 2024-12-24 |
| TASK-097 | Remove <EnvelopeContributionWidget /> JSX element and surrounding Box/Grid wrapper                         | ✅        | 2024-12-24 |
| TASK-098 | Locate any standalone "View Batch History" button or widget                                                | ✅        | 2024-12-24 |
| TASK-099 | Remove View Batch History widget/button element                                                            | ✅        | 2024-12-24 |
| TASK-100 | Remove imports for BankStatementImportWidget and EnvelopeContributionWidget from component file            | ✅        | 2024-12-24 |
| TASK-101 | Adjust grid layout (Grid container, Grid items) to accommodate removed widgets and maintain visual balance | ✅        | 2024-12-24 |
| TASK-102 | Test Dashboard page loads without errors                                                                   | ✅        | 2024-12-24 |
| TASK-103 | Verify remaining widgets display correctly in updated layout                                               | ✅        | 2024-12-24 |
| TASK-104 | Verify no broken references or unused state related to removed widgets                                     | ✅        | 2024-12-24 |

### Implementation Phase 11: Component Index Files and Exports

**GOAL-011**: Update index files to export new components for clean imports across application

| Task     | Description                                                                                               | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-105 | Create or update `ChurchRegister.React/src/components/Contributions/index.ts` file                        | ✅        | 2024-12-24 |
| TASK-106 | Export ContributionMemberGrid and FinancialActionsHeader from index.ts                                    | ✅        | 2024-12-24 |
| TASK-107 | Update `ChurchRegister.React/src/pages/Financial/index.ts` (create if needed) to export ContributionsPage | ✅        | 2024-12-24 |
| TASK-108 | Update main pages index `ChurchRegister.React/src/pages/index.ts` to include Financial page exports       | ✅        | 2024-12-24 |

### Implementation Phase 12: Unit Testing - Components

**GOAL-012**: Write comprehensive unit tests for new Contributions components using React Testing Library and Jest

| Task     | Description                                                                                               | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-109 | Create `ChurchRegister.React/src/components/Contributions/__tests__/ContributionMemberGrid.test.tsx` file |           |      |
| TASK-110 | Write test: "renders grid with correct columns (Name, Status, Envelope Number, This Year's Contribution)" |           |      |
| TASK-111 | Write test: "formats currency with £ symbol and 2 decimal places"                                         |           |      |
| TASK-112 | Write test: "handles search input with debounce"                                                          |           |      |
| TASK-113 | Write test: "handles status filter selection"                                                             |           |      |
| TASK-114 | Write test: "calls onViewContributions when action clicked"                                               |           |      |
| TASK-115 | Write test: "displays loading state when fetching data"                                                   |           |      |
| TASK-116 | Write test: "displays error message when API call fails"                                                  |           |      |
| TASK-117 | Write test: "displays empty state when no data returned"                                                  |           |      |
| TASK-118 | Create `ChurchRegister.React/src/components/Contributions/__tests__/FinancialActionsHeader.test.tsx` file |           |      |
| TASK-119 | Write test: "renders all three buttons for FinancialContributor role"                                     |           |      |
| TASK-120 | Write test: "renders only View Batch History button for FinancialViewer role"                             |           |      |
| TASK-121 | Write test: "renders no buttons for non-financial roles"                                                  |           |      |
| TASK-122 | Write test: "calls appropriate handler when buttons clicked"                                              |           |      |
| TASK-123 | Create `ChurchRegister.React/src/pages/Financial/__tests__/ContributionsPage.test.tsx` file               |           |      |
| TASK-124 | Write test: "renders page header with correct title and subtitle"                                         |           |      |
| TASK-125 | Write test: "renders ContributionMemberGrid component"                                                    |           |      |
| TASK-126 | Write test: "renders FinancialActionsHeader for authorized roles"                                         |           |      |
| TASK-127 | Write test: "opens contribution history dialog when View Contributions clicked"                           |           |      |
| TASK-128 | Write test: "opens HSBC upload modal when Upload button clicked"                                          |           |      |

### Implementation Phase 13: Integration Testing

**GOAL-013**: Write integration tests for navigation, routing, and role-based access control

| Task     | Description                                                                                                | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-129 | Create `ChurchRegister.React/src/__tests__/integration/contributions-navigation.test.tsx` file             |           |      |
| TASK-130 | Write test: "FinancialViewer can see Contributions nav item and access page"                               |           |      |
| TASK-131 | Write test: "FinancialContributor can see Contributions nav item and access page"                          |           |      |
| TASK-132 | Write test: "FinancialAdministrator can see Contributions nav item and access page"                        |           |      |
| TASK-133 | Write test: "User without financial roles cannot see Contributions nav item"                               |           |      |
| TASK-134 | Write test: "User without financial roles is redirected to 403 when accessing /app/contributions directly" |           |      |
| TASK-135 | Write test: "Navigation from Members to Contributions works correctly"                                     |           |      |
| TASK-136 | Write test: "Upload HSBC button works and refreshes grid on success"                                       |           |      |
| TASK-137 | Write test: "Enter Batch button navigates to batch entry"                                                  |           |      |
| TASK-138 | Write test: "View Batch History button navigates to history page"                                          |           |      |

### Implementation Phase 14: End-to-End Testing

**GOAL-014**: Create comprehensive E2E tests for complete user workflows using Playwright or Cypress

| Task     | Description                                                                                                                                                                                                                                                                                                             | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-139 | Create `ChurchRegister.React/e2e/contributions-workflow.spec.ts` file                                                                                                                                                                                                                                                   |           |      |
| TASK-140 | Write E2E test: "FinancialViewer user flow: login, navigate to Contributions, view member contributions" - Steps: 1) Login as FinancialViewer, 2) Verify Contributions menu visible, 3) Click Contributions, 4) Verify grid loads with data, 5) Click View Contributions on member, 6) Verify dialog opens with history |           |      |
| TASK-141 | Write E2E test: "FinancialContributor user flow: upload HSBC statement and verify grid updates" - Steps: 1) Login as FinancialContributor, 2) Navigate to Contributions, 3) Click Upload HSBC Statement, 4) Upload valid CSV, 5) Verify success message, 6) Verify grid refreshes with new data                         |           |      |
| TASK-142 | Write E2E test: "Members page no longer shows contribution data" - Steps: 1) Login as authorized user, 2) Navigate to Members, 3) Verify This Year's Contribution column not present, 4) Open action menu, 5) Verify View Contributions not present                                                                     |           |      |
| TASK-143 | Write E2E test: "Dashboard no longer shows financial widgets" - Steps: 1) Login, 2) Navigate to Dashboard, 3) Verify Upload HSBC widget not present, 4) Verify Enter Batch widget not present, 5) Verify View History widget not present                                                                                |           |      |
| TASK-144 | Write E2E test: "Unauthorized access handling" - Steps: 1) Login as non-financial user, 2) Attempt direct navigation to /app/contributions, 3) Verify 403 page displayed                                                                                                                                                |           |      |

### Implementation Phase 15: Documentation and Code Cleanup

**GOAL-015**: Complete documentation, code comments, and cleanup for production readiness

| Task     | Description                                                                           | Completed | Date |
| -------- | ------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-145 | Add comprehensive JSDoc comments to all new component functions and interfaces        |           |      |
| TASK-146 | Add inline code comments for complex logic (e.g., role checking, currency formatting) |           |      |
| TASK-147 | Update README.md or developer documentation with new Contributions feature overview   |           |      |
| TASK-148 | Document new API endpoints in API documentation (e.g., Swagger/OpenAPI comments)      |           |      |
| TASK-149 | Remove any console.log statements or debugging code                                   |           |      |
| TASK-150 | Remove unused imports from all modified files                                         |           |      |
| TASK-151 | Run ESLint and fix all linting errors/warnings in new and modified files              |           |      |
| TASK-152 | Run Prettier to format all new and modified files consistently                        |           |      |
| TASK-153 | Verify all TypeScript compilation succeeds with no errors                             |           |      |

### Implementation Phase 16: Manual QA and User Acceptance Testing

**GOAL-016**: Perform thorough manual testing across all browsers and devices before deployment

| Task     | Description                                                                                                   | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-154 | Test Contributions page in Chrome desktop: verify all functionality (grid, search, filters, actions, buttons) |           |      |
| TASK-155 | Test Contributions page in Firefox desktop: verify all functionality                                          |           |      |
| TASK-156 | Test Contributions page in Safari desktop: verify all functionality                                           |           |      |
| TASK-157 | Test Contributions page in Edge desktop: verify all functionality                                             |           |      |
| TASK-158 | Test Contributions page on mobile Chrome (iOS): verify responsive layout and touch interactions               |           |      |
| TASK-159 | Test Contributions page on mobile Safari (iOS): verify responsive layout and touch interactions               |           |      |
| TASK-160 | Test Contributions page on mobile Chrome (Android): verify responsive layout                                  |           |      |
| TASK-161 | Test role-based access: verify FinancialViewer sees limited buttons                                           |           |      |
| TASK-162 | Test role-based access: verify FinancialContributor sees all buttons                                          |           |      |
| TASK-163 | Test role-based access: verify unauthorized user cannot access page                                           |           |      |
| TASK-164 | Test navigation flow: Dashboard → Contributions → View Contributions → Back                                   |           |      |
| TASK-165 | Test HSBC upload workflow: Upload → Success → Grid Refresh                                                    |           |      |
| TASK-166 | Test batch entry workflow: Enter Batch → Save → Return to Contributions                                       |           |      |
| TASK-167 | Test Members page: verify This Year's Contribution column removed                                             |           |      |
| TASK-168 | Test Members page: verify View Contributions action removed                                                   |           |      |
| TASK-169 | Test Dashboard: verify financial widgets removed and layout correct                                           |           |      |
| TASK-170 | Test grid sorting: verify ascending/descending on all columns                                                 |           |      |
| TASK-171 | Test grid filtering: verify search by name and status filter work correctly                                   |           |      |
| TASK-172 | Test grid pagination: verify page size changes and page navigation                                            |           |      |
| TASK-173 | Test currency formatting: verify £ symbol and 2 decimal places display correctly                              |           |      |
| TASK-174 | Test error scenarios: verify error messages display for API failures                                          |           |      |
| TASK-175 | Test loading states: verify spinners/progress indicators during async operations                              |           |      |
| TASK-176 | Verify keyboard navigation: tab through all interactive elements                                              |           |      |
| TASK-177 | Verify screen reader compatibility: test with NVDA or JAWS                                                    |           |      |

### Implementation Phase 17: Performance Testing and Optimization

**GOAL-017**: Validate performance requirements and optimize if necessary

| Task     | Description                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-178 | Measure Contributions page initial load time with empty cache: should be < 2 seconds                   |           |      |
| TASK-179 | Measure grid rendering time with 1000 members: should be performant with pagination                    |           |      |
| TASK-180 | Measure search debounce effectiveness: verify API calls reduced with typing                            |           |      |
| TASK-181 | Measure grid sort performance: should complete < 1 second                                              |           |      |
| TASK-182 | Measure grid filter performance: should complete < 1 second                                            |           |      |
| TASK-183 | Test memory usage: navigate between pages multiple times, verify no memory leaks with browser DevTools |           |      |
| TASK-184 | Optimize bundle size if necessary: analyze with webpack-bundle-analyzer                                |           |      |
| TASK-185 | Verify React Query cache is working correctly: check network tab for unnecessary API calls             |           |      |

### Implementation Phase 18: Deployment Preparation

**GOAL-018**: Prepare feature for production deployment with proper configurations and rollback plans

| Task     | Description                                                                     | Completed | Date |
| -------- | ------------------------------------------------------------------------------- | --------- | ---- |
| TASK-186 | Create feature flag for Contributions feature (if using feature flag system)    |           |      |
| TASK-187 | Update production configuration files (appsettings.Production.json) if needed   |           |      |
| TASK-188 | Verify database migrations are not required (no schema changes)                 |           |      |
| TASK-189 | Create deployment checklist document with rollback procedures                   |           |      |
| TASK-190 | Tag code repository with version number for this release                        |           |      |
| TASK-191 | Create release notes documenting new Contributions feature and removed features |           |      |
| TASK-192 | Notify stakeholders (admins, financial users) of upcoming changes               |           |      |
| TASK-193 | Prepare user training materials or documentation for new Contributions section  |           |      |
| TASK-194 | Schedule deployment window with low user traffic                                |           |      |

### Implementation Phase 19: Production Deployment

**GOAL-019**: Deploy feature to production environment with monitoring and validation

| Task     | Description                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------- | --------- | ---- |
| TASK-195 | Deploy backend API changes to production (if any new endpoints created)       |           |      |
| TASK-196 | Deploy frontend React application to production                               |           |      |
| TASK-197 | Verify production deployment successful: check application logs for errors    |           |      |
| TASK-198 | Smoke test production: login as FinancialViewer and access Contributions page |           |      |
| TASK-199 | Smoke test production: verify Members page shows no contribution column       |           |      |
| TASK-200 | Smoke test production: verify Dashboard shows no financial widgets            |           |      |
| TASK-201 | Monitor application performance metrics for first 24 hours                    |           |      |
| TASK-202 | Monitor error logs and user feedback for first week                           |           |      |
| TASK-203 | Conduct post-deployment review meeting with team                              |           |      |

## 3. Alternatives

### Alternative Approaches Considered

- **ALT-001**: **Add financial filters to existing Members page instead of separate Contributions page**

  - **Reason Not Chosen**: Would mix administrative and financial concerns; doesn't provide clear role-based separation; clutters Members interface with role-specific features; makes permission management more complex

- **ALT-002**: **Keep financial widgets on Dashboard with role-based visibility**

  - **Reason Not Chosen**: Dashboard becomes cluttered for users without financial roles; financial users still need to navigate away from context to view contributions; doesn't provide dedicated workspace for financial operations

- **ALT-003**: **Create modal/dialog for contributions instead of dedicated page**

  - **Reason Not Chosen**: Limited screen real estate for complex grid operations; poor user experience for primary financial workflow; doesn't support bookmarking or direct navigation; harder to implement robust filtering and sorting

- **ALT-004**: **Use tabs within Members page (Members tab, Contributions tab)**

  - **Reason Not Chosen**: Increases cognitive load with tab switching; doesn't enforce role-based access cleanly; makes navigation state management complex; conflicts with existing Members page structure

- **ALT-005**: **Implement contributions as sub-menu under Financial in navigation**
  - **Reason Not Chosen**: Adds navigation hierarchy complexity; requires multi-level menu implementation; less discoverable for users; doesn't align with existing flat navigation structure

## 4. Dependencies

### External Dependencies

- **DEP-001**: Material-UI (MUI) v5+ - Component library for UI elements, DataGrid, icons
- **DEP-002**: @mui/x-data-grid - Advanced data grid component with sorting, filtering, pagination
- **DEP-003**: React Router v6+ - Client-side routing for navigation
- **DEP-004**: React Query (TanStack Query) v4+ - Server state management and caching
- **DEP-005**: Axios - HTTP client for API requests
- **DEP-006**: TypeScript v4.9+ - Type safety and developer experience

### Internal Component Dependencies

- **DEP-007**: ContributionHistoryDialog component - Existing component in `src/components/ChurchMembers/ContributionHistoryDialog.tsx` for displaying member contribution history
- **DEP-008**: HsbcUploadModal component - Existing component in `src/components/Financial/HsbcUploadModal.tsx` for uploading bank statements
- **DEP-009**: EnvelopeBatchEntry component - Existing component in `src/components/Financial/` for manual batch entry
- **DEP-010**: ProtectedFinancialRoute component - Existing auth wrapper in `src/components/auth/` for role-based route protection
- **DEP-011**: useAuth hook - Existing hook in `src/contexts/useAuth.ts` for accessing user authentication and roles

### API Dependencies

- **DEP-012**: `/api/contributions/members` endpoint - Backend API endpoint for fetching contribution-focused member data (to be created/verified in Phase 1)
- **DEP-013**: `/api/contributions/member/{id}/history` endpoint - Existing endpoint for fetching individual member contribution history
- **DEP-014**: HSBC upload API endpoints - Existing endpoints for processing bank statement uploads
- **DEP-015**: Envelope batch API endpoints - Existing endpoints for batch entry and history

### Infrastructure Dependencies

- **DEP-016**: ASP.NET Core Web API - Backend framework serving API endpoints
- **DEP-017**: FastEndpoints - API endpoint framework with built-in authorization
- **DEP-018**: Entity Framework Core - ORM for database access
- **DEP-019**: SQL Server Database - Data storage with ChurchMember and ChurchMemberContributions tables

### Build and Development Dependencies

- **DEP-020**: Vite - Build tool and development server
- **DEP-021**: ESLint - Code linting
- **DEP-022**: Prettier - Code formatting
- **DEP-023**: React Testing Library - Unit testing framework
- **DEP-024**: Jest - Test runner
- **DEP-025**: Playwright or Cypress - E2E testing framework

## 5. Files

### New Files to Create

- **FILE-001**: `ChurchRegister.React/src/types/contributions.ts` - TypeScript type definitions for contribution member data, grid queries, and responses
- **FILE-002**: `ChurchRegister.React/src/services/api/contributionsApi.ts` - API service layer for contribution endpoints
- **FILE-003**: `ChurchRegister.React/src/components/Contributions/ContributionMemberGrid.tsx` - Main grid component for displaying contribution member data
- **FILE-004**: `ChurchRegister.React/src/components/Contributions/FinancialActionsHeader.tsx` - Header component with financial action buttons
- **FILE-005**: `ChurchRegister.React/src/components/Contributions/index.ts` - Barrel export for Contributions components
- **FILE-006**: `ChurchRegister.React/src/pages/Financial/ContributionsPage.tsx` - Main page component for Contributions section
- **FILE-007**: `ChurchRegister.React/src/pages/Financial/index.ts` - Barrel export for Financial pages
- **FILE-008**: `ChurchRegister.React/src/components/Contributions/__tests__/ContributionMemberGrid.test.tsx` - Unit tests for grid component
- **FILE-009**: `ChurchRegister.React/src/components/Contributions/__tests__/FinancialActionsHeader.test.tsx` - Unit tests for header component
- **FILE-010**: `ChurchRegister.React/src/pages/Financial/__tests__/ContributionsPage.test.tsx` - Unit tests for page component
- **FILE-011**: `ChurchRegister.React/src/__tests__/integration/contributions-navigation.test.tsx` - Integration tests for navigation and routing
- **FILE-012**: `ChurchRegister.React/e2e/contributions-workflow.spec.ts` - E2E tests for user workflows
- **FILE-013**: `ChurchRegister.ApiService/Endpoints/Financial/GetContributionMembersEndpoint.cs` - Backend API endpoint for contribution members (if doesn't exist)

### Existing Files to Modify

- **FILE-014**: `ChurchRegister.React/src/components/Layout/Sidebar.tsx` - Add Contributions navigation item with role-based visibility
- **FILE-015**: `ChurchRegister.React/src/App.tsx` - Add route configuration for /app/contributions with protection
- **FILE-016**: `ChurchRegister.React/src/components/ChurchMembers/ChurchMemberGrid.tsx` - Remove This Year's Contribution column and View Contributions action
- **FILE-017**: `ChurchRegister.React/src/pages/DashboardPage.tsx` - Remove BankStatementImportWidget, EnvelopeContributionWidget, and batch history widgets
- **FILE-018**: `ChurchRegister.React/src/types/index.ts` - Export new contribution types
- **FILE-019**: `ChurchRegister.React/src/services/api/index.ts` - Export contributionsApi service
- **FILE-020**: `ChurchRegister.React/src/pages/index.ts` - Export ContributionsPage

### Configuration Files (Potentially)

- **FILE-021**: `ChurchRegister.React/tsconfig.json` - May need path aliases if directory structure changes
- **FILE-022**: `ChurchRegister.React/package.json` - May need to add dependencies if missing

## 6. Testing

### Unit Tests

- **TEST-001**: ContributionMemberGrid renders with correct 4 columns (Name, Status, Envelope Number, This Year's Contribution)
- **TEST-002**: ContributionMemberGrid formats currency correctly with £ symbol and 2 decimals
- **TEST-003**: ContributionMemberGrid handles search input with debounce (300ms)
- **TEST-004**: ContributionMemberGrid handles status filter changes
- **TEST-005**: ContributionMemberGrid calls onViewContributions with correct member data when action clicked
- **TEST-006**: ContributionMemberGrid displays loading state during data fetch
- **TEST-007**: ContributionMemberGrid displays error state when API fails
- **TEST-008**: ContributionMemberGrid displays empty state when no data
- **TEST-009**: FinancialActionsHeader renders all buttons for FinancialContributor role
- **TEST-010**: FinancialActionsHeader renders only View History for FinancialViewer role
- **TEST-011**: FinancialActionsHeader renders no buttons for non-financial roles
- **TEST-012**: FinancialActionsHeader calls correct handler when each button clicked
- **TEST-013**: ContributionsPage renders header with correct title and subtitle
- **TEST-014**: ContributionsPage renders ContributionMemberGrid component
- **TEST-015**: ContributionsPage renders FinancialActionsHeader with correct props
- **TEST-016**: ContributionsPage opens contribution dialog when View Contributions clicked
- **TEST-017**: ContributionsPage opens HSBC modal when Upload button clicked

### Integration Tests

- **TEST-018**: FinancialViewer can access Contributions page and see navigation item
- **TEST-019**: FinancialContributor can access Contributions page and see navigation item
- **TEST-020**: FinancialAdministrator can access Contributions page and see navigation item
- **TEST-021**: User without financial roles cannot see Contributions navigation item
- **TEST-022**: User without financial roles redirected to 403 when accessing /app/contributions
- **TEST-023**: Navigation from Members page to Contributions page works correctly
- **TEST-024**: Upload HSBC workflow completes and refreshes grid data
- **TEST-025**: Enter Batch button navigates to batch entry page
- **TEST-026**: View Batch History button navigates to history page

### End-to-End Tests

- **TEST-027**: E2E: FinancialViewer complete workflow (login, navigate, view contributions, check dialog)
- **TEST-028**: E2E: FinancialContributor HSBC upload workflow (upload CSV, verify success, check grid refresh)
- **TEST-029**: E2E: Verify Members page no longer shows This Year's Contribution column or View Contributions action
- **TEST-030**: E2E: Verify Dashboard no longer shows financial widgets (Upload HSBC, Enter Batch, View History)
- **TEST-031**: E2E: Unauthorized access redirects to 403 page
- **TEST-032**: E2E: Grid sorting works correctly on all columns
- **TEST-033**: E2E: Grid search and filtering work correctly
- **TEST-034**: E2E: Grid pagination works correctly

### Manual QA Test Cases

- **TEST-035**: Cross-browser testing (Chrome, Firefox, Safari, Edge)
- **TEST-036**: Mobile responsive testing (iOS Chrome, iOS Safari, Android Chrome)
- **TEST-037**: Role-based access testing for all financial roles
- **TEST-038**: Navigation flow testing across all pages
- **TEST-039**: All button interactions and workflows
- **TEST-040**: Grid interactions (sort, filter, search, pagination)
- **TEST-041**: Keyboard navigation and accessibility
- **TEST-042**: Screen reader compatibility

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Backend API endpoint may not exist**
  - **Mitigation**: Verify endpoint in Phase 1; if doesn't exist, coordinate with backend team to create before frontend development
  - **Impact**: Medium - could delay Phase 4-6 by 1-2 days
- **RISK-002**: **ThisYearsContribution field may not be available in current API response**

  - **Mitigation**: Review existing API contracts early; if missing, backend changes needed
  - **Impact**: Medium - requires backend modification and coordination

- **RISK-003**: **Existing ChurchMemberGrid component tightly coupled with Members page**

  - **Mitigation**: Create separate ContributionMemberGrid instead of reusing; reduces risk of breaking Members page
  - **Impact**: Low - increases development time slightly but reduces coupling

- **RISK-004**: **Role-based access may not be consistently enforced across application**

  - **Mitigation**: Verify ProtectedFinancialRoute component exists and works correctly; add integration tests
  - **Impact**: High - security vulnerability if not properly implemented

- **RISK-005**: **Removing widgets from Dashboard may break layout**

  - **Mitigation**: Test Dashboard thoroughly after widget removal; adjust grid layout as needed
  - **Impact**: Low - visual issue only, easily fixable

- **RISK-006**: **Users may not understand where financial features moved**

  - **Mitigation**: Create user documentation and training materials; communicate changes before deployment
  - **Impact**: Medium - user confusion and support tickets

- **RISK-007**: **Performance degradation with large datasets (5000+ members)**

  - **Mitigation**: Implement server-side pagination and filtering from start; monitor performance in Phase 17
  - **Impact**: Medium - may require optimization work

- **RISK-008**: **Concurrent HSBC uploads may cause data inconsistency**
  - **Mitigation**: Verify backend handles concurrency properly; test concurrent upload scenario
  - **Impact**: High - data integrity issue

### Assumptions

- **ASSUMPTION-001**: FinancialViewer, FinancialContributor, FinancialAdministrator, and SystemAdministration roles already exist in the database and role management system
- **ASSUMPTION-002**: ContributionHistoryDialog component is reusable and not tightly coupled to ChurchMembersPage
- **ASSUMPTION-003**: HsbcUploadModal component accepts onSuccess callback for grid refresh
- **ASSUMPTION-004**: EnvelopeBatchEntry component can be accessed via routing or modal
- **ASSUMPTION-005**: ThisYearsContribution is calculated server-side and included in member data response
- **ASSUMPTION-006**: Current calendar year is used for contribution calculation (January 1 - December 31)
- **ASSUMPTION-007**: Envelope number is optional and can be null for some members
- **ASSUMPTION-008**: Status filter dropdown options are available from existing API or constants
- **ASSUMPTION-009**: No database schema changes are required for this feature
- **ASSUMPTION-010**: Existing authentication and authorization infrastructure supports role-based page access
- **ASSUMPTION-011**: Users with SystemAdministration role have access to all features including financial
- **ASSUMPTION-012**: React Query is properly configured in the application for cache management
- **ASSUMPTION-013**: Material-UI theme is already configured and provides necessary color schemes for status chips
- **ASSUMPTION-014**: No migration strategy needed for existing users; they will see changes immediately after deployment

## 8. Related Specifications / Further Reading

### Related Specifications

- [Contributions UI - Dedicated Financial Contributions Management Interface](../spec/contributions-ui-updates-spec.md) - Primary specification for this implementation
- [Church Members Management Feature Specification](../spec/church-members-spec.md) - Base member management functionality
- [Church Member Contributions Processing and Tracking](../spec/member-contributions-spec.md) - Contribution data processing and calculation logic
- [HSBC Bank Statement Import](../spec/hsbc-transactions-spec.md) - HSBC statement upload and transaction processing
- [Envelope Contribution Batch Processing](../spec/envelope-contribution-spec.md) - Manual batch entry for cash contributions

### Technical Documentation

- [Material-UI Data Grid Documentation](https://mui.com/x/react-data-grid/) - Component library for grid implementation
- [React Query Documentation](https://tanstack.com/query/latest) - Server state management patterns
- [React Router Documentation](https://reactrouter.com/) - Client-side routing best practices
- [FastEndpoints Authorization](https://fast-endpoints.com/docs/security) - Backend authorization patterns
- [React Testing Library Documentation](https://testing-library.com/react) - Testing best practices

### Internal Documentation

- Church Register Application Architecture (internal wiki)
- Role-Based Access Control Implementation Guide (internal)
- Component Development Standards (internal)
- API Development Standards (internal)
