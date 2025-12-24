---
title: Envelope Contribution System - Weekly Cash Contribution Entry and Member Register Number Management
version: 1.0
date_created: 2024-12-24
last_updated: 2024-12-24
owner: Church Register Development Team
tags:
  [
    financial,
    data-processing,
    church-members,
    contributions,
    envelope-system,
    cash-contributions,
  ]
---

# Introduction

This specification defines the envelope contribution system for recording weekly cash donations from church members. Each active member is assigned a sequential register number at the start of each year. Members submit cash contributions in envelopes marked with their register number. The system provides a streamlined UI for batch entry of multiple envelopes collected on a given Sunday, automatic processing into member contribution records, and an annual process for generating new register numbers.

## 1. Purpose & Scope

This specification covers:

- Annual generation of sequential register numbers for active church members
- Batch entry interface for recording envelope contributions collected on Sundays
- Validation and processing of envelope contributions into ChurchMemberContributions table
- Duplicate batch prevention mechanisms
- Dashboard controls for initiating annual register number generation
- Integration with existing contribution tracking and reporting systems

**Intended Audience**: Backend developers, database administrators, frontend developers, QA engineers, and system architects.

**Assumptions**:

- ChurchMembers table exists with MemberSince and ChurchMemberStatusId fields
- ChurchMemberContributions table exists for tracking all contribution types
- ContributionTypes lookup table exists with ContributionTypeId=1 for Cash
- Users have appropriate permissions for financial data entry
- Current year contribution totals are already displayed in Church Members grid

## 2. Definitions

- **Envelope Contribution**: Cash donation submitted by a member in an envelope marked with their register number
- **Register Number**: Sequential number (1, 2, 3, 4...) assigned to each active member for a specific calendar year
- **Active Member**: Church member with ChurchMemberStatusId = 1 (Active status)
- **Envelope Batch**: Collection of envelope contributions submitted for a specific Sunday
- **Collection Date**: The Sunday on which physical envelopes were collected during church service
- **Batch Submission**: The act of entering and saving all envelope contributions for a given Sunday
- **Calendar Year**: January 1st to December 31st of a specific year
- **Register Number Generation**: Annual process of assigning sequential numbers to all active members for the upcoming year
- **FinancialViewer**: User role with read-only access to view envelope contributions, batch history, and financial reports
- **FinancialContributor**: User role with permission to enter and submit envelope contribution batches for Sundays
- **FinancialAdministrator**: User role with full financial permissions including batch entry and annual register number generation
- **SystemAdministrator**: User role with complete system access and all permissions

## 3. Requirements, Constraints & Guidelines

### Register Number Management

- **REQ-001**: System MUST generate sequential register numbers (1, 2, 3, 4...) for all active church members
- **REQ-002**: Register numbers MUST be integers with no prefix, starting from 1
- **REQ-003**: Register number generation MUST be triggered manually via a "Generate Register Numbers" button on the admin dashboard
- **REQ-004**: System MUST generate register numbers for the next calendar year (e.g., generate 2026 numbers in December 2025)
- **REQ-005**: Generated register numbers MUST be stored in ChurchMemberRegisterNumbers table with the target year
- **REQ-006**: Register number assignment MUST be based on active members ordered by MemberSince date (ascending - earliest members get lowest numbers)
- **REQ-007**: Only members with ChurchMemberStatusId = 1 (Active) MUST receive register numbers
- **REQ-008**: System MUST prevent register number generation process from running more than once per year
- **REQ-009**: System MUST display confirmation dialog before generating numbers, showing:
  - Target year
  - Count of active members who will receive numbers
  - Warning that this action cannot be undone
- **REQ-010**: Active year determination MUST be based on current calendar year (no IsActive flag needed)
- **REQ-011**: Previous years' register numbers remain in database but are not used for current year validation

### Register Number Generation Process

- **REQ-012**: Generation process MUST:
  1. Query all active members (ChurchMemberStatusId = 1)
  2. Order by MemberSince ASC
  3. Assign sequential numbers starting from 1
  4. Insert records into ChurchMemberRegisterNumbers with Year = [Next Year]
  5. Store audit information (CreatedBy, CreatedDateTime)
