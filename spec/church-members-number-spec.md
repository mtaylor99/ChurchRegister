---
title: Church Member Annual Number Allocation Process
version: 1.0
date_created: 2026-01-05
last_updated: 2026-01-05
owner: Church Register Development Team
tags: [process, church-members, financial, contributions, data-management]
---

# Introduction

This specification defines the annual church member number allocation process, which assigns sequential membership numbers to active church members based on their membership seniority. These numbers are used for contribution tracking and member identification within each calendar year.

## 1. Purpose & Scope

### Purpose

Define the business rules, data structures, user interface, and workflows for the annual church member number allocation process, ensuring consistent and predictable member numbering across years.

### Scope

- Annual generation of membership numbers for active members
- Mid-year allocation of numbers for newly added members
- Preview and confirmation workflow for annual generation
- Data persistence in ChurchMemberRegisterNumbers table
- Export functionality for generated numbers
- Integration with contribution tracking system

### Intended Audience

- Software developers implementing the feature
- Database administrators managing the schema
- System administrators performing annual number generation
- Financial administrators tracking contributions

### Assumptions

- Church members have a defined status (Active/Inactive)
- Each member has a MemberSince date
- The ChurchMemberRegisterNumbers table exists with appropriate schema
- Users have appropriate role-based permissions

## 2. Definitions

| Term                            | Definition                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Member Number**               | A sequential integer (1, 2, 3...) assigned to an active member for a specific year                      |
| **Active Member**               | A church member with ChurchMemberStatusId = 1 (Active status)                                           |
| **Annual Generation**           | The yearly process of allocating numbers to all active members for the upcoming year                    |
| **Mid-Year Allocation**         | Automatic assignment of next available number when a new active member is added after annual generation |
| **Target Year**                 | The year for which numbers are being generated (always current year + 1)                                |
| **Member Seniority**            | Determined by MemberSince date (earliest = most senior = lowest number)                                 |
| **ChurchMemberRegisterNumbers** | Database table storing the year-specific number assignments                                             |

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

#### Annual Generation Process

- **REQ-001**: The system SHALL only allow generation of member numbers for the next calendar year (current year + 1)
- **REQ-002**: The system SHALL prevent generation if numbers have already been generated for the target year
- **REQ-003**: The system SHALL display a preview grid before generating numbers showing proposed assignments
- **REQ-004**: The system SHALL require explicit confirmation before persisting number assignments
- **REQ-005**: The system SHALL only include Active members (ChurchMemberStatusId = 1) in number generation
- **REQ-006**: The system SHALL assign numbers sequentially starting from 1 based on member seniority
- **REQ-007**: The system SHALL order members by MemberSince ascending, then LastName ascending for tie-breaking
- **REQ-008**: The system SHALL persist generated numbers to ChurchMemberRegisterNumbers table
- **REQ-009**: The system SHALL record who generated the numbers (CreatedBy) and when (CreatedDateTime)
- **REQ-010**: The system SHALL provide export functionality for generated number assignments

#### Preview Grid Requirements

- **REQ-011**: Preview grid SHALL display columns: Member Name, Current Number (Year), New Member Number (Year+1), Member Since
- **REQ-012**: Preview grid SHALL show total count of active members receiving numbers
- **REQ-013**: Preview grid SHALL be sorted by MemberSince ASC, LastName ASC (not user-sortable)
- **REQ-014**: Preview grid SHALL fetch real-time data from database on each preview request
- **REQ-015**: Preview grid SHALL display current year numbers if they exist, blank if member has no current year number

#### Mid-Year Allocation Requirements

- **REQ-016**: When a new Active member is added after annual generation, system SHALL automatically assign the next available number for the current year
- **REQ-017**: Next available number SHALL be calculated as MAX(Number) + 1 for the current year
- **REQ-018**: Mid-year allocation SHALL occur immediately upon member creation with Active status
- **REQ-019**: Mid-year allocation SHALL follow same CreatedBy/CreatedDateTime audit pattern

#### Contribution Integration Requirements

