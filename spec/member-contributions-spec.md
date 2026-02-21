---
title: Church Member Contributions Processing and Tracking
version: 1.0
date_created: 2025-12-23
last_updated: 2025-12-23
owner: Church Register Development Team
tags: [financial, data-processing, church-members, contributions, hsbc-integration]
---

# Introduction

This specification defines the automated processing of HSBC bank transactions into church member contributions, tracking contribution history, and displaying member contribution summaries. The system will automatically match bank transactions to church members based on bank references and create a comprehensive contribution tracking system.

## 1. Purpose & Scope

This specification covers:
- Automatic processing of HSBC bank transactions into member contributions after file upload
- Matching logic between bank transactions and church members
- Creation and management of contribution records
- Display of contribution summaries on the Church Members Management grid
- Contribution history views for individual members
- Handling of unmatched transactions
- Permission controls for financial data access

**Intended Audience**: Backend developers, database administrators, frontend developers, QA engineers, and system architects.

**Assumptions**:
- HSBC bank statement upload functionality already exists
- ChurchMember table already has BankReference and GiftAidEligible fields
- ContributionTypes SQL table exists with values: 1=Cash, 2=Transfer
- HSBCBankCreditTransactions table exists with all required transaction data

## 2. Definitions

- **HSBC Transaction**: A credit transaction imported from an HSBC bank statement CSV file
- **Bank Reference**: A unique identifier used by a church member for bank transfers, stored in ChurchMember.BankReference
- **Contribution**: A financial donation made by a church member, tracked in ChurchMemberContributions table
- **Processed Flag**: Boolean indicator (IsProcessed) that marks whether an HSBC transaction has been matched and processed into contributions
- **Gift Aid**: UK tax relief scheme allowing charities to reclaim tax on eligible donations
- **Unmatched Transaction**: An HSBC transaction that cannot be automatically linked to a church member due to missing or non-matching bank reference
- **Calendar Year**: January 1st to December 31st of the current year
- **ThisYearsContribution**: Calculated total of all contributions made by a member in the current calendar year

## 3. Requirements, Constraints & Guidelines

### Core Processing Requirements

- **REQ-001**: System MUST automatically process HSBC transactions into member contributions immediately after successful file upload
- **REQ-002**: System MUST match HSBC transactions to ChurchMember records using case-insensitive comparison of HSBCBankCreditTransaction.Reference to ChurchMember.BankReference
- **REQ-003**: System MUST insert a record into ChurchMemberContributions for each successfully matched transaction
- **REQ-004**: System MUST mark matched HSBC transactions as processed by setting IsProcessed = 1
- **REQ-005**: System MUST leave unmatched transactions with IsProcessed = 0
- **REQ-006**: System MUST prevent insertion of duplicate contributions by checking if HSBCBankCreditTransaction.Id already exists in ChurchMemberContributions
- **REQ-007**: System MUST store the following fields in ChurchMemberContributions:
  - ChurchMemberId (foreign key)
  - Amount (from MoneyIn)
  - Date (transaction date)
  - TransactionRef (from Reference)
  - Description (from Description)
  - ContributionTypeId (hardcoded to 2 for Transfer)
  - HSBCBankCreditTransactionId (foreign key to source transaction)
- **REQ-008**: Processing logic MUST be structured as a reusable service method to support future re-process functionality

### Bank Reference Management

- **REQ-009**: System MUST enforce unique BankReference values across all active ChurchMember records
- **REQ-010**: System MUST perform case-insensitive validation when creating or editing ChurchMember.BankReference
- **REQ-011**: System MUST prevent saving a ChurchMember if BankReference duplicates an existing active member's reference

### Upload Summary Enhancement

- **REQ-012**: Upload response MUST include processing summary with:
  - Count of transactions matched to members
  - Count of unmatched transactions
  - Total amount processed
  - List of unmatched bank references
- **REQ-013**: Upload summary MUST display unmatched references as a list (reference strings only, not full transaction details)

### Contribution Display Requirements

- **REQ-014**: Church Members Management grid MUST include a new column "ThisYearsContribution"
- **REQ-015**: ThisYearsContribution MUST be calculated as the sum of all contributions for the member in the current calendar year (January 1 to December 31)
- **REQ-016**: ThisYearsContribution MUST include all contribution types (Cash and Transfer)
- **REQ-017**: ThisYearsContribution MUST display with currency symbol (£) and formatted to 2 decimal places
- **REQ-018**: ThisYearsContribution column MUST be sortable
- **REQ-019**: System MUST NOT display lifetime contribution totals

