---
title: Church Member District Assignment Specification
version: 1.0
date_created: 2026-02-14
last_updated: 2026-02-14
owner: Church Register Development Team
tags: [schema, feature, church-members, districts]
---

# Church Member District Assignment Specification

A specification for implementing district assignment functionality within the Church Register application, enabling church members to be organized into administrative districts (A through L) for pastoral care and organizational purposes.

## 1. Purpose & Scope

### Purpose
Enable church administrators to assign and manage district associations for church members through a dedicated interface, supporting annual district reorganization and pastoral care coordination.

### Scope
- Database schema for Districts table and ChurchMember foreign key relationship
- District assignment UI through a dedicated drawer in the Church Members grid
- District filtering in the Church Members grid
- District display in grid and Excel exports
- Permission-based access control for district assignment

### Out of Scope
- District management UI (districts are seeded, not managed through UI)
- Historical tracking of district assignments
- Bulk district assignment operations
- District-related dashboard statistics or reporting
- District leader assignment or metadata

### Intended Audience
- Backend developers implementing Entity Framework models and API endpoints
- Frontend developers implementing React UI components
- Database administrators managing schema changes
- QA engineers writing test specifications

## 2. Definitions

| Term | Definition |
|------|------------|
| **District** | An administrative grouping (A-L) used to organize church members for pastoral care |
| **Drawer** | A slide-out panel UI component used for forms and detailed views |
| **FK** | Foreign Key - database relationship constraint |
| **Seeded Data** | Pre-populated database records created during migration |
| **Unassigned** | A member without a district association (DistrictId is null) |

## 3. Requirements, Constraints & Guidelines

### Database Requirements

- **REQ-DB-001**: Create `Districts` table with columns:
  - `Id` (int, primary key, identity)
  - `Name` (nvarchar(1), not null, unique) - Values: A, B, C, D, E, F, G, H, I, J, K, L
  - `CreatedBy` (nvarchar(256), not null)
  - `CreatedDateTime` (datetime2, not null)
  - `ModifiedBy` (nvarchar(256), nullable)
  - `ModifiedDateTime` (datetime2, nullable)

- **REQ-DB-002**: Add `DistrictId` column to `ChurchMember` table:
  - `DistrictId` (int, nullable, foreign key to Districts.Id)
  - Allow NULL values (members can be unassigned)

- **REQ-DB-003**: Seed Districts table with 12 records (A through L) during migration

- **REQ-DB-004**: Add foreign key constraint with CASCADE behavior on update, NO ACTION on delete

### Backend API Requirements

- **REQ-API-001**: Create GET endpoint `/api/districts` to retrieve all districts
  - Returns: `List<DistrictDto>`
  - No pagination required (fixed small dataset)

- **REQ-API-002**: Create PUT endpoint `/api/church-members/{id}/district` to assign district
  - Request body: `{ "districtId": number | null }`
  - Returns: Updated `ChurchMemberDto` with district information
  - Validates that districtId exists if not null

- **REQ-API-003**: Include district information in existing ChurchMember DTOs:
  - `DistrictId` (nullable int)
  - `DistrictName` (nullable string)

- **REQ-API-004**: Support district filtering in GET `/api/church-members` endpoint
  - Add optional `districtId` query parameter
  - Support special value to filter for unassigned members

### Frontend UI Requirements

- **REQ-UI-001**: Add "District" column to Church Members DataGrid
  - Position: After "Contact Number" column
  - Display: District name (A-L) or "Unassigned"
  - Width: 100px
  - Sortable: Yes

- **REQ-UI-002**: Create "Assign District" drawer component
  - Trigger: Three-dot action menu on grid row
  - Show current district assignment
  - Dropdown select for districts A-L plus "Unassigned" option
  - Save and Cancel buttons
  - Display member name in drawer header