- **REQ-020**: Contributions SHALL always be recorded against ChurchMembers.Id (not the member number)
- **REQ-021**: System SHALL lookup member number for display/reporting purposes only
- **REQ-022**: Member number changes between years SHALL NOT affect historical contribution data

### Business Rules

- **BUS-001**: Each member can have only one number per year
- **BUS-002**: Each number can be assigned to only one member per year
- **BUS-003**: Numbers are year-specific; a member's number may change between years
- **BUS-004**: Inactive members do not receive numbers in annual generation
- **BUS-005**: When a member becomes inactive, their number becomes available for reassignment in the next year
- **BUS-006**: Numbers are always sequential starting from 1 with no gaps
- **BUS-007**: Member seniority (MemberSince date) is the primary factor in number assignment
- **BUS-008**: Surname is the secondary factor when MemberSince dates are equal

### Security Requirements

- **SEC-001**: Only users with SystemAdministration or FinancialAdministrator roles SHALL access annual generation
- **SEC-002**: All generation events SHALL be audited (who, when)
- **SEC-003**: Preview data SHALL respect user permissions and role-based access

### Data Constraints

- **CON-001**: ChurchMemberRegisterNumbers.Year SHALL be a 4-digit integer (e.g., 2026, 2027)
- **CON-002**: ChurchMemberRegisterNumbers.Number SHALL be stored as string to support future formats
- **CON-003**: ChurchMemberRegisterNumbers.ChurchMemberId SHALL be a foreign key to ChurchMembers.Id
- **CON-004**: Unique constraint on (Year, Number) - no duplicate numbers per year
- **CON-005**: Unique constraint on (Year, ChurchMemberId) - one number per member per year
- **CON-006**: Cannot generate numbers for years more than 1 year in the future
- **CON-007**: Cannot regenerate numbers for a year once generated

### UI/UX Guidelines

- **GUI-001**: Display clear warning that generation is permanent and cannot be undone
- **GUI-002**: Show preview before confirmation with prominent action buttons
- **GUI-003**: Display loading indicators during preview and generation operations
- **GUI-004**: Show success message with count of members assigned after generation
- **GUI-005**: Display appropriate error messages for validation failures
- **GUI-006**: Disable generation button if already generated for target year
- **GUI-007**: Export button should generate CSV with standard date/time filename

### Performance Guidelines

- **PER-001**: Preview generation should complete within 2 seconds for up to 1000 members
- **PER-002**: Actual number generation should complete within 5 seconds for up to 1000 members
- **PER-003**: Mid-year allocation should complete synchronously within 500ms

## 4. Interfaces & Data Contracts

### Database Schema

#### ChurchMemberRegisterNumbers Table

```sql
CREATE TABLE ChurchMemberRegisterNumbers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ChurchMemberId INT NOT NULL,
    Number VARCHAR(10) NOT NULL,  -- String to support future formats
    Year INT NOT NULL,
    CreatedBy VARCHAR(450) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    CONSTRAINT FK_ChurchMemberRegisterNumbers_ChurchMembers
        FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMembers(Id),
    CONSTRAINT UQ_ChurchMemberRegisterNumbers_Year_Number
        UNIQUE (Year, Number),
    CONSTRAINT UQ_ChurchMemberRegisterNumbers_Year_Member
        UNIQUE (Year, ChurchMemberId)
);

CREATE INDEX IX_ChurchMemberRegisterNumbers_Year
    ON ChurchMemberRegisterNumbers(Year);
CREATE INDEX IX_ChurchMemberRegisterNumbers_ChurchMemberId
    ON ChurchMemberRegisterNumbers(ChurchMemberId);
```

### API Endpoints

#### Preview Register Numbers

```typescript
GET /api/register-numbers/preview/{year}

Response 200:
{
  "year": 2027,
  "totalActiveMembers": 45,
  "previewGenerated": "2026-01-05T10:30:00Z",
  "assignments": [
    {
      "memberId": 123,
      "memberName": "John Smith",
      "memberSince": "2015-06-01",
      "currentNumber": 5,      // For current year (2026), null if doesn't exist
      "newNumber": 1            // For target year (2027)
    },
    // ... more assignments
  ]
}

Response 400: { "message": "Cannot preview for year 2028. Only year 2027 is valid." }
Response 409: { "message": "Numbers already generated for year 2027" }
```