### Contribution History View

- **REQ-020**: System MUST provide a detailed contribution history view accessible from the church member row context menu
- **REQ-021**: Contribution history MUST display contributions in descending date order (newest first)
- **REQ-022**: Contribution history MUST include date range filtering
- **REQ-023**: Contribution history MUST default to showing current calendar year contributions
- **REQ-024**: Contribution history grid MUST display:
  - Date
  - Amount (formatted with £)
  - Contribution Type
  - Transaction Reference
  - Description
- **REQ-025**: Contribution history MUST allow export to CSV/Excel
- **REQ-026**: Contribution history view MUST be read-only (no inline editing or deletion)

### Security Requirements

- **SEC-001**: Access to contribution data MUST be restricted to users with roles: FinancialViewer, FinancialContributor, or FinancialAdministrator
- **SEC-002**: Access to contribution processing MUST be restricted to users with roles: FinancialContributor or FinancialAdministrator
- **SEC-003**: FinancialViewer role MUST have read-only access to contribution data
- **SEC-004**: System MUST prevent deletion of processed contribution records
- **SEC-005**: System MUST prevent editing of processed contribution records

### Data Integrity Constraints

- **CON-001**: IsProcessed flag MUST be immutable once set to 1 (processed transactions cannot be unprocessed)
- **CON-002**: System MUST reject negative amounts in contribution records
- **CON-003**: Contribution records MUST maintain referential integrity with ChurchMember and HSBCBankCreditTransaction tables
- **CON-004**: Inactive members MUST retain their contribution history
- **CON-005**: Deleted or soft-deleted members MUST NOT have their contributions deleted

### Audit Requirements

- **AUD-001**: System MUST log all contribution record creation with timestamp and user
- **AUD-002**: System MUST log all failed matching attempts with reason
- **AUD-003**: Audit logs MUST be accessible to users with FinancialAdministrator role
- **AUD-004**: Contribution records MUST include CreatedBy and CreatedDateTime fields

### Guidelines

- **GUD-001**: Processing service should be designed for testability with dependency injection
- **GUD-002**: Matching logic should be case-insensitive and trim whitespace
- **GUD-003**: Error messages for unmatched transactions should be clear and actionable
- **GUD-004**: UI should provide clear feedback during and after processing

## 4. Interfaces & Data Contracts

### Database Schema

#### HSBCBankCreditTransactions (Modified)

```sql
ALTER TABLE HSBCBankCreditTransactions
ADD IsProcessed BIT NOT NULL DEFAULT 0;

CREATE INDEX IX_HSBCBankCreditTransactions_IsProcessed 
ON HSBCBankCreditTransactions(IsProcessed);

CREATE INDEX IX_HSBCBankCreditTransactions_Reference 
ON HSBCBankCreditTransactions(Reference);
```

#### ChurchMemberContributions (New Table)

```sql
CREATE TABLE ChurchMemberContributions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ChurchMemberId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Date DATETIME2 NOT NULL,
    TransactionRef NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    ContributionTypeId INT NOT NULL,
    HSBCBankCreditTransactionId INT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Deleted BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_ChurchMemberContributions_ChurchMember 
        FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMembers(Id),
    CONSTRAINT FK_ChurchMemberContributions_ContributionType 
        FOREIGN KEY (ContributionTypeId) REFERENCES ContributionTypes(Id),
    CONSTRAINT FK_ChurchMemberContributions_HSBCTransaction 
        FOREIGN KEY (HSBCBankCreditTransactionId) REFERENCES HSBCBankCreditTransactions(Id),
    CONSTRAINT CK_ChurchMemberContributions_Amount CHECK (Amount >= 0)
);

CREATE INDEX IX_ChurchMemberContributions_ChurchMemberId 
ON ChurchMemberContributions(ChurchMemberId);

CREATE INDEX IX_ChurchMemberContributions_Date 
ON ChurchMemberContributions(Date);

CREATE INDEX IX_ChurchMemberContributions_HSBCTransactionId 
ON ChurchMemberContributions(HSBCBankCreditTransactionId);

CREATE UNIQUE INDEX IX_ChurchMemberContributions_HSBCTransactionId_Unique 
ON ChurchMemberContributions(HSBCBankCreditTransactionId) 
WHERE HSBCBankCreditTransactionId IS NOT NULL;
```

