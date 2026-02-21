---
title: Administration Page Tabbed Layout with District Management
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Product Owner
tags: [design, app, administration, districts, church-members]
---

# Introduction

This specification defines the enhancement of the Administration page to use a tabbed layout (similar to the Training page) with two tabs: "User Management" and "Districts". The Districts tab provides a management interface for viewing districts and assigning deacons and district officers to each district. This feature builds upon the existing district assignment capability for church members and introduces a new "District Officer" role.

## 1. Purpose & Scope

This specification covers:
- Restructuring the Administration page to use a tabbed interface
- Moving existing User Management functionality into the first tab
- Creating a new Districts tab for district management
- Adding "District Officer" as a new church member role type
- Implementing district-to-deacon assignment functionality
- Implementing district-to-district-officer assignment functionality  
- Enhancing the Districts database entity with deacon and officer relationships
- Creating API endpoints for district operations
- Building React components for the Districts management grid and assignment dialogs

**Out of Scope:**
- Add/Edit/Delete operations for districts (districts are seed data only)
- District filtering, sorting (except default ascending by name), or search
- Export functionality for districts
- Automatic unassignment when member loses role (handled manually)

## 2. Definitions

### Acronyms & Abbreviations

- **CRUD**: Create, Read, Update, Delete
- **DTO**: Data Transfer Object
- **RBAC**: Role-Based Access Control
- **API**: Application Programming Interface
- **EF Core**: Entity Framework Core
- **FK**: Foreign Key

### Domain-Specific Terms

- **District**: A geographical or organizational subdivision within the church, designated by letters A through L
- **Deacon**: A church member with the "Deacon" role who oversees one or more districts
- **District Officer**: A church member with the "District Officer" role who assists with district management
- **Active Member**: A church member with status "Active"
- **Member Count**: The number of active church members assigned to a district

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

#### Administration Page Tabbed Layout

- **REQ-001**: The Administration page shall use a tabbed layout similar to the Training Certificates page
- **REQ-002**: The page shall display two tabs: "User Management" and "Districts"
- **REQ-003**: The default active tab shall be "User Management"
- **REQ-004**: The active tab selection shall be persisted in the URL query parameter (e.g., `?tab=users` or `?tab=districts`)
- **REQ-005**: Browser back/forward navigation shall correctly switch between tabs
- **REQ-006**: Refreshing the page shall maintain the currently active tab selection
- **REQ-007**: The User Management tab shall contain all existing user management functionality
- **REQ-008**: The "Add New User" button shall only be visible when the User Management tab is active

#### New District Officer Role

- **REQ-009**: The system shall add "District Officer" as a new church member role type (ID: 9)
- **REQ-010**: Church members shall be able to have the "District Officer" role assigned independently or in combination with other roles
- **REQ-011**: The District Officer role shall be available in all church member role management interfaces

#### Districts Database Schema

- **REQ-012**: The Districts table shall be enhanced with a nullable `DeaconId` column (FK to ChurchMembers.Id)
- **REQ-013**: The Districts table shall be enhanced with a nullable `DistrictOfficerId` column (FK to ChurchMembers.Id)
- **REQ-014**: A district may have zero or one deacon assigned
- **REQ-015**: A district may have zero or one district officer assigned
- **REQ-016**: A single deacon may be assigned to multiple districts
- **REQ-017**: A single district officer may be assigned to multiple districts
- **REQ-018**: Foreign key relationships shall use `ON DELETE NO ACTION` to prevent cascading deletes

#### Districts Tab UI

- **REQ-019**: The Districts tab shall display a read-only grid showing all districts (A through L)
- **REQ-020**: The grid shall display the following columns:
  - District (name)
  - Assigned Deacon (full name or "(None)")
  - Assigned District Officer (full name or "(None)")
  - Member Count (count of active members)
  - Actions (three-dot menu button)
- **REQ-021**: The grid shall be sorted by District name in ascending order (A to L)
- **REQ-022**: The grid shall not support filtering, searching, or user-initiated sorting
- **REQ-023**: The grid shall not support export functionality
- **REQ-024**: The grid shall not support add, edit, or delete operations on district records