#### Generate Register Numbers

```typescript
POST /api/register-numbers/generate

Request:
{
  "targetYear": 2027,
  "confirmGeneration": true
}

Response 200:
{
  "year": 2027,
  "totalMembersAssigned": 45,
  "generatedDateTime": "2026-01-05T10:35:00Z",
  "generatedBy": "john.admin@church.com",
  "preview": [
    // First 10 assignments for confirmation display
  ]
}

Response 400: { "message": "Invalid target year. Can only generate for 2027." }
Response 409: { "message": "Numbers already generated for year 2027" }
Response 403: { "message": "Insufficient permissions" }
```

#### Check Generation Status

```typescript
GET /api/register-numbers/status/{year}

Response 200:
{
  "year": 2027,
  "isGenerated": false,
  "totalAssignments": 0,
  "generatedBy": null,
  "generatedDateTime": null
}
```

#### Get Next Available Number (Internal Use)

```typescript
GET /api/register-numbers/next-available/{year}

Response 200:
{
  "year": 2026,
  "nextNumber": 46
}
```

### Frontend Component Interface

#### GenerateRegisterNumbers Component

```typescript
interface GenerateRegisterNumbersProps {
  onGenerationSuccess?: () => void;
}

interface PreviewAssignment {
  memberId: number;
  memberName: string;
  memberSince: string;
  currentNumber: number | null; // Current year number
  newNumber: number; // Next year number
}

interface PreviewData {
  year: number;
  totalActiveMembers: number;
  previewGenerated: string;
  assignments: PreviewAssignment[];
}
```

## 5. Acceptance Criteria

### Annual Generation Workflow

- **AC-001**: Given it is year 2026 and no numbers exist for 2027, When user opens Generate New Membership Numbers, Then system displays option to generate for 2027
- **AC-002**: Given it is year 2026 and numbers already exist for 2027, When user opens Generate New Membership Numbers, Then system displays "Already Generated" message and disables generation button
- **AC-003**: Given user clicks Preview button, When preview loads, Then system displays grid with all active members sorted by MemberSince ASC, LastName ASC
- **AC-004**: Given preview is displayed, When user reviews assignments, Then grid shows Member Name, Current Number (2026), New Member Number (2027), Member Since columns
- **AC-005**: Given preview shows N active members, When user clicks "Generate for 2027", Then confirmation modal appears warning action is permanent
- **AC-006**: Given user confirms generation, When generation completes, Then system creates N records in ChurchMemberRegisterNumbers with Year=2027
- **AC-007**: Given generation is successful, When user views result, Then success message shows "Successfully generated N membership numbers for 2027"
- **AC-008**: Given numbers are generated, When user clicks Export, Then CSV file downloads with format "register-numbers-2027-YYYYMMDD-HHMMSS.csv"

### Number Assignment Rules

- **AC-009**: Given Member A joined 2015-01-01 and Member B joined 2020-01-01, When generating 2027 numbers, Then Member A receives number 1 and Member B receives a higher number
- **AC-010**: Given Member A and Member B both joined 2015-01-01, and Member A surname is "Adams" and Member B is "Brown", When generating numbers, Then Member A receives lower number than Member B
- **AC-011**: Given there are 3 active members, When generating numbers, Then numbers assigned are 1, 2, 3 (sequential with no gaps)
- **AC-012**: Given Member X had number 5 in 2026 but is now Inactive, When generating 2027 numbers, Then Member X is excluded and their number is available for reassignment
- **AC-013**: Given Member Y is Active, When generating 2027 numbers, Then Member Y receives exactly one number for 2027

### Mid-Year Allocation

- **AC-014**: Given it is June 2026 and 2026 numbers were generated in January, When new Active member is added, Then member receives next available number (max + 1) for 2026 automatically
- **AC-015**: Given it is June 2026 and highest number is 50, When new Active member is added, Then member receives number 51 for 2026
- **AC-016**: Given new member is added as Inactive, When creation completes, Then no number is assigned for current year