#### ChurchMembers (Modified)

```sql
-- Add unique constraint for BankReference (excluding NULL and inactive members)
CREATE UNIQUE INDEX IX_ChurchMembers_BankReference_Unique 
ON ChurchMembers(BankReference) 
WHERE BankReference IS NOT NULL AND Deleted = 0 AND AccountStatus = 1; -- Assuming 1 = Active
```

### C# Entities and Enums

#### ContributionType Enum

```csharp
namespace ChurchRegister.Database.Enums;

public enum ContributionType
{
    Cash = 1,
    Transfer = 2
}
```

#### ChurchMemberContribution Entity

```csharp
namespace ChurchRegister.Database.Entities;

public class ChurchMemberContribution : IAuditableEntity
{
    public int Id { get; set; }
    public int ChurchMemberId { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string TransactionRef { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ContributionTypeId { get; set; }
    public int? HSBCBankCreditTransactionId { get; set; }
    
    // Navigation properties
    public ChurchMember ChurchMember { get; set; } = null!;
    public ContributionType ContributionType { get; set; }
    public HSBCBankCreditTransaction? HSBCBankCreditTransaction { get; set; }
    
    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public bool Deleted { get; set; }
}
```

### Service Interface

```csharp
namespace ChurchRegister.ApiService.Services;

public interface IContributionProcessingService
{
    /// <summary>
    /// Process HSBC transactions and create contribution records for matched members
    /// </summary>
    /// <param name="uploadedBy">Username of the user who uploaded the file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processing result with match statistics</returns>
    Task<ContributionProcessingResult> ProcessHsbcTransactionsAsync(
        string uploadedBy, 
        CancellationToken cancellationToken = default);
}

public class ContributionProcessingResult
{
    public bool Success { get; set; }
    public int TotalProcessed { get; set; }
    public int MatchedCount { get; set; }
    public int UnmatchedCount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<string> UnmatchedReferences { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
```

### API Response Models

#### Enhanced Upload Response

```csharp
namespace ChurchRegister.ApiService.Models.Financial;

public class UploadHsbcStatementResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UploadSummary? Summary { get; set; }
    public ContributionProcessingSummary? ProcessingSummary { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class ContributionProcessingSummary
{
    public int MatchedTransactions { get; set; }
    public int UnmatchedTransactions { get; set; }
    public decimal TotalAmountProcessed { get; set; }
    public List<string> UnmatchedReferences { get; set; } = new();
}
```

#### Contribution History Response

```csharp
namespace ChurchRegister.ApiService.Models.Financial;

public class ContributionHistoryDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string ContributionType { get; set; } = string.Empty;
    public string TransactionRef { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ContributionHistoryRequest
{
    public int ChurchMemberId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

### API Endpoints

#### Get Contribution History

```
GET /api/church-members/{memberId}/contributions
Query Parameters:
  - startDate (optional): DateTime (defaults to Jan 1 of current year)
  - endDate (optional): DateTime (defaults to Dec 31 of current year)
  
Authorization: FinancialViewer, FinancialContributor, FinancialAdministrator
Response: 200 OK - List<ContributionHistoryDto>
```

#### Export Contribution History

```
GET /api/church-members/{memberId}/contributions/export
Query Parameters:
  - startDate (optional): DateTime
  - endDate (optional): DateTime
  - format: "csv" | "excel"
  