#### Deacon Assignment

- **REQ-025**: Each district row shall have an "Assign Deacon" action in the actions menu
- **REQ-026**: The "Assign Deacon" action shall open a dialog with a dropdown of eligible deacons
- **REQ-027**: The dropdown shall only show active church members with the "Deacon" role
- **REQ-028**: The dropdown shall be sorted alphabetically by member full name
- **REQ-029**: The dropdown shall include a "(None)" option to unassign the current deacon
- **REQ-030**: The dialog shall display the currently assigned deacon as the selected value
- **REQ-031**: The dialog shall have "Cancel" and "Save" buttons
- **REQ-032**: Saving shall update the district's DeaconId in the database
- **REQ-033**: The grid shall refresh automatically after successful assignment

#### District Officer Assignment

- **REQ-034**: Each district row shall have an "Assign District Officer" action in the actions menu
- **REQ-035**: The "Assign District Officer" action shall be disabled if no deacon is assigned to the district
- **REQ-036**: The "Assign District Officer" action shall open a dialog with a dropdown of eligible district officers
- **REQ-037**: The dropdown shall only show active church members with the "District Officer" role
- **REQ-038**: The dropdown shall exclude the currently assigned deacon (to prevent same person being both)
- **REQ-039**: The dropdown shall be sorted alphabetically by member full name  
- **REQ-040**: The dropdown shall include a "(None)" option to unassign the current district officer
- **REQ-041**: The dialog shall display the currently assigned district officer as the selected value
- **REQ-042**: The dialog shall have "Cancel" and "Save" buttons
- **REQ-043**: Saving shall update the district's DistrictOfficerId in the database
- **REQ-044**: The grid shall refresh automatically after successful assignment

#### Member Count Calculation

- **REQ-045**: The Member Count column shall display the count of church members assigned to that district
- **REQ-046**: The count shall include only members with status "Active"
- **REQ-047**: Members with other statuses (Expired, In Glory, InActive) shall not be included in the count

### Security Requirements

- **SEC-001**: Access to the Districts tab shall require one of the following roles:
  - ChurchMembersViewer (read-only access)
  - ChurchMembersContributor (can assign deacons and officers)
  - ChurchMembersAdministrator (can assign deacons and officers)
- **SEC-002**: Users with ChurchMembersViewer role shall see the Districts tab but "Assign Deacon" and "Assign District Officer" actions shall be hidden
- **SEC-003**: Users with ChurchMembersContributor or ChurchMembersAdministrator roles shall have full assignment capabilities
- **SEC-004**: All API endpoints shall validate user permissions before allowing operations

### Constraints

- **CON-001**: The Districts entity contains seed data only (A through L) and shall not be modified via UI
- **CON-002**: A district officer cannot be assigned unless a deacon is already assigned to that district
- **CON-003**: The same church member cannot be both the deacon and district officer for the same district
- **CON-004**: Only active church members with the appropriate role shall appear in assignment dropdowns
- **CON-005**: The implementation shall follow the existing architectural patterns used in the Training Certificates page

### Guidelines

- **GUD-001**: Use Material-UI Dialog component for assignment modals (not Drawer)
- **GUD-002**: Follow the existing grid patterns from Church Members and Training Certificates
- **GUD-003**: Maintain consistency with the Training page tab implementation
- **GUD-004**: Use React Query for data fetching and cache management
- **GUD-005**: Implement optimistic UI updates where appropriate
- **GUD-006**: Display clear error messages for failed operations
- **GUD-007**: Show loading states during async operations
- **GUD-008**: Use the existing notification system for success/error feedback

### Patterns to Follow

- **PAT-001**: Follow the TabPanel component pattern from TrainingCertificatesPage.tsx
- **PAT-002**: Follow the a11yProps helper function pattern for accessibility
- **PAT-003**: Use Material-UI DataGrid for the districts grid
- **PAT-004**: Follow the three-dot action menu pattern from UserGrid.tsx
- **PAT-005**: Use the existing apiClient service pattern for API calls
- **PAT-006**: Follow the DTO mapping patterns from existing services

