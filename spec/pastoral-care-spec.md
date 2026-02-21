---
title: Pastoral Care Management Feature Specification
version: 1.0
date_created: 2026-02-20
last_updated: 2026-02-20
owner: ChurchRegister Development Team
tags: [design, feature, pastoral-care, church-members, reporting]
---

# Pastoral Care Management Feature Specification

This specification defines the requirements, constraints, and interfaces for the Pastoral Care Management feature, which enables church administrators to identify, track, and report on church members requiring pastoral care support.

## 1. Purpose & Scope

### Purpose

This specification defines the Pastoral Care Management feature, which extends the existing Church Members functionality to allow authorized users to:
- Mark church members as requiring pastoral care
- Filter member lists to quickly identify those requiring pastoral care
- Generate PDF reports of members requiring pastoral care, grouped by district for deacon review

### Scope

This specification covers:

- Addition of `PastoralCareRequired` boolean field to ChurchMember entity
- UI menu option to toggle pastoral care status (Yes/No)
- Toggle filter on Church Members grid for pastoral care status
- PDF export functionality for pastoral care report
- Report generation grouped by district with deacon information
- Role-based access control for pastoral care operations

### Out of Scope

- Detailed tracking of pastoral care visits or actions
- Pastoral care notes or history
- Automated notifications to deacons
- Integration with calendar/scheduling systems
- Member self-service to request pastoral care

### Intended Audience

- Backend developers implementing API endpoints and business logic
- Frontend developers creating UI components
- Database administrators managing schema changes
- QA engineers writing test cases
- Church administrators and deacons using the feature
- Generative AI systems implementing features

### Assumptions

- The ChurchMember entity and related infrastructure already exists
- Districts and deacon assignments are already implemented
- PDF generation library is available or will be added
- Users have appropriate role-based access configured
- The Church Members grid/list view already exists

## 2. Definitions

### Acronyms & Abbreviations

- **PDF**: Portable Document Format
- **DTO**: Data Transfer Object
- **RBAC**: Role-Based Access Control
- **API**: Application Programming Interface
- **UI**: User Interface

### Domain-Specific Terms

- **Pastoral Care**: Spiritual and emotional support provided to church members by deacons and ministers
- **Pastoral Care Required**: A flag indicating a church member needs pastoral attention or support
- **Deacon**: A church role responsible for providing pastoral care to members in assigned districts
- **District**: A geographical or organizational grouping of church members assigned to a specific deacon

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

#### Database Schema

- **REQ-DB-001**: Add `PastoralCareRequired` boolean field to `ChurchMembers` table with default value `false` (0)
- **REQ-DB-002**: Field shall be non-nullable with default constraint
- **REQ-DB-003**: Add index on `PastoralCareRequired` for query performance: `IX_ChurchMembers_PastoralCareRequired`

#### Entity & Model Updates

- **REQ-ENT-001**: Update `ChurchMember` entity to include `PastoralCareRequired` boolean property with default value `false`
- **REQ-ENT-002**: Update `ChurchMemberDto` to include `PastoralCareRequired` boolean property
- **REQ-ENT-003**: Update `CreateChurchMemberRequest` to include optional `PastoralCareRequired` field (defaults to `false`)
- **REQ-ENT-004**: Update `UpdateChurchMemberRequest` to include `PastoralCareRequired` field

#### API Endpoints

- **REQ-API-001**: Existing GET `/api/church-members` endpoint shall support `pastoralCareRequired` query parameter (values: null/all, true, false)
- **REQ-API-002**: Existing GET `/api/church-members/{id}` endpoint shall return `pastoralCareRequired` in response
- **REQ-API-003**: Existing POST `/api/church-members` endpoint shall accept `pastoralCareRequired` in request body
- **REQ-API-004**: Existing PUT `/api/church-members/{id}` endpoint shall accept `pastoralCareRequired` in request body
- **REQ-API-005**: Create new GET `/api/church-members/pastoral-care/export` endpoint to generate PDF report
- **REQ-API-006**: Export endpoint shall require `ChurchMembersContributor` or `ChurchMembersAdministrator` role
- **REQ-API-007**: Export endpoint shall return PDF with content-type `application/pdf`
- **REQ-API-008**: Export endpoint shall include filename `Pastoral_Care_Report_YYYYMMDD.pdf` in Content-Disposition header