Authorization: FinancialViewer, FinancialContributor, FinancialAdministrator
Response: 200 OK - File download
```

### Frontend Grid Column

```typescript
interface ChurchMemberGridRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // ... other fields
  thisYearsContribution: number; // Calculated sum for current calendar year
}
```

## 5. Acceptance Criteria

### Processing Logic

- **AC-001**: Given an uploaded HSBC file with 10 transactions, When 8 have matching member references and 2 do not, Then the system creates 8 contribution records and leaves 2 transactions unprocessed
- **AC-002**: Given an HSBC transaction with Reference "JOHN-SMITH-123", When a ChurchMember exists with BankReference "john-smith-123", Then the system matches them (case-insensitive)
- **AC-003**: Given a successfully matched transaction, When a contribution record is created, Then the HSBC transaction IsProcessed flag is set to 1
- **AC-004**: Given an HSBC transaction with IsProcessed = 1, When attempting to reprocess, Then the system skips it (immutable flag)
- **AC-005**: Given a contribution for member A already exists for HSBC transaction ID 123, When processing attempts to create another contribution for the same transaction, Then the system prevents the duplicate

### Bank Reference Validation

- **AC-006**: Given a user attempts to save a ChurchMember with BankReference "REF-001", When another active member already has "ref-001", Then the system prevents saving with error message
- **AC-007**: Given a user edits a ChurchMember's BankReference to "NEW-REF", When no other active member has that reference, Then the system saves successfully

### Upload Summary

- **AC-008**: Given processing completes with 5 matched and 2 unmatched transactions, When upload response is returned, Then ProcessingSummary shows MatchedTransactions=5, UnmatchedTransactions=2
- **AC-009**: Given unmatched transactions have references ["REF-A", "REF-B", "REF-C"], When upload completes, Then UnmatchedReferences list contains exactly those three values
- **AC-010**: Given matched transactions total £1,250.50, When processing completes, Then TotalAmountProcessed equals 1250.50

### Contribution Display

- **AC-011**: Given a member has contributions totaling £500 in current year and £300 in previous year, When viewing the members grid, Then ThisYearsContribution column shows "£500.00"
- **AC-012**: Given a member has no contributions in current year, When viewing the members grid, Then ThisYearsContribution shows "£0.00"
- **AC-013**: Given the members grid, When clicking the column header for ThisYearsContribution, Then the grid sorts by that value

### Contribution History

- **AC-014**: Given a user right-clicks on a church member row, When the context menu appears, Then "View Contributions" option is available
- **AC-015**: Given the contribution history dialog opens, When no date filters are applied, Then it shows contributions from Jan 1 to Dec 31 of current year
- **AC-016**: Given contribution history with 20 records, When sorted, Then newest contributions appear first (descending date order)
- **AC-017**: Given a user with FinancialViewer role, When viewing contribution history, Then all data is visible but no edit/delete options are shown

### Security & Permissions

- **AC-018**: Given a user without financial roles, When attempting to access /api/church-members/{id}/contributions, Then the system returns 403 Forbidden
- **AC-019**: Given a FinancialViewer user, When viewing contribution history, Then data is visible but no modification actions are available
- **AC-020**: Given any user role, When a contribution record exists, Then the system prevents deletion of that record

### Audit Trail

- **AC-021**: Given a contribution is created, When viewing the audit log, Then it shows CreatedBy=username and CreatedDateTime=UTC timestamp
- **AC-022**: Given unmatched transactions during processing, When viewing audit logs, Then failed match attempts are logged with the reference that couldn't be matched

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: Service layer logic, matching algorithm, validation rules
- **Integration Tests**: Database operations, transaction processing, contribution queries
- **End-to-End Tests**: File upload through contribution display workflow

### Test Frameworks

- **Backend**: MSTest, FluentAssertions, Moq for service mocking
- **Frontend**: Vitest, React Testing Library
- **Database**: EF Core In-Memory provider for integration tests

### Test Data Management

- **Test Fixtures**: Create reusable test church members with known BankReferences
- **Test Transactions**: Generate HSBC transactions with controlled reference patterns
- **Data Cleanup**: Rollback transactions in integration tests, clear test data after E2E tests

### Key Test Scenarios

```csharp
[TestClass]
public class ContributionProcessingServiceTests
{
    [TestMethod]
    public async Task ProcessHsbcTransactions_MatchesCorrectly_CaseInsensitive()
    {
        // Arrange: Member with BankReference "TEST-REF-001"
        // HSBC transaction with Reference "test-ref-001"
        
        // Act: Process transactions
        
        // Assert: Contribution created, IsProcessed = 1
    }
    
    [TestMethod]
    public async Task ProcessHsbcTransactions_PreventsDuplicates()
    {
        // Arrange: Contribution already exists for HSBCTransaction ID 123
        
        // Act: Attempt to process same transaction again
        
        // Assert: No duplicate created, existing contribution unchanged
    }
    