## 4. Interfaces & Data Contracts

### Database Schema

#### Districts Table (Enhanced)

```sql
-- Add new columns to existing Districts table
ALTER TABLE Districts
ADD DeaconId INT NULL,
    DistrictOfficerId INT NULL;

-- Add foreign key constraints
ALTER TABLE Districts
ADD CONSTRAINT FK_Districts_Deacon
    FOREIGN KEY (DeaconId) REFERENCES ChurchMembers(Id)
    ON DELETE NO ACTION;

ALTER TABLE Districts
ADD CONSTRAINT FK_Districts_DistrictOfficer
    FOREIGN KEY (DistrictOfficerId) REFERENCES ChurchMembers(Id)
    ON DELETE NO ACTION;

-- Add indexes for performance
CREATE INDEX IX_Districts_DeaconId ON Districts(DeaconId);
CREATE INDEX IX_Districts_DistrictOfficerId ON Districts(DistrictOfficerId);
```

#### ChurchMemberRoleTypes Table (New Role)

```sql
-- Insert new District Officer role
INSERT INTO ChurchMemberRoleTypes (Id, Type, CreatedBy, CreatedDateTime)
VALUES (9, 'District Officer', 'system', GETUTCDATE());
```

### API Endpoints

#### Get All Districts with Assignments

```http
GET /api/districts
Authorization: Bearer {token}
Roles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator
```

**Response:**

```typescript
{
  items: [
    {
      id: number;
      name: string;                    // "A" through "L"
      deaconId: number | null;
      deaconName: string | null;       // Full name or null
      districtOfficerId: number | null;
      districtOfficerName: string | null; // Full name or null
      memberCount: number;             // Count of active members
    }
  ]
}
```

**Status Codes:**
- 200 OK - Success
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions

#### Get Active Deacons

```http
GET /api/districts/deacons
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
```

**Response:**

```typescript
{
  items: [
    {
      id: number;
      fullName: string;
    }
  ]
}
```

**Status Codes:**
- 200 OK - Success
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions

#### Get Active District Officers

```http
GET /api/districts/district-officers
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
```

**Query Parameters:**

```typescript
{
  excludeMemberId?: number;  // Optional: Exclude specific member (current deacon)
}
```

**Response:**

```typescript
{
  items: [
    {
      id: number;
      fullName: string;
    }
  ]
}
```

**Status Codes:**
- 200 OK - Success
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions

#### Assign Deacon to District

```http
PUT /api/districts/{districtId}/assign-deacon
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
```

**Request Body:**

```typescript
{
  deaconId: number | null;  // null to unassign
}
```

**Response:**

```typescript
{
  id: number;
  name: string;
  deaconId: number | null;
  deaconName: string | null;
  districtOfficerId: number | null;
  districtOfficerName: string | null;
  memberCount: number;
}
```

**Status Codes:**
- 200 OK - Success
- 400 Bad Request - Invalid deacon ID or member is not a deacon
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions
- 404 Not Found - District not found

#### Assign District Officer to District

```http
PUT /api/districts/{districtId}/assign-district-officer
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
```

**Request Body:**

```typescript
{
  districtOfficerId: number | null;  // null to unassign
}
```

**Response:**

```typescript
{
  id: number;
  name: string;
  deaconId: number | null;
  deaconName: string | null;
  districtOfficerId: number | null;
  districtOfficerName: string | null;
  memberCount: number;
}
```

**Status Codes:**
- 200 OK - Success
- 400 Bad Request - Invalid scenarios:
  - Member is not a district officer
  - No deacon assigned to district
  - Same member is already the deacon
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Insufficient permissions
- 404 Not Found - District not found

### Data Transfer Objects

#### DistrictDto (Enhanced)

```typescript
interface DistrictDto {
  id: number;
  name: string;
  deaconId: number | null;
  deaconName: string | null;
  districtOfficerId: number | null;
  districtOfficerName: string | null;
  memberCount: number;
}
```

#### ChurchMemberSummaryDto (for dropdowns)

```typescript
interface ChurchMemberSummaryDto {
  id: number;
  fullName: string;
}
```