#### User Interface Requirements

- **REQ-UI-001**: Add "Pastoral Care Required" toggle switch filter to Church Members grid toolbar
- **REQ-UI-002**: Toggle filter shall have three states: "All Members" (default), "Yes", "No"
- **REQ-UI-003**: Filter state "All Members" shall display all members regardless of pastoral care status
- **REQ-UI-004**: Filter state "Yes" shall display only members with `PastoralCareRequired` = true
- **REQ-UI-005**: Filter state "No" shall display only members with `PastoralCareRequired` = false
- **REQ-UI-006**: Add menu option in Church Member actions menu: "Mark Pastoral Care Required"
- **REQ-UI-007**: Add menu option in Church Member actions menu: "Mark Pastoral Care Not Required"
- **REQ-UI-008**: Menu options shall toggle the `PastoralCareRequired` flag and refresh the grid
- **REQ-UI-009**: Add "Export Pastoral Care" button next to "Export Members" button
- **REQ-UI-010**: "Export Pastoral Care" button shall trigger PDF download when clicked
- **REQ-UI-011**: "Export Pastoral Care" button shall be visible only to users with `ChurchMembersContributor` or `ChurchMembersAdministrator` roles
- **REQ-UI-012**: Display visual indicator (icon or badge) in grid for members with `PastoralCareRequired` = true
- **REQ-UI-013**: Update member detail view to display pastoral care status
- **REQ-UI-014**: Update member edit form to include pastoral care checkbox

#### PDF Report Requirements

- **REQ-RPT-001**: Report shall be titled "Pastoral Care Report"
- **REQ-RPT-002**: Report shall include generation date in format "Generated: DD MMMM YYYY"
- **REQ-RPT-003**: Report shall group members by District (A, B, C, D, E, F, G, H, I, J, K, L)
- **REQ-RPT-004**: Report shall display districts in alphabetical order (A-L)
- **REQ-RPT-005**: For each district, report shall display district header with format: "District [Name] - Deacon: [Deacon Full Name]"
- **REQ-RPT-006**: If district has no assigned deacon, display: "District [Name] - Deacon: Unassigned"
- **REQ-RPT-007**: If district has no members requiring pastoral care, omit district from report
- **REQ-RPT-008**: Members within each district shall be listed in two columns for space efficiency
- **REQ-RPT-009**: Member names shall be formatted as "[FirstName] [LastName]"
- **REQ-RPT-010**: Members shall be sorted alphabetically by LastName, then FirstName within each district
- **REQ-RPT-011**: Report shall include total count at bottom: "Total Members Requiring Pastoral Care: [count]"
- **REQ-RPT-012**: Report shall use standard church branding/header if available
- **REQ-RPT-013**: Report shall be formatted for A4 paper size, portrait orientation

### Security Requirements

- **SEC-001**: Only users with `ChurchMembersContributor` or `ChurchMembersAdministrator` roles shall update pastoral care status
- **SEC-002**: Only users with `ChurchMembersContributor` or `ChurchMembersAdministrator` roles shall generate pastoral care reports
- **SEC-003**: Users with `ChurchMembersViewer` role shall see pastoral care status but cannot modify it
- **SEC-004**: Audit trail shall log all pastoral care status changes with userId, timestamp, and old/new values

### Performance Requirements

- **PERF-001**: Filtering by pastoral care status shall use database index for efficient queries
- **PERF-002**: PDF generation shall complete within 10 seconds for up to 500 members
- **PERF-003**: Report generation shall be executed asynchronously if member count exceeds 100

### Data Integrity Requirements

- **INT-001**: `PastoralCareRequired` field shall never be null (use default false for existing records)
- **INT-002**: Updating pastoral care status shall update `ModifiedBy` and `ModifiedDateTime` audit fields
- **INT-003**: Historical pastoral care status changes shall be logged in audit trail

