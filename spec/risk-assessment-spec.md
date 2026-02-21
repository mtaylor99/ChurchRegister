---
title: Church Risk Assessment Management System Specification
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Church Register Development Team
tags: [risk-assessment, compliance, health-safety, governance, safeguarding, deacon-approval]
---

# Church Risk Assessment Management System

## 1. Purpose & Scope

This specification defines the requirements, constraints, and interfaces for implementing a risk assessment register and review management system for the Church Register application. The feature enables authorized users to maintain a consolidated register of 8 core church risk assessments, track review dates, manage multi-deacon approval processes, and receive automated reminders for upcoming reviews through integration with the existing Reminders feature.

**Intended Audience**: Backend developers, frontend developers, QA engineers, church administrators, deacons

**Assumptions**:
- 8 consolidated risk assessment categories covering 36 individual compliance areas
- All risk assessments require deacon approval (multi-approver tracking)
- Physical risk assessment documents stored externally (system tracks metadata only)
- Review intervals are fixed at 1, 2, 3, or 5 years
- Application runs weekly in Docker container, startup job checks for due reviews
- Reminders system already implemented and will be reused for notifications

## 2. Definitions

- **Risk Assessment**: A compliance document evaluating hazards and controls for a specific church activity/area
- **Consolidated Category**: A grouping of related risk assessments into a single document (e.g., "Safeguarding" covers 5 separate policies)
- **Review Date**: The date when a risk assessment must be re-evaluated for currency and accuracy
- **Deacon**: A church role with authority to approve risk assessments (maps to system role)
- **Multi-Deacon Approval**: Process where multiple deacons must individually review and approve a risk assessment
- **Overdue**: Risk assessment with review date in past and status not recently updated to Approved
- **Review Interval**: Fixed period (1/2/3/5 years) between required reviews
- **Startup Job**: Background process that runs when application starts to check for due reviews and create reminders
- **Severity**: Criticality level of the risk assessment (Critical, High, Standard) for prioritization
- **Scope/Coverage**: Church areas or activities covered by the risk assessment (e.g., Main Building, Community Services)

## 3. Requirements, Constraints & Guidelines

### Database Requirements

