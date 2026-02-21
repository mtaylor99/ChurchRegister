---
title: Church Reminders Management System Specification
version: 1.0
date_created: 2026-02-14
last_updated: 2026-02-14
owner: Church Register Development Team
tags: [reminders, compliance, recurring-tasks, task-management, alerts]
---

# Church Reminders Management System

## 1. Purpose & Scope

This specification defines the requirements, constraints, and interfaces for implementing a reminders management system for the Church Register application. The feature enables authorized users to create, track, and manage recurring compliance reminders (e.g., insurance renewals, training certifications, maintenance tasks) with automated alert notifications and completion tracking.

**Intended Audience**: Backend developers, frontend developers, QA engineers, administrators

**Assumptions**:
- Reminders are organization-level (not personal to-do lists)
- Reminders are assigned to system users for ownership/completion
- Recurrence is manual (user opts to create next on completion, not automated)
- Alert thresholds match training certificates pattern (60 days amber, 30 days red)

## 2. Definitions

- **Reminder**: A task with description, due date, and assigned user requiring completion or renewal
- **Alert Status**: Visual indicator (Red/Amber/None) based on days until due date
- **RAG Status**: Red-Amber-Green traffic light system for priority visualization
- **Overdue**: Reminder with due date in past and status still Pending
- **Recurrence Interval**: Time period (3/6/12 months) for calculating next reminder due date
- **Completion Notes**: Mandatory text captured when marking reminder complete
- **Priority**: Optional flag indicating important reminders (Important vs Normal)
- **Show Expired**: Toggle filter to include/exclude Completed reminders from grid

## 3. Requirements, Constraints & Guidelines

### Database Requirements