- **REQ-UI-003**: Add District filter to Church Members grid filters
  - Type: Dropdown select
  - Options: "All", "Unassigned", A, B, C, D, E, F, G, H, I, J, K, L
  - Default: "All"
  - Apply italic styling to "All" option (existing pattern)

- **REQ-UI-004**: Include District column in Excel export
  - Position: After Contact Number
  - Column header: "District"
  - Value: District name or empty string for unassigned

### Permission Requirements

- **REQ-SEC-001**: District assignment requires `ChurchMembersAdministrator` role
  - Only administrators can access "Assign District" drawer
  - Contributors and Viewers can see district information but cannot modify

- **REQ-SEC-002**: District viewing is available to all church member roles:
  - ChurchMembersViewer
  - ChurchMembersContributor
  - ChurchMembersAdministrator

### Constraints

- **CON-001**: District list is fixed at 12 values (A-L) and cannot be modified through UI
- **CON-002**: A member can only be assigned to one district at a time
- **CON-003**: District assignment is optional - members can remain unassigned
- **CON-004**: No historical tracking of district changes
- **CON-005**: No bulk district assignment operations in initial implementation

### Guidelines

- **GUD-001**: Follow existing drawer patterns (e.g., Training Certificate drawer)
- **GUD-002**: Use React Query for data fetching and cache invalidation
- **GUD-003**: Apply MUI DataGrid styling consistent with existing grids
- **GUD-004**: Maintain responsive design for mobile and tablet views
- **GUD-005**: Use existing notification system for success/error messages
- **GUD-006**: Follow existing Excel export patterns (xlsx-js-style library)

## 4. Interfaces & Data Contracts

### Database Schema

```sql
-- Districts table
CREATE TABLE Districts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(1) NOT NULL UNIQUE,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy NVARCHAR(256) NULL,
    ModifiedDateTime DATETIME2 NULL
);

-- Add DistrictId to ChurchMember
ALTER TABLE ChurchMember
ADD DistrictId INT NULL
CONSTRAINT FK_ChurchMember_District FOREIGN KEY (DistrictId)
REFERENCES Districts(Id) ON UPDATE CASCADE ON DELETE NO ACTION;

-- Seed districts
INSERT INTO Districts (Name, CreatedBy, CreatedDateTime)
VALUES 
    ('A', 'System', GETUTCDATE()),
    ('B', 'System', GETUTCDATE()),
    ('C', 'System', GETUTCDATE()),
    ('D', 'System', GETUTCDATE()),
    ('E', 'System', GETUTCDATE()),
    ('F', 'System', GETUTCDATE()),
    ('G', 'System', GETUTCDATE()),
    ('H', 'System', GETUTCDATE()),
    ('I', 'System', GETUTCDATE()),
    ('J', 'System', GETUTCDATE()),
    ('K', 'System', GETUTCDATE()),
    ('L', 'System', GETUTCDATE());
```

### Backend DTOs

```csharp
/// <summary>
/// District data transfer object
/// </summary>
public class DistrictDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Request to assign or update member's district
/// </summary>
public class AssignDistrictRequest
{
    /// <summary>
    /// District ID to assign, or null to unassign
    /// </summary>
    public int? DistrictId { get; set; }
}

/// <summary>
/// Extended ChurchMemberDto with district information
/// </summary>
public class ChurchMemberDto
{
    // ... existing properties ...
    
    /// <summary>
    /// Assigned district ID (null if unassigned)
    /// </summary>
    public int? DistrictId { get; set; }
    
    /// <summary>
    /// Assigned district name (null if unassigned)
    /// </summary>
    public string? DistrictName { get; set; }
}
```

### API Endpoints

```typescript
// GET /api/districts
// Response: 200 OK
[
  { "id": 1, "name": "A" },
  { "id": 2, "name": "B" },
  // ... through L
]

// PUT /api/church-members/{id}/district
// Request Body:
{
  "districtId": 3  // or null to unassign
}

// Response: 200 OK
{
  "id": 123,
  "firstName": "John",
  "lastName": "Smith",
  // ... other member properties ...
  "districtId": 3,
  "districtName": "C"
}

// GET /api/church-members?districtId=3
// Returns members in district C

// GET /api/church-members?districtId=null
// Returns unassigned members
```