#### AssignDeaconRequest

```typescript
interface AssignDeaconRequest {
  deaconId: number | null;
}
```

#### AssignDistrictOfficerRequest

```typescript
interface AssignDistrictOfficerRequest {
  districtOfficerId: number | null;
}
```

### C# Models

```csharp
namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Enhanced district DTO with deacon and officer assignments
/// </summary>
public class DistrictDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? DeaconId { get; set; }
    public string? DeaconName { get; set; }
    public int? DistrictOfficerId { get; set; }
    public string? DistrictOfficerName { get; set; }
    public int MemberCount { get; set; }
}

/// <summary>
/// Request to assign a deacon to a district
/// </summary>
public class AssignDeaconRequest
{
    public int? DeaconId { get; set; }
}

/// <summary>
/// Request to assign a district officer to a district
/// </summary>
public class AssignDistrictOfficerRequest
{
    public int? DistrictOfficerId { get; set; }
}

/// <summary>
/// Summary DTO for church member selection
/// </summary>
public class ChurchMemberSummaryDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}
```

## 5. Acceptance Criteria

### Administration Page Tabs

- **AC-001**: Given a user navigates to `/app/administration`, When the page loads, Then the User Management tab shall be active by default
- **AC-002**: Given a user is on the Administration page, When they click the Districts tab, Then the URL shall update to `/app/administration?tab=districts`
- **AC-003**: Given a user navigates to `/app/administration?tab=districts`, When the page loads, Then the Districts tab shall be active
- **AC-004**: Given a user is on the Districts tab, When they click the browser back button, Then the User Management tab shall become active
- **AC-005**: Given a user is on the User Management tab, When the page loads, Then the "Add New User" button shall be visible
- **AC-006**: Given a user is on the Districts tab, When the page loads, Then the "Add New User" button shall not be visible

### Districts Grid Display

- **AC-007**: Given a user with ChurchMembersViewer role, When they view the Districts tab, Then they shall see all 12 districts (A through L)
- **AC-008**: Given the Districts grid is displayed, When districts are rendered, Then they shall be sorted alphabetically from A to L
- **AC-009**: Given a district has no deacon assigned, When the grid is displayed, Then the Assigned Deacon column shall show "(None)"
- **AC-010**: Given a district has no district officer assigned, When the grid is displayed, Then the Assigned District Officer column shall show "(None)"
- **AC-011**: Given a district has 5 active members assigned, When the grid is displayed, Then the Member Count column shall show "5"
- **AC-012**: Given a district has 3 active members and 2 inactive members, When the Member Count is calculated, Then it shall show "3"

### Deacon Assignment

- **AC-013**: Given a user with ChurchMembersContributor role, When they click the actions menu for a district, Then they shall see "Assign Deacon" option
- **AC-014**: Given a user clicks "Assign Deacon", When the dialog opens, Then it shall show a dropdown with all active deacons sorted alphabetically
- **AC-015**: Given a district has a deacon assigned, When the assign deacon dialog opens, Then the current deacon shall be pre-selected in the dropdown
- **AC-016**: Given a user selects a different deacon and clicks Save, When the operation succeeds, Then the grid shall update to show the new deacon name
- **AC-017**: Given a user selects "(None)" and clicks Save, When the operation succeeds, Then the district's deacon shall be unassigned and grid shall show "(None)"
- **AC-018**: Given a user attempts to assign an inactive member as deacon, When the assignment is attempted, Then the operation shall fail with an appropriate error message

### District Officer Assignment

- **AC-019**: Given a district has no deacon assigned, When the actions menu is opened, Then the "Assign District Officer" option shall be disabled
- **AC-020**: Given a district has a deacon assigned, When the actions menu is opened, Then the "Assign District Officer" option shall be enabled
- **AC-021**: Given a user clicks "Assign District Officer", When the dialog opens, Then it shall show a dropdown with active district officers excluding the current deacon
- **AC-022**: Given John Smith is the assigned deacon, When the district officer dropdown loads, Then John Smith shall not appear in the list
- **AC-023**: Given a user attempts to assign a district officer when no deacon is assigned, When the API endpoint is called, Then it shall return a 400 Bad Request error
- **AC-024**: Given a user selects a district officer and clicks Save, When the operation succeeds, Then the grid shall update to show the new district officer name