- **REQ-DB-001**: Create `ReminderCategories` table with Id (PK), Name (nvarchar 100, unique), ColorHex (nvarchar 7 nullable), IsSystemCategory (bit, default 0), SortOrder (int, default 0), CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime
- **REQ-DB-002**: Seed ReminderCategories with system categories: "None" (#9e9e9e, SortOrder 0), "Health & Safety" (#f44336, SortOrder 1), "Financial" (#4caf50, SortOrder 2), "Risk Assessments" (#ff9800, SortOrder 3) - all with IsSystemCategory=true
- **REQ-DB-003**: Add unique constraint on ReminderCategories.Name (case-insensitive)
- **REQ-DB-004**: Create `Reminders` table with Id (PK), Description, DueDate, AssignedToUserId (FK to AspNetUsers), CategoryId (FK to ReminderCategories, nullable), Priority (bool nullable), Status, CompletionNotes (nullable), CompletedBy (nullable), CompletedDateTime (nullable), CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime
- **REQ-DB-005**: CategoryId foreign key references ReminderCategories.Id with ON DELETE SET NULL
- **REQ-DB-006**: Status column stores only "Pending" or "Completed" (not Overdue - calculated on frontend)
- **REQ-DB-007**: Priority column: true = Important, false/null = Normal
- **REQ-DB-008**: CompletionNotes nullable in database but mandatory when completing via UI
- **REQ-DB-009**: AssignedToUserId foreign key references AspNetUsers.Id with NO ACTION on delete
- **REQ-DB-010**: All reminders stored in single table (no separate recurrence or history tables)
- **REQ-DB-011**: Hard delete only (no IsDeleted soft delete flag)
- **REQ-DB-012**: Add indexes on DueDate, Status, AssignedToUserId, CategoryId for query performance

### API Requirements - Reminders

- **REQ-API-001**: Create GET /api/reminders endpoint with query parameters: status, assignedToUserId, categoryId, description (search)
- **REQ-API-002**: Create GET /api/reminders/{id} endpoint returning full reminder details including category
- **REQ-API-003**: Create POST /api/reminders endpoint for creating new reminder with categoryId
- **REQ-API-004**: Create PUT /api/reminders/{id} endpoint for updating existing reminder including categoryId
- **REQ-API-005**: Create PUT /api/reminders/{id}/complete endpoint for marking complete with notes
- **REQ-API-006**: Create DELETE /api/reminders/{id} endpoint for hard delete
- **REQ-API-007**: Create GET /api/reminders/dashboard-summary endpoint returning count within 60 days
- **REQ-API-008**: GET /api/reminders accessible to RemindersViewer, RemindersContributor, RemindersAdministrator
- **REQ-API-009**: POST/PUT/DELETE accessible to RemindersContributor, RemindersAdministrator only (NOT Viewer)
- **REQ-API-010**: Complete endpoint validates CompletionNotes is not empty
- **REQ-API-011**: Complete endpoint accepts optional createNext flag with interval (3/6/12 months) or custom date
- **REQ-API-012**: Complete endpoint inherits categoryId when creating next reminder

### API Requirements - Categories

- **REQ-API-CAT-001**: Create GET /api/reminder-categories endpoint returning all categories ordered by SortOrder
- **REQ-API-CAT-002**: Create GET /api/reminder-categories/{id} endpoint returning single category
- **REQ-API-CAT-003**: Create POST /api/reminder-categories endpoint for creating new category
- **REQ-API-CAT-004**: Create PUT /api/reminder-categories/{id} endpoint for updating category (name, color, sortOrder)
- **REQ-API-CAT-005**: Create DELETE /api/reminder-categories/{id} endpoint for deleting user-created categories
- **REQ-API-CAT-006**: GET /api/reminder-categories accessible to RemindersViewer, RemindersContributor, RemindersAdministrator
- **REQ-API-CAT-007**: POST/PUT/DELETE accessible to RemindersContributor, RemindersAdministrator only
- **REQ-API-CAT-008**: Cannot delete category with IsSystemCategory=true (return 400 Bad Request)
- **REQ-API-CAT-009**: Cannot delete category in use by reminders (return 400 Bad Request with count)
- **REQ-API-CAT-010**: Cannot update Name of system category (IsSystemCategory=true)
- **REQ-API-CAT-011**: Category names must be unique (case-insensitive), max 100 characters
- **REQ-API-CAT-012**: ColorHex must be valid hex format (#RRGGBB) or null

### Frontend Requirements - Page Layout

- **REQ-UI-001**: Add "Reminders" section to left navigation bar (new top-level menu item)
- **REQ-UI-002**: Create RemindersPage with tabbed interface matching Training Certificates pattern
- **REQ-UI-003**: Tab 1 labeled "Reminders" with Notifications icon - displays reminders grid
- **REQ-UI-004**: Tab 2 labeled "Categories" with Category icon - displays category management grid
- **REQ-UI-005**: Page toolbar shows different actions based on active tab
- **REQ-UI-006**: Tab 1 toolbar: "Add Reminder" button (primary)
- **REQ-UI-007**: Tab 2 toolbar: "Add Category" button (primary)
- **REQ-UI-008**: Page header: Bell icon, "Reminders" title, subtitle "Manage compliance reminders and task categories"

### Frontend Requirements - Reminders Grid (Tab 1)

- **REQ-UI-009**: Grid columns: Description, Category, Assigned To, Priority, Alert, Due Date, Status, Actions
- **REQ-UI-010**: Category column displays category name as colored chip with ColorHex background (if not null/None)
- **REQ-UI-011**: Category column: "None" category displays as grey chip, user categories display with custom colors
- **REQ-UI-012**: Priority column displays star icon (⭐) for Important, blank for Normal
- **REQ-UI-013**: Alert column displays icon: Red (due within 30 days), Amber (due 31-60 days), None (due > 60 days or Completed)
- **REQ-UI-014**: Status column displays: Pending (blue chip), Completed (green chip), Overdue (red chip - calculated: Pending + due date < today)
- **REQ-UI-015**: Grid filters: Description (search), Category (dropdown All/specific category), Status (All/Pending/Completed/Overdue), Assigned To (All/specific user), Show Expired (toggle default OFF)
- **REQ-UI-016**: Category filter dropdown populated from ReminderCategories ordered by SortOrder
- **REQ-UI-017**: Category filter "All" includes reminders with null CategoryId
- **REQ-UI-018**: "Show Expired" toggle OFF excludes Completed reminders (matches training pattern)
- **REQ-UI-019**: Three-dot action menu per row: Edit Reminder, Mark Complete, Delete Reminder, View History

### Frontend Requirements - Category Management Grid (Tab 2)

- **REQ-UI-020**: Grid columns: Name, Color (chip preview), Sort Order, Actions
- **REQ-UI-021**: Color column displays colored chip with category name using ColorHex
- **REQ-UI-022**: Sort Order column displays numeric value (editable inline or via up/down arrows)
- **REQ-UI-023**: Actions column: three-dot menu with Edit Category, Delete Category
- **REQ-UI-024**: System categories (IsSystemCategory=true) show "System" badge, Edit allows color/sort only (not name)
- **REQ-UI-025**: Delete action disabled for system categories with tooltip "Cannot delete system category"
- **REQ-UI-026**: Delete action disabled for categories in use with tooltip "Category in use by X reminders"
- **REQ-UI-027**: Grid ordered by SortOrder ascending
- **REQ-UI-028**: No pagination required (low record count expected)

### Frontend Requirements - Create/Edit Reminder Drawers

- **REQ-UI-029**: Create CreateReminderDrawer component (anchor: right, width: 500px)
- **REQ-UI-030**: CreateReminderDrawer fields: Description (required), Category (dropdown, default "None"), Due Date (required), Assigned To (dropdown, required), Priority (checkbox "Mark as Important")
- **REQ-UI-031**: Category dropdown populated from ReminderCategories ordered by SortOrder, displays colored chips
- **REQ-UI-032**: Create EditReminderDrawer component (same fields as Create, pre-populated including category)
- **REQ-UI-033**: Create CompleteReminderDrawer component with: Reminder details (read-only, including category), Completion Notes (textarea, required), "Create next reminder" section
- **REQ-UI-034**: CompleteReminderDrawer "Create next reminder" section: Checkbox, Interval dropdown (3/6/12 months/Custom), Date picker (if Custom selected)
- **REQ-UI-035**: When creating next reminder, category inherited from original reminder automatically

### Frontend Requirements - Category Management Drawers

- **REQ-UI-036**: Create CreateCategoryDrawer component (anchor: right, width: 400px)
- **REQ-UI-037**: CreateCategoryDrawer fields: Name (required, max 100 chars), Color (color picker, optional)
- **REQ-UI-038**: Color picker displays color swatches for common colors plus custom hex input
- **REQ-UI-039**: Create EditCategoryDrawer component (same fields as Create, pre-populated)
- **REQ-UI-040**: EditCategoryDrawer for system category: Name field disabled with helper text "System category name cannot be changed"
- **REQ-UI-041**: EditCategoryDrawer for system category: Color and SortOrder remain editable
- **REQ-UI-042**: Display validation error if name already exists (case-insensitive)

### Frontend Requirements - Dashboard Widget

- **REQ-UI-043**: Add Reminders dashboard widget (7th position, after Data Protection widget)
- **REQ-UI-044**: Dashboard widget displays: Bell icon, "Reminders" title, count of reminders within 60 days (excluding Completed), checkmark if count is 0
- **REQ-UI-045**: Dashboard widget click navigates to Reminders page (Tab 1)
- **REQ-UI-046**: Dashboard widget has "Quick Add" button (+ icon) opening CreateReminderDrawer

### Security Requirements

- **SEC-001**: Only RemindersContributor and RemindersAdministrator roles can create/edit/delete reminders
- **SEC-002**: RemindersViewer role can view reminders but cannot create/edit/complete/delete
- **SEC-003**: API endpoints must validate user role authorization
- **SEC-004**: Drawer actions must conditionally render based on user role
- **SEC-005**: Audit trail must capture username from JWT claims for CreatedBy/ModifiedBy/CompletedBy fields
- **SEC-006**: Users can only complete reminders assigned to them OR administrators can complete any reminder

### Business Logic Requirements

- **REQ-BIZ-001**: Alert status calculation: due date within 30 days = Red, 31-60 days = Amber, > 60 days or Completed = None
- **REQ-BIZ-002**: Overdue status calculation: Status=Pending AND DueDate < Today = display as Overdue (calculate on frontend, not stored)
- **REQ-BIZ-003**: When marking complete with "Create next reminder" checked, calculate new due date = current due date + selected interval
- **REQ-BIZ-004**: New reminder created from completion inherits: Description, AssignedToUserId, Priority, CategoryId (Status always Pending)
- **REQ-BIZ-005**: Interval calculation: 3 months = +3 months, 6 months = +6, 12 months = +12, Custom = user-selected date
- **REQ-BIZ-006**: Dashboard summary counts reminders with: Status=Pending AND DueDate <= (Today + 60 days)
- **REQ-BIZ-007**: Cannot edit or delete Completed reminders (actions disabled if Status=Completed)
- **REQ-BIZ-008**: Can mark Overdue reminders as complete without updating due date first
- **REQ-BIZ-009**: Cannot delete category if IsSystemCategory=true (validate in API)
- **REQ-BIZ-010**: Cannot delete category if reminders reference it (validate in API, return error with count)
- **REQ-BIZ-011**: When category deleted by admin override, all reminders with CategoryId set to NULL
- **REQ-BIZ-012**: Category names must be unique across system (case-insensitive comparison)
- **REQ-BIZ-013**: SortOrder determines display order in dropdowns and category grid (ascending)
- **REQ-BIZ-014**: Default category for new reminders = null (or "None" category if required in UI)

### Technical Constraints

- **CON-001**: Must use Entity Framework Core for database schema and migrations
- **CON-002**: Must use FastEndpoints pattern for API endpoints
- **CON-003**: Must use React Query for frontend data fetching and cache invalidation
- **CON-004**: Must use MUI components (Drawer, DataGrid, DatePicker, Chip) for UI
- **CON-005**: No Excel export required for Reminders grid
- **CON-006**: No soft delete (hard delete only)
- **CON-007**: All reminders stored in single table (no archiving to separate table)
- **CON-008**: Recurrence is manual (no automated scheduled jobs to create next reminders)

### Guidelines

- **GUD-001**: Follow existing drawer implementation patterns (Training Certificates, District, Data Protection)
- **GUD-002**: Follow existing three-dot menu action patterns
- **GUD-003**: Follow existing dashboard widget patterns (Training Certificates widget)
- **GUD-004**: Use existing notification system for success/error messages
- **GUD-005**: Maintain consistent naming conventions (Reminders, not Tasks/Alerts)
- **GUD-006**: Include XML documentation comments for all public APIs
- **GUD-007**: Use same RAG color scheme as Training (Red: #f44336, Amber: #ff9800, Green: #4caf50)
- **GUD-008**: Grid styling and behavior should closely match Training Certificates grid

### Design Patterns

- **PAT-001**: Icon-based status visualization (RAG status for alerts, chips for status)
- **PAT-002**: Drawer-based CRUD operations (Create, Edit, Complete as separate drawers)
- **PAT-003**: Filter state management with Show Expired toggle matching training pattern
- **PAT-004**: Dashboard widget as navigation entry point with quick-add capability
- **PAT-005**: Optimistic UI updates with React Query mutation and cache invalidation

## 4. Interfaces & Data Contracts

### Database Schema

#### ReminderCategories Table

```sql
CREATE TABLE ReminderCategories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ColorHex NVARCHAR(7) NULL, -- e.g., '#ff5722'
    IsSystemCategory BIT NOT NULL DEFAULT 0,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy NVARCHAR(256) NOT NULL,
    ModifiedDateTime DATETIME2 NOT NULL,
    CONSTRAINT UQ_ReminderCategories_Name UNIQUE (Name)
);

-- Seed system categories
INSERT INTO ReminderCategories (Name, ColorHex, IsSystemCategory, SortOrder, CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime)
VALUES 
    ('None', '#9e9e9e', 1, 0, 'System', GETUTCDATE(), 'System', GETUTCDATE()),
    ('Health & Safety', '#f44336', 1, 1, 'System', GETUTCDATE(), 'System', GETUTCDATE()),
    ('Financial', '#4caf50', 1, 2, 'System', GETUTCDATE(), 'System', GETUTCDATE()),
    ('Risk Assessments', '#ff9800', 1, 3, 'System', GETUTCDATE(), 'System', GETUTCDATE());
```

#### Reminders Table

```sql
CREATE TABLE Reminders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Description NVARCHAR(500) NOT NULL,
    DueDate DATETIME2 NOT NULL,
    AssignedToUserId NVARCHAR(450) NOT NULL,
    CategoryId INT NULL,
    Priority BIT NULL, -- true = Important, false/null = Normal
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Completed
    CompletionNotes NVARCHAR(MAX) NULL, -- mandatory via UI validation
    CompletedBy NVARCHAR(256) NULL,
    CompletedDateTime DATETIME2 NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy NVARCHAR(256) NOT NULL,
    ModifiedDateTime DATETIME2 NOT NULL,
    CONSTRAINT FK_Reminders_AssignedToUser 
        FOREIGN KEY (AssignedToUserId) 
        REFERENCES AspNetUsers(Id) 
        ON DELETE NO ACTION,
    CONSTRAINT FK_Reminders_Category
        FOREIGN KEY (CategoryId)
        REFERENCES ReminderCategories(Id)
        ON DELETE SET NULL,
    CONSTRAINT CK_Reminders_Status 
        CHECK (Status IN ('Pending', 'Completed'))
);

CREATE INDEX IX_Reminders_DueDate ON Reminders(DueDate);
CREATE INDEX IX_Reminders_Status ON Reminders(Status);
CREATE INDEX IX_Reminders_AssignedToUserId ON Reminders(AssignedToUserId);
CREATE INDEX IX_Reminders_CategoryId ON Reminders(CategoryId);
CREATE INDEX IX_Reminders_Status_DueDate ON Reminders(Status, DueDate);
```

### Backend DTOs

#### ReminderCategoryDto

```csharp
public class ReminderCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public bool IsSystemCategory { get; set; }
    public int SortOrder { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDateTime { get; set; }
    public int ReminderCount { get; set; } // Number of reminders using this category
}
```

#### ReminderDto

```csharp
public class ReminderDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string AssignedToUserId { get; set; } = string.Empty;
    public string AssignedToUserName { get; set; } = string.Empty; // display name
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; } // display name
    public string? CategoryColorHex { get; set; } // for chip display
    public bool? Priority { get; set; } // true = Important, null/false = Normal
    public string Status { get; set; } = string.Empty; // "Pending", "Completed"
    public string? CompletionNotes { get; set; }
    public string? CompletedBy { get; set; }
    public DateTime? CompletedDateTime { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDateTime { get; set; }
    
    // Calculated fields (not stored)
    public string AlertStatus { get; set; } = string.Empty; // "red", "amber", "none"
    public int DaysUntilDue { get; set; }
}
```

#### CreateReminderCategoryRequest

```csharp
public class CreateReminderCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
}
```

#### UpdateReminderCategoryRequest

```csharp
public class UpdateReminderCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public int SortOrder { get; set; }
}
```

#### CreateReminderRequest

```csharp
public class CreateReminderRequest
{
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string AssignedToUserId { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public bool? Priority { get; set; }
}
```

#### UpdateReminderRequest

```csharp
public class UpdateReminderRequest
{
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string AssignedToUserId { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public bool? Priority { get; set; }
}
```

#### CompleteReminderRequest

```csharp
public class CompleteReminderRequest
{
    public string CompletionNotes { get; set; } = string.Empty; // required
    public bool CreateNext { get; set; }
    public string? NextInterval { get; set; } // "3months", "6months", "12months", "custom"
    public DateTime? CustomDueDate { get; set; } // required if NextInterval = "custom"
}
```

#### ReminderQueryParameters

```csharp
public class ReminderQueryParameters
{
    public string? Status { get; set; } // "Pending", "Completed", "Overdue"
    public string? AssignedToUserId { get; set; }
    public int? CategoryId { get; set; } // null = include all including null CategoryId
    public string? Description { get; set; } // search filter
    public bool ShowExpired { get; set; } = false; // if false, exclude Completed
}
```

#### DashboardReminderSummaryDto

```csharp
public class DashboardReminderSummaryDto
{
    public int UpcomingCount { get; set; } // count within 60 days, status = Pending
}
```

### API Endpoints

#### GET /api/reminder-categories

**Authorization**: RemindersViewer, RemindersContributor, RemindersAdministrator

**Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "None",
    "colorHex": "#9e9e9e",
    "isSystemCategory": true,
    "sortOrder": 0,
    "reminderCount": 5
  },
  {
    "id": 2,
    "name": "Health & Safety",
    "colorHex": "#f44336",
    "isSystemCategory": true,
    "sortOrder": 1,
    "reminderCount": 12
  }
]
```

#### POST /api/reminder-categories

**Authorization**: RemindersContributor, RemindersAdministrator

**Request Body**:
```json
{
  "name": "Training & Development",
  "colorHex": "#2196f3"
}
```

**Response**: 201 Created (returns ReminderCategoryDto)

**Response**: 400 Bad Request (validation: name already exists, invalid color hex)

#### PUT /api/reminder-categories/{id}

**Authorization**: RemindersContributor, RemindersAdministrator

**Request Body**: UpdateReminderCategoryRequest

**Response**: 200 OK (returns updated ReminderCategoryDto)

**Response**: 400 Bad Request (cannot update system category name, validation errors)

#### DELETE /api/reminder-categories/{id}

**Authorization**: RemindersContributor, RemindersAdministrator

**Response**: 204 No Content

**Response**: 400 Bad Request (system category, category in use by X reminders)

#### GET /api/reminders

**Authorization**: RemindersViewer, RemindersContributor, RemindersAdministrator

**Query Parameters**:
- `status` (string, optional): Filter by "Pending", "Completed", "Overdue"
- `assignedToUserId` (string, optional): Filter by user ID
- `categoryId` (int, optional): Filter by category ID
- `description` (string, optional): Search in description
- `showExpired` (bool, optional, default: false): Include Completed reminders

**Response**: 200 OK
```json
[
  {
    "id": 1,
    "description": "Renew Church Building Insurance",
    "dueDate": "2026-03-15T00:00:00Z",
    "assignedToUserId": "user-123",
    "assignedToUserName": "John Smith",
    "categoryId": 3,
    "categoryName": "Financial",
    "categoryColorHex": "#4caf50",
    "priority": true,
    "status": "Pending",
    "completionNotes": null,
    "completedBy": null,
    "completedDateTime": null,
    "createdBy": "admin@church.org",
    "createdDateTime": "2025-03-15T10:00:00Z",
    "modifiedBy": "admin@church.org",
    "modifiedDateTime": "2025-03-15T10:00:00Z",
    "alertStatus": "amber",
    "daysUntilDue": 45
  }
]
```

#### GET /api/reminders/{id}

**Authorization**: RemindersViewer, RemindersContributor, RemindersAdministrator

**Response**: 200 OK (returns ReminderDto)

**Response**: 404 Not Found

#### POST /api/reminders

**Authorization**: RemindersContributor, RemindersAdministrator (NOT Viewer)

**Request Body**:
```json
{
  "description": "Fire Marshal Training Renewal",
  "dueDate": "2027-03-01T00:00:00Z",
  "assignedToUserId": "user-456",
  "categoryId": 2,
  "priority": false
}
```

**Response**: 201 Created (returns ReminderDto with Location header)

**Response**: 400 Bad Request (validation errors)

#### PUT /api/reminders/{id}

**Authorization**: RemindersContributor, RemindersAdministrator

**Request Body**: UpdateReminderRequest (same as Create)

**Response**: 200 OK (returns updated ReminderDto)

**Response**: 400 Bad Request (validation or cannot edit Completed)

**Response**: 404 Not Found

#### PUT /api/reminders/{id}/complete

**Authorization**: RemindersContributor, RemindersAdministrator

**Request Body**:
```json
{
  "completionNotes": "Policy renewed with AXA Insurance. Policy #INS-2026-12345. Premium £2,500.",
  "createNext": true,
  "nextInterval": "12months",
  "customDueDate": null
}
```

**Response**: 200 OK
```json
{
  "completed": { /* ReminderDto of completed reminder */ },
  "nextReminder": { /* ReminderDto of new reminder if createNext=true */ }
}
```

**Response**: 400 Bad Request (CompletionNotes empty, already completed)

**Response**: 404 Not Found

#### DELETE /api/reminders/{id}

**Authorization**: RemindersContributor, RemindersAdministrator

**Response**: 204 No Content

**Response**: 400 Bad Request (cannot delete Completed)

**Response**: 404 Not Found

#### GET /api/reminders/dashboard-summary

**Authorization**: RemindersViewer, RemindersContributor, RemindersAdministrator

**Response**: 200 OK
```json
{
  "upcomingCount": 8
}
```

### Frontend TypeScript Interfaces

#### ReminderCategory Type

```typescript
export interface ReminderCategory {
  id: number;
  name: string;
  colorHex: string | null;
  isSystemCategory: boolean;
  sortOrder: number;
  createdBy: string;
  createdDateTime: string;
  modifiedBy: string;
  modifiedDateTime: string;
  reminderCount: number;
}
```

#### Reminder Type

```typescript
export interface Reminder {
  id: number;
  description: string;
  dueDate: string; // ISO date string
  assignedToUserId: string;
  assignedToUserName: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryColorHex: string | null;
  priority: boolean | null;
  status: 'Pending' | 'Completed';
  completionNotes: string | null;
  completedBy: string | null;
  completedDateTime: string | null;
  createdBy: string;
  createdDateTime: string;
  modifiedBy: string;
  modifiedDateTime: string;
  alertStatus: 'red' | 'amber' | 'none';
  daysUntilDue: number;
}
```

#### CreateReminderCategoryRequest Type

```typescript
export interface CreateReminderCategoryRequest {
  name: string;
  colorHex: string | null;
}
```

#### UpdateReminderCategoryRequest Type

```typescript
export interface UpdateReminderCategoryRequest {
  name: string;
  colorHex: string | null;
  sortOrder: number;
}
```

#### CreateReminderRequest Type

```typescript
export interface CreateReminderRequest {
  description: string;
  dueDate: string;
  assignedToUserId: string;
  categoryId: number | null;
  priority: boolean | null;
}
```

#### UpdateReminderRequest Type

```typescript
export interface UpdateReminderRequest {
  description: string;
  dueDate: string;
  assignedToUserId: string;
  categoryId: number | null;
  priority: boolean | null;
}
```

#### CompleteReminderRequest Type

```typescript
export interface CompleteReminderRequest {
  completionNotes: string;
  createNext: boolean;
  nextInterval: '3months' | '6months' | '12months' | 'custom' | null;
  customDueDate: string | null;
}
```

#### ReminderQueryParameters Type

```typescript
export interface ReminderQueryParameters {
  status?: 'Pending' | 'Completed' | 'Overdue';
  assignedToUserId?: string;
  categoryId?: number;
  description?: string;
  showExpired?: boolean;
}
```

### Grid Column Configuration

```typescript
const columns: GridColDef[] = [
  {
    field: 'description',
    headerName: 'Description',
    width: 300,
    sortable: true,
    filterable: true
  },
  {
    field: 'categoryName',
    headerName: 'Category',
    width: 150,
    sortable: true,
    renderCell: (params) => {
      if (!params.row.categoryName) return <Chip label="None" size="small" sx={{ bgcolor: '#9e9e9e' }} />;
      return (
        <Chip 
          label={params.row.categoryName}
          size="small"
          sx={{ bgcolor: params.row.categoryColorHex || '#9e9e9e' }}
        />
      );
    }
  },
  {
    field: 'assignedToUserName',
    headerName: 'Assigned To',
    width: 150,
    sortable: true
  },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 80,
    renderCell: (params) => params.row.priority ? <Star color="warning" /> : null
  },
  {
    field: 'alertStatus',
    headerName: 'Alert',
    width: 80,
    renderCell: (params) => {
      if (params.row.status === 'Completed') return null;
      if (params.row.alertStatus === 'red') return <ErrorIcon color="error" />;
      if (params.row.alertStatus === 'amber') return <WarningIcon color="warning" />;
      return null;
    }
  },
  {
    field: 'dueDate',
    headerName: 'Due Date',
    width: 120,
    renderCell: (params) => new Date(params.row.dueDate).toLocaleDateString()
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => {
      // Calculate display status
      const isPending = params.row.status === 'Pending';
      const isOverdue = isPending && new Date(params.row.dueDate) < new Date();
      const displayStatus = isOverdue ? 'Overdue' : params.row.status;
      
      return (
        <Chip 
          label={displayStatus}
          color={displayStatus === 'Completed' ? 'success' : displayStatus === 'Overdue' ? 'error' : 'info'}
          size="small"
        />
      );
    }
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 80,
    renderCell: (params) => <ActionsMenu reminder={params.row} />
  }
];
```

## 5. Acceptance Criteria

### Database & Migration

- **AC-DB-001**: Given a new EF migration is created, When applied to database, Then Reminders table exists with all specified columns and constraints
- **AC-DB-002**: Given Reminders table exists, When querying schema, Then Status column has CHECK constraint limiting to 'Pending' or 'Completed'
- **AC-DB-003**: Given Reminders table exists, When querying indexes, Then indexes exist on DueDate, Status, AssignedToUserId
- **AC-DB-004**: Given Reminders table, When querying foreign keys, Then FK_Reminders_AssignedToUser exists with NO ACTION on delete
- **AC-DB-005**: Given database schema, When querying AspNetRoles, Then RemindersViewer, RemindersContributor, RemindersAdministrator roles exist

### Backend Service Layer

- **AC-SVC-001**: Given valid query parameters, When GetRemindersAsync is called, Then return list of ReminderDto with AlertStatus and DaysUntilDue calculated
- **AC-SVC-002**: Given status filter "Overdue", When GetRemindersAsync is called, Then return only reminders with Status=Pending AND DueDate < Today
- **AC-SVC-003**: Given showExpired=false, When GetRemindersAsync is called, Then exclude reminders with Status=Completed
- **AC-SVC-004**: Given valid CreateReminderRequest, When CreateReminderAsync is called, Then create reminder with Status=Pending, populate audit fields
- **AC-SVC-005**: Given valid UpdateReminderRequest, When UpdateReminderAsync is called, Then update description/dueDate/assignedTo/priority, update ModifiedBy/DateTime
- **AC-SVC-006**: Given reminder with Status=Completed, When UpdateReminderAsync is called, Then throw validation exception
- **AC-SVC-007**: Given valid CompleteReminderRequest with empty CompletionNotes, When CompleteReminderAsync is called, Then throw validation exception
- **AC-SVC-008**: Given CompleteReminderRequest with createNext=true and nextInterval="12months", When CompleteReminderAsync is called, Then create new reminder with DueDate = original DueDate + 12 months
- **AC-SVC-009**: Given CompleteReminderRequest with createNext=true and nextInterval="custom", When CompleteReminderAsync is called, Then create new reminder with DueDate = CustomDueDate
- **AC-SVC-010**: Given CompleteReminderRequest with createNext=false, When CompleteReminderAsync is called, Then only complete existing reminder, do not create new
- **AC-SVC-011**: Given dashboard summary query, When GetDashboardSummaryAsync is called, Then return count of reminders with Status=Pending AND DueDate <= (Today + 60 days)
- **AC-SVC-012**: Given AlertStatus calculation with DueDate 25 days away, When mapping to DTO, Then AlertStatus = "red"
- **AC-SVC-013**: Given AlertStatus calculation with DueDate 45 days away, When mapping to DTO, Then AlertStatus = "amber"
- **AC-SVC-014**: Given AlertStatus calculation with DueDate 70 days away, When mapping to DTO, Then AlertStatus = "none"
- **AC-SVC-015**: Given AlertStatus calculation with Status=Completed, When mapping to DTO, Then AlertStatus = "none" regardless of DueDate

### Backend API Endpoints

- **AC-API-001**: Given authenticated RemindersViewer, When GET /api/reminders, Then return 200 with list of ReminderDto
- **AC-API-002**: Given authenticated RemindersContributor, When POST /api/reminders with valid request, Then return 201 with created ReminderDto
- **AC-API-003**: Given authenticated RemindersAdministrator, When PUT /api/reminders/{id} with valid request, Then return 200 with updated ReminderDto
- **AC-API-004**: Given authenticated RemindersViewer, When POST /api/reminders, Then return 403 Forbidden
- **AC-API-005**: Given unauthenticated request, When GET /api/reminders, Then return 401 Unauthorized
- **AC-API-006**: Given invalid reminder ID 99999, When GET /api/reminders/99999, Then return 404 Not Found
- **AC-API-007**: Given valid CompleteReminderRequest, When PUT /api/reminders/{id}/complete, Then return 200 with completed reminder and optionally new reminder
- **AC-API-008**: Given CompleteReminderRequest with empty CompletionNotes, When PUT /api/reminders/{id}/complete, Then return 400 Bad Request with validation error
- **AC-API-009**: Given completed reminder, When DELETE /api/reminders/{id}, Then return 400 Bad Request (cannot delete completed)
- **AC-API-010**: Given pending reminder, When DELETE /api/reminders/{id}, Then return 204 No Content and hard delete from database
- **AC-API-011**: Given Swagger documentation, When viewing API docs, Then all reminder endpoints documented with request/response schemas and authorization

### Frontend Navigation & Layout

- **AC-UI-001**: Given left navigation menu, When rendered, Then "Reminders" menu item appears as top-level section with Bell icon
- **AC-UI-002**: Given "Reminders" menu item, When clicked, Then navigate to /reminders route
- **AC-UI-003**: Given RemindersPage, When rendered, Then page title "Reminders" displays with "Add Reminder" button in toolbar

### Frontend Grid Display

- **AC-UI-004**: Given Reminders grid, When rendered, Then columns appear in order: Description, Assigned To, Priority, Alert, Due Date, Status, Actions
- **AC-UI-005**: Given reminder with priority=true, When viewing grid, Then Priority column shows gold star icon
- **AC-UI-006**: Given reminder with priority=false/null, When viewing grid, Then Priority column is blank
- **AC-UI-007**: Given reminder due in 25 days, When viewing grid, Then Alert column shows red error icon
- **AC-UI-008**: Given reminder due in 45 days, When viewing grid, Then Alert column shows amber warning icon
- **AC-UI-009**: Given reminder due in 70 days, When viewing grid, Then Alert column is blank
- **AC-UI-010**: Given completed reminder, When viewing grid, Then Alert column is blank
- **AC-UI-011**: Given reminder with Status=Pending and DueDate in future, When viewing grid, Then Status displays blue "Pending" chip
- **AC-UI-012**: Given reminder with Status=Completed, When viewing grid, Then Status displays green "Completed" chip
- **AC-UI-013**: Given reminder with Status=Pending and DueDate in past, When viewing grid, Then Status displays red "Overdue" chip (calculated)
- **AC-UI-014**: Given Due Date column, When rendered, Then date formatted as MM/DD/YYYY locale string

### Frontend Filters

- **AC-UI-015**: Given grid filters, When rendered, Then Description search, Status dropdown, Assigned To dropdown, Show Expired toggle are visible
- **AC-UI-016**: Given Status filter dropdown, When opened, Then options are: "All" (italic), "Pending", "Completed", "Overdue"
- **AC-UI-017**: Given Status filter set to "Overdue", When applied, Then grid shows only reminders with Pending status and due date < today
- **AC-UI-018**: Given Assigned To filter dropdown, When opened, Then all system users listed plus "All" option (italic)
- **AC-UI-019**: Given Show Expired toggle OFF (default), When grid loads, Then Completed reminders are excluded
- **AC-UI-020**: Given Show Expired toggle ON, When grid loads, Then Completed reminders are included
- **AC-UI-021**: Given Description search filter, When user types "insurance", Then grid shows only reminders with "insurance" in description (case-insensitive)

### Frontend Create Reminder Drawer

- **AC-UI-022**: Given "Add Reminder" button clicked, When CreateReminderDrawer opens, Then drawer displays with width 500px anchored right
- **AC-UI-023**: Given CreateReminderDrawer, When rendered, Then fields displayed: Description (text, required), Due Date (date picker, required), Assigned To (dropdown, required), Priority checkbox ("Mark as Important")
- **AC-UI-024**: Given CreateReminderDrawer, When Description field empty and Save clicked, Then validation error "Description is required"
- **AC-UI-025**: Given CreateReminderDrawer, When Due Date empty and Save clicked, Then validation error "Due Date is required"
- **AC-UI-026**: Given CreateReminderDrawer, When Assigned To not selected and Save clicked, Then validation error "Assigned To is required"
- **AC-UI-027**: Given CreateReminderDrawer with valid data, When Save clicked, Then POST /api/reminders called, success notification shown, drawer closes, grid refreshes
- **AC-UI-028**: Given CreateReminderDrawer, When Cancel clicked, Then drawer closes without saving

### Frontend Edit Reminder Drawer

- **AC-UI-029**: Given "Edit Reminder" action clicked, When EditReminderDrawer opens, Then drawer displays with current reminder data pre-populated
- **AC-UI-030**: Given EditReminderDrawer, When fields modified and Save clicked, Then PUT /api/reminders/{id} called, grid refreshes
- **AC-UI-031**: Given completed reminder, When viewing action menu, Then "Edit Reminder" option is disabled/hidden
- **AC-UI-032**: Given EditReminderDrawer with API error, When Save fails, Then error notification shown, drawer remains open

### Frontend Complete Reminder Drawer

- **AC-UI-033**: Given "Mark Complete" action clicked, When CompleteReminderDrawer opens, Then drawer displays reminder details (read-only) and Completion Notes textarea
- **AC-UI-034**: Given CompleteReminderDrawer, When rendered, Then "Create next reminder" section displays with checkbox, interval dropdown, date picker
- **AC-UI-035**: Given CompleteReminderDrawer, When "Create next reminder" checkbox unchecked, Then interval dropdown and date picker are hidden
- **AC-UI-036**: Given CompleteReminderDrawer, When "Create next reminder" checkbox checked, Then interval dropdown displays options: "3 months", "6 months", "12 months", "Custom date"
- **AC-UI-037**: Given interval dropdown set to "Custom date", When selected, Then date picker becomes visible
- **AC-UI-038**: Given interval dropdown set to "3 months", When selected, Then calculated date hint displays: "New due date: {originalDueDate + 3 months}"
- **AC-UI-039**: Given CompleteReminderDrawer, When Completion Notes empty and Complete clicked, Then validation error "Completion Notes are required"
- **AC-UI-040**: Given CompleteReminderDrawer with valid notes and createNext=true with interval="12months", When Complete clicked, Then PUT /api/reminders/{id}/complete called, both reminders returned, grid refreshes showing new pending reminder
- **AC-UI-041**: Given CompleteReminderDrawer with valid notes and createNext=false, When Complete clicked, Then reminder marked complete, drawer closes, grid refreshes showing completed status
- **AC-UI-042**: Given completion successful, When drawer closes, Then success notification shows "Reminder completed successfully" (or "...and new reminder created")

### Frontend Action Menu

- **AC-UI-043**: Given pending reminder, When action menu opened, Then options displayed: "Edit Reminder", "Mark Complete", "Delete Reminder", "View History"
- **AC-UI-044**: Given completed reminder, When action menu opened, Then only "View History" option is visible/enabled
- **AC-UI-045**: Given RemindersViewer user, When viewing action menu, Then only "View History" option is visible (no Edit/Complete/Delete)
- **AC-UI-046**: Given RemindersContributor user, When viewing action menu, Then all actions visible (Edit, Complete, Delete, History)
- **AC-UI-047**: Given "Delete Reminder" clicked, When confirmation dialog displays, Then dialog shows "Are you sure you want to delete this reminder?"
- **AC-UI-048**: Given delete confirmation, When user confirms, Then DELETE /api/reminders/{id} called, reminder removed from grid, success notification shown

### Frontend Dashboard Widget

- **AC-UI-049**: Given dashboard page, When rendered, Then Reminders widget appears as 7th KPI card (after Data Protection widget)
- **AC-UI-050**: Given Reminders widget, When rendered, Then displays Bell icon, "Reminders" title, count of upcoming reminders
- **AC-UI-051**: Given 8 reminders within 60 days, When widget rendered, Then displays "8" as count
- **AC-UI-052**: Given 0 reminders within 60 days, When widget rendered, Then displays green checkmark instead of "0"
- **AC-UI-053**: Given Reminders widget, When clicked, Then navigate to /reminders page
- **AC-UI-054**: Given Reminders widget, When "+" quick add button clicked, Then CreateReminderDrawer opens
- **AC-UI-055**: Given dashboard loads, When widget data fetched, Then GET /api/reminders/dashboard-summary called

### Frontend React Query Integration

- **AC-RQ-001**: Given useReminders hook, When called with query parameters, Then fetch data from GET /api/reminders
- **AC-RQ-002**: Given useCreateReminder hook, When mutation succeeds, Then invalidate reminders query cache and dashboard summary cache
- **AC-RQ-003**: Given useUpdateReminder hook, When mutation succeeds, Then invalidate reminders query cache
- **AC-RQ-004**: Given useCompleteReminder hook, When mutation succeeds, Then invalidate reminders and dashboard summary caches
- **AC-RQ-005**: Given useDeleteReminder hook, When mutation succeeds, Then invalidate reminders and dashboard summary caches

### Security & Authorization

- **AC-SEC-001**: Given RemindersViewer user, When attempting POST /api/reminders, Then request rejected with 403 Forbidden
- **AC-SEC-002**: Given RemindersContributor user, When creating/editing/completing/deleting reminder, Then CreatedBy/ModifiedBy/CompletedBy fields capture username from JWT
- **AC-SEC-003**: Given unauthenticated user, When accessing any reminder endpoint, Then request rejected with 401 Unauthorized
- **AC-SEC-004**: Given reminder completion, When saved, Then CompletedBy and CompletedDateTime fields populated with current user and timestamp

### Business Logic & Calculations

- **AC-BIZ-001**: Given reminder due in 25 days, When AlertStatus calculated, Then returns "red"
- **AC-BIZ-002**: Given reminder due in 45 days, When AlertStatus calculated, Then returns "amber"
- **AC-BIZ-003**: Given reminder due in 70 days, When AlertStatus calculated, Then returns "none"
- **AC-BIZ-004**: Given reminder with Status=Completed, When AlertStatus calculated, Then returns "none" regardless of due date
- **AC-BIZ-005**: Given reminder completion with createNext=true and interval="3months", When new reminder created, Then new DueDate = original DueDate + 3 months
- **AC-BIZ-006**: Given reminder completion with createNext=true and interval="6months", When new reminder created, Then new DueDate = original DueDate + 6 months
- **AC-BIZ-007**: Given reminder completion with createNext=true and interval="12months", When new reminder created, Then new DueDate = original DueDate + 12 months
- **AC-BIZ-008**: Given reminder completion with createNext=true and interval="custom", When new reminder created, Then new DueDate = CustomDueDate from request
- **AC-BIZ-009**: Given new reminder created from completion, When created, Then inherits Description, AssignedToUserId, Priority from original
- **AC-BIZ-010**: Given new reminder created from completion, When created, Then Status always set to "Pending" (not inherited)
- **AC-BIZ-011**: Given dashboard summary calculation, When counting, Then include only reminders with Status=Pending AND DueDate <= (Today + 60 days)
- **AC-BIZ-012**: Given overdue reminder, When marking complete, Then allowed (no need to update due date first)

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer methods, DTO mapping, alert status calculation, date interval calculation, React components, React hooks
- **Integration Tests**: API endpoints with database, EF Core queries, authorization
- **End-to-End Tests**: Complete user workflows from grid to create/edit/complete drawers

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq (for .NET applications)
- **Frontend**: Vitest (component tests), React Testing Library, MSW (API mocking)
- **E2E**: Playwright (cross-browser testing)

### Test Data Management

- **Approach**: Use TestWebApplicationFactory with in-memory/test database
- **Setup**: Create test users and sample reminders in test fixture
- **Cleanup**: Transaction rollback or database reset between tests
- **Fixtures**: ReminderBuilder for generating test reminders with various states

### CI/CD Integration

- **Pipeline**: GitHub Actions workflow triggers on PR and merge to main
- **Stages**: Build → Unit Tests → Integration Tests → E2E Tests → Deploy
- **Gates**: All tests must pass before merge allowed
- **Reporting**: Test results published to PR, code coverage report generated

### Coverage Requirements

- **Minimum Thresholds**: 80% line coverage, 70% branch coverage
- **Critical Paths**: 100% coverage for alert status calculation, date interval arithmetic, completion logic
- **Exclusions**: DTOs, auto-generated code, Program.cs startup

### Performance Testing

- **Load Test**: 50 concurrent users viewing/creating reminders
- **Response Time**: API endpoints must respond within 500ms at 95th percentile
- **Database**: Query performance for reminders list with filters (< 100ms for 1000 records)

### Test Examples

#### Backend Unit Test

```csharp
[TestClass]
public class ReminderServiceTests
{
    [TestMethod]
    public async Task CompleteReminderAsync_WithCreateNext12Months_CreatesNewReminderPlusOneYear()
    {
        // Arrange
        var reminder = new ReminderBuilder()
            .WithDueDate(new DateTime(2026, 3, 15))
            .Build();
        
        var request = new CompleteReminderRequest
        {
            CompletionNotes = "Insurance renewed",
            CreateNext = true,
            NextInterval = "12months"
        };
        
        // Act
        var result = await _service.CompleteReminderAsync(reminder.Id, request, "testuser");
        
        // Assert
        result.Completed.Status.Should().Be("Completed");
        result.Completed.CompletionNotes.Should().Be("Insurance renewed");
        result.NextReminder.Should().NotBeNull();
        result.NextReminder.DueDate.Should().Be(new DateTime(2027, 3, 15));
        result.NextReminder.Status.Should().Be("Pending");
        result.NextReminder.Description.Should().Be(reminder.Description);
    }
    