### Constraints

- **CON-001**: PDF generation library must support multi-column layouts
- **CON-002**: Report generation must not lock the database for extended periods
- **CON-003**: Export functionality must work with existing district assignments
- **CON-004**: Members without assigned districts shall be grouped under "Unassigned District" in report

### Guidelines

- **GUD-001**: Use consistent terminology: "Pastoral Care Required" (not "Needs Pastoral Care" or similar variations)
- **GUD-002**: Follow existing ChurchRegister UI patterns for filters and exports
- **GUD-003**: Provide clear visual feedback when toggling pastoral care status
- **GUD-004**: Include loading indicators during PDF generation
- **GUD-005**: Use MaterialUI components consistent with existing application design

### Patterns to Follow

- **PAT-001**: Follow existing ChurchMember CRUD patterns for API endpoints
- **PAT-002**: Use existing PDF generation patterns from envelope reports (if available)
- **PAT-003**: Follow existing filter implementation patterns from other grid views
- **PAT-004**: Use existing role-based access control patterns
- **PAT-005**: Follow existing audit trail logging patterns

## 4. Interfaces & Data Contracts

### Database Schema Changes

```sql
-- Add PastoralCareRequired column to ChurchMembers table
ALTER TABLE ChurchMembers
ADD PastoralCareRequired BIT NOT NULL DEFAULT 0;

-- Add index for filtering performance
CREATE INDEX IX_ChurchMembers_PastoralCareRequired
ON ChurchMembers(PastoralCareRequired)
INCLUDE (Id, FirstName, LastName, DistrictId);
```

### Entity Definition

```csharp
public class ChurchMember : IAuditableEntity
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool PastoralCareRequired { get; set; } = false; // NEW
    // ... existing properties
}
```

### API Request/Response Models

#### ChurchMemberDto (Updated)

```csharp
public class ChurchMemberDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool PastoralCareRequired { get; set; } // NEW
    // ... existing properties
}
```

#### Query Parameters for GET /api/church-members

```csharp
public class ChurchMemberGridQuery
{
    public string? SearchTerm { get; set; }
    public int? StatusId { get; set; }
    public int? DistrictId { get; set; }
    public bool? PastoralCareRequired { get; set; } // NEW: null=all, true=yes, false=no
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "LastName";
    public string SortDirection { get; set; } = "asc";
}
```

#### Pastoral Care Report DTO

```csharp
public class PastoralCareReportDto
{
    public List<PastoralCareDistrictDto> Districts { get; set; } = new();
    public int TotalMembers { get; set; }
    public DateTime GeneratedDate { get; set; }
}

public class PastoralCareDistrictDto
{
    public string DistrictName { get; set; } = string.Empty;
    public string? DeaconName { get; set; }
    public List<PastoralCareMemberDto> Members { get; set; } = new();
}

public class PastoralCareMemberDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
}
```

### API Endpoints

#### GET /api/church-members/pastoral-care/export

**Description**: Generate and download PDF report of members requiring pastoral care

**Authorization**: Requires `ChurchMembersContributor` or `ChurchMembersAdministrator` role

**Request**: None (GET request, no body)

**Response**: 
- **Success (200)**: PDF file with content-type `application/pdf`
- **Forbidden (403)**: User lacks required role
- **Internal Server Error (500)**: PDF generation failed

**Response Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Pastoral_Care_Report_20260220.pdf"
```

### Frontend TypeScript Interfaces

```typescript
export interface ChurchMemberSummary {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  districtName?: string;
  pastoralCareRequired: boolean; // NEW
  // ... existing properties
}

