---
title: Church Member Data Protection Consent Management Specification
version: 1.0
date_created: 2026-02-14
last_updated: 2026-02-14
owner: Church Register Development Team
tags: [gdpr, data-protection, consent-management, church-members, compliance]
---

# Church Member Data Protection Consent Management

## 1. Purpose & Scope

This specification defines the requirements, constraints, and interfaces for implementing GDPR-compliant data protection consent management for church members. The feature enables authorized users to record and manage member consent preferences for use of personal information in church communications, publications, and online platforms.

**Intended Audience**: Backend developers, frontend developers, QA engineers, compliance officers

**Assumptions**:
- Church operates under UK GDPR regulations
- Consent is opt-in (default: all permissions denied)
- Manual consent collection process (no member self-service portal)
- Consent is granular (6 separate permissions) and can be withdrawn at any time

## 2. Definitions

- **GDPR**: General Data Protection Regulation - EU/UK data protection law
- **Special Category Data**: Sensitive personal data (e.g., health information) requiring explicit consent
- **Opt-in Consent**: Explicit action required to grant permission (default: no consent)
- **Data Subject**: The church member whose personal data is being processed
- **Data Controller**: The church organization responsible for determining how personal data is used
- **Consent Withdrawal**: Action to revoke previously granted permission
- **Incidental Appearance**: Appearing in background/group photos without being the primary subject

## 3. Requirements, Constraints & Guidelines

### Database Requirements

- **REQ-DB-001**: Create `ChurchMemberDataProtection` table with Id (PK), ChurchMemberId (FK), AllowNameInCommunications, AllowHealthStatusInCommunications, AllowPhotoInCommunications, AllowPhotoInSocialMedia, GroupPhotos, PermissionForMyChildren (all boolean NOT NULL default false)
- **REQ-DB-002**: Add audit fields to ChurchMemberDataProtection: CreatedBy (nvarchar), CreatedDateTime (datetime2), ModifiedBy (nvarchar), ModifiedDateTime (datetime2) - all NOT NULL
- **REQ-DB-003**: Add DataProtectionId (nullable int) foreign key to ChurchMember table
- **REQ-DB-004**: Configure 1:1 relationship: ChurchMember.HasOne(DataProtection).WithOne().HasForeignKey(ChurchMember.DataProtectionId)
- **REQ-DB-005**: Create unique index on ChurchMemberDataProtection.ChurchMemberId to enforce 1:1 relationship
- **REQ-DB-006**: When creating new ChurchMember, automatically create associated ChurchMemberDataProtection record with all permissions set to false
- **REQ-DB-007**: Use database transaction to ensure atomic creation of ChurchMember + ChurchMemberDataProtection

### API Requirements

- **REQ-API-001**: Create GET /api/church-members/{id}/data-protection endpoint returning DataProtectionDto
- **REQ-API-002**: Create PUT /api/church-members/{id}/data-protection endpoint accepting UpdateDataProtectionRequest
- **REQ-API-003**: GET endpoint accessible to ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator roles
- **REQ-API-004**: PUT endpoint accessible to ChurchMembersContributor, ChurchMembersAdministrator roles only (NOT Viewer)
- **REQ-API-005**: Include data protection summary (status, lastModified) in ChurchMemberDto for grid display
- **REQ-API-006**: Return 404 if church member not found
- **REQ-API-007**: Return 200 with updated DataProtectionDto on successful update
- **REQ-API-008**: Log audit trail on every consent change (who, when, which permissions changed)

### Frontend Requirements

- **REQ-UI-001**: Add "Data Protection" column to Church Members grid after District column
- **REQ-UI-002**: Display icon indicator in Data Protection column: Green CheckCircle (all 6 permissions true), Amber Warning (1-5 permissions true), Grey Block/Cancel (all 6 permissions false)
- **REQ-UI-003**: Show tooltip on hover over icon displaying: all 6 permission states (✓/✗) + Last Modified date + Modified By user
- **REQ-UI-004**: Add "Manage Data Protection" action to grid three-dot menu visible to Contributors and Administrators only
- **REQ-UI-005**: Create ManageDataProtectionDrawer component (anchor: right, width: 500px)
- **REQ-UI-006**: Drawer header: "{firstName} {lastName} - Data Protection Consent"
- **REQ-UI-007**: Display 6 checkboxes in drawer with exact wording provided (see section 4)
- **REQ-UI-008**: Group checkboxes under "Minimum Consent Checkboxes (Bare Essentials)" heading with numbered items (1-6)
- **REQ-UI-009**: Add "Clear All Consent" button (red, with confirmation dialog) to set all permissions to false
- **REQ-UI-010**: Add "Save" button (primary, disabled when no changes or loading)
- **REQ-UI-011**: Add "Cancel" button to close drawer without saving
- **REQ-UI-012**: Display last modified date and user below checkboxes: "Last updated: {date} by {user}"
- **REQ-UI-013**: Show loading spinner on Save button during mutation
- **REQ-UI-014**: Close drawer automatically after successful save with success notification
- **REQ-UI-015**: Invalidate Church Members query cache after successful save to refresh grid icon

### Excel Export Requirements