    [TestMethod]
    public void CalculateAlertStatus_DueIn25Days_ReturnsRed()
    {
        // Arrange
        var dueDate = DateTime.Today.AddDays(25);
        
        // Act
        var alertStatus = ReminderService.CalculateAlertStatus(dueDate, "Pending");
        
        // Assert
        alertStatus.Should().Be("red");
    }
}
```

#### Frontend Component Test

```typescript
describe('CompleteReminderDrawer', () => {
  it('should require completion notes before allowing complete', async () => {
    const mockReminder = createMockReminder({ id: 1, description: 'Test Reminder' });
    
    render(
      <CompleteReminderDrawer 
        open={true} 
        reminder={mockReminder} 
        onClose={jest.fn()} 
      />
    );
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    await userEvent.click(completeButton);
    
    expect(screen.getByText(/completion notes are required/i)).toBeInTheDocument();
  });
  
  it('should show interval dropdown when create next checked', async () => {
    const mockReminder = createMockReminder();
    
    render(<CompleteReminderDrawer open={true} reminder={mockReminder} onClose={jest.fn()} />);
    
    const createNextCheckbox = screen.getByLabelText(/create next reminder/i);
    await userEvent.click(createNextCheckbox);
    
    expect(screen.getByLabelText(/interval/i)).toBeVisible();
    expect(screen.getByRole('option', { name: '3 months' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '6 months' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '12 months' })).toBeInTheDocument();
  });
});
```

#### E2E Test

```typescript
test('contributor can create and complete reminder', async ({ page }) => {
  await page.goto('/reminders');
  
  // Create new reminder
  await page.getByRole('button', { name: 'Add Reminder' }).click();
  await expect(page.getByText('Create Reminder')).toBeVisible();
  
  await page.getByLabel('Description').fill('Test Fire Marshal Training');
  await page.getByLabel('Due Date').fill('2027-03-01');
  await page.getByLabel('Assigned To').selectOption('John Smith');
  await page.getByLabel('Mark as Important').check();
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify success and grid refresh
  await expect(page.getByText(/reminder created successfully/i)).toBeVisible();
  await expect(page.getByText('Test Fire Marshal Training')).toBeVisible();
  
  // Complete reminder with next occurrence
  await page.getByText('Test Fire Marshal Training').click();
  await page.getByLabel('Actions').click();
  await page.getByText('Mark Complete').click();
  
  await page.getByLabel('Completion Notes').fill('Training completed successfully');
  await page.getByLabel('Create next reminder').check();
  await page.getByLabel('Interval').selectOption('12 months');
  await page.getByRole('button', { name: 'Complete' }).click();
  
  // Verify completion and new reminder created
  await expect(page.getByText(/completed and new reminder created/i)).toBeVisible();
  
  // Filter to show expired
  await page.getByLabel('Show Expired').check();
  const completedRows = await page.getByText('Completed').count();
  expect(completedRows).toBeGreaterThan(0);
});
```

## 7. Rationale & Context

### Design Decisions

#### Single Table for All Reminders

**Decision**: Store all reminders (pending, completed, recurring) in single Reminders table with Status column.

**Rationale**:
- Simpler queries (no joins to history/archive tables)
- Easy filtering with Show Expired toggle
- Completed reminders provide historical context (what was done, when, by whom)
- Total record count expected to be low (<1000 annually)
- Can add archiving later if performance becomes issue

**Alternative Considered**: Separate RemindersHistory table for completed
- **Rejected because**: Adds complexity without clear benefit at expected scale, harder to query "show all" scenario

#### Manual Recurrence (Not Automated)

**Decision**: User manually opts to create next reminder on completion, not automated scheduled job.

**Rationale**:
- Church tasks often have irregular schedules (insurance may switch providers, training may be discontinued)
- Manual review ensures reminders stay relevant
- Avoids creating unwanted reminders for discontinued activities
- Simpler implementation (no background workers, no cron jobs)
- User confirms task completion before creating next occurrence

**Alternative Considered**: Automated recurrence using scheduled job
- **Rejected because**: Creates "reminder spam" if task discontinued, requires background infrastructure, less flexible for one-off changes

#### Priority as Optional Boolean

**Decision**: Priority field is nullable boolean (true=Important, false/null=Normal), not enum with levels.

**Rationale**:
- User requested "Important or blank" - binary choice
- Simpler UX (checkbox vs dropdown)
- Most reminders are normal priority; Important is exceptional
- Can extend to enum later if more levels needed (High/Medium/Low)

**Alternative Considered**: Priority enum (High/Medium/Low)
- **Rejected because**: User specifically requested binary choice, simpler for current needs

#### Overdue as Calculated Status (Not Stored)

**Decision**: Store only Pending/Completed in Status column; calculate Overdue on frontend (Status=Pending AND DueDate < Today).

**Rationale**:
- Avoids scheduled job to update Status to Overdue nightly
- Overdue is dynamic (changes at midnight automatically)
- Backend doesn't need to maintain derived state
- Consistent with Training Certificates pattern (calculates Alert status, doesn't store "Expired")

**Alternative Considered**: Overdue as stored status with nightly job
- **Rejected because**: Adds infrastructure complexity, scheduled job can fail, calculated approach is simpler and reliable

#### Mandatory Completion Notes

**Decision**: Require CompletionNotes when marking reminder complete (validated in UI and API).

**Rationale**:
- Provides audit trail for compliance (what was done to complete task)
- Historical record for next person handling renewal ("last year renewed with AXA, policy #12345")
- Forces user to document completion action
- User explicitly requested: "Let's force completion notes, so we know what got done"

#### Hard Delete Only (No Soft Delete)

**Decision**: DELETE endpoint performs hard delete from database; no IsDeleted flag.

**Rationale**:
- User explicitly requested: "No need for soft delete"
- Completed reminders already provide history (Show Expired toggle)
- Simplifies queries (no WHERE IsDeleted = 0 clauses)
- Accidentally created reminders can be fully removed
- Audit log provides deletion record if needed

**Alternative Considered**: Soft delete with IsDeleted flag
- **Rejected because**: User doesn't need undelete functionality, completed reminders already serve as history

#### Cannot Edit/Delete Completed Reminders

**Decision**: Disable Edit and Delete actions for reminders with Status=Completed.

**Rationale**:
- Protects audit trail integrity (completed record shouldn't change)
- Prevents accidental data loss (user thinks they're editing pending, actually editing completed)
- If correction needed, create new reminder instead
- Completion record is historical fact, not editable

#### AssignedTo User Filter

**Decision**: Include filter dropdown for Assigned To user in addition to Description and Status filters.

**Rationale**:
- User mentioned: "worth having a user filter too"
- Allows users to see "my reminders" vs "all reminders"
- Common use case: user wants to see tasks assigned to them
- Administrators need to see all users' reminders for oversight

### User Experience Context

#### Workflow Example

**Scenario: Annual Church Building Insurance Renewal**

1. **Creation** (Feb 2025):
   - Administrator creates reminder: "Renew Church Building Insurance"
   - Due Date: March 15, 2026
   - Assigned To: Church Secretary
   - Priority: Important (starred)

2. **Alert Monitoring** (Jan-Feb 2026):
   - Jan 15: Reminder appears in dashboard widget (60 days before due)
   - Feb 14: Alert icon turns red (30 days before due)
   - Secretary sees red alert in grid, knows action needed

3. **Completion** (Feb 28, 2026):
   - Secretary obtains insurance quotes, renews policy
   - Opens "Mark Complete" drawer
   - Enters Completion Notes: "Policy renewed with AXA Insurance. Policy #INS-2026-12345. Premium £2,500. Buildings cover £500k, contents £100k."
   - Checks "Create next reminder"
   - Selects "12 months" interval
   - Clicks Complete
   - System creates new reminder due March 15, 2027

4. **Historical Record**:
   - Next year, Secretary filters "Show Expired" ON
   - Sees last year's completed reminder with notes
   - References previous policy number and provider for renewal

#### Pain Points Addressed

- **Previous State**: Reliance on paper calendar notes, missed renewals, no central tracking
- **Solution**: Digital reminders with alerts, completion tracking, auto-generation of next occurrence
- **Benefit**: Proactive notifications, audit trail, institutional memory captured in completion notes

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: SQL Server Database - Required for storing Reminders table with indexes and foreign keys

### Third-Party Services

- **SVC-001**: None - Self-contained feature with no external API dependencies

### Infrastructure Dependencies

- **INF-001**: Entity Framework Core ORM - Required for database migrations, relationship mapping
- **INF-002**: ASP.NET Core Runtime - Required for FastEndpoints API hosting, JWT authentication
- **INF-003**: React Router - Required for /reminders route and navigation

### Data Dependencies

- **DAT-001**: AspNetUsers Table - AssignedToUserId foreign key references authenticated user IDs
- **DAT-002**: AspNetRoles Table - Authorization depends on RemindersViewer/Contributor/Administrator roles

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 Runtime - Required for FastEndpoints and Entity Framework Core features
- **PLT-002**: React 19 - Required for frontend component rendering and hooks
- **PLT-003**: TypeScript 5.x - Required for type-safe frontend development
- **PLT-004**: MUI (Material-UI) 7.x - Required for Drawer, DataGrid, DatePicker, Chip components

### Compliance Dependencies

- **COM-001**: None - Feature is for internal task management, not subject to GDPR or external compliance

## 9. Examples & Edge Cases

### Example 1: Simple Reminder Creation

**Scenario**: Administrator creates reminder for fire marshal training renewal.

**Workflow**:
1. Navigate to Reminders page
2. Click "Add Reminder"
3. Fill in:
   - Description: "Fire Marshal Training - John Smith"
   - Due Date: March 1, 2027
   - Assigned To: John Smith
   - Priority: Not checked (Normal)
4. Click Save
5. Reminder appears in grid with blue "Pending" chip
6. No alert icon yet (due > 60 days)

**Database State**:
```sql
INSERT INTO Reminders (Description, DueDate, AssignedToUserId, Priority, Status, CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime)
VALUES ('Fire Marshal Training - John Smith', '2027-03-01', 'user-123', NULL, 'Pending', 'admin@church.org', GETDATE(), 'admin@church.org', GETDATE());
```

### Example 2: Completion with 12-Month Recurrence

**Scenario**: Insurance reminder completed, create next year's reminder automatically.

**Workflow**:
1. Open "Renew Church Building Insurance" reminder (due March 15, 2026)
2. Click "Mark Complete"
3. Enter Completion Notes: "Policy renewed with AXA, Policy #INS-2026-12345, Premium £2,500"
4. Check "Create next reminder"
5. Select "12 months" from interval dropdown
6. Calculated date hint shows: "New due date: March 15, 2027"
7. Click Complete
8. Original reminder Status → Completed, CompletionNotes saved, CompletedBy/DateTime populated
9. New reminder created: Status=Pending, DueDate=March 15, 2027, inherits Description/AssignedTo/Priority

**Result**: Grid now shows green "Completed" chip for 2026 reminder (if Show Expired ON), blue "Pending" chip for new 2027 reminder.

### Example 3: Overdue Reminder Completion

**Scenario**: Fire extinguisher inspection due Feb 1 but completed Feb 14 (overdue).

**Current State**:
- DueDate: Feb 1, 2026
- Status: Pending
- Today: Feb 14, 2026

**Grid Display**: Red "Overdue" chip (calculated: Status=Pending AND DueDate < Today)

**Workflow**:
1. User clicks "Mark Complete" on overdue reminder
2. Enters Completion Notes: "All extinguishers inspected and tagged by ABC Fire Safety"
3. Does NOT update due date (allowed to complete as-is)
4. Clicks Complete
5. Status → Completed, CompletedDateTime = Feb 14

**Result**: Overdue reminder successfully completed without modifying due date.

### Example 4: Filtering by Assigned User

**Scenario**: Secretary wants to see only reminders assigned to them.

**Workflow**:
1. Open Reminders page (shows all reminders by default)
2. Open "Assigned To" filter dropdown
3. Select "Jane Doe (Secretary)"
4. Grid refreshes showing only reminders with AssignedToUserId = Jane Doe's user ID

**Use Case**: Each staff member filters to see their own responsibilities without seeing others' tasks.

### Example 5: Dashboard Widget Alert

**Scenario**: Multiple reminders approaching due dates.

**Data**:
- Reminder A: Due in 10 days (red alert)
- Reminder B: Due in 40 days (amber alert)
- Reminder C: Due in 70 days (no alert, not counted)
- Reminder D: Completed yesterday (no alert, not counted)

**Dashboard Widget Display**:
- Icon: Bell
- Title: "Reminders"
- Count: "2" (only A and B counted - within 60 days and Pending)
- Color: Amber/warning (has items needing attention)

**Click**: Navigate to /reminders page, automatically filtered to show upcoming (within 60 days).

### Edge Case 1: Create Next with Custom Date

**Scenario**: Training recurrence is irregular (not 3/6/12 months), user selects custom date.

**Workflow**:
1. Complete "DBS Check - Mary Jones" (due Jan 10, 2026)
2. Enter Completion Notes: "DBS check renewed, certificate #12345"
3. Check "Create next reminder"
4. Select "Custom date" from interval dropdown
5. Date picker appears
6. Select: July 15, 2026 (6.5 months - irregular interval)
7. Click Complete
8. New reminder created with DueDate = July 15, 2026 (exactly as specified)

**Result**: Supports non-standard recurrence intervals.

### Edge Case 2: Cannot Delete Completed Reminder

**Scenario**: Administrator tries to delete completed reminder.

**Workflow**:
1. User enables "Show Expired" filter to see completed reminders
2. Opens action menu on completed reminder
3. "Delete Reminder" option is disabled/hidden
4. Only "View History" option available

**Alternative Attempt**:
1. User bypasses frontend, sends DELETE /api/reminders/{id} directly
2. Backend checks: if Status = Completed, return 400 Bad Request
3. Error message: "Cannot delete completed reminders"

**Rationale**: Protects audit trail; completed records are historical facts.

### Edge Case 3: User Deleted from AspNetUsers

**Scenario**: Reminder assigned to user who is later deleted from system.

**Database Behavior**:
- FK_Reminders_AssignedToUser configured with ON DELETE NO ACTION
- Attempting to delete user with assigned reminders fails with FK constraint violation

**Resolution Workflow**:
1. Before deleting user, administrator reassigns their reminders to another user
2. Update Reminders SET AssignedToUserId = 'new-user-id' WHERE AssignedToUserId = 'deleted-user-id'
3. Then delete user from AspNetUsers

**Alternative**: Change FK to ON DELETE SET NULL, AssignedToUserId becomes nullable
- **Not chosen**: Reminders should always have an owner for accountability

### Edge Case 4: Multiple Reminders Same Description

**Scenario**: Two reminders with identical descriptions but different due dates/users.

**Example**:
- Reminder 1: "Fire Extinguisher Inspection" due Feb 1, assigned to Secretary
- Reminder 2: "Fire Extinguisher Inspection" due Aug 1, assigned to Secretary

**Grid Display**: Both appear in grid (no duplicate detection)

**Behavior**: Allowed intentionally - descriptions are free text, not unique identifiers. User may want multiple instances (quarterly inspections, different buildings, etc.).

### Edge Case 5: Alert Icon Logic at Midnight

**Scenario**: At midnight, reminder transitions from 31 days (amber) to 30 days (red).

**Technical Behavior**:
- Alert status calculated on each render based on `DaysUntilDue = (DueDate - Today).Days`
- When day changes at midnight, next page load/refresh automatically shows updated icon
- No background job needed; calculation is dynamic

**User Experience**: User refreshes dashboard at 12:01 AM, sees icon change from amber to red.

## 10. Validation Criteria

### Database Validation

- [ ] Reminders table exists in database with all specified columns
- [ ] Status column CHECK constraint limits values to 'Pending' or 'Completed'
- [ ] FK_Reminders_AssignedToUser foreign key exists with NO ACTION on delete
- [ ] Indexes exist on DueDate, Status, AssignedToUserId columns
- [ ] Composite index exists on (Status, DueDate) for dashboard query performance
- [ ] Priority column allows NULL (nullable boolean)
- [ ] CompletionNotes, CompletedBy, CompletedDateTime columns allow NULL

### Backend API Validation

- [ ] GET /api/reminders returns 200 with list of ReminderDto including AlertStatus
- [ ] GET /api/reminders?status=Overdue filters to Pending with DueDate < Today
- [ ] GET /api/reminders?showExpired=false excludes Status=Completed
- [ ] POST /api/reminders creates reminder with Status=Pending by default
- [ ] PUT /api/reminders/{id} updates description/dueDate/assignedTo/priority
- [ ] PUT /api/reminders/{id} returns 400 if Status=Completed (cannot edit completed)
- [ ] PUT /api/reminders/{id}/complete validates CompletionNotes not empty
- [ ] PUT /api/reminders/{id}/complete with createNext=true creates new reminder
- [ ] PUT /api/reminders/{id}/complete with interval="12months" calculates DueDate + 12 months
- [ ] PUT /api/reminders/{id}/complete with interval="custom" uses CustomDueDate
- [ ] DELETE /api/reminders/{id} returns 400 if Status=Completed
- [ ] DELETE /api/reminders/{id} returns 204 and hard deletes if Status=Pending
- [ ] GET /api/reminders/dashboard-summary counts only Pending within 60 days
- [ ] All endpoints enforce role authorization (Viewer can view, Contributor+ can edit)
- [ ] Swagger documentation displays all endpoints with schemas

### Frontend Grid Validation

- [ ] "Reminders" navigation item appears in left menu with Bell icon
- [ ] Grid columns appear: Description, Assigned To, Priority, Alert, Due Date, Status, Actions
- [ ] Priority column shows star icon for Important, blank for Normal
- [ ] Alert column shows red icon (due ≤30 days), amber (31-60 days), none (>60 or completed)
- [ ] Status column shows blue "Pending", green "Completed", red "Overdue" chips
- [ ] Overdue chip displays when Status=Pending AND DueDate < Today (calculated, not stored)
- [ ] Filters render: Description search, Status dropdown, Assigned To dropdown, Show Expired toggle
- [ ] Show Expired toggle default OFF excludes Completed reminders
- [ ] Show Expired toggle ON includes Completed reminders
- [ ] Status filter "Overdue" option filters to calculated overdue reminders
- [ ] Grid refreshes automatically after create/edit/complete/delete operations

### Frontend Drawer Validation

- [ ] "Add Reminder" button opens CreateReminderDrawer (width 500px, right anchor)
- [ ] CreateReminderDrawer requires Description, Due Date, Assigned To
- [ ] CreateReminderDrawer has optional Priority checkbox
- [ ] EditReminderDrawer pre-populates with current reminder data
- [ ] Edit action disabled/hidden for completed reminders
- [ ] CompleteReminderDrawer displays reminder details read-only
- [ ] CompleteReminderDrawer requires Completion Notes (validation error if empty)
- [ ] CompleteReminderDrawer "Create next reminder" section: checkbox, interval dropdown, date picker
- [ ] Interval dropdown options: "3 months", "6 months", "12 months", "Custom date"
- [ ] Date picker appears only when "Custom date" selected
- [ ] Success notification after create/edit/complete/delete
- [ ] Error notification on API failure
- [ ] Drawers close automatically on success
- [ ] Cancel button closes drawer without saving

### Frontend Dashboard Widget Validation

- [ ] Reminders widget displays as 7th KPI card on dashboard
- [ ] Widget shows Bell icon, "Reminders" title
- [ ] Widget displays count of upcoming reminders (within 60 days, Pending)
- [ ] Widget displays checkmark when count is 0
- [ ] Widget click navigates to /reminders page
- [ ] Widget "+" quick add button opens CreateReminderDrawer
- [ ] Widget data fetched from GET /api/reminders/dashboard-summary

### Security & Roles Validation

- [ ] RemindersViewer can view reminders but cannot create/edit/complete/delete (403)
- [ ] RemindersContributor can view, create, edit, complete, delete reminders
- [ ] RemindersAdministrator can view, create, edit, complete, delete reminders
- [ ] Unauthenticated users get 401 on all endpoints
- [ ] CreatedBy/ModifiedBy/CompletedBy fields capture username from JWT claims
- [ ] Action menu shows only "View History" for Viewers
- [ ] Action menu shows all options (Edit/Complete/Delete/History) for Contributors/Admins

### Business Logic Validation

- [ ] Alert status calculation: 25 days = red, 45 days = amber, 70 days = none
- [ ] Completed reminders have AlertStatus = none regardless of due date
- [ ] Completion with createNext + "3months" creates new reminder DueDate + 3 months
- [ ] Completion with createNext + "6months" creates new reminder DueDate + 6 months
- [ ] Completion with createNext + "12months" creates new reminder DueDate + 12 months
- [ ] Completion with createNext + "custom" creates new reminder with CustomDueDate
- [ ] New reminder from completion inherits Description, AssignedToUserId, Priority
- [ ] New reminder from completion has Status = Pending (always, never inherited)
- [ ] Dashboard summary counts only Status=Pending AND DueDate <= (Today + 60 days)
- [ ] Overdue reminder (DueDate < Today) can be marked complete without updating date

### Performance Validation

- [ ] GET /api/reminders responds < 200ms with 100 reminders
- [ ] POST /api/reminders responds < 300ms
- [ ] PUT /api/reminders/{id}/complete with createNext responds < 500ms
- [ ] Grid renders < 1 second with 200 reminders
- [ ] Dashboard widget loads < 500ms
- [ ] Date filter queries use index on DueDate column

### Accessibility Validation

- [ ] All form fields have associated labels (htmlFor or aria-label)
- [ ] Drawer accessible via keyboard (Tab, Enter, Esc)
- [ ] Grid navigable with keyboard (arrow keys, Tab)
- [ ] Star icon has aria-label "Important" for screen readers
- [ ] Alert icons have aria-label describing status
- [ ] Focus indicators visible on all interactive elements

## 11. Related Specifications / Further Reading

### Internal Specifications

- [Training Certificates Specification](./training-module-spec.md) - Similar grid pattern, RAG alert status, dashboard widget, drawer editing
- [Church District Assignment Specification](./church-district-spec.md) - Drawer implementation pattern, action menus
- [Church Members Specification](./church-members-spec.md) - Grid structure, filter patterns, three-dot actions

### External Documentation

- [Entity Framework Core: Indexes](https://learn.microsoft.com/en-us/ef/core/modeling/indexes) - Index configuration for query performance
- [FastEndpoints Authorization](https://fast-endpoints.com/docs/security) - Role-based endpoint authorization
- [React Query: Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) - Mutation patterns with cache invalidation
- [MUI DataGrid](https://mui.com/x/react-data-grid/) - Grid component with filtering and sorting
- [MUI Drawer Component](https://mui.com/material-ui/react-drawer/) - Drawer implementation guide
- [MUI DatePicker](https://mui.com/x/react-date-pickers/date-picker/) - Date selection component
- [MUI Chip Component](https://mui.com/material-ui/react-chip/) - Status chip styling

### Architecture Documentation

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Overall system architecture, database schema
- [docs/error-handling-patterns.md](../docs/error-handling-patterns.md) - API error handling conventions
- [docs/security-configuration.md](../docs/security-configuration.md) - JWT authentication, role-based authorization