### Validation & Error Handling

- **AC-017**: Given user attempts to generate for 2028 in 2026, When request is submitted, Then system returns error "Cannot generate for year 2028. Only year 2027 is valid."
- **AC-018**: Given numbers already exist for 2027, When user attempts to generate again, Then system prevents generation and shows error
- **AC-019**: Given user without SystemAdministration or FinancialAdministrator role, When accessing generation feature, Then system denies access
- **AC-020**: Given preview request fails due to database error, When error occurs, Then user sees error message and retry option

### Data Integrity

- **AC-021**: Given numbers are generated for 2027, When querying database, Then each member has exactly one record for year 2027
- **AC-022**: Given numbers are generated for 2027, When querying database, Then each number 1 to N appears exactly once for year 2027
- **AC-023**: Given contribution is recorded, When querying contribution data, Then contribution is linked to ChurchMembers.Id not member number
- **AC-024**: Given member number changes from 5 (2026) to 3 (2027), When viewing 2026 contributions, Then contributions still correctly display member's 2026 data

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Business logic for number assignment, sorting, validation
- **Integration Tests**: Database operations, API endpoints, number allocation service
- **End-to-End Tests**: Complete workflow from preview to generation to export

### Test Frameworks

- Backend: MSTest, FluentAssertions, Moq
- Frontend: Vitest, React Testing Library
- E2E: Playwright

### Test Scenarios

#### Unit Tests

```csharp
[TestClass]
public class RegisterNumberAllocationTests
{
    [TestMethod]
    public void AssignNumbers_WithActiveMembersSortedByMemberSince_AssignsSequentialNumbers()

    [TestMethod]
    public void AssignNumbers_WithSameMemberSinceDate_SortsByLastName()

    [TestMethod]
    public void AssignNumbers_ExcludesInactiveMembers()

    [TestMethod]
    public void ValidateTargetYear_CurrentYearPlus1_ReturnsTrue()

    [TestMethod]
    public void ValidateTargetYear_CurrentYearPlus2_ReturnsFalse()

    [TestMethod]
    public void GetNextAvailableNumber_WithExistingNumbers_ReturnsMaxPlusOne()
}
```

#### Integration Tests

```csharp
[TestClass]
public class RegisterNumberIntegrationTests
{
    [TestMethod]
    public async Task GenerateForYear_FirstTime_CreatesRecordsSuccessfully()

    [TestMethod]
    public async Task GenerateForYear_AlreadyGenerated_ThrowsException()

    [TestMethod]
    public async Task PreviewForYear_WithActiveMembers_ReturnsCorrectAssignments()

    [TestMethod]
    public async Task CreateActiveMember_AfterGeneration_AssignsNextNumber()
}
```

### Test Data Management

- Use in-memory database for unit tests
- Use test database with known seed data for integration tests
- Clean up test data after each test run
- Maintain test fixtures for various member scenarios

### CI/CD Integration

- All tests run on pull request
- Integration tests run on main branch commits
- E2E tests run nightly
- Test results published to GitHub Actions

### Coverage Requirements

- Minimum 80% code coverage for business logic
- 100% coverage for number assignment algorithm
- Critical paths must have integration test coverage

## 7. Rationale & Context

### Design Decisions

#### Why Sequential Numbers Starting from 1?

Sequential numbering provides simplicity, predictability, and clear visual identification of membership size. Starting from 1 each year ensures consistency and makes it easy to identify the most senior members.

#### Why Year-Specific Numbers?

Membership changes year-over-year due to status changes, new members, and member departures. Year-specific numbers ensure accurate tracking while maintaining historical integrity. This approach also prevents confusion when a member's position in the hierarchy changes.

#### Why Store Number as String?

While current implementation uses integers, storing as string provides flexibility for future enhancements such as prefixes (e.g., "2027-001") or special numbering schemes without schema changes.

#### Why Prevent Regeneration?

Once numbers are generated and potentially used in contributions or reports, regeneration would cause data inconsistency and confusion. The one-time generation enforces data integrity and prevents accidental overwrites.

#### Why Link Contributions to ChurchMembers.Id?