- **REQ-EXP-001**: Add 6 data protection columns at end of Church Members Excel export (after all existing columns)
- **REQ-EXP-002**: Column headers: "Name in Communications", "Health Status Mentions", "Photo in Print", "Photo on Social Media", "Group Photos", "Permission for Children"
- **REQ-EXP-003**: Cell values: "Yes" (true), "No" (false)
- **REQ-EXP-004**: Apply cell coloring: Green background (#d4edda) for "Yes", Red background (#f8d7da) for "No"
- **REQ-EXP-005**: Column width: 12 characters each

### Security Requirements

- **SEC-001**: Only ChurchMembersContributor and ChurchMembersAdministrator roles can edit data protection consent
- **SEC-002**: ChurchMembersViewer role can view data protection status but cannot edit
- **SEC-003**: API endpoints must validate user role authorization before processing requests
- **SEC-004**: Drawer "Manage Data Protection" action must conditionally render based on user role (hide for Viewers)
- **SEC-005**: Audit trail must capture username from JWT claims for CreatedBy/ModifiedBy fields
- **SEC-006**: All consent changes must be logged to application audit log

### Compliance Requirements

- **COM-001**: Default state for all permissions must be false (opt-in consent model)
- **COM-002**: Each permission must be separately granular (no bundled consent)
- **COM-003**: Consent must be freely given (no pre-ticked checkboxes for new members)
- **COM-004**: Consent withdrawal must be as easy as granting (Clear All Consent button)
- **COM-005**: Audit trail must demonstrate when consent was given, by whom, and when changed
- **COM-006**: Hover tooltip must provide transparency about current consent status without requiring additional clicks

### Technical Constraints

- **CON-001**: Must use Entity Framework Core for database schema and migrations
- **CON-002**: Must use FastEndpoints pattern for API endpoints
- **CON-003**: Must use React Query for frontend data fetching and cache invalidation
- **CON-004**: Must use MUI components (Drawer, Checkbox, FormControlLabel, Tooltip) for UI
- **CON-005**: Must use xlsx-js-style for Excel export with colored cells
- **CON-006**: ChurchMemberDataProtection record is mandatory for every ChurchMember (enforced via auto-creation)
- **CON-007**: Data Protection status cannot be deleted, only modified (all permissions can be set to false)
- **CON-008**: No historical versioning of consent changes (current state + audit log only)

### Guidelines

- **GUD-001**: Follow existing drawer implementation patterns (Training Certificates, District Assignment)
- **GUD-002**: Follow existing three-dot menu action patterns
- **GUD-003**: Follow existing Excel export patterns (colored cells, column positioning)
- **GUD-004**: Use existing notification system for success/error messages
- **GUD-005**: Maintain consistent naming conventions across layers (DataProtection vs DataProtectionConsent)
- **GUD-006**: Include XML documentation comments for all public APIs
- **GUD-007**: Use FormGroup component to wrap related checkboxes for accessibility
- **GUD-008**: Display descriptive helper text under checkboxes explaining scope of each permission

### Design Patterns

- **PAT-001**: Icon-based status visualization (similar to Training Certificate alerts: Red/Amber/Green)
- **PAT-002**: Hover tooltip for detailed information (similar to attendance event details)
- **PAT-003**: Confirmation dialog for destructive actions (Clear All Consent)
- **PAT-004**: Drawer-based editing (separate from main member form)
- **PAT-005**: Optimistic UI updates with React Query mutation

## 4. Interfaces & Data Contracts

### Database Schema

#### ChurchMemberDataProtection Table

```sql
CREATE TABLE ChurchMemberDataProtection (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ChurchMemberId INT NOT NULL UNIQUE,
    AllowNameInCommunications BIT NOT NULL DEFAULT 0,
    AllowHealthStatusInCommunications BIT NOT NULL DEFAULT 0,
    AllowPhotoInCommunications BIT NOT NULL DEFAULT 0,
    AllowPhotoInSocialMedia BIT NOT NULL DEFAULT 0,
    GroupPhotos BIT NOT NULL DEFAULT 0,
    PermissionForMyChildren BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy NVARCHAR(256) NOT NULL,
    ModifiedDateTime DATETIME2 NOT NULL,
    CONSTRAINT FK_ChurchMemberDataProtection_ChurchMember 
        FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IX_ChurchMemberDataProtection_ChurchMemberId 
    ON ChurchMemberDataProtection(ChurchMemberId);
```

#### ChurchMember Table Modification

```sql
ALTER TABLE ChurchMember
ADD DataProtectionId INT NULL;

ALTER TABLE ChurchMember
ADD CONSTRAINT FK_ChurchMember_DataProtection 
    FOREIGN KEY (DataProtectionId) 
    REFERENCES ChurchMemberDataProtection(Id);
```

### Backend DTOs

#### DataProtectionDto

```csharp
public class DataProtectionDto
{
    public int Id { get; set; }
    public int ChurchMemberId { get; set; }
    public bool AllowNameInCommunications { get; set; }
    public bool AllowHealthStatusInCommunications { get; set; }
    public bool AllowPhotoInCommunications { get; set; }
    public bool AllowPhotoInSocialMedia { get; set; }
    public bool GroupPhotos { get; set; }
    public bool PermissionForMyChildren { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDateTime { get; set; }
}
```

#### UpdateDataProtectionRequest

```csharp
public class UpdateDataProtectionRequest
{
    public bool AllowNameInCommunications { get; set; }
    public bool AllowHealthStatusInCommunications { get; set; }
    public bool AllowPhotoInCommunications { get; set; }
    public bool AllowPhotoInSocialMedia { get; set; }
    public bool GroupPhotos { get; set; }
    public bool PermissionForMyChildren { get; set; }
}
```

#### DataProtectionSummaryDto (for grid display)

```csharp
public class DataProtectionSummaryDto
{
    public string Status { get; set; } = string.Empty; // "all_granted", "partial", "all_denied"
    public bool AllowNameInCommunications { get; set; }
    public bool AllowHealthStatusInCommunications { get; set; }
    public bool AllowPhotoInCommunications { get; set; }
    public bool AllowPhotoInSocialMedia { get; set; }
    public bool GroupPhotos { get; set; }
    public bool PermissionForMyChildren { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDateTime { get; set; }
}
```

#### Updated ChurchMemberDto

```csharp
public class ChurchMemberDto
{
    // ... existing properties ...
    public int? DataProtectionId { get; set; }
    public DataProtectionSummaryDto? DataProtection { get; set; }
}
```

### API Endpoints

#### GET /api/church-members/{id}/data-protection

**Authorization**: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator

**Request**: Path parameter `id` (int)

**Response**: 200 OK
```json
{
  "id": 42,
  "churchMemberId": 123,
  "allowNameInCommunications": true,
  "allowHealthStatusInCommunications": false,
  "allowPhotoInCommunications": true,
  "allowPhotoInSocialMedia": false,
  "groupPhotos": true,
  "permissionForMyChildren": true,
  "modifiedBy": "john.smith@church.org",
  "modifiedDateTime": "2026-02-14T10:30:00Z"
}
```

**Response**: 404 Not Found (if church member or data protection record not found)

#### PUT /api/church-members/{id}/data-protection

**Authorization**: ChurchMembersContributor, ChurchMembersAdministrator (NOT Viewer)

**Request**: Path parameter `id` (int)

**Request Body**:
```json
{
  "allowNameInCommunications": true,
  "allowHealthStatusInCommunications": true,
  "allowPhotoInCommunications": true,
  "allowPhotoInSocialMedia": false,
  "groupPhotos": true,
  "permissionForMyChildren": false
}
```

**Response**: 200 OK (returns updated DataProtectionDto)

**Response**: 403 Forbidden (if user is Viewer role)

**Response**: 404 Not Found (if church member not found)

### Frontend TypeScript Interfaces

#### DataProtection Type

```typescript
export interface DataProtection {
  id: number;
  churchMemberId: number;
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
  modifiedBy: string;
  modifiedDateTime: string;
}
```

#### DataProtectionSummary Type

```typescript
export interface DataProtectionSummary {
  status: 'all_granted' | 'partial' | 'all_denied';
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
  modifiedBy: string;
  modifiedDateTime: string;
}
```

#### UpdateDataProtectionRequest Type

```typescript
export interface UpdateDataProtectionRequest {
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
}
```

#### Updated ChurchMemberDto

```typescript
export interface ChurchMemberDto {
  // ... existing properties ...
  dataProtectionId?: number | null;
  dataProtection?: DataProtectionSummary | null;
}
```

### Drawer Checkbox Exact Wording

#### Section Header
**"Minimum Consent Checkboxes (Bare Essentials)"**

#### Checkbox 1
**Label**: ☐ I give permission for my name to be included in the church newsletter or other church communications.

**Helper Text**: This covers: Congratulations, Thank-yous, Mentions of involvement, Prayer requests without health details

**Database Field**: `AllowNameInCommunications`

#### Checkbox 2
**Label**: ☐ I give permission for the church to mention me in pastoral situations (e.g., illness, hospital admission), keeping details minimal.

**Helper Text**: This is needed because health information is "special category data".

**Database Field**: `AllowHealthStatusInCommunications`

#### Checkbox 3
**Label**: ☐ I give permission for my photo to be used in printed church materials (e.g., newsletter, noticeboard).

**Helper Text**: This separates print from online, which is important legally.

**Database Field**: `AllowPhotoInCommunications`

#### Checkbox 4
**Label**: ☐ I give permission for my photo to be used on the church Facebook page or other online platforms.

**Helper Text**: This must be separate because: Facebook is public, Data leaves the UK/EU, People often want print but not online.

**Database Field**: `AllowPhotoInSocialMedia`

#### Checkbox 5
**Label**: ☐ I am happy to appear incidentally in group or crowd photos.

**Helper Text**: This avoids needing consent for every wide shot, while still respecting people who prefer not to appear at all.

**Database Field**: `GroupPhotos`

#### Checkbox 6
**Label**: ☐ I give permission for my child's name/photo to be used as above.

**Helper Text**: (Optional but helpful - not essential)

**Database Field**: `PermissionForMyChildren`

### Icon Indicator Logic

```typescript
function getDataProtectionIcon(dataProtection: DataProtectionSummary | null): {
  icon: React.ReactNode;
  color: string;
  tooltip: React.ReactNode;
} {
  if (!dataProtection) {
    return {
      icon: <Block />,
      color: 'grey',
      tooltip: 'No data protection record'
    };
  }

  const permissions = [
    dataProtection.allowNameInCommunications,
    dataProtection.allowHealthStatusInCommunications,
    dataProtection.allowPhotoInCommunications,
    dataProtection.allowPhotoInSocialMedia,
    dataProtection.groupPhotos,
    dataProtection.permissionForMyChildren
  ];

  const grantedCount = permissions.filter(p => p).length;

  if (grantedCount === 6) {
    return {
      icon: <CheckCircle />,
      color: 'success.main',
      tooltip: renderTooltip(dataProtection, 'All permissions granted')
    };
  } else if (grantedCount === 0) {
    return {
      icon: <Cancel />,
      color: 'grey',
      tooltip: renderTooltip(dataProtection, 'No permissions granted')
    };
  } else {
    return {
      icon: <Warning />,
      color: 'warning.main',
      tooltip: renderTooltip(dataProtection, 'Partial permissions granted')
    };
  }
}

function renderTooltip(dataProtection: DataProtectionSummary, statusText: string): React.ReactNode {
  return (
    <Box>
      <Typography variant="body2" fontWeight="bold">{statusText}</Typography>
      <Box mt={1}>
        <Typography variant="caption">
          {dataProtection.allowNameInCommunications ? '✓' : '✗'} Name in Communications
        </Typography>
        <Typography variant="caption">
          {dataProtection.allowHealthStatusInCommunications ? '✓' : '✗'} Health Status Mentions
        </Typography>
        <Typography variant="caption">
          {dataProtection.allowPhotoInCommunications ? '✓' : '✗'} Photo in Print
        </Typography>
        <Typography variant="caption">
          {dataProtection.allowPhotoInSocialMedia ? '✓' : '✗'} Photo on Social Media
        </Typography>
        <Typography variant="caption">
          {dataProtection.groupPhotos ? '✓' : '✗'} Group Photos
        </Typography>
        <Typography variant="caption">
          {dataProtection.permissionForMyChildren ? '✓' : '✗'} Permission for Children
        </Typography>
      </Box>
      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          Last modified: {new Date(dataProtection.modifiedDateTime).toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Modified by: {dataProtection.modifiedBy}
        </Typography>
      </Box>
    </Box>
  );
}
```

## 5. Acceptance Criteria

### Database & Migration

- **AC-DB-001**: Given a new EF migration is created, When applied to database, Then ChurchMemberDataProtection table exists with all specified columns and constraints
- **AC-DB-002**: Given ChurchMemberDataProtection table exists, When querying table schema, Then ChurchMemberId column has UNIQUE constraint
- **AC-DB-003**: Given ChurchMember table, When querying schema, Then DataProtectionId column exists as nullable INT
- **AC-DB-004**: Given ChurchMember and ChurchMemberDataProtection tables, When querying foreign keys, Then FK_ChurchMember_DataProtection exists
- **AC-DB-005**: Given a new ChurchMember is created, When transaction commits, Then corresponding ChurchMemberDataProtection record exists with all permissions set to false
- **AC-DB-006**: Given a ChurchMember is created, When DataProtection record creation fails, Then entire transaction rolls back and ChurchMember is not created
- **AC-DB-007**: Given ChurchMemberDataProtection record, When all audit fields are checked, Then CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime are NOT NULL

### Backend Service Layer

- **AC-SVC-001**: Given a valid member ID, When GetDataProtectionAsync is called, Then return DataProtectionDto with all permission values and audit fields
- **AC-SVC-002**: Given an invalid member ID, When GetDataProtectionAsync is called, Then throw NotFoundException
- **AC-SVC-003**: Given a valid UpdateDataProtectionRequest, When UpdateDataProtectionAsync is called, Then update all 6 permission fields and ModifiedBy/ModifiedDateTime
- **AC-SVC-004**: Given an UpdateDataProtectionRequest, When UpdateDataProtectionAsync is called, Then original CreatedBy and CreatedDateTime remain unchanged
- **AC-SVC-005**: Given ChurchMember query, When DTO is mapped, Then DataProtectionSummary is populated with status ("all_granted", "partial", "all_denied")
- **AC-SVC-006**: Given DataProtection with all 6 permissions true, When calculating status, Then status is "all_granted"
- **AC-SVC-007**: Given DataProtection with 0 permissions true, When calculating status, Then status is "all_denied"
- **AC-SVC-008**: Given DataProtection with 1-5 permissions true, When calculating status, Then status is "partial"
- **AC-SVC-009**: Given UpdateDataProtectionRequest with all false, When UpdateDataProtectionAsync is called (Clear All), Then all permissions set to false successfully

### Backend API Endpoints

- **AC-API-001**: Given authenticated ChurchMembersViewer, When GET /api/church-members/123/data-protection, Then return 200 with DataProtectionDto
- **AC-API-002**: Given authenticated ChurchMembersContributor, When PUT /api/church-members/123/data-protection with valid request, Then return 200 with updated DataProtectionDto
- **AC-API-003**: Given authenticated ChurchMembersAdministrator, When PUT /api/church-members/123/data-protection with valid request, Then return 200 with updated DataProtectionDto
- **AC-API-004**: Given authenticated ChurchMembersViewer, When PUT /api/church-members/123/data-protection, Then return 403 Forbidden
- **AC-API-005**: Given unauthenticated request, When GET /api/church-members/123/data-protection, Then return 401 Unauthorized
- **AC-API-006**: Given invalid member ID 99999, When GET /api/church-members/99999/data-protection, Then return 404 Not Found
- **AC-API-007**: Given valid PUT request, When UpdateDataProtection endpoint is called, Then audit log entry is created with username and timestamp
- **AC-API-008**: Given Swagger documentation, When viewing API docs, Then both endpoints are documented with request/response schemas and authorization requirements

### Frontend Grid Display

- **AC-UI-001**: Given Church Members grid, When rendered, Then "Data Protection" column appears after "District" column
- **AC-UI-002**: Given member with all 6 permissions true, When viewing grid, Then Data Protection column shows green CheckCircle icon
- **AC-UI-003**: Given member with 0 permissions true, When viewing grid, Then Data Protection column shows grey Cancel icon
- **AC-UI-004**: Given member with 3 permissions true, When viewing grid, Then Data Protection column shows amber Warning icon
- **AC-UI-005**: Given Data Protection icon, When user hovers over icon, Then tooltip appears showing all 6 permission states (✓/✗)
- **AC-UI-006**: Given Data Protection tooltip, When displayed, Then last modified date and modified by user are shown at bottom
- **AC-UI-007**: Given ChurchMembersViewer user, When viewing grid action menu, Then "Manage Data Protection" option is NOT visible
- **AC-UI-008**: Given ChurchMembersContributor user, When viewing grid action menu, Then "Manage Data Protection" option is visible
- **AC-UI-009**: Given ChurchMembersAdministrator user, When viewing grid action menu, Then "Manage Data Protection" option is visible

### Frontend Drawer Component

- **AC-UI-010**: Given "Manage Data Protection" action clicked, When ManageDataProtectionDrawer opens, Then drawer displays member's full name in header
- **AC-UI-011**: Given drawer is open, When rendered, Then all 6 checkboxes are displayed with exact wording specified in section 4
- **AC-UI-012**: Given drawer is open, When rendered, Then section header "Minimum Consent Checkboxes (Bare Essentials)" is displayed
- **AC-UI-013**: Given drawer is open, When rendered, Then each checkbox has helper text displayed below label
- **AC-UI-014**: Given member's current permissions, When drawer opens, Then checkboxes are pre-checked to match current database values
- **AC-UI-015**: Given drawer is open, When user unchecks checkbox, Then Save button becomes enabled
- **AC-UI-016**: Given drawer is open, When user checks checkbox, Then Save button becomes enabled
- **AC-UI-017**: Given drawer with unchanged checkboxes, When displayed, Then Save button is disabled
- **AC-UI-018**: Given drawer is open, When Save button is clicked, Then loading spinner appears on button
- **AC-UI-019**: Given valid changes, When Save completes successfully, Then success notification appears
- **AC-UI-020**: Given valid changes, When Save completes successfully, Then drawer closes automatically
- **AC-UI-021**: Given valid changes, When Save completes successfully, Then grid refreshes with updated icon
- **AC-UI-022**: Given drawer is open, When Cancel button is clicked, Then drawer closes without saving changes
- **AC-UI-023**: Given drawer is open, When "Clear All Consent" button is clicked, Then confirmation dialog appears
- **AC-UI-024**: Given Clear All Consent confirmation dialog, When user confirms, Then all 6 checkboxes become unchecked
- **AC-UI-025**: Given Clear All Consent confirmation dialog, When user cancels, Then checkboxes remain unchanged and dialog closes
- **AC-UI-026**: Given drawer is open, When rendered, Then last modified date and user are displayed below checkboxes
- **AC-UI-027**: Given API error during save, When error occurs, Then error notification appears with message
- **AC-UI-028**: Given API error during save, When error occurs, Then drawer remains open for user to retry or cancel

### Frontend React Query Integration

- **AC-RQ-001**: Given useDataProtection hook, When called with member ID, Then fetch data from GET /api/church-members/{id}/data-protection
- **AC-RQ-002**: Given useUpdateDataProtection hook, When mutation succeeds, Then invalidate church members query cache
- **AC-RQ-003**: Given useUpdateDataProtection hook, When mutation succeeds, Then invalidate specific data protection query cache
- **AC-RQ-004**: Given failed data protection fetch, When retrying, Then use exponential backoff strategy

### Excel Export

- **AC-EXP-001**: Given Church Members Excel export, When generated, Then 6 data protection columns appear at end of sheet
- **AC-EXP-002**: Given Excel export, When viewing headers, Then columns are: "Name in Communications", "Health Status Mentions", "Photo in Print", "Photo on Social Media", "Group Photos", "Permission for Children"
- **AC-EXP-003**: Given member with permission granted (true), When viewing Excel cell, Then cell displays "Yes" with green background (#d4edda)
- **AC-EXP-004**: Given member with permission denied (false), When viewing Excel cell, Then cell displays "No" with red background (#f8d7da)
- **AC-EXP-005**: Given Excel export, When viewing column widths, Then each data protection column width is 12 characters
- **AC-EXP-006**: Given 100 members with varied permissions, When exporting, Then all 6 columns populated correctly for all members

### Security & Authorization

- **AC-SEC-001**: Given ChurchMembersViewer user, When attempting PUT /api/church-members/123/data-protection, Then request is rejected with 403 Forbidden
- **AC-SEC-002**: Given ChurchMembersContributor user, When modifying data protection, Then ModifiedBy audit field captures contributor's username from JWT
- **AC-SEC-003**: Given unauthenticated user, When accessing any data protection endpoint, Then request is rejected with 401 Unauthorized
- **AC-SEC-004**: Given permission change, When saved, Then audit log entry includes: member ID, username, timestamp, changed permission fields

### GDPR Compliance

- **AC-COM-001**: Given new ChurchMember record, When created, Then DataProtection record has all 6 permissions set to false (opt-in)
- **AC-COM-002**: Given drawer with checkboxes, When displayed, Then no checkboxes are pre-ticked for new member (must be manually checked)
- **AC-COM-003**: Given user wants to withdraw all consent, When "Clear All Consent" is clicked and confirmed, Then all permissions set to false in single operation
- **AC-COM-004**: Given audit requirements, When permission is changed, Then ModifiedBy and ModifiedDateTime are updated to track who made change and when
- **AC-COM-005**: Given transparency requirement, When user hovers over icon, Then all current permission states are visible without requiring drawer to open
- **AC-COM-006**: Given granular consent requirement, When managing permissions, Then each permission can be independently granted or denied

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer methods, DTO mapping, status calculation logic, React components, React hooks
- **Integration Tests**: API endpoints with database, EF Core relationships, transaction handling
- **End-to-End Tests**: Complete user workflows from grid to drawer to save

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq (for .NET applications)
- **Frontend**: Vitest (component tests), React Testing Library, MSW (API mocking)
- **E2E**: Playwright (cross-browser testing)

### Test Data Management

- **Approach**: Use TestWebApplicationFactory with in-memory/test database
- **Setup**: Create ChurchMember with associated DataProtection record in test fixture
- **Cleanup**: Transaction rollback or database reset between tests
- **Fixtures**: ChurchMemberBuilder and DataProtectionBuilder for test data

### CI/CD Integration

- **Pipeline**: GitHub Actions workflow triggers on PR and merge to main
- **Stages**: Build → Unit Tests → Integration Tests → E2E Tests → Deploy
- **Gates**: All tests must pass before merge allowed
- **Reporting**: Test results published to PR, code coverage report generated

### Coverage Requirements

- **Minimum Thresholds**: 80% line coverage, 70% branch coverage
- **Critical Paths**: 100% coverage for consent status calculation, audit trail, transaction handling
- **Exclusions**: DTOs, auto-generated code, Program.cs startup

### Performance Testing

- **Load Test**: 100 concurrent users managing data protection for different members
- **Response Time**: API endpoints must respond within 500ms at 95th percentile
- **Database**: Query performance for ChurchMember with DataProtection join (< 100ms)

### Test Examples

#### Backend Unit Test

```csharp
[TestClass]
public class DataProtectionServiceTests
{
    [TestMethod]
    public async Task UpdateDataProtectionAsync_AllPermissionsFalse_SetsStatusToDenied()
    {
        // Arrange
        var member = new ChurchMemberBuilder().WithDataProtection().Build();
        var request = new UpdateDataProtectionRequest
        {
            AllowNameInCommunications = false,
            AllowHealthStatusInCommunications = false,
            AllowPhotoInCommunications = false,
            AllowPhotoInSocialMedia = false,
            GroupPhotos = false,
            PermissionForMyChildren = false
        };
        
        // Act
        var result = await _service.UpdateDataProtectionAsync(member.Id, request, "test@user.com");
        
        // Assert
        result.Should().NotBeNull();
        result.AllowNameInCommunications.Should().BeFalse();
        result.AllowHealthStatusInCommunications.Should().BeFalse();
        result.AllowPhotoInCommunications.Should().BeFalse();
        result.AllowPhotoInSocialMedia.Should().BeFalse();
        result.GroupPhotos.Should().BeFalse();
        result.PermissionForMyChildren.Should().BeFalse();
        result.ModifiedBy.Should().Be("test@user.com");
    }
}
```

#### Frontend Component Test

```typescript
describe('ManageDataProtectionDrawer', () => {
  it('should display all 6 checkboxes with correct labels', () => {
    render(
      <ManageDataProtectionDrawer 
        open={true} 
        member={mockMember} 
        onClose={jest.fn()} 
      />
    );
    
    expect(screen.getByText(/permission for my name to be included/i)).toBeInTheDocument();
    expect(screen.getByText(/mention me in pastoral situations/i)).toBeInTheDocument();
    expect(screen.getByText(/photo to be used in printed church materials/i)).toBeInTheDocument();
    expect(screen.getByText(/photo to be used on the church Facebook page/i)).toBeInTheDocument();
    expect(screen.getByText(/appear incidentally in group or crowd photos/i)).toBeInTheDocument();
    expect(screen.getByText(/permission for my child's name/i)).toBeInTheDocument();
  });
  
  it('should show confirmation dialog when Clear All Consent clicked', async () => {
    render(
      <ManageDataProtectionDrawer 
        open={true} 
        member={mockMember} 
        onClose={jest.fn()} 
      />
    );
    
    const clearButton = screen.getByText(/clear all consent/i);
    await userEvent.click(clearButton);
    
    expect(screen.getByText(/are you sure you want to remove all consent/i)).toBeInTheDocument();
  });
});
```

#### E2E Test

```typescript
test('administrator can manage data protection consent', async ({ page }) => {
  await page.goto('/church-members');
  
  // Find member row and open action menu
  await page.getByText('John Smith').click();
  await page.getByLabel('Actions').click();
  await page.getByText('Manage Data Protection').click();
  
  // Verify drawer opens with member name
  await expect(page.getByText('John Smith - Data Protection Consent')).toBeVisible();
  
  // Check permission checkboxes
  await page.getByLabel(/permission for my name to be included/i).check();
  await page.getByLabel(/photo to be used in printed church materials/i).check();
  
  // Save changes
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify success notification and drawer closes
  await expect(page.getByText(/data protection updated successfully/i)).toBeVisible();
  await expect(page.getByText('John Smith - Data Protection Consent')).not.toBeVisible();
  
  // Verify icon changed to amber (partial)
  const dataProtectionCell = page.getByRole('cell', { name: /data protection/i });
  await expect(dataProtectionCell.locator('svg[data-testid="WarningIcon"]')).toBeVisible();
});
```

## 7. Rationale & Context

### Design Decisions

#### 1:1 Relationship with Auto-Creation

**Decision**: Automatically create ChurchMemberDataProtection record when ChurchMember is created, with all permissions defaulting to false.

**Rationale**:
- Ensures every member has data protection record (no null handling)
- Enforces opt-in consent model (GDPR requirement)
- Simplifies UI logic (no "create vs update" distinction)
- Database transaction ensures atomicity (both created or neither)

**Alternative Considered**: Nullable FK with lazy creation on first edit
- **Rejected because**: Requires null checks throughout codebase, UI must handle "no record exists" state, harder to query members without consent

#### Separate Drawer vs Inline Form

**Decision**: Implement data protection management in separate drawer, not integrated into main member edit form.

**Rationale**:
- Maintains clean separation of concerns (demographic data vs consent)
- Reduces cognitive load in main edit form (already complex)
- Aligns with GDPR principle of "freely given consent" (separate decision point)
- Consistent with Training Certificates and District Assignment patterns
- Easier to add future consent types without cluttering main form

#### Icon with Tooltip vs Text Status

**Decision**: Display color-coded icon (Green/Amber/Grey) with detailed hover tooltip instead of text status.

**Rationale**:
- Visual indicators faster to scan than text (grid usability)
- Tooltip provides transparency without clicks (GDPR transparency principle)
- Color coding (RAG status) consistent with Training Certificates module
- Space efficient (icon vs "All Granted" text in column)
- Accessible (tooltip works with keyboard navigation)

#### Six Separate Checkboxes vs Grouped

**Decision**: Display 6 separate checkboxes for granular consent management.

**Rationale**:
- GDPR Article 7 requires granular consent (no bundled consent)
- Different legal implications (print vs online, health data vs name)
- Members commonly want some permissions but not others (e.g., print but not social media)
- Supports principle of data minimization

#### "Clear All Consent" Button

**Decision**: Provide single-click button to withdraw all consent with confirmation dialog.

**Rationale**:
- GDPR Article 7(3) requires consent withdrawal to be as easy as granting
- Single operation ensures atomic update (prevents partial withdrawal failures)
- Confirmation dialog prevents accidental clicks
- Red button styling indicates destructive action

#### Contributors Can Edit

**Decision**: Allow both ChurchMembersContributor and ChurchMembersAdministrator to edit data protection (unlike District which is Admin-only).

**Rationale**:
- Data protection consent is frequently updated (new photos, events, communications)
- Contributors often collect consent forms in person (data entry role)
- Restricting to Admin-only would create bottleneck
- Audit trail provides accountability regardless of role
- Aligns with similar modules (Training Certificates allow Contributor edits)

#### No Expiry/Review Date

**Decision**: Consent does not expire automatically; no scheduled review mechanism.

**Rationale**:
- UK GDPR does not mandate consent expiry for non-profit religious organizations
- Adds complexity without clear legal benefit for this use case
- Church maintains ongoing relationship with members (consent remains relevant)
- Members can withdraw consent at any time (satisfies withdrawal requirement)
- Can be added later if compliance requirements change

#### Audit Trail Without History Table

**Decision**: Store current state with audit fields (ModifiedBy/ModifiedDateTime) but no separate history table.

**Rationale**:
- Satisfies basic GDPR accountability requirement (when consent changed, by whom)
- Simpler implementation (no additional tables, queries)
- Application audit log provides detailed change history if needed
- Full history table adds complexity (storage, queries, UI) without clear use case
- Can be added later if compliance officer requests detailed audit reports

### GDPR Compliance Context

#### Lawful Basis

The church processes member data under GDPR Article 6(1)(a) "Consent" for communications and photography. Health information processed under Article 9(2)(a) "Explicit consent for special category data".

#### Consent Requirements (GDPR Article 7)

- **Freely Given**: Separate drawer ensures consent not bundled with membership
- **Specific**: Six separate permissions for different processing purposes
- **Informed**: Helper text explains scope of each permission
- **Unambiguous**: Explicit checkbox action required (not pre-ticked)
- **Withdrawal**: Clear All Consent button makes withdrawal as easy as granting
- **Burden of Proof**: Audit trail demonstrates consent was given, when, by whom

#### Transparency (GDPR Articles 13-14)

- Icon tooltip shows current consent status without requiring clicks
- Drawer displays full consent details with last modified date
- Helper text explains what each permission covers

#### Special Category Data (GDPR Article 9)

Checkbox 2 (AllowHealthStatusInCommunications) explicitly handles health information (special category data requiring explicit consent). Helper text emphasizes this.

### User Experience Context

#### Workflow

1. Administrator creates new member → DataProtection record auto-created (all false)
2. Administrator collects paper consent form from member
3. Administrator opens member in grid → "Manage Data Protection" from action menu
4. Drawer opens → Check appropriate boxes based on form
5. Save → Icon updates in grid (Green/Amber/Grey)
6. Later: Another administrator needs to know member's photo consent
7. Hover over icon → Tooltip shows all permissions without clicking

#### Pain Points Addressed

- **Previous State**: No systematic consent tracking, reliance on paper files
- **Solution**: Digital record with audit trail, easy lookup via grid icon
- **Benefit**: Staff can quickly check consent before publishing newsletter/photos

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: SQL Server Database - Required for storing ChurchMemberDataProtection table with transactional integrity

### Third-Party Services

- **SVC-001**: Excel Export Library (xlsx-js-style) - Required for generating Excel files with colored cells (green/red backgrounds)

### Infrastructure Dependencies

- **INF-001**: Entity Framework Core ORM - Required for database migrations, relationship mapping, transaction management
- **INF-002**: ASP.NET Core Runtime - Required for FastEndpoints API hosting and JWT authentication

### Data Dependencies

- **DAT-001**: ChurchMember Table - ChurchMemberDataProtection depends on existing ChurchMember records via foreign key
- **DAT-002**: AspNetUsers Table - ModifiedBy/CreatedBy fields reference authenticated user emails from JWT claims

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 Runtime - Required minimum version for FastEndpoints and Entity Framework Core features
- **PLT-002**: React 19 - Required for frontend component rendering and hooks
- **PLT-003**: TypeScript 5.x - Required for type-safe frontend development
- **PLT-004**: MUI (Material-UI) 7.x - Required for Drawer, Checkbox, Tooltip components with consistent styling

### Compliance Dependencies

- **COM-001**: UK GDPR Compliance Framework - All consent mechanisms must comply with GDPR Articles 6, 7, 9, 13-14
- **COM-002**: Data Protection Act 2018 (UK) - Special category data (health information) processing requirements

## 9. Examples & Edge Cases

### Example 1: New Member - Full Consent

**Scenario**: New member John Smith joins church and provides full consent for all communications and photos.

**Workflow**:
1. Administrator creates ChurchMember record: FirstName="John", LastName="Smith"
2. Database trigger/EF creates ChurchMemberDataProtection: all 6 permissions = false
3. Administrator opens "Manage Data Protection" drawer
4. Administrator checks all 6 checkboxes based on signed consent form
5. Clicks Save → ModifiedBy="admin@church.org", ModifiedDateTime=now
6. Grid shows green CheckCircle icon for John Smith
7. Hover tooltip displays: "All permissions granted", all 6 with ✓, "Last modified: [date] by admin@church.org"

**Database State**:
```sql
SELECT * FROM ChurchMemberDataProtection WHERE ChurchMemberId = 123;
-- AllowNameInCommunications: 1 (true)
-- AllowHealthStatusInCommunications: 1 (true)
-- AllowPhotoInCommunications: 1 (true)
-- AllowPhotoInSocialMedia: 1 (true)
-- GroupPhotos: 1 (true)
-- PermissionForMyChildren: 1 (true)
-- ModifiedBy: 'admin@church.org'
-- ModifiedDateTime: '2026-02-14 10:30:00'
```

### Example 2: Existing Member - Partial Consent (Print but not Online)

**Scenario**: Member Mary Jones comfortable with printed newsletter and group photos but does not want photos on social media.

**Workflow**:
1. Administrator opens Mary's data protection drawer
2. Checks: Name (✓), Printed Photos (✓), Group Photos (✓)
3. Leaves unchecked: Health Status, Social Media Photos, Children Permission
4. Saves changes
5. Grid shows amber Warning icon
6. Tooltip displays: "Partial permissions granted", 3 with ✓ and 3 with ✗

**Use Case**: Before posting event photos to Facebook, staff hover over Mary's icon → see ✗ for Social Media → ensure Mary not in posted photos.

### Example 3: Consent Withdrawal - Clear All

**Scenario**: Member requests all consent be withdrawn due to privacy concerns.

**Workflow**:
1. Administrator opens member's data protection drawer (currently has 4 permissions checked)
2. Clicks red "Clear All Consent" button
3. Confirmation dialog appears: "Are you sure you want to remove all consent permissions for [Member Name]? This action will set all permissions to 'No'."
4. Administrator confirms
5. All 6 checkboxes become unchecked
6. Clicks Save
7. Grid icon changes from amber Warning to grey Cancel
8. Tooltip shows: "No permissions granted", all 6 with ✗

**GDPR Compliance**: Request honored immediately, audit trail shows withdrawal date/user.

### Example 4: Special Category Data - Health Mentions

**Scenario**: Member hospitalized, church wants to mention in prayer newsletter.

**Workflow**:
1. Pastor asks secretary to check consent before including in newsletter
2. Secretary opens Church Members grid, finds member
3. Hovers over Data Protection icon
4. Tooltip shows: "✗ Health Status Mentions"
5. Secretary reports back: member has not consented to health mentions
6. Pastor contacts member directly, obtains verbal consent
7. Administrator updates drawer: checks "AllowHealthStatusInCommunications"
8. Member included in newsletter prayer requests

**Legal Basis**: GDPR Article 9(2)(a) explicit consent for special category data (health).

### Example 5: Excel Export for Audit

**Scenario**: Church data protection officer needs annual audit report of all member consent status.

**Workflow**:
1. Administrator opens Church Members page
2. Clicks "Export to Excel"
3. Opens downloaded file
4. Scrolls right to last 6 columns:
   - "Name in Communications", "Health Status Mentions", "Photo in Print", "Photo on Social Media", "Group Photos", "Permission for Children"
5. Cells show "Yes" (green background) or "No" (red background)
6. Officer uses Excel filtering to identify:
   - Members with no consent (all 6 columns = "No")
   - Members with social media consent (column D = "Yes")

**Audit Result**: Officer confirms 85% of members have name consent, 40% have social media consent.

### Edge Case 1: Concurrent Edits

**Scenario**: Two administrators open data protection drawer for same member simultaneously.

**Behavior**:
1. Admin A opens drawer → sees current state (3 permissions checked)
2. Admin B opens drawer → sees same current state
3. Admin A checks 2 more permissions, saves → database updates, ModifiedBy="AdminA"
4. Admin B unchecks 1 permission, saves → database updates, ModifiedBy="AdminB"
5. Final state: Admin B's changes overwrite Admin A's (last write wins)

**Mitigation**: Acceptable for this use case (rare scenario, low impact). If needed later: implement optimistic concurrency with EF RowVersion.

### Edge Case 2: Children Permission Without Children

**Scenario**: Member without children checks "Permission for my children" checkbox.

**Behavior**:
- Checkbox is visible and functional for all members
- No validation prevents checking it
- Database stores permission even if member has no child records
- Future-proof: if member later adds children, permission already recorded

**Rationale**: Simpler UI logic (no conditional rendering), member may have children not in database, permission can be granted proactively.

### Edge Case 3: Deleted Member

**Scenario**: ChurchMember record is soft-deleted or hard-deleted.

**Behavior**:
- If using soft delete (IsDeleted flag): DataProtection record retained, data protection drawer still accessible
- If using hard delete (CASCADE): DataProtection record automatically deleted per FK constraint
- Excel export excludes deleted members (not shown in grid)

**GDPR Right to Erasure**: When member exercises right to erasure, hard delete both ChurchMember and ChurchMemberDataProtection (CASCADE handles automatically).

### Edge Case 4: Missing DataProtection Record (Legacy Data)

**Scenario**: ChurchMember exists before feature deployed, no DataProtection record.

**Behavior**:
- Grid displays grey Block icon
- Tooltip: "No data protection record"
- When "Manage Data Protection" clicked, drawer displays error: "Data protection record not found"
- Administrator must manually create record (future migration script can handle bulk creation)

**Migration Recommendation**: Run script to create DataProtection records for all existing members with all permissions = false.

### Edge Case 5: Viewer Role Attempts Edit

**Scenario**: ChurchMembersViewer user modifies frontend code to enable Save button.

**Behavior**:
1. Viewer opens drawer (visible in read-only mode)
2. Viewer bypasses frontend validation, clicks Save
3. Frontend calls PUT /api/church-members/123/data-protection
4. Backend FastEndpoints authorization checks role
5. Response: 403 Forbidden
6. Frontend displays error: "You do not have permission to edit data protection"

**Security**: Backend authorization prevents unauthorized changes even if frontend bypassed.

## 10. Validation Criteria

### Database Validation

- [ ] ChurchMemberDataProtection table exists in database
- [ ] All 6 permission columns defined as BIT NOT NULL DEFAULT 0
- [ ] Audit columns (CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime) present and NOT NULL
- [ ] UNIQUE constraint on ChurchMemberId enforced
- [ ] Foreign key FK_ChurchMemberDataProtection_ChurchMember exists with CASCADE delete
- [ ] ChurchMember.DataProtectionId column exists as nullable INT
- [ ] New ChurchMember creation triggers DataProtection record creation in same transaction
- [ ] Query performance: ChurchMember JOIN DataProtection executes < 100ms for 1000 records

### Backend API Validation

- [ ] GET /api/church-members/{id}/data-protection returns 200 with DataProtectionDto
- [ ] PUT /api/church-members/{id}/data-protection returns 200 with updated DataProtectionDto
- [ ] GET endpoint accessible to Viewer, Contributor, Administrator roles
- [ ] PUT endpoint accessible to Contributor, Administrator roles only (Viewer gets 403)
- [ ] Unauthenticated requests return 401
- [ ] Invalid member ID returns 404
- [ ] UpdateDataProtection updates ModifiedBy and ModifiedDateTime
- [ ] UpdateDataProtection preserves CreatedBy and CreatedDateTime
- [ ] ChurchMemberDto includes DataProtectionSummary with status ("all_granted", "partial", "all_denied")
- [ ] Swagger documentation displays both endpoints with schemas
- [ ] Application audit log captures consent changes with username and timestamp

### Frontend Grid Validation

- [ ] "Data Protection" column appears after "District" column
- [ ] Green CheckCircle icon displays when all 6 permissions true
- [ ] Grey Cancel icon displays when all 6 permissions false
- [ ] Amber Warning icon displays when 1-5 permissions true
- [ ] Hover tooltip shows all 6 permission states (✓ or ✗)
- [ ] Tooltip displays last modified date and modified by user
- [ ] Tooltip renders with keyboard navigation (focus + Enter)
- [ ] "Manage Data Protection" action visible to Contributor/Administrator
- [ ] "Manage Data Protection" action hidden from Viewer
- [ ] Grid refreshes (icon updates) after drawer save without page refresh

### Frontend Drawer Validation

- [ ] Drawer opens from grid action menu
- [ ] Drawer displays member full name in header
- [ ] Section header "Minimum Consent Checkboxes (Bare Essentials)" displayed
- [ ] All 6 checkboxes display with exact wording specified
- [ ] Each checkbox has helper text displayed below label
- [ ] Checkboxes pre-checked to match current database values
- [ ] Save button disabled when no changes made
- [ ] Save button enabled when any checkbox changed
- [ ] Save button shows loading spinner during mutation
- [ ] Success notification appears after save
- [ ] Drawer closes automatically after successful save
- [ ] Cancel button closes drawer without saving
- [ ] "Clear All Consent" button displays with red styling
- [ ] Clear All Consent shows confirmation dialog
- [ ] Confirmation dialog allows cancel (no changes)
- [ ] Confirmation dialog confirmed unchecks all 6 checkboxes
- [ ] Last modified date and user displayed below checkboxes
- [ ] Error notification displays on API error with message
- [ ] Drawer remains open on error for retry/cancel

### Excel Export Validation

- [ ] 6 data protection columns appear at end of export
- [ ] Column headers: "Name in Communications", "Health Status Mentions", "Photo in Print", "Photo on Social Media", "Group Photos", "Permission for Children"
- [ ] Cells display "Yes" for true, "No" for false
- [ ] "Yes" cells have green background (#d4edda)
- [ ] "No" cells have red background (#f8d7da)
- [ ] Column width: 12 characters each
- [ ] All members included with correct permission values
- [ ] Export completes < 5 seconds for 500 members

### Security & Compliance Validation

- [ ] Viewer role cannot edit data protection (403 response)
- [ ] Contributor role can edit data protection
- [ ] Administrator role can edit data protection
- [ ] ModifiedBy field captures username from JWT claims
- [ ] New members have all permissions defaulted to false (opt-in)
- [ ] Clear All Consent sets all 6 permissions to false atomically
- [ ] Audit log entry created on every consent change
- [ ] Consent withdrawal (Clear All) is single operation (no partial failures)

### Performance Validation

- [ ] GET data protection endpoint responds < 200ms (95th percentile)
- [ ] PUT data protection endpoint responds < 500ms (95th percentile)
- [ ] Grid with 1000 members renders < 2 seconds including icons
- [ ] Tooltip hover displays < 100ms
- [ ] Drawer opens < 500ms
- [ ] Save operation completes < 1 second

### Accessibility Validation

- [ ] All checkboxes have associated labels (aria-label or htmlFor)
- [ ] Tooltip accessible via keyboard navigation
- [ ] Drawer accessible via keyboard (Tab, Enter, Esc)
- [ ] Color-coded icons also have text labels for screen readers
- [ ] Focus indicators visible on all interactive elements
- [ ] Confirmation dialog traps focus until dismissed

### Browser Compatibility Validation

- [ ] Chrome/Edge (latest): Full functionality
- [ ] Firefox (latest): Full functionality
- [ ] Safari (latest): Full functionality
- [ ] Mobile browsers (iOS Safari, Chrome Android): Responsive layout

## 11. Related Specifications / Further Reading

### Internal Specifications

- [Church District Assignment Specification](./church-district-spec.md) - Similar drawer implementation pattern, 1:FK relationship
- [Church Members Specification](./church-members-spec.md) - Core member management, grid structure, action menus
- [Training Certificates Specification](./training-module-spec.md) - Color-coded status indicators (RAG), drawer editing

### External Documentation

- [UK GDPR Overview](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/) - ICO guidance on GDPR compliance
- [GDPR Article 7: Conditions for consent](https://gdpr-info.eu/art-7-gdpr/) - Legal requirements for valid consent
- [GDPR Article 9: Processing of special categories of personal data](https://gdpr-info.eu/art-9-gdpr/) - Health information consent requirements
- [Entity Framework Core: One-to-One Relationships](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/one-to-one) - EF Core relationship configuration
- [FastEndpoints Authorization](https://fast-endpoints.com/docs/security) - Role-based endpoint authorization
- [React Query: Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) - Mutation patterns with cache invalidation
- [MUI Drawer Component](https://mui.com/material-ui/react-drawer/) - Drawer implementation guide
- [MUI Checkbox Component](https://mui.com/material-ui/react-checkbox/) - Checkbox with labels and helper text
- [MUI Tooltip Component](https://mui.com/material-ui/react-tooltip/) - Hover tooltip implementation
- [xlsx-js-style Library](https://github.com/gitbrent/xlsx-js-style) - Excel export with cell styling

### Architecture Documentation

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Overall system architecture, database schema
- [docs/error-handling-patterns.md](../docs/error-handling-patterns.md) - API error handling conventions
- [docs/security-configuration.md](../docs/security-configuration.md) - JWT authentication, role-based authorization

### GDPR Resources for Development Team

- [ICO: How do we obtain valid consent?](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/consent/how-do-we-obtain-valid-consent/)
- [ICO: What about children?](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/consent/what-about-children/)
- [ICO: How do we withdraw consent?](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/consent/how-do-we-withdraw-consent/)