- **REQ-013**: If member status changes after number assignment, number remains assigned but member cannot submit envelopes
- **REQ-014**: System MUST provide a preview/export of assigned numbers for printing member cards

### Envelope Contribution Batch Entry

- **REQ-015**: System MUST provide a dedicated UI for entering envelope contributions
- **REQ-016**: Batch entry form MUST require selection of Collection Date (Sunday only)
- **REQ-017**: Collection Date MUST be restricted to Sundays only (day of week validation)
- **REQ-018**: System MUST prevent creation of duplicate batches for the same Sunday
- **REQ-019**: Batch entry UI MUST display a grid/table with two columns:
  - Member Register Number (numeric input)
  - Amount (currency input, decimal 18,2)
- **REQ-020**: UI MUST support rapid data entry:
  - Tab navigation between fields
  - Auto-focus to next row after amount entry
  - Quick add new row functionality
- **REQ-021**: UI MUST display running total of all amounts entered
- **REQ-022**: UI MUST display count of envelopes entered
- **REQ-023**: System MUST validate member register numbers in real-time against current year's ChurchMemberRegisterNumbers
- **REQ-024**: Invalid register numbers MUST be highlighted in red text within the form with specific error message (e.g., "Invalid number" or "Member not active")
- **REQ-025**: System MUST display member name next to valid register number for verification
- **REQ-026**: Amounts MUST be validated as positive decimal values
- **REQ-027**: System MUST prevent batch submission when any validation errors exist (invalid numbers shown in red)

### Envelope Contribution Batch Processing

- **REQ-028**: On batch submission, system MUST create a record in EnvelopeContributionBatch table with:
  - BatchDate (Collection Date - Sunday)
  - TotalAmount (sum of all envelope amounts)
  - EnvelopeCount (count of valid envelopes)
  - Status ('Submitted')
  - Audit fields (CreatedBy, CreatedDateTime)
- **REQ-029**: System MUST insert individual records into ChurchMemberContributions for each envelope with:
  - ChurchMemberId (looked up via register number for current year)
  - Amount (from envelope entry)
  - Date (BatchDate from EnvelopeContributionBatch)
  - TransactionRef (format: "ENV-[BatchId]-[RegisterNumber]")
  - Description (format: "Envelope contribution - Sunday [Date]")
  - ContributionTypeId = 1 (Cash)
  - EnvelopeContributionBatchId (foreign key to batch)
  - Audit fields
- **REQ-030**: All batch inserts MUST be executed within a database transaction
- **REQ-031**: If any insert fails, entire batch MUST be rolled back
- **REQ-032**: On successful submission, system MUST display confirmation with:
  - Batch reference number
  - Total amount processed
  - Number of envelopes processed

### Duplicate Prevention & Batch Management

- **REQ-033**: System MUST enforce unique constraint on EnvelopeContributionBatch.BatchDate
- **REQ-034**: System MUST check for existing batch before allowing entry for a given Sunday
- **REQ-035**: If batch exists for selected Sunday, system MUST display error: "Contributions for [Date] have already been submitted"
- **REQ-036**: System MUST provide batch history view showing:
  - Batch date
  - Total amount
  - Envelope count
  - Submitted by
  - Submitted date/time
- **REQ-037**: Batch records MUST be immutable after submission (no editing or deletion allowed - history is retained)
- **REQ-038**: System MAY provide "View Batch Details" to display individual envelope entries in read-only mode

### Integration with Existing Features

- **REQ-039**: Envelope contributions MUST be included in member's ThisYearsContribution total on Church Members grid
- **REQ-040**: Envelope contributions MUST appear in member's contribution history view
- **REQ-041**: Contribution history MUST display envelope contributions with "Cash" as contribution type
- **REQ-042**: System MUST support Gift Aid calculation for cash contributions where member is GiftAidEligible

### Data Validation Rules

- **REQ-043**: Register number MUST exist in ChurchMemberRegisterNumbers for current year
- **REQ-044**: Collection Date MUST be a Sunday
- **REQ-045**: Collection Date MUST not be in the future
- **REQ-046**: Collection Date SHOULD be within last 30 days (warning if older, but allow override)
- **REQ-047**: Amount MUST be greater than 0
- **REQ-048**: Amount MUST not exceed £10,000 per envelope (configurable limit)
- **REQ-049**: Member MUST be Active (ChurchMemberStatusId = 1) at time of batch submission
- **REQ-050**: System MUST display validation errors in red text color within the form for immediate visibility