- **REQ-DB-001**: Create `RiskAssessmentCategories` table with Id (PK), Name (nvarchar 100, unique), Description (nvarchar 500), Severity (nvarchar 50), ColorHex (nvarchar 7 nullable), SortOrder (int, default 0), CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime
- **REQ-DB-001a**: RiskAssessmentCategories.Description stores the comma-separated list of individual risk assessments consolidated into this category (read-only, seeded, displayed in expandable grid rows and drawers)
- **REQ-DB-002**: Seed RiskAssessmentCategories with 8 system categories (all with fixed names, editable colors/sort only)
- **REQ-DB-003**: Category 1: "Safeguarding" (Critical, #d32f2f red, SortOrder 1) - covers Working with Children, Adults at Risk, Volunteers, DBS, Respect for Others
- **REQ-DB-004**: Category 2: "Community Outreach & Services" (High, #f57c00 orange, SortOrder 2) - covers Soup Station protocols, entry/behavioral policies, food safety
- **REQ-DB-005**: Category 3: "Health & Safety - General" (High, #ffa726 lighter orange, SortOrder 3) - covers perimeter, lone working, slips/trips/falls, working at height, personal safety, hazardous items, baptistry, general H&S
- **REQ-DB-006**: Category 4: "Emergency Procedures" (Critical, #c62828 dark red, SortOrder 4) - covers fire safety/alarms, evacuation, first aid/accident reporting, terrorist attack
- **REQ-DB-007**: Category 5: "Financial Compliance" (High, #388e3c green, SortOrder 5) - covers financial regulations, banking, finance risk, examiners, conflict of interest
- **REQ-DB-008**: Category 6: "Data & Information Governance" (High, #1976d2 blue, SortOrder 6) - covers data protection, retention & archive
- **REQ-DB-009**: Category 7: "Governance & Administration" (Standard, #7b1fa2 purple, SortOrder 7) - covers trustees, officers, safe environment, CCTV, music licence, digital/social media
- **REQ-DB-010**: Category 8: "Employment & HR" (High, #00796b teal, SortOrder 8) - covers grievance, disciplinary, capability, complaints
- **REQ-DB-011**: Add unique constraint on RiskAssessmentCategories.Name (case-insensitive)
- **REQ-DB-012**: Create `RiskAssessments` table with Id (PK), CategoryId (FK to RiskAssessmentCategories), Title (nvarchar 200), Description (nvarchar 1000 nullable), ReviewInterval (int - years: 1/2/3/5), LastReviewDate (DateTime nullable), NextReviewDate (DateTime), Status (nvarchar 50), Scope (nvarchar 500 nullable), Notes (nvarchar max nullable), CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime
- **REQ-DB-012a**: RiskAssessments.Description is editable and stores assessment-specific notes, changes, or context (distinct from category-level consolidated items list)
- **REQ-DB-013**: CategoryId foreign key references RiskAssessmentCategories.Id with NO ACTION on delete
- **REQ-DB-014**: Status column stores "Under Review" or "Approved" (not Overdue - calculated on frontend)
- **REQ-DB-015**: ReviewInterval constrained to values: 1, 2, 3, or 5 (years)
- **REQ-DB-016**: NextReviewDate calculated as LastReviewDate + ReviewInterval years
- **REQ-DB-017**: Create `RiskAssessmentApprovals` table with Id (PK), RiskAssessmentId (FK), ApprovedByUserId (FK to AspNetUsers), ApprovedDate (DateTime), Notes (nvarchar 500 nullable)
- **REQ-DB-018**: RiskAssessmentId foreign key references RiskAssessments.Id with CASCADE on delete
- **REQ-DB-019**: ApprovedByUserId foreign key references AspNetUsers.Id with NO ACTION on delete
- **REQ-DB-020**: Composite unique index on (RiskAssessmentId, ApprovedByUserId) to prevent duplicate approvals by same deacon
- **REQ-DB-021**: Add indexes on RiskAssessments: NextReviewDate, Status, CategoryId for query performance
- **REQ-DB-022**: Seed 8 initial RiskAssessment records (one per category) with status "Under Review", NextReviewDate staggered over next 12 months

### API Requirements - Risk Assessments

- **REQ-API-001**: Create GET /api/risk-assessments endpoint with query parameters: categoryId, status, overdueOnly (boolean)
- **REQ-API-002**: GET /api/risk-assessments returns list with category details (including categoryDescription for consolidated items), overdue flag (calculated), approval count, severity
- **REQ-API-002a**: All risk assessment DTOs must include categoryDescription field populated from RiskAssessmentCategories.Description for display in grid, drawers, and PDF export
- **REQ-API-003**: Create GET /api/risk-assessments/{id} endpoint returning full details including approvals list
- **REQ-API-004**: Create PUT /api/risk-assessments/{id} endpoint for updating title, description, reviewInterval, scope, notes
- **REQ-API-005**: PUT cannot change CategoryId (fixed at seed), cannot change LastReviewDate (use review/approve workflow)
- **REQ-API-006**: Create POST /api/risk-assessments/{id}/start-review endpoint to change status to "Under Review", clear approvals, set ModifiedBy
- **REQ-API-007**: Create POST /api/risk-assessments/{id}/approve endpoint accepting ApprovalRequest (notes REQUIRED, non-empty validation)
- **REQ-API-008**: Approve endpoint validates user has RiskAssessmentsAdmin or SystemAdministration role, creates RiskAssessmentApproval record
- **REQ-API-009**: Approve endpoint checks if minimum approvals met (configurable, default 3), if so: set Status="Approved", set LastReviewDate=today, calculate NextReviewDate=LastReviewDate+ReviewInterval
- **REQ-API-010**: Create GET /api/risk-assessments/dashboard-summary endpoint returning overdue count and due-within-60-days count
- **REQ-API-011**: Create GET /api/risk-assessments/{id}/history endpoint returning version history grouped by review cycles (each cycle shows LastReviewDate and list of approvals with notes)
- **REQ-API-012**: GET endpoints accessible to RiskAssessmentsViewer, RiskAssessmentsContributor, RiskAssessmentsAdmin, SystemAdministration roles
- **REQ-API-013**: PUT/POST endpoints accessible to RiskAssessmentsContributor, RiskAssessmentsAdmin, SystemAdministration roles only
- **REQ-API-014**: Approve and start-review endpoints accessible ONLY to RiskAssessmentsAdmin and SystemAdministration roles
- **REQ-API-015**: Approve endpoint validates no duplicate approval by same user (check RiskAssessmentApprovals table)
- **REQ-API-016**: Create background job endpoint POST /api/risk-assessments/check-due-reviews (internal, called on startup)
- **REQ-API-017**: Check-due-reviews job finds risk assessments with NextReviewDate within 60 days and Status="Approved", creates Reminder for each (if not already exists)

### API Requirements - Categories

- **REQ-API-CAT-001**: Create GET /api/risk-assessment-categories endpoint returning all categories ordered by SortOrder
- **REQ-API-CAT-002**: Create PUT /api/risk-assessment-categories/{id} endpoint for updating ColorHex and SortOrder ONLY (not Name/Description)
- **REQ-API-CAT-003**: GET endpoint accessible to RiskAssessmentsViewer, RiskAssessmentsContributor, RiskAssessmentsAdmin, SystemAdministration
- **REQ-API-CAT-004**: PUT endpoint accessible to RiskAssessmentsContributor, RiskAssessmentsAdmin, SystemAdministration
- **REQ-API-CAT-005**: Cannot delete categories (no DELETE endpoint)
- **REQ-API-CAT-006**: Category names are read-only system-defined values

### Frontend Requirements - Page Layout

- **REQ-UI-001**: Add "Risk Assessments" section to left navigation bar under Compliance/Governance section
- **REQ-UI-002**: Create RiskAssessmentsPage with single-tab layout (no tabbed interface like Reminders)
- **REQ-UI-003**: Page header: Shield icon, "Risk Assessments" title, subtitle "Church compliance risk assessment register and review tracking"
- **REQ-UI-004**: Page toolbar: "Export PDF" button (primary), "Edit Categories" button (secondary), no "Add" button (fixed 8 records)
- **REQ-UI-005**: Grid displays all 8 risk assessments with filtering capabilities

### Frontend Requirements - Risk Assessments Grid

- **REQ-UI-006**: Grid columns: Category, Title, Severity, Last Review, Next Review, Status, Approvals, Alert, Actions
- **REQ-UI-007**: Category column displays category name as colored chip with ColorHex background and severity level
- **REQ-UI-008**: Severity displayed as badge on category chip: "CRITICAL" (dark red), "HIGH" (orange), "STANDARD" (grey)
- **REQ-UI-009**: Last Review column displays date (format: DD MMM YYYY) or "Never Reviewed" if null
- **REQ-UI-010**: Next Review column displays date (format: DD MMM YYYY) with color coding: red if overdue (past today), amber if within 30 days, green if > 30 days
- **REQ-UI-011**: Status column displays chip: "Under Review" (blue), "Approved" (green)
- **REQ-UI-012**: Approvals column displays count (e.g., "3 of 3") with checkmark icon if minimum met
- **REQ-UI-013**: Alert column displays icon: Red exclamation (overdue), Amber warning (due within 30 days), Green check (> 30 days and approved)
- **REQ-UI-014**: Actions column: three-dot menu with "View Details", "Start Review", "Approve", "Edit Details", "View History"
- **REQ-UI-015**: Grid filters: Category (dropdown), Status (All/Under Review/Approved/Overdue), Show Overdue Only (toggle)
- **REQ-UI-016**: Category filter dropdown populated from RiskAssessmentCategories ordered by SortOrder
- **REQ-UI-016a**: Grid rows are expandable - clicking expand icon shows category description (consolidated items list) in an expanded detail panel
- **REQ-UI-016b**: Expanded panel displays "Consolidated Items:" label followed by the category description text from RiskAssessmentCategories.Description
- **REQ-UI-016c**: Expanded panel styling uses subtle background color and indented layout
- **REQ-UI-017**: Overdue calculated as: NextReviewDate < Today (client-side calculation)
- **REQ-UI-018**: Grid sorted by NextReviewDate ascending (overdue first, then nearest due dates)

### Frontend Requirements - Risk Assessment Drawers

- **REQ-UI-019**: Create ViewRiskAssessmentDrawer component (anchor: right, width: 600px)
- **REQ-UI-020**: ViewDrawer displays: Category (chip), Title, Description (assessment-specific), Consolidated Items (from category description), Severity, Review Interval, Last Review Date, Next Review Date, Status, Scope, Notes (all read-only)
- **REQ-UI-020a**: ViewDrawer shows "Consolidated Items" section displaying RiskAssessmentCategories.Description as a formatted list or paragraph
- **REQ-UI-021**: ViewDrawer shows "Approvals" section listing all approvers with name, date, notes
- **REQ-UI-022**: ViewDrawer footer buttons: "Start Review", "Approve", "Edit", "Close"
- **REQ-UI-023**: Create EditRiskAssessmentDrawer component (anchor: right, width: 600px)
- **REQ-UI-024**: EditDrawer fields: Title (required, max 200), Description (textarea, max 1000, labeled "Assessment Notes"), ReviewInterval (dropdown: 1/2/3/5 years), Scope (textarea, max 500), Notes (textarea)
- **REQ-UI-024a**: EditDrawer displays Consolidated Items (read-only) from category description above the editable fields for reference
- **REQ-UI-025**: EditDrawer displays Category (read-only, cannot change)
- **REQ-UI-026**: Create ApproveRiskAssessmentDrawer component (anchor: right, width: 500px)
- **REQ-UI-027**: ApproveDrawer displays: Risk Assessment summary (read-only), current approvals list, "Your Approval" section
- **REQ-UI-028**: ApproveDrawer "Your Approval" section: Notes (textarea REQUIRED, validation: non-empty), "Approve" button (green, prominent)
- **REQ-UI-028a**: Approval notes mandatory with helper text: "Document what was reviewed: changes made, issues addressed, or 'No changes required'"
- **REQ-UI-029**: ApproveDrawer shows warning if user already approved: "You approved this on [date]" with disabled Approve button
- **REQ-UI-030**: ApproveDrawer shows success message after approval: "Your approval recorded. X of Y approvals received."
- **REQ-UI-031**: If minimum approvals met after approval, show: "Risk assessment approved! Next review due: [date]"
- **REQ-UI-032**: Create ViewHistoryDrawer component (anchor: right, width: 700px) showing version history grouped by review cycles
- **REQ-UI-033**: HistoryDrawer displays timeline: each review cycle shows "Reviewed: [LastReviewDate]" with all approvals underneath (name, date, notes)
- **REQ-UI-034**: HistoryDrawer separates cycles with divider, most recent cycle at top
- **REQ-UI-035**: ViewRiskAssessmentDrawer footer includes "View History" button opening ViewHistoryDrawer

### Frontend Requirements - Category Management

- **REQ-UI-036**: Create EditCategoriesDialog component (modal dialog)
- **REQ-UI-037**: Dialog displays grid: Category Name (read-only), Severity (read-only), Color (editable color picker), Sort Order (editable number input)
- **REQ-UI-038**: Color picker allows hex input or predefined palette
- **REQ-UI-039**: Save button updates all categories in single API call
- **REQ-UI-040**: Show validation error if sort order duplicates exist

### Frontend Requirements - Dashboard Widget

- **REQ-UI-041**: Add Risk Assessments dashboard widget (position after Reminders widget)
- **REQ-UI-042**: Widget displays: Shield icon, "Risk Assessments" title, count of overdue + due within 60 days
- **REQ-UI-043**: Widget shows red alert badge if any overdue, amber if due within 30 days, green checkmark if all current
- **REQ-UI-044**: Widget click navigates to Risk Assessments page
- **REQ-UI-045**: Widget displays breakdown: "X overdue, Y due soon" or "All assessments current ✓"

### Frontend Requirements - PDF Export

- **REQ-UI-046**: Add "Export PDF" button to Risk Assessments page toolbar
- **REQ-UI-047**: Export generates single PDF report containing all 8 risk assessments
- **REQ-UI-048**: PDF structure: Cover page with title "Church Risk Assessment Register" and export date
- **REQ-UI-049**: For each assessment: Category name with severity badge, consolidated items list (from RiskAssessmentCategories.Description), assessment description, current status, last reviewed date, next review due, last approval notes (most recent)
- **REQ-UI-049a**: PDF clearly labels "Consolidated Items:" section showing the category description, followed by "Assessment Notes:" section if RiskAssessments.Description is populated
- **REQ-UI-050**: PDF uses table format with clear sections and page breaks between categories
- **REQ-UI-051**: Export accessible to all roles (RiskAssessmentsViewer, RiskAssessmentsContributor, RiskAssessmentsAdmin, SystemAdministration)
- **REQ-UI-052**: Show loading indicator during PDF generation, download automatically when ready

### Security Requirements

- **SEC-001**: Four role levels: RiskAssessmentsViewer (read-only), RiskAssessmentsContributor (edit), RiskAssessmentsAdmin (approve and start reviews), SystemAdministration (full access)
- **SEC-002**: Only RiskAssessmentsAdmin and SystemAdministration roles can approve risk assessments
- **SEC-003**: Only RiskAssessmentsAdmin and SystemAdministration roles can start reviews (which clears approvals)
- **SEC-004**: RiskAssessmentsContributor can edit details but not approve or start reviews
- **SEC-005**: All roles (including RiskAssessmentsViewer) can export PDFs and view history
- **SEC-006**: Audit trail captures username from JWT for CreatedBy/ModifiedBy/ApprovedBy
- **SEC-007**: Drawer action buttons conditionally render based on user role
- **SEC-008**: Approval notes field mandatory (non-empty validation) to ensure proper documentation

### Business Logic Requirements

- **REQ-BIZ-001**: Overdue calculation: NextReviewDate < Today (calculated on frontend, not stored in Status)
- **REQ-BIZ-002**: Alert thresholds: Overdue (red), Due within 30 days (amber), Due > 30 days (green)
- **REQ-BIZ-003**: Dashboard summary counts: Status="Approved" AND NextReviewDate < Today (overdue) + NextReviewDate <= Today+60 days (due soon)
- **REQ-BIZ-004**: Minimum approvals configurable via app setting (default: 3)
- **REQ-BIZ-005**: When minimum approvals met: auto-update Status="Approved", LastReviewDate=today, NextReviewDate=LastReviewDate+ReviewInterval
- **REQ-BIZ-006**: Starting review: set Status="Under Review", clear all RiskAssessmentApprovals records for that assessment
- **REQ-BIZ-007**: Duplicate approval check: validate ApprovedByUserId not in RiskAssessmentApprovals for RiskAssessmentId
- **REQ-BIZ-008**: Cannot approve if user is not in RiskAssessmentsAdmin or SystemAdministration role
- **REQ-BIZ-009**: Review intervals must be 1, 2, 3, or 5 years (no custom intervals)
- **REQ-BIZ-010**: NextReviewDate auto-calculated, not manually set by users
- **REQ-BIZ-011**: Approval notes form version history: each approval captures what changed or "No changes required"
- **REQ-BIZ-012**: Version history grouped by review cycles: LastReviewDate separates cycles, approvals listed within each cycle

### Background Job Requirements

- **REQ-JOB-001**: Create startup background job CheckDueRiskAssessmentReviews
- **REQ-JOB-002**: Job runs on application startup (Docker container start)
- **REQ-JOB-003**: Job queries RiskAssessments where Status="Approved" AND NextReviewDate <= Today+60 days
- **REQ-JOB-004**: For each found assessment, check if Reminder exists with Description matching pattern "Risk Assessment Review: [Title]"
- **REQ-JOB-005**: If no matching Reminder exists, create new Reminder with: Description="Risk Assessment Review: [Title]", CategoryId="Risk Assessments", DueDate=NextReviewDate, AssignedToUserId=admin or configurable default, Priority=true if overdue
- **REQ-JOB-006**: If Reminder exists but DueDate doesn't match NextReviewDate, update Reminder.DueDate
- **REQ-JOB-007**: Job logs results: "Created X reminders, Updated Y reminders for due risk assessments"
- **REQ-JOB-008**: Job runs asynchronously, doesn't block application startup
- **REQ-JOB-009**: Job failure should log error but not crash application
- **REQ-JOB-010**: Configurable lookhead period (default 60 days) via appsettings.json

### Integration with Reminders System

- **REQ-INT-001**: Reminders feature must have "Risk Assessments" category in ReminderCategories
- **REQ-INT-002**: Risk assessment reminders auto-created with CategoryId referencing "Risk Assessments" category
- **REQ-INT-003**: Reminder description format: "Risk Assessment Review: [RiskAssessment.Title]"
- **REQ-INT-004**: Reminder DueDate equals RiskAssessment.NextReviewDate
- **REQ-INT-005**: When risk assessment approved and NextReviewDate updated, corresponding Reminder.DueDate must be updated or new Reminder created
- **REQ-INT-006**: Clicking Reminder navigates to Risk Assessments page filtered to relevant assessment
- **REQ-INT-007**: Completing Reminder does NOT auto-approve risk assessment (manual deacon approval still required)
- **REQ-INT-008**: Risk Assessments page shows related Reminders in drawer "Related Reminders" section (optional enhancement)

### Technical Constraints

- **CON-001**: Must use Entity Framework Core for database schema and migrations
- **CON-002**: Must use FastEndpoints pattern for API endpoints
- **CON-003**: Must use React Query for frontend data fetching and cache invalidation
- **CON-004**: Must use MUI components (Drawer, DataGrid, Chip, Dialog) for UI
- **CON-005**: Background job must use IHostedService or startup middleware pattern
- **CON-006**: No document upload/storage (track metadata only)
- **CON-007**: No soft delete (hard delete only if implementation allows, but no DELETE endpoint for assessments)
- **CON-008**: Fixed 8 risk assessments (no add/delete operations)
- **CON-009**: Application runs weekly in Docker container (not 24/7 uptime)

### Guidelines

- **GUD-001**: Follow existing drawer implementation patterns (Reminders feature)
- **GUD-002**: Follow existing three-dot menu action patterns
- **GUD-003**: Follow existing dashboard widget patterns (Reminders/Training Certificates)
- **GUD-004**: Use existing notification system for success/error messages
- **GUD-005**: Maintain consistent naming conventions (Risk Assessments, not Compliance Docs)
- **GUD-006**: Include XML documentation comments for all public APIs
- **GUD-007**: Use RAG color scheme: Red (overdue/critical), Amber (warning/high), Green (ok/standard)
- **GUD-008**: Grid styling should match Training Certificates and Reminders grids
- **GUD-009**: Approval workflow should be simple and intuitive (one-click approve from drawer)
- **GUD-010**: Background job should be lightweight and fail-safe

### Design Patterns

- **PAT-001**: Icon-based status visualization (RAG alerts, chips for status)
- **PAT-002**: Drawer-based operations (View, Edit, Approve as separate drawers)
- **PAT-003**: Multi-approver junction table pattern (many-to-many with audit fields)
- **PAT-004**: Background job pattern for automated reminder creation
- **PAT-005**: Calculated fields pattern (overdue flag computed client-side, not stored)
- **PAT-006**: Integration pattern (risk assessments create/update reminders, reminders don't control assessments)

## 4. Interfaces & Data Contracts

### RiskAssessmentCategoryDto

```typescript
interface RiskAssessmentCategoryDto {
  id: number;
  name: string;
  description: string;
  severity: 'Critical' | 'High' | 'Standard';
  colorHex: string | null;
  sortOrder: number;
  createdBy: string;
  createdDateTime: string; // ISO date
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date
}
```

### RiskAssessmentDto

```typescript
interface RiskAssessmentDto {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryDescription: string; // consolidated items list from category
  categoryColorHex: string | null;
  severity: 'Critical' | 'High' | 'Standard';
  title: string;
  description: string | null; // assessment-specific editable notes
  reviewInterval: 1 | 2 | 3 | 5; // years
  lastReviewDate: string | null; // ISO date
  nextReviewDate: string; // ISO date
  status: 'Under Review' | 'Approved';
  scope: string | null;
  notes: string | null;
  approvalCount: number;
  minimumApprovalsRequired: number;
  isOverdue: boolean; // calculated
  alertStatus: 'red' | 'amber' | 'green'; // calculated
  createdBy: string;
  createdDateTime: string; // ISO date
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date
}
```

### RiskAssessmentDetailDto

```typescript
interface RiskAssessmentDetailDto extends RiskAssessmentDto {
  approvals: RiskAssessmentApprovalDto[];
}
```

### RiskAssessmentApprovalDto

```typescript
interface RiskAssessmentApprovalDto {
  id: number;
  riskAssessmentId: number;
  approvedByUserId: string;
  approvedByUserName: string;
  approvedDate: string; // ISO date
  notes: string | null;
}
```

### UpdateRiskAssessmentRequest

```typescript
interface UpdateRiskAssessmentRequest {
  title: string; // required, max 200
  description?: string | null; // max 1000
  reviewInterval: 1 | 2 | 3 | 5;
  scope?: string | null; // max 500
  notes?: string | null;
}
```

### ApproveRiskAssessmentRequest

```typescript
interface ApproveRiskAssessmentRequest {
  notes?: string | null; // max 500
}
```

### ApproveRiskAssessmentResponse

```typescript
interface ApproveRiskAssessmentResponse {
  approvalRecorded: boolean;
  totalApprovalsReceived: number;
  minimumApprovalsRequired: number;
  assessmentApproved: boolean; // true if minimum met after this approval
  nextReviewDate: string | null; // ISO date, populated if assessmentApproved
}
```

### DashboardRiskAssessmentSummaryDto

```typescript
interface DashboardRiskAssessmentSummaryDto {
  overdueCount: number;
  dueSoonCount: number; // within 60 days
  totalCount: number; // always 8
}
```

### UpdateCategoryRequest

```typescript
interface UpdateCategoryRequest {
  colorHex: string | null; // must be valid #RRGGBB or null
  sortOrder: number;
}
```

## 5. Acceptance Criteria

### Risk Assessment Display

- **AC-001**: Given user is RiskAssessmentViewer, When navigating to Risk Assessments page, Then all 8 risk assessments display in grid with category, status, next review date
- **AC-002**: Given risk assessment NextReviewDate is past today's date, When grid renders, Then Alert column shows red exclamation icon and row is highlighted
- **AC-003**: Given risk assessment Status is "Approved" and NextReviewDate is within 30 days, When grid renders, Then Alert column shows amber warning icon

### Deacon Approval Workflow

- **AC-004**: Given user has Deacon role, When clicking Approve on risk assessment, Then ApproveDrawer opens showing current approvals and approval form
- **AC-005**: Given user is approving risk assessment, When submitting approval notes, Then approval is recorded and count increments
- **AC-006**: Given risk assessment has 2 approvals and minimum is 3, When 3rd deacon approves, Then Status changes to "Approved", LastReviewDate set to today, NextReviewDate calculated
- **AC-007**: Given deacon already approved assessment, When viewing in ApproveDrawer, Then "You approved this on [date]" shows and Approve button is disabled
- **AC-008**: Given user is not in Deacon role, When viewing risk assessment, Then Approve action is not visible in menu

### Start Review Workflow

- **AC-009**: Given risk assessment is "Approved" with 3 approvals, When deacon clicks Start Review, Then Status changes to "Under Review" and all approvals are cleared
- **AC-010**: Given review is started, When viewing assessment, Then approvals list is empty and Status shows "Under Review"

### Background Job & Reminder Integration

- **AC-011**: Given application starts up, When background job runs, Then checks all risk assessments with NextReviewDate within 60 days
- **AC-012**: Given risk assessment due in 45 days with no existing reminder, When background job runs, Then new Reminder created with description "Risk Assessment Review: [Title]" and DueDate matching NextReviewDate
- **AC-013**: Given risk assessment reminder exists but DueDate outdated, When background job runs, Then Reminder.DueDate updated to match current NextReviewDate
- **AC-014**: Given risk assessment approved and NextReviewDate updated, When background job next runs, Then corresponding Reminder.DueDate updated

### Dashboard Widget

- **AC-015**: Given 2 risk assessments are overdue, When viewing dashboard, Then Risk Assessments widget shows "2 overdue" with red alert badge
- **AC-016**: Given all risk assessments current (NextReviewDate > 60 days), When viewing dashboard, Then widget shows "All assessments current ✓" with green indicator
- **AC-017**: Given user clicks dashboard widget, When click occurs, Then navigate to Risk Assessments page

### Category Management

- **AC-018**: Given user is RiskAssessmentContributor, When clicking Edit Categories, Then dialog opens showing all 8 categories with editable color and sort order
- **AC-019**: Given editing category color, When saving changes, Then category chip in grid updates to new color
- **AC-020**: Given category name is system-defined, When viewing Edit Categories, Then name field is read-only/disabled

### Grid Filtering

- **AC-021**: Given user filters by Status "Overdue", When filter applied, Then only risk assessments with NextReviewDate < Today display
- **AC-022**: Given user filters by Category "Safeguarding", When filter applied, Then only Safeguarding risk assessment displays
- **AC-023**: Given user toggles "Show Overdue Only", When toggled on, Then grid shows only overdue assessments

### Edit Risk Assessment

- **AC-024**: Given user is RiskAssessmentContributor, When editing risk assessment details, Then can modify title, description, review interval, scope, notes
- **AC-025**: Given editing risk assessment, When changing ReviewInterval from 3 to 5 years, Then warning shows "Next review date will recalculate upon next approval"
- **AC-026**: Given editing risk assessment, When attempting to change Category, Then field is disabled/read-only

### Validation & Error Handling

- **AC-027**: Given user submits approval, When API call fails, Then error toast notification displays "Failed to record approval"
- **AC-028**: Given user updates assessment with title > 200 chars, When submitting, Then validation error "Title must be 200 characters or less"
- **AC-029**: Given deacon tries to approve same assessment twice, When 2nd approval attempted, Then API returns 400 "You have already approved this assessment"

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer logic (approval counting, date calculations, overdue detection)
- **Integration Tests**: API endpoints with in-memory database, deacon role validation, background job execution
- **End-to-End Tests**: Full approval workflow from UI through to database updates and reminder creation

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq for .NET testing
- **Frontend**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E
- **API Testing**: FastEndpoints testing utilities for endpoint validation

### Test Data Management

- **Seed Data**: 8 risk assessment categories and initial assessments seeded in test database
- **Test Users**: Create test users with RiskAssessmentViewer, RiskAssessmentContributor, Deacon roles
- **Cleanup**: Reset approval records between tests, restore status to known state

### CI/CD Integration

- **GitHub Actions**: Run all tests on PR creation and merge to main
- **Coverage Requirements**: Minimum 80% code coverage for approval logic and date calculations
- **E2E Tests**: Run against Docker containerized application weekly to match production usage pattern

### Performance Testing

- **Load**: Simulate 100 concurrent users viewing risk assessments dashboard
- **Background Job**: Verify job completes within 5 seconds on application startup
- **Reminder Creation**: Test bulk reminder creation for all 8 assessments within acceptable time

### Key Test Scenarios

```csharp
// Example unit test structure
public class RiskAssessmentApprovalTests
{
    [TestMethod]
    public async Task ApproveRiskAssessment_WhenMinimumApprovalsReached_ShouldUpdateStatusAndRecalculateNextReviewDate()
    {
        // Arrange: Risk assessment with 2 approvals, minimum 3, review interval 3 years
        // Act: Submit 3rd approval
        // Assert: Status="Approved", LastReviewDate=Today, NextReviewDate=Today+3years
    }
    
    [TestMethod]
    public async Task StartReview_WhenRiskAssessmentApproved_ShouldClearAllApprovalsAndSetStatusUnderReview()
    {
        // Arrange: Risk assessment with Status="Approved" and 3 approvals
        // Act: Call StartReview endpoint
        // Assert: Status="Under Review", Approvals count = 0
    }
    
    [TestMethod]
    public async Task BackgroundJob_WhenRiskAssessmentDueIn45Days_ShouldCreateReminder()
    {
        // Arrange: Risk assessment with NextReviewDate = Today + 45 days
        // Act: Run background job
        // Assert: Reminder created with matching DueDate and description
    }
}
```

## 7. Rationale & Context

### Consolidation Strategy

The 8 consolidated categories were designed to group related compliance areas while maintaining clear boundaries between different risk domains. This approach:
- Reduces administrative burden (8 reviews instead of 36)
- Maintains comprehensive coverage across all church operations
- Aligns with typical church governance committee structures
- Enables focused review sessions per domain (e.g., Finance Committee reviews Financial Compliance category)

### Multi-Deacon Approval Pattern

Requiring multiple deacon approvals provides:
- **Accountability**: Shared responsibility for risk assessment currency
- **Quality Control**: Multiple reviewers catch gaps or outdated controls
- **Governance Best Practice**: Independent verification of compliance
- **Audit Trail**: Clear record of who approved and when

### Integration with Reminders System

Reusing the existing Reminders feature provides:
- **Unified Notification System**: Single source of truth for all upcoming tasks
- **Consistent UX**: Users already familiar with reminder workflows
- **Dashboard Consolidation**: One widget shows all compliance deadlines
- **No Redundant Development**: Leverage existing alert infrastructure

### Background Job on Startup

Running the reminder creation job on application startup (vs scheduled CRON):
- **Matches Usage Pattern**: Application runs weekly, job runs weekly
- **Simplicity**: No need for persistent background scheduler
- **Resource Efficiency**: No idle processes in Docker container between uses
- **Predictable Behavior**: Job always runs when user accesses application

### Fixed 8 Assessments (No Add/Delete)

Restricting to predefined categories:
- **Prevents Fragmentation**: Avoids proliferation of duplicate/overlapping assessments
- **Enforces Completeness**: Ensures all mandatory compliance areas are covered
- **Simplifies UX**: No "Add Risk Assessment" complexity, just maintain existing ones
- **Governance Control**: Category structure decided at organizational level, not ad-hoc

### Review Interval Constraints (1/2/3/5 years)

Fixed intervals align with:
- **Regulatory Standards**: Most HSE/safeguarding compliance requires 1-3 year reviews
- **Church Governance Cycles**: Matches trustee appointment cycles and annual reviews
- **Simplicity**: Avoids confusion from arbitrary custom intervals
- **Predictability**: Regular cadence for committee planning

## 8. Dependencies & External Integrations

### Internal System Dependencies

- **DEP-001**: Reminders feature must be implemented and ReminderCategories table must include "Risk Assessments" category
- **DEP-002**: AspNetUsers table with Deacon role assignment
- **DEP-003**: Role-based authorization middleware for FastEndpoints
- **DEP-004**: Notification/toast system for user feedback
- **DEP-005**: Dashboard widget infrastructure

### Authentication & Authorization

- **AUTH-001**: JWT-based authentication for API endpoints
- **AUTH-002**: Role claims in JWT must include Deacon, RiskAssessmentViewer, RiskAssessmentContributor roles
- **AUTH-003**: User.Identity.Name must resolve to valid AspNetUsers.UserName for audit trail

### Background Processing

- **INF-001**: IHostedService support in .NET runtime for background job execution
- **INF-002**: Application startup configuration to register and start background services
- **INF-003**: Logging infrastructure (ILogger) for job execution tracking

### Database Platform

- **PLT-001**: SQL Server or PostgreSQL with support for:
  - DateTime types with timezone awareness
  - Composite unique indexes
  - Foreign key constraints with cascade/no-action behaviors
  - Check constraints for enum-like columns (Status, ReviewInterval)

### Compliance Dependencies

- **COM-001**: Health & Safety Executive (HSE) - Requires regular risk assessment reviews for workplace safety
- **COM-002**: Charity Commission - Governance and trustee oversight of risk management
- **COM-003**: Church of England Safeguarding requirements - Mandates safeguarding risk assessments
- **COM-004**: General Data Protection Regulation (GDPR) - Data governance and protection assessments
- **COM-005**: Insurance Requirements - Many church insurance policies require current risk assessments
- **COM-006**: Food Standards Agency - Food safety assessments for community services (soup station)
- **COM-007**: Disclosure and Barring Service (DBS) - Background check processes for safeguarding

### External Standards References

- **STD-001**: HSE "Five Steps to Risk Assessment" methodology
- **STD-002**: Church of England Parish Safeguarding Handbook
- **STD-003**: Charity Governance Code (risk management principle)
- **STD-004**: ISO 31000 Risk Management Guidelines (optional, for best practice)

## 9. Examples & Edge Cases

### Example 1: Complete Approval Workflow

```javascript
// User Story: Deacon reviews and approves Safeguarding risk assessment

// Step 1: View risk assessment details
GET /api/risk-assessments/1
Response: {
  id: 1,
  title: "Safeguarding Risk Assessment",
  status: "Under Review",
  approvalCount: 2,
  minimumApprovalsRequired: 3,
  nextReviewDate: "2026-03-15"
}

// Step 2: Submit approval
POST /api/risk-assessments/1/approve
Body: {
  notes: "Reviewed updated DBS procedures, all controls adequate"
}
Response: {
  approvalRecorded: true,
  totalApprovalsReceived: 3,
  minimumApprovalsRequired: 3,
  assessmentApproved: true, // Threshold met!
  nextReviewDate: "2027-02-17" // Today + 1 year (ReviewInterval)
}

// Step 3: Verify status updated
GET /api/risk-assessments/1
Response: {
  id: 1,
  status: "Approved",
  lastReviewDate: "2026-02-17",
  nextReviewDate: "2027-02-17",
  approvalCount: 3
}
```

### Example 2: Background Job Creates Reminder

```javascript
// Scenario: Risk assessment due in 45 days, no reminder exists

// On application startup, background job runs:
CheckDueRiskAssessmentReviews()

// Job logic:
1. Query: NextReviewDate <= "2026-04-03" (Today + 60 days) AND Status="Approved"
2. Found: RiskAssessment Id=4 "Emergency Procedures" with NextReviewDate="2026-03-30"
3. Check: No Reminder exists with Description="Risk Assessment Review: Emergency Procedures"
4. Create Reminder:
   POST /api/reminders
   {
     description: "Risk Assessment Review: Emergency Procedures",
     dueDate: "2026-03-30",
     categoryId: 4, // "Risk Assessments" category
     assignedToUserId: "[admin-user-id]",
     priority: false // Not overdue yet
   }
5. Log: "Created 1 reminder for due risk assessment: Emergency Procedures"
```

### Example 3: Start Review Clears Approvals

```javascript
// Scenario: Annual review cycle begins, reset approval status

POST /api/risk-assessments/5/start-review

// Backend logic:
1. Fetch RiskAssessment Id=5
2. Set Status="Under Review"
3. Delete all records from RiskAssessmentApprovals WHERE RiskAssessmentId=5
4. Set ModifiedBy=current user, ModifiedDateTime=now
5. Return updated RiskAssessmentDto

// Result:
{
  id: 5,
  status: "Under Review",
  approvalCount: 0,
  approvals: []
}
```

### Edge Case 1: Duplicate Approval Attempt

```javascript
// Deacon tries to approve same assessment twice

POST /api/risk-assessments/2/approve
Body: { notes: "Looks good" }

// Backend validation:
1. Check RiskAssessmentApprovals WHERE RiskAssessmentId=2 AND ApprovedByUserId=[current-user]
2. Record found (user already approved)
3. Return 400 Bad Request

Response: {
  error: "You have already approved this risk assessment on 2026-02-10"
}
```

### Edge Case 2: Overdue Risk Assessment with No Reminder

```javascript
// Risk assessment overdue but reminder was deleted

// Background job detects:
1. RiskAssessment Id=3 has NextReviewDate="2026-01-15" (overdue)
2. No matching Reminder exists
3. Create Reminder with Priority=true (overdue flag)
   {
     description: "Risk Assessment Review: Health & Safety - General",
     dueDate: "2026-01-15", // Past date
     priority: true,
     assignedToUserId: "[admin-user-id]"
   }
4. Reminder grid shows as "Overdue" with red alert
```

### Edge Case 3: Review Interval Change Mid-Cycle

```javascript
// User changes review interval from 3 years to 5 years while status is "Under Review"

PUT /api/risk-assessments/7
Body: {
  title: "Governance & Administration",
  reviewInterval: 5 // Changed from 3
}

// Important: NextReviewDate NOT recalculated yet
// Will recalculate only when approval threshold met:

// Later, when approved:
POST /api/risk-assessments/7/approve
// (3rd approval)

// Backend logic:
1. Detect minimumApprovalsRequired met
2. Set LastReviewDate = "2026-02-17"
3. Calculate NextReviewDate = LastReviewDate + ReviewInterval (5 years)
   Result: "2031-02-17"
4. Update Status = "Approved"
```

### Edge Case 4: Category Color Change Reflects Immediately

```javascript
// Admin changes Safeguarding category color from red to orange

PUT /api/risk-assessment-categories/1
Body: {
  colorHex: "#f57c00", // Orange instead of red
  sortOrder: 1
}

// Frontend behavior:
1. React Query cache invalidation
2. Grid re-fetches all risk assessments
3. Category chip for Safeguarding risk assessment re-renders with orange background
4. No data migration needed (CategoryId unchanged, just display color)
```

### Edge Case 5: All 8 Assessments Overdue on First Implementation

```javascript
// Initial deployment, all assessments seeded with NextReviewDate in past

// Background job on first startup:
1. Finds all 8 risk assessments overdue
2. Creates 8 high-priority Reminders
3. Dashboard widget shows "8 overdue" with red alert
4. User reviews each assessment, deacons approve, Status changes to "Approved"
5. NextReviewDate recalculated to future dates
6. Dashboard clears as assessments move to current status
```

## 10. Validation Criteria

### API Contract Validation

- All API endpoints return correct HTTP status codes (200, 400, 401, 403, 404)
- DTOs match TypeScript interfaces exactly (property names, types, nullability)
- Enum values for Status, Severity, ReviewInterval match specification
- Date fields returned as ISO 8601 strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
- Foreign key relationships enforced (CategoryId, ApprovedByUserId, RiskAssessmentId)

### Data Integrity Validation

- Composite unique index prevents duplicate approvals by same deacon
- Review interval constrained to 1, 2, 3, or 5 (database check constraint)
- Status constrained to "Under Review" or "Approved" (database check constraint)
- NextReviewDate always equals LastReviewDate + ReviewInterval when Status="Approved"
- Approval count matches actual record count in RiskAssessmentApprovals table

### Business Logic Validation

- Minimum approvals threshold (default 3) correctly triggers status change
- Overdue flag calculation: NextReviewDate < Today (client-side)
- Alert status calculation: red (overdue), amber (≤30 days), green (>30 days)
- Dashboard summary counts match grid filter results for overdue/due soon
- Starting review clears ALL approvals for that assessment

### Security Validation

- Non-Deacon users cannot access /approve endpoint (403 Forbidden)
- RiskAssessmentViewer cannot edit or approve (403 Forbidden for PUT/POST)
- JWT claims correctly map to user roles (Deacon, RiskAssessmentContributor)
- Audit fields (CreatedBy, ModifiedBy, ApprovedBy) capture correct username from JWT
- Cross-user approval restriction: User A cannot approve as User B

### Performance Validation

- Grid loads all 8 risk assessments with category data in < 500ms
- Background job completes reminder creation for 8 assessments in < 5 seconds
- Dashboard widget query executes in < 200ms
- Approval submission processes and recalculates dates in < 1 second
- Page remains responsive with 100 concurrent users viewing grid

### UI/UX Validation

- All drawers render within 500px-600px width as specified
- Category chips display correct color from ColorHex field
- Severity badges display "CRITICAL", "HIGH", "STANDARD" labels
- Overdue assessments visually distinct (red highlighting/icons)
- "Approve" button disabled if user already approved (prevents confusion)
- Grid sorting by NextReviewDate shows overdue first, then nearest due
- Category filter "All" includes all assessments regardless of category

### Integration Validation

- Risk assessment reminder created with CategoryId="Risk Assessments"
- Reminder description matches pattern "Risk Assessment Review: [Title]"
- Reminder DueDate matches RiskAssessment.NextReviewDate
- Completing reminder does NOT auto-update risk assessment status
- Updating NextReviewDate updates corresponding reminder if exists
- Background job doesn't create duplicate reminders

### Accessibility Validation

- All form inputs have proper labels (aria-label or associated <label>)
- Color coding supplemented with icons (not color-only indicators)
- Keyboard navigation works for all drawer forms (tab order logical)
- Screen reader announces status changes ("Risk assessment approved")
- Focus management when opening/closing drawers
- WCAG 2.1 AA compliance for color contrast ratios

## 11. Related Specifications / Further Reading

### Internal Specifications

- [Church Reminders Management System Specification](./done/reminders-spec.md) - Integration point for automated reminder creation
- [Church Members Management Specification](./done/church-members-spec.md) - User roles and authentication patterns
- [Church Data Protection Specification](./done/church-dataprotection-spec.md) - GDPR compliance context and audit trail requirements

### External Standards & Guidance

- **HSE Risk Assessment**: [Five Steps to Risk Assessment](https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm)
- **Church of England Safeguarding**: [Parish Safeguarding Handbook](https://www.churchofengland.org/safeguarding/safeguarding-e-manual/parish-safeguarding-handbook)
- **Charity Commission**: [Charity Governance Code - Risk Management](https://www.gov.uk/government/publications/the-essential-trustee-what-you-need-to-know-cc3)
- **ISO 31000**: Risk Management Guidelines (international standard for risk management frameworks)
- **Data Protection**: ICO guidance on data protection impact assessments (DPIA)

### Implementation References

- **FastEndpoints Documentation**: [Background Services](https://fast-endpoints.com/docs/misc-guides#background-services)
- **Entity Framework Core**: [Composite Keys and Indexes](https://learn.microsoft.com/en-us/ef/core/modeling/keys)
- **React Query**: [Dependent Queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries) for reminder integration
- **MUI DatePicker**: [Date range validation](https://mui.com/x/react-date-pickers/validation/) for review date calculations

### Related Documentation

- [Church Register Architecture Documentation](../docs/ARCHITECTURE.md) - System architecture patterns
- [Security Configuration Guide](../docs/security-configuration.md) - Role-based access control setup
- [Local Development Setup](../docs/local-development-setup.md) - Docker container configuration for weekly startup pattern