export interface ChurchMemberGridQuery {
  searchTerm?: string;
  statusId?: number;
  districtId?: number;
  pastoralCareRequired?: boolean | null; // NEW: null=all, true=yes, false=no
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}
```

## 5. Acceptance Criteria

### Database Migration

- **AC-DB-001**: Given the migration is applied, When querying ChurchMembers table, Then PastoralCareRequired column exists with default value false
- **AC-DB-002**: Given existing church members in database, When migration is applied, Then all existing members have PastoralCareRequired = false
- **AC-DB-003**: Given the migration is applied, When querying with index hint, Then IX_ChurchMembers_PastoralCareRequired index is used

### API Functionality

- **AC-API-001**: Given a member with PastoralCareRequired = true, When GET /api/church-members?pastoralCareRequired=true is called, Then the member is included in results
- **AC-API-002**: Given a member with PastoralCareRequired = false, When GET /api/church-members?pastoralCareRequired=true is called, Then the member is excluded from results
- **AC-API-003**: Given PastoralCareRequired parameter is null or omitted, When GET /api/church-members is called, Then all members are returned regardless of pastoral care status
- **AC-API-004**: Given valid member data with PastoralCareRequired = true, When POST /api/church-members is called, Then member is created with correct pastoral care status
- **AC-API-005**: Given a member with PastoralCareRequired = false, When PUT /api/church-members/{id} with PastoralCareRequired = true, Then member status is updated and audit fields are set
- **AC-API-006**: Given user has ChurchMembersContributor role, When GET /api/church-members/pastoral-care/export is called, Then PDF is generated and downloaded
- **AC-API-007**: Given user has ChurchMembersViewer role only, When GET /api/church-members/pastoral-care/export is called, Then 403 Forbidden is returned
- **AC-API-008**: Given 10 members requiring pastoral care across 3 districts, When export is called, Then PDF contains all 10 members grouped by district

### UI Behavior

- **AC-UI-001**: Given Church Members page is loaded, When page renders, Then pastoral care filter toggle shows "All Members" state
- **AC-UI-002**: Given filter is set to "All Members", When user clicks toggle to "Yes", Then only members with PastoralCareRequired = true are displayed
- **AC-UI-003**: Given filter is set to "Yes", When user clicks toggle to "No", Then only members with PastoralCareRequired = false are displayed
- **AC-UI-004**: Given a member is selected, When user selects "Mark Pastoral Care Required" from menu, Then member's PastoralCareRequired is set to true and grid refreshes
- **AC-UI-005**: Given a member with PastoralCareRequired = true is selected, When user selects "Mark Pastoral Care Not Required" from menu, Then PastoralCareRequired is set to false and grid refreshes
- **AC-UI-006**: Given user has ChurchMembersContributor role, When Church Members page loads, Then "Export Pastoral Care" button is visible
- **AC-UI-007**: Given user has ChurchMembersViewer role only, When Church Members page loads, Then "Export Pastoral Care" button is hidden
- **AC-UI-008**: Given "Export Pastoral Care" button is clicked, When export completes, Then PDF is downloaded with filename "Pastoral_Care_Report_[date].pdf"
- **AC-UI-009**: Given a member has PastoralCareRequired = true, When member row is displayed in grid, Then visual indicator (icon/badge) is shown
- **AC-UI-010**: Given member detail drawer is opened, When member has PastoralCareRequired = true, Then pastoral care status is displayed

### PDF Report Content

- **AC-RPT-001**: Given report is generated, When PDF is opened, Then title "Pastoral Care Report" is displayed at top
- **AC-RPT-002**: Given report is generated on 2026-02-20, When PDF is opened, Then "Generated: 20 February 2026" is displayed
- **AC-RPT-003**: Given District A has 5 members requiring pastoral care and deacon "John Smith", When report is generated, Then district section shows "District A - Deacon: John Smith" with 5 members listed
- **AC-RPT-004**: Given District B has 0 members requiring pastoral care, When report is generated, Then District B is not included in report
- **AC-RPT-005**: Given District C has no assigned deacon, When report is generated, Then district section shows "District C - Deacon: Unassigned"
- **AC-RPT-006**: Given members "Alice Brown" and "Bob Anderson" in same district, When report is generated, Then members are sorted as "Anderson, Bob" then "Brown, Alice"
- **AC-RPT-007**: Given a district has 12 members requiring pastoral care, When report is generated, Then members are displayed in two columns (6 per column)
- **AC-RPT-008**: Given 23 members total require pastoral care, When report is generated, Then footer shows "Total Members Requiring Pastoral Care: 23"
- **AC-RPT-009**: Given members exist without assigned district, When report is generated, Then they appear under "Unassigned District" section

### Security & Authorization

- **AC-SEC-001**: Given user has ChurchMembersViewer role, When attempting to update pastoral care status, Then 403 Forbidden is returned
- **AC-SEC-002**: Given user has ChurchMembersContributor role, When updating pastoral care status, Then update succeeds and audit trail is logged
- **AC-SEC-003**: Given pastoral care status is changed from false to true, When audit log is queried, Then entry contains userId, timestamp, oldValue (false), newValue (true)

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service methods for filtering, PDF generation, data transformation
- **Integration Tests**: API endpoints with in-memory database, role authorization
- **End-to-End Tests**: UI interactions, filter behavior, PDF download

### Testing Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library, Playwright for E2E
- **PDF Verification**: PDFSharp or similar for content validation

### Test Data Management

- Seed test database with members across multiple districts
- Include members with varying pastoral care statuses
- Assign deacons to some districts, leave others unassigned
- Create test users with different role combinations

### CI/CD Integration

- Run all tests in GitHub Actions pipeline
- Generate test coverage reports
- Block merge if tests fail or coverage drops

### Coverage Requirements

- Minimum 80% code coverage for new service methods
- 100% coverage for role authorization logic
- All AC criteria must have corresponding automated tests

### Performance Testing

- Load test with 1000+ member database
- Verify PDF generation completes within 10 seconds
- Test filtering response time with large datasets

### Test Cases

#### Unit Tests

```csharp
// ChurchMemberServiceTests.cs
[TestMethod]
public async Task GetChurchMembers_WithPastoralCareRequiredTrue_ReturnsOnlyMembersRequiringCare()
{
    // Arrange: Create members with pastoral care required true and false
    // Act: Call service with pastoralCareRequired = true
    // Assert: Only members with flag = true are returned
}