### Frontend Types

```typescript
// District type
export interface District {
  id: number;
  name: string;
}

// Extended ChurchMemberDto
export interface ChurchMemberDetailDto {
  // ... existing properties ...
  districtId: number | null;
  districtName: string | null;
}

// Assign district request
export interface AssignDistrictRequest {
  districtId: number | null;
}
```

## 5. Acceptance Criteria

### Database & Backend

- **AC-DB-001**: Given the migration is executed, When querying the Districts table, Then 12 records exist with names A through L
- **AC-DB-002**: Given a ChurchMember record, When DistrictId is null, Then the member can be saved successfully (unassigned state)
- **AC-DB-003**: Given a valid districtId, When assigning to a member, Then the foreign key constraint is enforced
- **AC-DB-004**: Given a district is deleted, When members reference that district, Then deletion fails (NO ACTION constraint)

### API Endpoints

- **AC-API-001**: Given a GET request to `/api/districts`, When executed, Then return all 12 districts ordered by name
- **AC-API-002**: Given a valid member ID and district ID, When PUT `/api/church-members/{id}/district`, Then member's district is updated and DistrictName is populated in response
- **AC-API-003**: Given a valid member ID and null districtId, When PUT request is made, Then member becomes unassigned (DistrictId = null)
- **AC-API-004**: Given an invalid district ID, When assigning to member, Then return 400 Bad Request with validation error
- **AC-API-005**: Given a GET request with `?districtId=3`, When executed, Then return only members in district C
- **AC-API-006**: Given a GET request with `?districtId=null`, When executed, Then return only unassigned members

### Frontend UI

- **AC-UI-001**: Given the Church Members grid is displayed, When viewing the District column, Then it appears after Contact Number column
- **AC-UI-002**: Given a member has district "C" assigned, When viewing the grid, Then "C" is displayed in the District column
- **AC-UI-003**: Given a member is unassigned, When viewing the grid, Then "Unassigned" is displayed in the District column
- **AC-UI-004**: Given user has ChurchMembersAdministrator role, When clicking three-dot menu on a member row, Then "Assign District" option is available
- **AC-UI-005**: Given user has ChurchMembersViewer or Contributor role, When clicking three-dot menu, Then "Assign District" option is NOT available
- **AC-UI-006**: Given "Assign District" drawer is open, When selecting a district and clicking Save, Then the member's district is updated and success notification is shown
- **AC-UI-007**: Given the district filter dropdown, When "All" is selected, Then all members are displayed regardless of district
- **AC-UI-008**: Given the district filter dropdown, When "Unassigned" is selected, Then only members without districts are displayed
- **AC-UI-009**: Given the district filter dropdown, When "C" is selected, Then only members in district C are displayed
- **AC-UI-010**: Given members are exported to Excel, When opening the file, Then District column appears after Contact Number with correct values

### Permissions

- **AC-SEC-001**: Given user lacks ChurchMembersAdministrator role, When attempting PUT `/api/church-members/{id}/district`, Then return 403 Forbidden
- **AC-SEC-002**: Given user has ChurchMembersViewer role, When viewing member details, Then district information is visible in read-only mode

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service methods, validation logic, DTO mapping
- **Integration Tests**: API endpoints with database, permission enforcement
- **End-to-End Tests**: Playwright tests for drawer interaction, filtering, Excel export

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq, Entity Framework InMemory provider
- **Frontend**: Vitest (unit), Playwright (E2E), React Testing Library

### Test Data Management

- Use Entity Framework migrations for test database setup
- Seed test districts in test fixtures
- Create test members with varied district assignments
- Clean up test data after each test run

### CI/CD Integration