    [TestMethod]
    public async Task ProcessHsbcTransactions_HandlesUnmatched()
    {
        // Arrange: HSBC transaction with reference not matching any member
        
        // Act: Process transactions
        
        // Assert: Transaction remains IsProcessed = 0, included in UnmatchedReferences
    }
}
```

### Coverage Requirements

- **Service Layer**: Minimum 90% code coverage
- **API Endpoints**: 100% coverage for happy path and error scenarios
- **Validation Logic**: 100% coverage for all validation rules

### CI/CD Integration

- Run unit tests on every pull request
- Run integration tests on merge to main branch
- Run E2E tests nightly or on release candidates

## 7. Rationale & Context

### Design Decisions

**Immediate Processing vs Background Job**
- Initial implementation processes immediately after upload for simplicity and user feedback
- Structured as reusable service to support future background job implementation
- Provides instant feedback on match success/failure

**Immutable IsProcessed Flag**
- Once processed, transactions should not be "unprocessed" to maintain data integrity
- Future re-processing feature will handle corrections without modifying existing flags
- Prevents accidental data loss or duplicate processing

**Case-Insensitive Matching**
- User entry of bank references may vary in case
- Reduces matching failures due to capitalization differences
- Standard practice for reference matching

**No Lifetime Contributions Display**
- Keeps UI focused on current year giving patterns
- Reduces query complexity and performance overhead
- Can be added later if needed via separate report

**Read-Only Contribution History**
- Maintains audit trail integrity
- Prevents accidental modification of financial records
- Corrections should be handled through adjustments, not edits

**Foreign Key to Source Transaction**
- Enables traceability back to original bank transaction
- Supports audit and reconciliation requirements
- Allows future re-processing scenarios

### Business Context

Churches need to track member contributions for:
- Financial planning and budgeting
- Acknowledging regular givers
- Gift Aid claims (UK specific)
- Annual contribution statements
- Trend analysis

Automated processing reduces manual data entry, improves accuracy, and provides real-time visibility into giving patterns.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: HSBC Bank Statement CSV files - Pre-existing upload and parsing functionality

### Database Dependencies

- **DAT-001**: ChurchMembers table - Must include BankReference and GiftAidEligible columns
- **DAT-002**: HSBCBankCreditTransactions table - Existing table with transaction data
- **DAT-003**: ContributionTypes lookup table - Must contain values 1=Cash, 2=Transfer

### Infrastructure Dependencies

- **INF-001**: SQL Server database - Must support DATETIME2, DECIMAL(18,2), and indexed foreign keys
- **INF-002**: Entity Framework Core - ORM for database access and migrations
- **INF-003**: ASP.NET Core Identity - For role-based authorization checks

### Technology Platform Dependencies

- **PLT-001**: .NET 8.0 or higher - Required for minimal API endpoints and async patterns
- **PLT-002**: React - Frontend framework for contribution history dialog and grid enhancements
- **PLT-003**: Material-UI or similar - For data grid and dialog components

### Compliance Dependencies

- **COM-001**: Financial record retention - Contribution records must be retained per organizational policy (typically 7 years)
- **COM-002**: UK GDPR - Personal financial data requires appropriate security measures and access controls

## 9. Examples & Edge Cases

### Example Processing Scenario

```csharp
// HSBC Transaction Data
var transaction = new HSBCBankCreditTransaction
{
    Id = 101,
    Date = new DateTime(2025, 12, 15),
    Description = "ONLINE BANKING TRANSFER",
    Reference = "JOHN-DOE-001",
    MoneyIn = 50.00m,
    IsProcessed = false
};

// Church Member Data
var member = new ChurchMember
{
    Id = 42,
    FirstName = "John",
    LastName = "Doe",
    BankReference = "john-doe-001", // Case-insensitive match
    GiftAidEligible = true
};

// Expected Contribution Record
var contribution = new ChurchMemberContribution
{
    ChurchMemberId = 42,
    Amount = 50.00m,
    Date = new DateTime(2025, 12, 15),
    TransactionRef = "JOHN-DOE-001",
    Description = "ONLINE BANKING TRANSFER",
    ContributionTypeId = 2, // Transfer
    HSBCBankCreditTransactionId = 101,
    CreatedBy = "admin@churchregister.com",
    CreatedDateTime = DateTime.UtcNow
};