### Permissions

- **AC-025**: Given a user with ChurchMembersViewer role, When viewing the Districts tab, Then assignment actions shall not be visible
- **AC-026**: Given a user with ChurchMembersContributor role, When viewing the Districts tab, Then assignment actions shall be visible and enabled
- **AC-027**: Given a user without any ChurchMembers roles, When attempting to access the Districts tab, Then they shall receive a 403 Forbidden response

### New Role Integration

- **AC-028**: Given a church member has "District Officer" role assigned, When searching for district officers, Then that member shall appear in the district officer dropdown
- **AC-029**: Given a church member has both "Deacon" and "District Officer" roles, When they are assigned as deacon to District A, Then they shall not appear in the district officer dropdown for District A
- **AC-030**: Given a church member has both "Deacon" and "District Officer" roles, When they are assigned as deacon to District A, Then they shall appear in the district officer dropdown for District B

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer logic, DTO mappings, validation rules
- **Integration Tests**: API endpoints with database interactions
- **End-to-End Tests**: Full user workflows using Playwright

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library, Playwright

### Test Data Management

- Use in-memory database for unit/integration tests
- Seed test data including districts, deacons, and district officers
- Clean up test data after each test run

### CI/CD Integration

- All tests shall run in GitHub Actions pipeline
- Pull requests shall require passing tests before merge
- Automated test reports shall be generated

### Coverage Requirements

- Minimum 80% code coverage for service layer
- All API endpoints shall have integration tests
- Critical user workflows shall have E2E tests

### Performance Testing

- Grid load time with 12 districts shall be < 500ms
- Assignment operations shall complete in < 1 second
- Member count calculations shall be optimized with proper indexes

### Key Test Scenarios

#### Backend Tests

```csharp
[TestClass]
public class DistrictServiceTests
{
    [TestMethod]
    public async Task AssignDeacon_WhenDeaconIsActive_ShouldSucceed()
    
    [TestMethod]
    public async Task AssignDeacon_WhenDeaconIsInactive_ShouldFail()
    
    [TestMethod]
    public async Task AssignDistrictOfficer_WhenNoDeaconAssigned_ShouldFail()
    
    [TestMethod]
    public async Task AssignDistrictOfficer_WhenSameAsDeacon_ShouldFail()
    
    [TestMethod]
    public async Task GetDistricts_ShouldCalculateMemberCountCorrectly()
    
    [TestMethod]
    public async Task GetActiveDeacons_ShouldOnlyReturnActiveMembers()
}
```

#### Frontend Tests

```typescript
describe('DistrictsTab', () => {
  it('should display all 12 districts in alphabetical order');
  it('should show "(None)" when no deacon is assigned');
  it('should disable "Assign District Officer" when no deacon assigned');
  it('should open assign deacon dialog on action click');
  it('should filter out current deacon from district officer dropdown');
  it('should refresh grid after successful assignment');
});
```

## 7. Rationale & Context

### Design Decisions

#### Tabbed Layout Choice

The tabbed layout was chosen to:
- Group related administrative functions together
- Reduce navigation complexity
- Match the pattern established by the Training Certificates page
- Provide a familiar user experience
- Allow future expansion with additional admin tabs

#### Separate Dialogs for Deacon and Officer

Using separate dialogs (rather than one combined dialog) provides:
- Clearer user intent
- Simpler validation logic
- Better accessibility
- Reduced cognitive load

#### Business Rule: Officer Requires Deacon

Requiring a deacon before allowing an officer assignment ensures:
- Proper hierarchy is maintained
- Each district has clear leadership
- Prevents orphaned officer assignments
- Reflects real-world church organizational structure

#### Business Rule: Same Person Cannot Hold Both

Preventing the same person from being both deacon and officer for the same district:
- Ensures proper separation of duties
- Allows delegation of responsibilities
- Prevents single point of failure
- Encourages involvement of more members