[TestMethod]
public async Task GeneratePastoralCareReport_WithMultipleDistricts_GroupsByDistrict()
{
    // Arrange: Create members in different districts
    // Act: Generate report
    // Assert: Report has separate sections for each district with members
}
```

#### Integration Tests

```csharp
// PastoralCareEndpointTests.cs
[TestMethod]
public async Task ExportPastoralCare_WithContributorRole_ReturnsPdf()
{
    // Arrange: Authenticate as ChurchMembersContributor
    // Act: Call GET /api/church-members/pastoral-care/export
    // Assert: Response is 200, content-type is application/pdf
}

[TestMethod]
public async Task ExportPastoralCare_WithViewerRole_ReturnsForbidden()
{
    // Arrange: Authenticate as ChurchMembersViewer
    // Act: Call GET /api/church-members/pastoral-care/export
    // Assert: Response is 403 Forbidden
}
```

#### E2E Tests

```typescript
// pastoral-care.spec.ts
test('should filter members requiring pastoral care', async ({ page }) => {
  // Navigate to church members page
  // Click pastoral care filter toggle to "Yes"
  // Verify only members with pastoral care indicator are shown
});

test('should download pastoral care PDF report', async ({ page }) => {
  // Navigate to church members page
  // Click "Export Pastoral Care" button
  // Verify PDF download starts
  // Verify filename matches expected pattern
});
```

## 7. Rationale & Context

### Design Decisions

#### Why Boolean Field vs. Dedicated Table?

A simple boolean field (`PastoralCareRequired`) is sufficient for the current requirement. A separate table would be needed only if:
- Historical tracking of pastoral care events is required
- Multiple types of pastoral care need to be tracked
- Detailed notes or visit logs are needed

For the current scope, a boolean flag provides the simplest, most performant solution.

#### Why Toggle Filter with Three States?

The three-state toggle (All/Yes/No) provides maximum flexibility:
- **All (default)**: Most common use case - viewing all members
- **Yes**: Quick access for deacons to see their pastoral care list
- **No**: Ability to identify members who might need review

This is more intuitive than a checkbox filter which would only have Yes/No.

#### Why PDF Export Instead of Screen Export?

PDF provides:
- Printable format for deacons who prefer paper lists
- Fixed layout that won't change across devices
- Professional appearance for pastoral care meetings
- Offline access to care lists

#### Why Two-Column Layout in Report?

Two columns maximize space efficiency while maintaining readability:
- Fits more members on a single page
- Reduces paper waste
- Easier to scan visually during meetings

### Business Context

#### Pastoral Care Workflow

Deacons typically review their district members regularly to ensure appropriate pastoral support. This feature streamlines the workflow:

1. Church administrator marks members requiring pastoral care based on:
   - Personal circumstances (illness, bereavement, isolation)
   - Attendance patterns
   - Direct requests for support
   - Deacon feedback

2. Deacons access filtered lists to see their responsibilities

3. Reports are generated for monthly deacons' meetings to discuss cases

4. Status is updated as pastoral care is provided or needs change

### Alternative Approaches Considered

#### Alternative 1: Pastoral Care Notes Field
**Rejected because**: Adds complexity beyond current scope. Can be added later if needed.

#### Alternative 2: Email Notifications to Deacons
**Rejected because**: Requires email infrastructure and notification preferences. Future enhancement.

#### Alternative 3: Separate Pastoral Care Module
**Rejected because**: Over-engineering for current needs. Integration with existing member management is simpler.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None - feature is self-contained within ChurchRegister application

### Third-Party Services

- **SVC-001**: PDF Generation Library - Required capabilities include multi-column layouts, custom headers/footers, A4 page size support. Must work with .NET 9.0. Suggested libraries: QuestPDF, PdfSharpCore, or iText.

### Infrastructure Dependencies

- **INF-001**: Database - Requires SQL Server with support for ALTER TABLE and CREATE INDEX statements
- **INF-002**: File System - Temporary storage for PDF generation before streaming to client

### Data Dependencies

- **DAT-001**: Districts Table - Must exist with deacon assignments (foreign key to ChurchMembers)
- **DAT-002**: ChurchMembers Table - Must exist with FirstName, LastName, DistrictId fields
- **DAT-003**: ChurchMemberRoles - Deacon role must be properly assigned to identify deacons for report headers

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 Runtime - Required for application hosting
- **PLT-002**: Entity Framework Core - For database migrations and querying
- **PLT-003**: React with MaterialUI - For frontend UI components
- **PLT-004**: PDF Library Compatible with .NET 9.0 - For report generation

### Compliance Dependencies

- **COM-001**: GDPR Compliance - Pastoral care status may be considered sensitive personal data. Ensure:
  - Role-based access controls are enforced
  - Audit trail logs all access and modifications
  - Data protection consent is documented
  - Right to be forgotten can remove pastoral care status

## 9. Examples & Edge Cases

### Example 1: Basic Filtering

```typescript
// User toggles pastoral care filter to "Yes"
const query: ChurchMemberGridQuery = {
  pastoralCareRequired: true,
  pageNumber: 1,
  pageSize: 20,
  sortBy: 'LastName',
  sortDirection: 'asc'
};