### Permission & Security Requirements

- **SEC-001**: Only users with "FinancialContributor" or "FinancialAdministrator" or "SystemAdministrator" roles MAY enter envelope contributions
- **SEC-002**: Only users with "FinancialAdministrator" or "SystemAdministrator" roles MAY generate register numbers
- **SEC-003**: Users with "FinancialViewer" role MAY view envelope batches and history (read-only access)
- **SEC-004**: All batch submissions MUST log user identity in audit fields
- **SEC-005**: Register number generation MUST log admin user identity
- **SEC-006**: Batch data MUST be transmitted over HTTPS only

### Performance Constraints

- **CON-001**: Batch submission MUST complete within 5 seconds for batches up to 100 envelopes
- **CON-002**: Register number generation MUST complete within 10 seconds for up to 500 members
- **CON-003**: Real-time member number validation MUST respond within 500ms

### User Experience Guidelines

- **GUD-001**: UI SHOULD auto-save draft entries locally to prevent data loss
- **GUD-002**: UI SHOULD provide keyboard shortcuts for common actions
- **GUD-003**: Error messages SHOULD be specific and actionable
- **GUD-004**: Success confirmations SHOULD include printable receipt option
- **GUD-005**: Mobile/tablet UI SHOULD support landscape orientation for easier entry

## 4. Interfaces & Data Contracts

### Database Schema

#### EnvelopeContributionBatch Table (NEW)

```sql
CREATE TABLE EnvelopeContributionBatch (
    Id INT PRIMARY KEY IDENTITY(1,1),
    BatchDate DATE NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    EnvelopeCount INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Submitted',
    CreatedBy VARCHAR(255) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy VARCHAR(255) NULL,
    ModifiedDateTime DATETIME2 NULL,

    CONSTRAINT UQ_EnvelopeContributionBatch_BatchDate UNIQUE (BatchDate),
    CONSTRAINT CK_EnvelopeContributionBatch_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CK_EnvelopeContributionBatch_EnvelopeCount CHECK (EnvelopeCount > 0)
);

CREATE INDEX IX_EnvelopeContributionBatch_BatchDate
    ON EnvelopeContributionBatch(BatchDate DESC);
```

#### ChurchMemberRegisterNumbers Table (EXISTING - Reference)

```sql
-- Already exists - no changes needed
CREATE TABLE ChurchMemberRegisterNumbers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ChurchMemberId INT NOT NULL,
    Number VARCHAR(20) NULL,  -- Will store "1", "2", "3", etc.
    Year INT NULL,            -- e.g., 2026, 2027
    CreatedBy VARCHAR(255) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy VARCHAR(255) NULL,
    ModifiedDateTime DATETIME2 NULL,

    CONSTRAINT FK_ChurchMemberRegisterNumbers_ChurchMembers
        FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMembers(Id)
);

CREATE INDEX IX_ChurchMemberRegisterNumbers_Year_Number
    ON ChurchMemberRegisterNumbers(Year, Number);
```

#### ChurchMemberContributions Table (EXISTING - Add Column)

```sql
-- Add new column to existing table
ALTER TABLE ChurchMemberContributions
    ADD EnvelopeContributionBatchId INT NULL;

ALTER TABLE ChurchMemberContributions
    ADD CONSTRAINT FK_ChurchMemberContributions_EnvelopeContributionBatch
        FOREIGN KEY (EnvelopeContributionBatchId)
        REFERENCES EnvelopeContributionBatch(Id);

CREATE INDEX IX_ChurchMemberContributions_EnvelopeContributionBatchId
    ON ChurchMemberContributions(EnvelopeContributionBatchId);
```

### API Endpoints

#### POST /api/financial/envelope-contributions/batches

**Purpose**: Submit a new envelope contribution batch

**Request Body**:

```json
{
  "collectionDate": "2025-12-21",
  "envelopes": [
    {
      "registerNumber": 45,
      "amount": 20.0
    },
    {
      "registerNumber": 23,
      "amount": 15.5
    }
  ]
}
```

**Response (Success - 201 Created)**:

```json
{
  "batchId": 123,
  "batchDate": "2025-12-21",
  "totalAmount": 35.5,
  "envelopeCount": 2,
  "processedContributions": [
    {
      "registerNumber": 45,
      "memberName": "John Smith",
      "amount": 20.0,
      "contributionId": 5001
    },
    {
      "registerNumber": 23,
      "memberName": "Mary Johnson",
      "amount": 15.5,
      "contributionId": 5002
    }
  ]
}
```

**Response (Validation Error - 400 Bad Request)**:

```json
{
  "error": "ValidationError",
  "message": "Invalid envelope entries",
  "validationErrors": [
    {
      "registerNumber": 99,
      "error": "Register number not found for current year"
    },
    {
      "registerNumber": 23,
      "error": "Member is not active"
    }
  ]
}
```

**Response (Duplicate - 409 Conflict)**:

```json
{
  "error": "DuplicateBatch",
  "message": "Contributions for Sunday, December 21, 2025 have already been submitted",
  "existingBatchId": 122
}
```

#### GET /api/financial/envelope-contributions/batches

**Purpose**: Retrieve list of envelope contribution batches

**Query Parameters**:

- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `pageNumber` (default: 1)
- `pageSize` (default: 50)

**Response (200 OK)**:

```json
{
  "batches": [
    {
      "batchId": 123,
      "batchDate": "2025-12-21",
      "totalAmount": 1250.0,
      "envelopeCount": 48,
      "submittedBy": "admin@church.org",
      "submittedDateTime": "2025-12-21T14:30:00Z"
    }
  ],
  "totalCount": 52,
  "pageNumber": 1,
  "pageSize": 50
}
```

#### GET /api/financial/envelope-contributions/batches/{batchId}

**Purpose**: Retrieve detailed batch information including individual envelopes

**Response (200 OK)**:

```json
{
  "batchId": 123,
  "batchDate": "2025-12-21",
  "totalAmount": 1250.0,
  "envelopeCount": 48,
  "status": "Submitted",
  "submittedBy": "admin@church.org",
  "submittedDateTime": "2025-12-21T14:30:00Z",
  "envelopes": [
    {
      "contributionId": 5001,
      "registerNumber": 45,
      "memberId": 102,
      "memberName": "John Smith",
      "amount": 20.0
    }
  ]
}
```

#### POST /api/administration/church-members/generate-register-numbers

**Purpose**: Generate register numbers for next year's active members

**Request Body**:

```json
{
  "targetYear": 2026,
  "confirmGeneration": true
}
```

**Response (Success - 200 OK)**:

```json
{
  "year": 2026,
  "totalMembersAssigned": 156,
  "generatedDateTime": "2025-12-24T10:00:00Z",
  "generatedBy": "admin@church.org",
  "preview": [
    {
      "registerNumber": 1,
      "memberId": 45,
      "memberName": "Albert Jones",
      "memberSince": "1995-03-15"
    },
    {
      "registerNumber": 2,
      "memberId": 67,
      "memberName": "Betty Smith",
      "memberSince": "1998-06-20"
    }
  ]
}
```

**Response (Already Generated - 409 Conflict)**:

```json
{
  "error": "AlreadyGenerated",
  "message": "Register numbers for year 2026 have already been generated",
  "generatedDate": "2025-12-15T09:30:00Z",
  "generatedBy": "admin@church.org"
}
```

#### GET /api/administration/church-members/register-numbers/preview/{year}

**Purpose**: Preview register number assignments without generating

**Response (200 OK)**:

```json
{
  "year": 2026,
  "totalActiveMembers": 156,
  "previewGenerated": "2025-12-24T10:00:00Z",
  "assignments": [
    {
      "registerNumber": 1,
      "memberId": 45,
      "memberName": "Albert Jones",
      "memberSince": "1995-03-15"
    }
  ]
}
```

#### GET /api/financial/envelope-contributions/validate-register-number/{number}/{year}

**Purpose**: Validate a register number and return member information

**Response (200 OK)**:

```json
{
  "valid": true,
  "registerNumber": 45,
  "year": 2025,
  "memberId": 102,
  "memberName": "John Smith",
  "isActive": true
}
```

**Response (Invalid - 404 Not Found)**:

```json
{
  "valid": false,
  "registerNumber": 99,
  "year": 2025,
  "error": "Register number not found for current year"
}
```