#### Active Members Only in Dropdowns

Showing only active members in assignment dropdowns:
- Prevents assignment of inactive/deceased members
- Ensures current leadership
- Reduces dropdown clutter
- Matches business requirements

#### Member Count = Active Members Only

Counting only active members:
- Provides accurate current picture
- Matches operational needs
- Aligns with how church measures active participation

### Alternative Approaches Considered

1. **Single Assignment Dialog**: Considered one dialog for both deacon and officer, but rejected due to increased complexity
2. **Automatic Unassignment**: Considered auto-removing assignments when roles change, but manual management provides more control
3. **In-line Editing**: Considered editable grid cells, but separate dialogs provide better validation and user feedback
4. **District Add/Edit/Delete**: Considered allowing district management, but districts are fixed organizational units

## 8. Dependencies & External Integrations

### External Systems

None - this is an internal feature

### Third-Party Services

None required

### Infrastructure Dependencies

- **INF-001**: SQL Server database with EF Core migrations support
- **INF-002**: ASP.NET Core 9.0 runtime
- **INF-003**: React 18+ with TypeScript
- **INF-004**: Material-UI v5+ component library

### Data Dependencies

- **DAT-001**: Existing Districts seed data (A through L)
- **DAT-002**: Existing ChurchMembers table with status and role relationships
- **DAT-003**: Existing ChurchMemberRoleTypes table
- **DAT-004**: Existing ChurchMemberRoles junction table

### Technology Platform Dependencies

- **PLT-001**: Entity Framework Core for database operations
- **PLT-002**: FastEndpoints for API implementation
- **PLT-003**: React Query for frontend data management
- **PLT-004**: Material-UI DataGrid component

### Architectural Dependencies

- **ARC-001**: Existing clean architecture patterns (Domain, Application, Infrastructure layers)
- **ARC-002**: Existing DTO mapping patterns
- **ARC-003**: Existing authentication and authorization middleware
- **ARC-004**: Existing React component architecture and patterns

## 9. Examples & Edge Cases

### Example 1: Standard Assignment Flow

```typescript
// User assigns John Smith (Deacon) to District A
// Initial state
{
  id: 1,
  name: "A",
  deaconId: null,
  deaconName: null,
  districtOfficerId: null,
  districtOfficerName: null,
  memberCount: 8
}

// After deacon assignment
{
  id: 1,
  name: "A",
  deaconId: 42,
  deaconName: "John Smith",
  districtOfficerId: null,
  districtOfficerName: null,
  memberCount: 8
}

// Then assign Mary Johnson (District Officer)
{
  id: 1,
  name: "A",
  deaconId: 42,
  deaconName: "John Smith",
  districtOfficerId: 57,
  districtOfficerName: "Mary Johnson",
  memberCount: 8
}
```

### Example 2: Deacon Dropdown List

```typescript
// GET /api/districts/deacons response
{
  items: [
    { id: 23, fullName: "David Brown" },
    { id: 42, fullName: "John Smith" },
    { id: 67, fullName: "Michael Wilson" },
    { id: 89, fullName: "Sarah Davis" }
  ]
}
```

### Example 3: District Officer Dropdown (Excluding Current Deacon)

```typescript
// GET /api/districts/district-officers?excludeMemberId=42
// Excludes John Smith (id: 42) who is the current deacon
{
  items: [
    { id: 34, fullName: "Emily Thompson" },
    { id: 57, fullName: "Mary Johnson" },
    { id: 91, fullName: "Robert Anderson" }
  ]
}
```

### Edge Case 1: Attempting Officer Assignment Without Deacon

```http
PUT /api/districts/1/assign-district-officer
{
  "districtOfficerId": 57
}

Response: 400 Bad Request
{
  "error": "Cannot assign district officer. A deacon must be assigned to this district first."
}
```

### Edge Case 2: Attempting to Assign Same Member as Both

```http
PUT /api/districts/1/assign-district-officer
{
  "districtOfficerId": 42  // Same as DeaconId
}

Response: 400 Bad Request
{
  "error": "The same member cannot be both deacon and district officer for the same district."
}
```