// API returns only members with PastoralCareRequired = true
```

### Example 2: Creating Member with Pastoral Care Flag

```csharp
var newMember = new CreateChurchMemberRequest
{
    FirstName = "Jane",
    LastName = "Doe",
    PastoralCareRequired = true, // New member needing immediate pastoral support
    MemberSince = DateTime.UtcNow.Date,
    ChurchMemberStatusId = 1 // Active
};
```

### Example 3: PDF Report Structure

```
                    Pastoral Care Report
                Generated: 20 February 2026

District A - Deacon: John Smith
---------------------------------
Anderson, Bob          Brown, Alice
Carter, David          Davis, Emma
Evans, Frank           Foster, Grace

District C - Deacon: Unassigned
---------------------------------
Harris, Henry          Irving, Isabel
Jones, Jack

District F - Deacon: Mary Wilson
---------------------------------
Kelly, Karen           Lewis, Laura
Mitchell, Mike         Nelson, Nancy
Owens, Oliver          Parker, Patricia
Quinn, Quincy          Roberts, Rachel
Stevens, Steve         Turner, Tina
Underwood, Uma         Vincent, Victor

                    ----------------
        Total Members Requiring Pastoral Care: 23
```

### Edge Case 1: No Members Requiring Pastoral Care

**Scenario**: All members have PastoralCareRequired = false

**Expected Behavior**: 
- Filter with "Yes" shows empty grid with message "No members requiring pastoral care"
- Export button generates PDF showing:
```
                    Pastoral Care Report
                Generated: 20 February 2026

        No members currently require pastoral care.