## 5. Acceptance Criteria

- **AC-001**: Given I am an admin user, When I click "Generate Register Numbers" on the dashboard for year 2026, Then the system assigns sequential numbers (1, 2, 3...) to all active members ordered by MemberSince ascending
- **AC-002**: Given register numbers have been generated for 2026, When I attempt to generate them again for 2026, Then the system prevents generation and displays an error message
- **AC-003**: Given I am on the envelope contribution entry page, When I select a collection date that is not a Sunday, Then the system displays a validation error
- **AC-004**: Given I have entered valid register numbers and amounts, When I submit the batch, Then the system creates one EnvelopeContributionBatch record and multiple ChurchMemberContributions records
- **AC-005**: Given a batch has already been submitted for Sunday December 21, 2025, When I attempt to create another batch for the same date, Then the system prevents submission with a duplicate error
- **AC-006**: Given I enter a register number in the UI, When the number is valid for the current year and member is active, Then the system displays the corresponding member name
- **AC-007**: Given I enter an invalid register number, When I tab to the next field, Then the system highlights the error in red text and displays "Register number not found for current year" or "Member is not active"
- **AC-007a**: Given I have validation errors shown in red, When I attempt to submit the batch, Then the system prevents submission and displays "Please correct validation errors before submitting"
- **AC-008**: Given I have entered 10 envelopes totaling £250.00, When I view the batch entry form, Then the UI displays "Total Envelopes: 10" and "Total Amount: £250.00"
- **AC-009**: Given envelope contributions have been successfully submitted, When I view the Church Members grid, Then each member's ThisYearsContribution includes their envelope contributions
- **AC-010**: Given I am viewing a member's contribution history, When envelope contributions exist, Then they appear with ContributionType "Cash" and proper date/description
- **AC-011**: Given it is currently year 2025, When I query for valid register numbers, Then the system uses only Year=2025 records from ChurchMemberRegisterNumbers
- **AC-012**: Given a member's status changes from Active to Inactive after register number generation, When I attempt to enter their envelope, Then the system displays "Member is not active" in red text and prevents batch submission

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer logic for register number generation, batch validation, contribution processing
- **Integration Tests**: Database transactions, FK constraints, batch submission flow
- **End-to-End Tests**: Full UI workflow from batch entry to contribution verification
- **API Tests**: Endpoint validation, error handling, permission checks

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library
- **API Testing**: Integration test harness with TestWebApplicationFactory

### Test Data Management

- **Setup**: Create test members with various MemberSince dates and statuses
- **Teardown**: Clean up test batches and contributions after each test
- **Isolation**: Use separate test database or transactions for each test

### Test Coverage Requirements

- **Minimum**: 80% code coverage for business logic
- **Critical Paths**: 100% coverage for batch submission, register number generation, validation logic

### Test Scenarios

#### Register Number Generation Tests

- Generate numbers for first time
- Attempt duplicate generation (should fail)
- Generate with zero active members
- Generate with 500+ active members
- Verify sequential ordering by MemberSince

#### Batch Submission Tests

- Submit valid batch
- Submit with invalid register numbers
- Submit with non-Sunday date
- Submit duplicate batch (same Sunday)
- Submit with negative amounts
- Submit with member who became inactive
- Verify transaction rollback on error

#### Validation Tests

- Validate register number for current year
- Validate register number from previous year (should fail)
- Validate non-existent register number
- Validate Sunday vs non-Sunday dates
- Validate amount ranges

## 7. Rationale & Context

### Why Sequential Register Numbers?

Sequential numbers (1, 2, 3...) are simple, easy to write on envelopes, and familiar to members. Ordering by MemberSince ensures longest-serving members retain lower numbers year-over-year for consistency.

### Why Batch-Based Entry?

Envelope contributions are collected weekly during Sunday services. Batch-based entry models the real-world process where an administrator sits down with a stack of envelopes and enters them all at once. This also enables:

- Audit trail of when collections were entered
- Duplicate prevention at the batch level
- Easy reconciliation of physical envelopes vs digital records

### Why Immutable Batches?

Once a batch is submitted, it represents a completed administrative task. Immutability ensures:

- Financial integrity and historical accuracy
- Clear audit trail
- Prevents accidental modifications or deletions
- Simplified reporting (no need to track batch versions)
- Complete history is retained for compliance and auditing

If errors occur, corrections should be made through adjustment entries or new offsetting transactions. This maintains a complete audit trail of all financial activities.

### Why Year Column Instead of IsActive Flag?

Using the Year column directly makes queries simpler and more explicit. Current year = active numbers. The database naturally maintains historical records without complex status management. Queries like `WHERE Year = YEAR(GETDATE())` are straightforward and performant.

### Why Restrict to Sundays Only?

Church envelope collections occur during Sunday services. Restricting to Sundays:

- Prevents data entry errors (wrong day selected)
- Aligns with actual church operations
- Simplifies reporting (weekly patterns)
- Enables Sunday-specific features (e.g., "last 4 Sundays" report)

## 8. Dependencies & External Integrations

### Internal System Dependencies

- **DEP-001**: ChurchMembers table with MemberSince and ChurchMemberStatusId fields
- **DEP-002**: ChurchMemberContributions table for storing all contribution records
- **DEP-003**: ContributionTypes lookup table with ContributionTypeId=1 defined as "Cash"
- **DEP-004**: User authentication system for audit trail (CreatedBy fields)
- **DEP-005**: Permission system for Financial.Write and Admin roles
- **DEP-006**: Church Members Management grid for displaying ThisYearsContribution
- **DEP-007**: Contribution history view for displaying individual transactions

### Database Platform Dependencies

- **PLT-001**: Microsoft SQL Server or compatible database supporting:
  - IDENTITY columns for auto-incrementing primary keys
  - UNIQUE constraints for duplicate prevention
  - CHECK constraints for data validation
  - Foreign key constraints for referential integrity
  - Transaction support for atomic batch operations
  - DATE and DATETIME2 data types

### Frontend Dependencies

- **PLT-002**: React-based frontend framework
- **PLT-003**: Form validation library for real-time validation
- **PLT-004**: Date picker component with day-of-week filtering
- **PLT-005**: Currency input component with proper decimal handling

### Technology Platform Dependencies

- **PLT-006**: .NET 8.0 or higher for backend services
- **PLT-007**: Entity Framework Core for data access
- **PLT-008**: FastEndpoints for API endpoint implementation

## 9. Examples & Edge Cases

### Example 1: Normal Batch Submission

**Scenario**: Administrator enters 5 envelopes collected on Sunday, December 21, 2025

```json
POST /api/financial/envelope-contributions/batches
{
  "collectionDate": "2025-12-21",
  "envelopes": [
    { "registerNumber": 1, "amount": 50.00 },
    { "registerNumber": 5, "amount": 20.00 },
    { "registerNumber": 12, "amount": 30.00 },
    { "registerNumber": 23, "amount": 15.00 },
    { "registerNumber": 45, "amount": 25.00 }
  ]
}
```

**Result**:

- EnvelopeContributionBatch created with TotalAmount=140.00, EnvelopeCount=5
- 5 ChurchMemberContributions records created
- Each contribution linked to batch via EnvelopeContributionBatchId

### Example 2: Register Number Generation

**Scenario**: Generate register numbers for 2026

**Database State Before**:

```
ChurchMembers (Active only):
ID | Name           | MemberSince | StatusId
45 | Albert Jones   | 1995-03-15  | 1
67 | Betty Smith    | 1998-06-20  | 1
89 | Charlie Brown  | 2000-01-10  | 1
12 | David Lee      | 2020-05-15  | 1
```

**Action**: Admin clicks "Generate Register Numbers" for 2026

**Database State After**:

```
ChurchMemberRegisterNumbers:
ID | ChurchMemberId | Number | Year
1  | 45             | 1      | 2026
2  | 67             | 2      | 2026
3  | 89             | 3      | 2026
4  | 12             | 4      | 2026
```

### Example 3: Invalid Register Number