Member numbers change between years, but contributions must remain permanently linked to the correct member. Using the immutable ChurchMembers.Id ensures data integrity across all years.

#### Why Automatic Mid-Year Allocation?

New members joining mid-year need immediate number assignment for contribution tracking. Waiting until next year's generation would create operational gaps and tracking issues.

#### Why Preview Before Generation?

The preview provides transparency, allows verification of the assignment logic, and gives administrators confidence before committing to permanent changes.

### Historical Context

The previous implementation had a flaw where target year was always set to current year + 1, which prevented generation when the database only had prior year data. This specification addresses that by allowing generation for current year if not yet generated.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Authentication System - Required for user identity and role verification

### Database Dependencies

- **DAT-001**: ChurchMembers table - Source of member data including status and MemberSince date
- **DAT-002**: ChurchMemberStatuses table - Defines Active status (StatusId = 1)
- **DAT-003**: AspNetUsers table - User information for CreatedBy audit trail

### Infrastructure Dependencies

- **INF-001**: Database Management System - SQL Server or compatible RDBMS with support for unique constraints and transactions
- **INF-002**: Web Server - ASP.NET Core hosting environment
- **INF-003**: Client Browser - Modern browser supporting ES2020+ JavaScript

### Technology Platform Dependencies

- **PLT-001**: .NET 8.0+ - Backend runtime environment
- **PLT-002**: React 18+ - Frontend framework
- **PLT-003**: Entity Framework Core 8+ - ORM for database operations

### Compliance Dependencies

- **COM-001**: Data Retention - Generated numbers must be retained for audit purposes for minimum 7 years
- **COM-002**: Access Control - Must comply with RBAC policies for sensitive financial operations

## 9. Examples & Edge Cases

### Example 1: Standard Annual Generation (2026 to 2027)

**Scenario**: It's January 2026, and we need to generate 2027 numbers.

**Active Members** (sorted by MemberSince ASC, LastName ASC):
| Name | MemberSince | 2026 Number | 2027 Number |
|------|-------------|-------------|-------------|
| Alice Adams | 2010-03-15 | 1 | 1 |
| Bob Brown | 2010-03-15 | 2 | 2 |
| Charlie Chen | 2015-06-01 | 3 | 3 |
| Diana Davis | 2020-01-10 | 4 | 4 |

**Result**: All active members retain sequential numbers based on seniority.

### Example 2: Member Status Change

**Scenario**: Bob Brown becomes Inactive before generating 2027 numbers.

**Active Members for 2027**:
| Name | MemberSince | 2026 Number | 2027 Number |
|------|-------------|-------------|-------------|
| Alice Adams | 2010-03-15 | 1 | 1 |
| Charlie Chen | 2015-06-01 | 3 | 2 |
| Diana Davis | 2020-01-10 | 4 | 3 |

**Result**: Bob is excluded, and everyone after him shifts up one number. Bob's 2026 contributions remain linked to his ChurchMembers.Id.

### Example 3: New Member Added Mid-Year

**Scenario**: It's June 2026, numbers already generated. Emma Evans joins as Active member.

**Current State** (2026):

- Highest number: 4 (Diana Davis)

**Action**: Create new Active member Emma Evans (MemberSince: 2026-06-15)

**Result**:

- Emma automatically receives number 5 for 2026
- When 2027 generation runs, Emma's position is determined by her MemberSince date
- Emma might receive different number in 2027 based on seniority compared to other members

### Example 4: Same Join Date - Surname Tie-Breaker

**Scenario**: Three members joined on same date.

**Members**:
| Name | MemberSince | Surname | Number |
|------|-------------|---------|--------|
| Frank Fisher | 2020-01-01 | Fisher | 1 |
| George Graham | 2020-01-01 | Graham | 2 |
| Helen Harris | 2020-01-01 | Harris | 3 |

**Result**: Sorted alphabetically by surname when MemberSince dates match.

### Example 5: Edge Case - All Members Inactive

**Scenario**: Attempting to generate when all members are Inactive.

**Action**: Request generation for 2027

**Result**:

- System returns error: "No active members to assign register numbers"
- No records created in ChurchMemberRegisterNumbers
- User receives clear error message

### Example 6: Attempting Early Generation

**Scenario**: It's January 2026, user attempts to generate 2028 numbers.

**Action**: Request generation for 2028

**Result**:

- System validation fails
- Error message: "Cannot generate for year 2028. Only year 2027 is valid."
- No database changes occur

### Example 7: Attempting Regeneration

**Scenario**: Numbers already exist for 2027, user attempts to generate again.

**Action**: Request generation for 2027

**Result**:

- System checks existing records
- Returns 409 Conflict status
- Error message: "Register numbers for year 2027 have already been generated"
- UI shows "Already Generated" state
- Export functionality available for existing data

### Code Example: Number Assignment Algorithm

```csharp
public async Task<List<RegisterNumberAssignment>> AssignNumbersAsync(int targetYear)
{
    // Fetch active members ordered by seniority
    var activeMembers = await _context.ChurchMembers
        .Where(m => m.ChurchMemberStatusId == 1) // Active status
        .OrderBy(m => m.MemberSince)
        .ThenBy(m => m.LastName)
        .ToListAsync();

    // Assign sequential numbers starting from 1
    var assignments = activeMembers
        .Select((member, index) => new RegisterNumberAssignment
        {
            ChurchMemberId = member.Id,
            MemberName = $"{member.FirstName} {member.LastName}",
            MemberSince = member.MemberSince ?? DateTime.UtcNow,
            Number = index + 1,
            Year = targetYear
        })
        .ToList();

    return assignments;
}
```

### Code Example: Preview Grid Data

```typescript
// Frontend preview data structure
const previewData = {
  year: 2027,
  totalActiveMembers: 45,
  previewGenerated: "2026-01-05T10:30:00Z",
  assignments: [
    {
      memberId: 123,
      memberName: "Alice Adams",
      memberSince: "2010-03-15",
      currentNumber: 1, // 2026 number
      newNumber: 1, // 2027 number
    },
    {
      memberId: 125,
      memberName: "Charlie Chen",
      memberSince: "2015-06-01",
      currentNumber: 3, // 2026 number
      newNumber: 2, // 2027 number (Bob became inactive)
    },
    // ... more assignments
  ],
};
```

## 10. Validation Criteria

### Pre-Generation Validation

- [ ] Target year is exactly current year + 1
- [ ] No existing records in ChurchMemberRegisterNumbers for target year
- [ ] User has SystemAdministration or FinancialAdministrator role
- [ ] At least one Active member exists in the system

### Data Validation

- [ ] All active members have non-null MemberSince dates
- [ ] No duplicate ChurchMember.Id values in active members query
- [ ] All assigned numbers are sequential from 1 to N with no gaps
- [ ] Each number 1 to N is assigned exactly once
- [ ] Each member receives exactly one number

### Post-Generation Validation

- [ ] Count of records in ChurchMemberRegisterNumbers for target year equals count of active members
- [ ] All CreatedBy and CreatedDateTime fields are populated
- [ ] Unique constraints on (Year, Number) and (Year, ChurchMemberId) are enforced
- [ ] Foreign key relationships to ChurchMembers.Id are valid
- [ ] Generation audit log entry created

### UI Validation

- [ ] Preview grid displays correct current and new numbers
- [ ] Total active members count matches database query
- [ ] Export file contains all generated assignments
- [ ] Success message displays correct count and year
- [ ] Error messages are clear and actionable
- [ ] Already-generated state is correctly identified and displayed

## 11. Related Specifications / Further Reading

### Internal Documentation

- [Church Members Specification](church-members-spec.md) - Core member management
- [Member Contributions Specification](member-contributions-spec.md) - Contribution tracking and reporting
- [Envelope Contribution Specification](envelope-contribution-spec.md) - Envelope-based contributions

### External References

- [SQL Server Unique Constraints Documentation](https://learn.microsoft.com/en-us/sql/relational-databases/tables/unique-constraints-and-check-constraints)
- [Entity Framework Core Concurrency Tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)
- [React Data Grid Best Practices](https://react.dev/learn/rendering-lists)