- Run all tests in GitHub Actions pipeline
- Backend tests run on `dotnet test`
- Frontend tests run on `npm run test` and `npm run test:e2e`
- Block PR merge if tests fail

### Coverage Requirements

- Minimum 80% code coverage for new service methods
- 100% coverage for permission authorization logic
- At least one E2E test per acceptance criteria

### Test Examples

```csharp
// Backend Integration Test
[TestMethod]
public async Task AssignDistrict_ValidDistrictId_UpdatesMemberDistrict()
{
    // Arrange
    var member = await CreateTestMember();
    var district = await GetDistrictByName("C");
    var request = new AssignDistrictRequest { DistrictId = district.Id };

    // Act
    var result = await _service.AssignDistrictAsync(member.Id, request, "test-user");

    // Assert
    result.Should().NotBeNull();
    result.DistrictId.Should().Be(district.Id);
    result.DistrictName.Should().Be("C");
}
```

```typescript
// Frontend E2E Test
test('administrator can assign district to member', async ({ page }) => {
  // Arrange
  await loginAsAdministrator(page);
  await page.goto('/church-members');
  
  // Act
  await page.locator('[data-testid="member-row-actions-1"]').click();
  await page.locator('text=Assign District').click();
  await page.locator('[data-testid="district-select"]').selectOption('C');
  await page.locator('text=Save').click();
  
  // Assert
  await expect(page.locator('[data-testid="district-column-1"]')).toHaveText('C');
  await expect(page.locator('text=District assigned successfully')).toBeVisible();
});
```

## 7. Rationale & Context

### Design Decisions

**Why separate drawer instead of edit form?**
- Districts change annually and keeping assignment separate from main member editing reduces clutter
- Allows quick district changes without loading full member editing context
- Follows principle of separation of concerns

**Why nullable DistrictId?**
- New members may not have districts assigned immediately
- Members may be temporarily unassigned during reorganization
- Provides flexibility without requiring a "None" or "Unassigned" district record

**Why fixed district list (A-L)?**
- Districts are organizational constants that rarely if ever change
- Seeding simplifies data management vs. requiring UI for district CRUD
- 12 districts provide sufficient granularity for most church sizes

**Why no bulk assignment?**
- User requirement: Only a few members change districts annually
- Individual assignment sufficient for current use case
- Can be added later if needed without breaking changes

**Why no historical tracking?**
- Current district association is sufficient for present operational needs
- Reduces database complexity and query overhead
- Historical reporting not identified as a requirement

### Business Context

Church districts are used for:
- Pastoral care organization and visitation schedules
- Deacon assignments and member support
- Communication and event coordination within smaller groups
- Annual reorganization as membership changes

## 8. Dependencies & External Integrations

### Infrastructure Dependencies

- **INF-001**: SQL Server database - Required for Districts table and foreign key relationships
- **INF-002**: Entity Framework Core - Required for migrations and ORM functionality

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 runtime - Compatibility with existing backend stack
- **PLT-002**: React 19 - Compatibility with existing frontend components
- **PLT-003**: MUI (Material-UI) v7 - Component library for drawer and select controls
- **PLT-004**: TanStack React Query v5 - State management and cache invalidation for district data

### Authentication & Authorization Dependencies

- **SEC-003**: ASP.NET Core Identity - Role-based authorization for ChurchMembersAdministrator
- **SEC-004**: JWT Bearer authentication - Secure API endpoint access

### Data Dependencies

- **DAT-002**: ChurchMember table - District assignment depends on existing member records
- **DAT-003**: AspNetRoles table - Permission enforcement depends on role definitions

## 9. Examples & Edge Cases

### Edge Case 1: Assigning to Non-Existent District

```typescript
// Request
PUT /api/church-members/123/district
{ "districtId": 999 }

// Response: 400 Bad Request
{
  "message": "Validation failed",
  "errors": ["District with ID 999 does not exist"]
}
```