### Edge Case 3: Unassigning Deacon When Officer Exists

```http
PUT /api/districts/1/assign-deacon
{
  "deaconId": null
}

Response: 400 Bad Request
{
  "error": "Cannot unassign deacon while a district officer is assigned. Please unassign the district officer first."
}
```

### Edge Case 4: Member Count Calculation

```sql
-- District A has these members assigned:
-- ID 10: Active
-- ID 15: Active
-- ID 20: Expired
-- ID 25: Active
-- ID 30: In Glory

-- Member count should be 3 (only Active members)
```

### Edge Case 5: Multi-District Assignment

```typescript
// John Smith (id: 42) assigned as deacon to multiple districts
District A: { deaconId: 42, deaconName: "John Smith" }
District B: { deaconId: 42, deaconName: "John Smith" }
District C: { deaconId: 42, deaconName: "John Smith" }

// This is allowed - one deacon can oversee multiple districts
```

### Edge Case 6: Member With Both Roles

```typescript
// Sarah Davis has both "Deacon" and "District Officer" roles

// Scenario 1: She is deacon of District A
// District A officer dropdown: Sarah Davis NOT included

// Scenario 2: She is deacon of District B
// District C officer dropdown: Sarah Davis IS included
// (She can be officer of C while being deacon of B)
```

## 10. Validation Criteria

### Database Validation

- **VAL-001**: Districts table shall have DeaconId and DistrictOfficerId columns
- **VAL-002**: Foreign key constraints shall exist and prevent invalid references
- **VAL-003**: Indexes shall exist on DeaconId and DistrictOfficerId for query performance
- **VAL-004**: ChurchMemberRoleTypes shall contain "District Officer" role with Id = 9

### API Validation

- **VAL-005**: All endpoints shall require authentication
- **VAL-006**: All endpoints shall enforce role-based authorization
- **VAL-007**: Assignment endpoints shall validate that members have the required role
- **VAL-008**: Assignment endpoints shall validate business rules (deacon required for officer)
- **VAL-009**: All endpoints shall return appropriate HTTP status codes
- **VAL-010**: Error responses shall include clear, actionable messages

### UI Validation

- **VAL-011**: Tabs shall be keyboard accessible with proper ARIA attributes
- **VAL-012**: Active tab shall be visually distinct
- **VAL-013**: Assignment dialogs shall have proper form validation
- **VAL-014**: Loading states shall be displayed during async operations
- **VAL-015**: Success/error notifications shall appear for user actions
- **VAL-016**: Grid shall be responsive and work on mobile devices
- **VAL-017**: Disabled actions shall have appropriate visual indicators and tooltips

### Business Rule Validation

- **VAL-018**: System shall prevent assigning inactive members
- **VAL-019**: System shall prevent assigning non-deacons as deacons
- **VAL-020**: System shall prevent assigning non-officers as district officers
- **VAL-021**: System shall prevent officer assignment when no deacon exists
- **VAL-022**: System shall prevent same member being both deacon and officer for same district
- **VAL-023**: Member count shall accurately reflect only active members

### Integration Validation

- **VAL-024**: Tab state shall persist correctly in browser URL
- **VAL-025**: Browser back/forward shall work correctly with tabs
- **VAL-026**: Grid shall refresh after assignments without full page reload
- **VAL-027**: React Query cache shall invalidate correctly after mutations

## 11. Related Specifications / Further Reading

### Related Specifications

- [Church Members Management Specification](spec/done/church-members-spec.md)
- [Training Module Specification](spec/done/training-module-spec.md)
- [Church District Implementation Summary](docs/church-district-implementation-summary.md)

### Related Documentation

- [Application Architecture](docs/ARCHITECTURE.md)
- [Routing and Navigation Conventions](docs/routing-navigation-conventions.md)
- [Security Configuration](docs/security-configuration.md)
- [Entity Framework Core Documentation](https://learn.microsoft.com/en-us/ef/core/)
- [Material-UI Tabs Documentation](https://mui.com/material-ui/react-tabs/)
- [React Query Documentation](https://tanstack.com/query/latest)