```

### Edge Case 2: All Members in Unassigned District

**Scenario**: Members requiring pastoral care exist but have DistrictId = null

**Expected Behavior**:
- Report shows section "Unassigned District - Deacon: Unassigned"
- Members are listed in two columns as normal
- Total count includes these members

### Edge Case 3: District with One Member

**Scenario**: District has only one member requiring pastoral care

**Expected Behavior**:
- District section appears with single member in left column
- Right column is empty (no padding placeholder)
- Section is not omitted despite low count

### Edge Case 4: Member Name Exceeds Column Width

**Scenario**: Member has very long name (e.g., "Smith-Johnson-Anderson-Williams, Christopher-Alexander-Benjamin")

**Expected Behavior**:
- Name wraps to next line within column
- Column width remains fixed
- Report layout is not broken

### Edge Case 5: Large Number of Members in One District

**Scenario**: District A has 50 members requiring pastoral care

**Expected Behavior**:
- Members flow across multiple pages
- District header repeats on each page: "District A (continued) - Deacon: John Smith"
- Two-column layout maintained throughout

### Edge Case 6: Special Characters in Names

**Scenario**: Member name contains apostrophes, hyphens, accented characters (e.g., "O'Brien-García, Máire")

**Expected Behavior**:
- Name renders correctly in PDF with proper UTF-8 encoding
- Sorting works correctly with special characters

### Edge Case 7: Concurrent Status Updates

**Scenario**: Two administrators simultaneously update pastoral care status for same member

**Expected Behavior**:
- Database concurrency check detects conflict
- Second update overwrites first (last-write-wins)
- Both changes logged in audit trail with timestamps

### Edge Case 8: Deacon Assigned to Multiple Districts

**Scenario**: One deacon (Sarah Johnson) is assigned to both District A and District B

**Expected Behavior**:
- District A section shows "Deacon: Sarah Johnson"
- District B section shows "Deacon: Sarah Johnson"
- Each district maintains separate member lists

## 10. Validation Criteria

### Database Migration Validation

- [ ] Migration script executes without errors on clean database
- [ ] Migration script executes without errors on existing production-like database
- [ ] Column PastoralCareRequired exists with correct data type (BIT/boolean)
- [ ] Default constraint is applied correctly (default = 0/false)
- [ ] Index IX_ChurchMembers_PastoralCareRequired exists and includes specified columns
- [ ] Existing member records have PastoralCareRequired = false after migration
- [ ] Rollback script successfully removes column and index

### API Validation

- [ ] Swagger/OpenAPI documentation includes updated endpoints and models
- [ ] GET /api/church-members correctly filters by pastoralCareRequired parameter
- [ ] POST /api/church-members accepts and persists PastoralCareRequired value
- [ ] PUT /api/church-members updates PastoralCareRequired value
- [ ] GET /api/church-members/{id} returns PastoralCareRequired in response
- [ ] GET /api/church-members/pastoral-care/export returns valid PDF
- [ ] Export endpoint enforces role-based authorization
- [ ] Export endpoint sets correct Content-Type and Content-Disposition headers
- [ ] All audit fields (ModifiedBy, ModifiedDateTime) update on pastoral care status change

### UI Validation

- [ ] Pastoral care toggle filter renders correctly on Church Members page
- [ ] Toggle filter defaults to "All Members" state
- [ ] Clicking filter cycles through All → Yes → No → All states
- [ ] Grid updates to show filtered results when filter changes
- [ ] Menu option "Mark Pastoral Care Required" appears for all members
- [ ] Menu option "Mark Pastoral Care Not Required" appears for all members
- [ ] Clicking menu option updates member status and refreshes grid
- [ ] Visual indicator (icon/badge) displays for members with PastoralCareRequired = true
- [ ] "Export Pastoral Care" button appears next to "Export Members" button
- [ ] Button visibility respects role-based authorization
- [ ] Clicking export button downloads PDF file
- [ ] Loading indicator appears during PDF generation
- [ ] Member detail view shows pastoral care status
- [ ] Member edit form includes pastoral care checkbox
- [ ] Checkbox is disabled for users with ChurchMembersViewer role only

### PDF Report Validation

- [ ] PDF opens successfully in Adobe Reader, Chrome, Edge browsers
- [ ] Report title "Pastoral Care Report" appears at top
- [ ] Generation date displays in correct format
- [ ] Districts appear in alphabetical order (A-L)
- [ ] District headers show correct format: "District [Name] - Deacon: [Name]"
- [ ] Unassigned deacon displays as "Deacon: Unassigned"
- [ ] Members within district are sorted alphabetically by last name
- [ ] Members display in two-column layout
- [ ] Member names format correctly as "[FirstName] [LastName]"
- [ ] Footer shows total count of members requiring pastoral care
- [ ] Page size is A4, orientation is portrait
- [ ] Multi-page reports maintain layout consistency
- [ ] Special characters and accents render correctly
- [ ] Report is printable without layout issues

### Security Validation

- [ ] ChurchMembersViewer can view pastoral care status but cannot edit
- [ ] ChurchMembersContributor can view and edit pastoral care status
- [ ] ChurchMembersAdministrator can view and edit pastoral care status
- [ ] ChurchMembersViewer cannot access export endpoint (403 Forbidden)
- [ ] ChurchMembersContributor can access export endpoint
- [ ] ChurchMembersAdministrator can access export endpoint
- [ ] Audit trail logs all pastoral care status changes
- [ ] Audit log includes userId, timestamp, oldValue, newValue

### Performance Validation

- [ ] Filtering by pastoral care status returns results in < 500ms for 1000 members
- [ ] PDF generation completes in < 10 seconds for 500 members
- [ ] Database query plan uses IX_ChurchMembers_PastoralCareRequired index
- [ ] Grid pagination works efficiently with pastoral care filter enabled
- [ ] No N+1 query issues when loading members with district/deacon information

### Accessibility Validation

- [ ] Toggle filter is keyboard navigable
- [ ] Screen reader announces filter state changes
- [ ] Export button has descriptive aria-label
- [ ] Visual indicator has appropriate alt text or aria-label
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Focus states are clearly visible

### Cross-Browser Validation

- [ ] Feature works in Chrome (latest)
- [ ] Feature works in Edge (latest)
- [ ] Feature works in Firefox (latest)
- [ ] Feature works in Safari (latest)
- [ ] PDF download works in all supported browsers

## 11. Related Specifications / Further Reading

- [Church Members Management Feature Specification](/spec/done/church-members-spec.md)
- [Districts and Deacons Feature Specification](/spec/done/district-decaons-spec.md)
- [Role-Based Access Control](/docs/security-configuration.md)
- [Audit Trail Pattern](/docs/error-handling-patterns.md)
- [Export and Reporting Patterns](/docs/envelope-template-upload-guide.md)

### External Resources

- [QuestPDF Documentation](https://www.questpdf.com/) - For PDF generation
- [GDPR Guidelines for Churches](https://gdpr.eu/data-protection-impact-assessment-template/) - Data protection considerations
- [MaterialUI Toggle Button](https://mui.com/material-ui/react-toggle-button/) - UI component reference
- [Entity Framework Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/) - Database schema changes