### Edge Case 2: Unassigning District (Setting to Null)

```typescript
// Request
PUT /api/church-members/123/district
{ "districtId": null }

// Response: 200 OK
{
  "id": 123,
  "firstName": "John",
  "lastName": "Smith",
  "districtId": null,
  "districtName": null
}

// Grid Display: "Unassigned"
// Excel Export: Empty cell
```

### Edge Case 3: Filtering for Unassigned Members

```typescript
// Request
GET /api/church-members?page=1&pageSize=20&districtId=null

// Response
{
  "items": [/* members with districtId = null */],
  "totalCount": 15,
  "currentPage": 1,
  "pageSize": 20
}
```

### Edge Case 4: Member with District Deleted (Should Not Happen)

```sql
-- Attempt to delete district with assigned members
DELETE FROM Districts WHERE Id = 3;

-- Result: Error due to FK constraint (NO ACTION)
-- Msg 547: The DELETE statement conflicted with the REFERENCE constraint
```

### Example: Complete District Assignment Flow

```typescript
// 1. Fetch districts for dropdown
const { data: districts } = useQuery({
  queryKey: ['districts'],
  queryFn: () => districtsApi.getDistricts()
});

// 2. Open assign district drawer
const handleAssignDistrict = (member: ChurchMemberDto) => {
  setSelectedMember(member);
  setDrawerOpen(true);
};

// 3. User selects district and saves
const handleSave = async (districtId: number | null) => {
  await assignDistrictMutation.mutateAsync({
    memberId: selectedMember.id,
    districtId: districtId
  });
  
  // React Query automatically invalidates and refetches
  // Grid updates to show new district
  // Notification: "District assigned successfully"
};
```

## 10. Validation Criteria

### Database Validation

- [ ] Districts table created with correct schema
- [ ] ChurchMember.DistrictId column added with FK constraint
- [ ] 12 districts seeded (A through L)
- [ ] FK constraint prevents invalid district assignments
- [ ] NULL values allowed for DistrictId

### API Validation

- [ ] GET /api/districts returns all 12 districts
- [ ] PUT /api/church-members/{id}/district updates district correctly
- [ ] Invalid district ID returns 400 error
- [ ] District filtering works for specific districts
- [ ] District filtering works for unassigned members (null)
- [ ] District information included in member DTOs

### UI Validation

- [ ] District column appears in grid after Contact Number
- [ ] District column shows name or "Unassigned"
- [ ] "Assign District" appears in action menu for administrators only
- [ ] Drawer opens with current district pre-selected
- [ ] Dropdown includes all 12 districts plus "Unassigned"
- [ ] Save updates district and refreshes grid
- [ ] Cancel closes drawer without changes
- [ ] District filter dropdown works correctly
- [ ] "All" option in filter uses italic styling
- [ ] Excel export includes District column in correct position

### Permission Validation

- [ ] Only ChurchMembersAdministrator can assign districts
- [ ] API returns 403 for unauthorized assignment attempts
- [ ] All roles can view district information
- [ ] UI hides "Assign District" action for non-administrators

### Test Coverage Validation

- [ ] Unit tests cover service methods
- [ ] Integration tests cover API endpoints
- [ ] E2E tests cover drawer interaction
- [ ] E2E tests cover filtering scenarios
- [ ] E2E tests cover Excel export
- [ ] Permission tests cover all role scenarios
- [ ] Minimum 80% code coverage achieved

## 11. Related Specifications / Further Reading

- [Church Members Specification](./church-members-spec.md) - Core member management functionality
- [Training Certificates Specification](./training-module-spec.md) - Reference drawer implementation pattern
- [HSBC Transactions Specification](./hsbc-transactions-spec.md) - Reference Excel export patterns
- [MUI DataGrid Documentation](https://mui.com/x/react-data-grid/) - Grid component reference
- [React Query Documentation](https://tanstack.com/query/latest) - Data fetching and caching patterns