**User Input**: Register number 99 (doesn't exist for 2025)

**Validation Response**:

```json
{
  "valid": false,
  "registerNumber": 99,
  "year": 2025,
  "error": "Register number not found for current year"
}
```

**UI Behavior**: Error message displayed in red text next to the register number field, submit button remains disabled until error is corrected

### Example 4: Duplicate Batch Prevention

**Existing Data**: Batch already submitted for 2025-12-21

**User Attempts**: Submit another batch for 2025-12-21

**System Response**: 409 Conflict

```json
{
  "error": "DuplicateBatch",
  "message": "Contributions for Sunday, December 21, 2025 have already been submitted",
  "existingBatchId": 122
}
```

### Example 5: Member Became Inactive

**Scenario**:

1. Register numbers generated on Dec 1, 2025
2. Member #45 assigned to John Smith (Active)
3. On Dec 10, John Smith's status changed to Inactive
4. On Dec 21, envelope with #45 is submitted

**System Response**: Validation error

```json
{
  "validationErrors": [
    {
      "registerNumber": 45,
      "error": "Member is not active"
    }
  ]
}
```

### Edge Case 1: Year Transition

**Scenario**: It's December 31, 2025, 11:59 PM

**Register Number Query**: Uses Year=2025

**Scenario**: Clock strikes midnight, now January 1, 2026, 12:01 AM

**Register Number Query**: Uses Year=2026

**Consideration**: If 2026 numbers haven't been generated, NO valid register numbers exist until generation completes.

### Edge Case 2: Zero Active Members

**Scenario**: All members become inactive before register number generation

**Action**: Admin attempts to generate numbers for 2026

**System Response**:

```json
{
  "year": 2026,
  "totalMembersAssigned": 0,
  "warning": "No active members to assign register numbers"
}
```

### Edge Case 3: Same-Day Multiple Batches

**Scenario**: Administrator realizes they forgot some envelopes after submitting batch

**System Behavior**: Cannot create second batch for same Sunday

**Resolution**: Administrator must contact support to void/adjust original batch, or record missed envelopes with next week's batch and adjust date

### Edge Case 4: Future Collection Date

**User Input**: Collection date = 2025-12-28 (next Sunday, in future)

**Validation**: Date is in future

**System Response**: Error - "Collection date cannot be in the future"

**Rationale**: Prevents accidental forward-dating; envelopes should be entered same day or shortly after collection

### Edge Case 5: Very Old Collection Date

**User Input**: Collection date = 2025-01-07 (10 months ago)

**System Behavior**: Warning message "Collection date is more than 30 days old. Are you sure?"

**Rationale**: Likely data entry error, but allow override for legitimate late entries

## 10. Validation Criteria

The implementation meets this specification when:

1. ✅ Register number generation creates sequential numbers (1, 2, 3...) for all active members ordered by MemberSince
2. ✅ Register number generation can only run once per year
3. ✅ Batch entry UI accepts only member number and amount inputs
4. ✅ Collection date can only be a Sunday
5. ✅ Duplicate batches for same Sunday are prevented
6. ✅ Register numbers are validated against current year's ChurchMemberRegisterNumbers table
7. ✅ Invalid register numbers display validation errors with member lookup failure
8. ✅ Valid register numbers display corresponding member name
9. ✅ Batch submission creates one EnvelopeContributionBatch and multiple ChurchMemberContributions records atomically
10. ✅ TransactionRef follows format "ENV-[BatchId]-[RegisterNumber]"
11. ✅ ContributionTypeId is set to 1 (Cash) for all envelope contributions
12. ✅ Envelope contributions appear in member's ThisYearsContribution total
13. ✅ Envelope contributions appear in member's contribution history view
14. ✅ Batch records are immutable after submission
15. ✅ All database operations use transactions with rollback on error
16. ✅ Audit fields (CreatedBy, CreatedDateTime) are populated for all records
17. ✅ Only users with appropriate permissions can enter batches or generate numbers
18. ✅ Previous year register numbers do not validate for current year
19. ✅ Inactive members' register numbers are rejected during batch submission
20. ✅ UI displays running total and envelope count during entry

## 11. Related Specifications / Further Reading

- [church-members-spec.md](church-members-spec.md) - Church Members Management Feature
- [member-contributions-spec.md](member-contributions-spec.md) - Member Contributions Processing (HSBC Integration)
- [hsbc-transactions-spec.md](hsbc-transactions-spec.md) - HSBC Bank Transaction Import

### External References

- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html) - GBP (£) formatting standards
- [HMRC Gift Aid Guidance](https://www.gov.uk/claim-gift-aid) - UK charity tax relief regulations