// Transaction updated
transaction.IsProcessed = true;
```

### Edge Case: Whitespace Handling

```csharp
// HSBC Reference: " JOHN-DOE-001 " (with leading/trailing spaces)
// Member Reference: "john-doe-001" (trimmed)
// Expected: Match succeeds after trimming and case normalization
```

### Edge Case: Null/Empty References

```csharp
// HSBC transaction with Reference = null or ""
// Expected: Transaction left unprocessed, added to UnmatchedReferences as "[EMPTY]"
```

### Edge Case: Multiple Members with Same Reference (Data Quality Issue)

```csharp
// Member A: BankReference = "SHARED-REF"
// Member B: BankReference = "SHARED-REF"
// Expected: Unique constraint prevents this during member creation/edit
// If data issue exists, processing logs error and skips transaction
```

### Example Upload Summary Response

```json
{
  "success": true,
  "message": "16 new transaction(s) imported successfully",
  "summary": {
    "totalProcessed": 16,
    "newTransactions": 16,
    "duplicatesSkipped": 0,
    "ignoredNoMoneyIn": 0
  },
  "processingSummary": {
    "matchedTransactions": 13,
    "unmatchedTransactions": 3,
    "totalAmountProcessed": 1450.75,
    "unmatchedReferences": [
      "UNKNOWN-REF-001",
      "JANE-SMITH-999",
      "TEST-REF-INVALID"
    ]
  },
  "errors": []
}
```

### Example Contribution History Query

```sql
-- Get current year contributions for member ID 42
SELECT 
    cmc.Id,
    cmc.Date,
    cmc.Amount,
    ct.Name AS ContributionType,
    cmc.TransactionRef,
    cmc.Description
FROM ChurchMemberContributions cmc
INNER JOIN ContributionTypes ct ON cmc.ContributionTypeId = ct.Id
WHERE cmc.ChurchMemberId = 42
  AND cmc.Deleted = 0
  AND cmc.Date >= '2025-01-01'
  AND cmc.Date < '2026-01-01'
ORDER BY cmc.Date DESC;
```

### Example ThisYearsContribution Calculation

```sql
-- Add calculated column to ChurchMembers query
SELECT 
    cm.Id,
    cm.FirstName,
    cm.LastName,
    cm.Email,
    ISNULL(SUM(cmc.Amount), 0) AS ThisYearsContribution
FROM ChurchMembers cm
LEFT JOIN ChurchMemberContributions cmc 
    ON cm.Id = cmc.ChurchMemberId 
    AND cmc.Deleted = 0
    AND cmc.Date >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
    AND cmc.Date < DATEFROMPARTS(YEAR(GETDATE()) + 1, 1, 1)
WHERE cm.Deleted = 0
GROUP BY cm.Id, cm.FirstName, cm.LastName, cm.Email
ORDER BY cm.LastName, cm.FirstName;
```

## 10. Validation Criteria

### Processing Validation

- **VAL-001**: Processing service successfully matches at least 90% of test transactions with known references
- **VAL-002**: No duplicate contributions created in test scenarios with 1000+ transactions
- **VAL-003**: IsProcessed flag correctly set to 1 for all matched transactions
- **VAL-004**: UnmatchedReferences list accurately reflects all non-matching transactions

### Data Integrity Validation

- **VAL-005**: All contribution records have valid ChurchMemberId foreign keys
- **VAL-006**: All contribution amounts are non-negative (CHECK constraint enforced)
- **VAL-007**: BankReference uniqueness constraint prevents duplicate active member references
- **VAL-008**: No orphaned contribution records (all link to existing members)

### Security Validation

- **VAL-009**: Users without financial roles receive 403 error when accessing contribution endpoints
- **VAL-010**: FinancialViewer users cannot modify or delete contribution data
- **VAL-011**: Contribution records cannot be deleted via API or UI

### Performance Validation

- **VAL-012**: Processing 100 transactions completes in under 5 seconds
- **VAL-013**: ThisYearsContribution calculation adds less than 200ms to members grid query
- **VAL-014**: Contribution history query returns results in under 1 second for members with 1000+ contributions

### UI Validation

- **VAL-015**: ThisYearsContribution column displays correctly formatted currency (£XXX.XX)
- **VAL-016**: Contribution history dialog loads within 2 seconds
- **VAL-017**: Date range filter updates results within 500ms
- **VAL-018**: Export to CSV generates valid file with all selected contributions

## 11. Related Specifications / Further Reading

- [HSBC Transactions Specification](hsbc-transactions-spec.md) - HSBC file upload and parsing
- [Church Members Specification](church-members-spec.md) - Church member management
- [Financial Roles and Permissions](../docs/security-roles.md) - Role-based access control
- [Audit Logging Standards](../docs/audit-logging.md) - Audit trail requirements
- [Entity Framework Core Documentation](https://learn.microsoft.com/en-us/ef/core/) - ORM usage patterns
- [UK Gift Aid Guidance](https://www.gov.uk/claim-gift-aid) - HMRC gift aid rules for future implementation
