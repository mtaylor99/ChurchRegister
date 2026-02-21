---
title: HSBC Bank Statement Import Feature Specification
version: 1.0
date_created: 2025-12-22
last_updated: 2025-12-22
owner: ChurchRegister Development Team
tags: [data, feature, financial, import, dashboard, hsbc, transactions]
---

# HSBC Bank Statement Import Feature Specification

This specification defines the requirements, constraints, and interfaces for importing HSBC bank statement CSV files into the ChurchRegister application, enabling financial administrators to upload and track credit transactions for reconciliation and reporting purposes.

## 1. Purpose & Scope

### Purpose

This specification defines the HSBC Bank Statement Import feature, which enables authorized financial users to upload HSBC bank statement CSV files through a dashboard widget. The system will parse the CSV, extract credit transactions (MoneyIn), detect payment references, prevent duplicates, and store the data for later financial reporting and reconciliation grouped by reference.

### Scope

This specification covers:

- Dashboard widget with modal dialog for CSV file upload
- HSBC CSV file parsing with automatic column detection
- Payment reference extraction from transaction descriptions
- Duplicate transaction detection based on Date + Amount + Description
- Storage of credit transactions only (MoneyIn > 0)
- Progress indicator during file processing
- Upload result summary (new vs existing transactions)
- Role-based access control for financial operations
- Audit trail for upload operations

### Out of Scope (Future Implementation)

- Automatic reconciliation with expected donations
- Manual transaction editing or deletion
- Multi-bank format support (non-HSBC formats)
- Transaction categorization or tagging
- Financial reporting and analytics dashboards
- Export of stored transactions
- Debit transaction import (MoneyOut)
- Bulk transaction editing

### Intended Audience

- Backend developers implementing API endpoints and business logic
- Frontend developers creating UI components
- Database administrators managing schema changes
- QA engineers writing test cases
- Generative AI systems implementing features
- Financial administrators using the system

## 2. Definitions

- **HSBC**: Hong Kong and Shanghai Banking Corporation - the bank whose statement format is being imported
- **CSV**: Comma-Separated Values file format
- **Credit Transaction**: A transaction with a positive MoneyIn value indicating money received
- **Payment Reference**: An identifier extracted from the transaction description, typically following "REF" keyword
- **Duplicate Transaction**: A transaction with identical Date, MoneyIn amount, and Description as an existing record
- **Financial Administrator**: User role with full financial management permissions
- **Financial Contributor**: User role with permission to upload and view financial data
- **Dashboard Widget**: A card or tile on the dashboard page that provides quick access to features

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

#### Dashboard Widget

- **REQ-001**: System shall display an "Import Bank Statement" widget on the dashboard page
- **REQ-002**: Widget shall be visible only to users with FinancialAdministrator or FinancialContributor roles
- **REQ-003**: Widget shall display a clear call-to-action (e.g., "Upload HSBC Statement")
- **REQ-004**: Clicking the widget shall open a modal dialog for file upload

#### File Upload Modal

- **REQ-005**: Modal shall display a file input control accepting only .csv files
- **REQ-006**: Modal shall display instructions for HSBC CSV format
- **REQ-007**: Modal shall have "Cancel" and "Upload" buttons
- **REQ-008**: Upload button shall be disabled until a file is selected
- **REQ-009**: Modal shall display a progress bar during file processing
- **REQ-010**: Progress bar shall update based on number of rows processed
- **REQ-011**: Modal shall remain open during upload and processing

#### CSV File Parsing

- **REQ-012**: System shall parse HSBC CSV files with the following expected columns:
  - Date (required)
  - Description (required)
  - Money In (required for credit transactions)
  - Money Out (optional, will be ignored)
  - Balance (optional, will be ignored)
  - Other bank-specific columns (will be ignored)
- **REQ-013**: System shall automatically detect column positions by header names (case-insensitive)
- **REQ-014**: System shall support alternative column names:
  - "Date" or "Transaction Date"
  - "Description" or "Transaction Description"
  - "Money In" or "Credit Amount" or "Credit"
  - "Money Out" or "Debit Amount" or "Debit"
- **REQ-015**: System shall handle quoted CSV fields (commas within quotes)
- **REQ-016**: System shall skip empty lines in the CSV file
- **REQ-017**: System shall skip the header row automatically
- **REQ-018**: System shall parse dates in UK format (DD/MM/YYYY)
- **REQ-019**: System shall parse decimal amounts with proper culture handling

#### Payment Reference Extraction

- **REQ-020**: System shall extract payment references from Description field
- **REQ-021**: System shall search for " REF " marker (case-insensitive) in Description
- **REQ-022**: System shall extract text after " REF " marker until end or trailing tokens
- **REQ-023**: System shall recognize and truncate at following trailing tokens:
  - " VIA "
  - " ONLINE BANKING"
  - " MOBILE APP"
  - " ON "
  - " AT "
- **REQ-024**: If no reference is found, system shall store empty string in Reference field
- **REQ-025**: Reference field shall be trimmed of leading/trailing whitespace

#### Transaction Filtering

- **REQ-026**: System shall only import transactions where MoneyIn has a value > 0
- **REQ-027**: System shall ignore transactions where MoneyIn is null, zero, or empty
- **REQ-028**: System shall ignore MoneyOut column entirely

#### Duplicate Detection

- **REQ-029**: System shall detect duplicates based on exact match of:
  - Date (DateTime comparison, ignoring time component)
  - MoneyIn (decimal value comparison)
  - Description (string comparison, case-sensitive)
- **REQ-030**: System shall skip duplicate transactions without error
- **REQ-031**: System shall count skipped duplicates for result summary
- **REQ-032**: Duplicate detection shall check against existing non-deleted records only

#### Data Persistence

- **REQ-033**: System shall save new transactions to HSBCBankCreditTransaction table
- **REQ-034**: System shall populate the following fields:
  - Date: From CSV Date column
  - Description: From CSV Description column
  - Reference: Extracted from Description using reference extraction logic
  - MoneyIn: From CSV Money In column
  - CreatedBy: Current authenticated user's identifier
  - CreatedDateTime: Server timestamp at time of upload
  - Deleted: false
- **REQ-035**: System shall perform transaction persistence within a database transaction
- **REQ-036**: System shall rollback all changes if any error occurs during processing

#### Upload Result Feedback

- **REQ-037**: System shall display upload results after processing completes
- **REQ-038**: Result summary shall include:
  - Total transactions processed from CSV
  - Number of new transactions imported
  - Number of duplicate transactions skipped
  - Number of transactions ignored (no MoneyIn value)
- **REQ-039**: System shall display success message with result summary
- **REQ-040**: System shall display error message if file format is invalid
- **REQ-041**: System shall close modal automatically after user acknowledges results

### Security Requirements

#### Authentication & Authorization

- **SEC-001**: All bank statement import endpoints shall require authentication
- **SEC-002**: System shall implement two access levels for this feature:
  - **FinancialAdministrator**: Full access to import and manage financial data
  - **FinancialContributor**: Permission to upload bank statements and view data
- **SEC-003**: Only FinancialAdministrator and FinancialContributor roles can access the import widget
- **SEC-004**: Only FinancialAdministrator and FinancialContributor roles can upload CSV files
- **SEC-005**: Dashboard widget shall be hidden from users without appropriate roles

#### Data Protection

- **SEC-006**: Uploaded CSV files shall not be stored on the server
- **SEC-007**: CSV data shall only be held in memory during processing
- **SEC-008**: Audit logs shall record username and timestamp of each upload
- **SEC-009**: Transaction data shall be protected by standard database access controls

### Data Validation Constraints

#### File Validation

- **CON-001**: File must have .csv extension
- **CON-002**: File must contain at least 2 lines (header + one data row)
- **CON-003**: File must contain required columns: Date, Description, and Money In (or alternatives)
- **CON-004**: If required columns are missing, upload shall fail with clear error message
- **CON-005**: Maximum file size shall be 10 MB

#### Field Validation

- **CON-006**: Date field must parse to valid DateTime
- **CON-007**: MoneyIn field must parse to valid positive decimal
- **CON-008**: Description maximum 500 characters (will be truncated if longer)
- **CON-009**: Reference maximum 100 characters (will be truncated if longer)
- **CON-010**: MoneyIn must be between 0.01 and 999,999.99

#### Business Logic Validation

- **CON-011**: At least one valid credit transaction must exist in the file
- **CON-012**: If all transactions are duplicates or have no MoneyIn, upload shall still succeed with appropriate message
- **CON-013**: Invalid rows shall be skipped with logging, not cause entire upload to fail

### Guidelines

#### User Experience

- **GUD-001**: Progress bar should update smoothly for large files (100+ transactions)
- **GUD-002**: Upload process should be non-blocking where possible
- **GUD-003**: Error messages should be specific and actionable
- **GUD-004**: Success messages should provide actionable summary information

#### Performance

- **GUD-005**: File parsing should handle files with 1000+ transactions efficiently
- **GUD-006**: Duplicate detection should use indexed database queries
- **GUD-007**: Batch inserts should be used for multiple transactions

#### Code Organization

- **PAT-001**: CSV parsing logic shall be in a dedicated service class
- **PAT-002**: Reference extraction shall be a standalone pure function
- **PAT-003**: Duplicate detection shall be implemented at database level where possible
- **PAT-004**: Follow existing ChurchRegister API patterns and conventions

## 4. Interfaces & Data Contracts

### Frontend to Backend API

#### Upload Bank Statement Endpoint

**POST** `/api/financial/hsbc-transactions/upload`

**Request:**

- Content-Type: `multipart/form-data`
- Body: FormData with single file field

```typescript
interface UploadRequest {
  file: File; // CSV file
}
```

**Response (Success - 200 OK):**

```typescript
interface UploadResponse {
  success: true;
  message: string;
  summary: {
    totalProcessed: number;
    newTransactions: number;
    duplicatesSkipped: number;
    ignoredNoMoneyIn: number;
  };
}
```

**Response (Validation Error - 400 Bad Request):**

```typescript
interface UploadErrorResponse {
  success: false;
  message: string;
  errors: string[];
}
```

**Response (Unauthorized - 401 / Forbidden - 403):**

Standard authentication/authorization error response

### Database Schema

#### HSBCBankCreditTransaction Table

Existing table structure (no changes required):

```sql
CREATE TABLE HSBCBankCreditTransaction (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATETIME2 NOT NULL,
    Description NVARCHAR(500) NULL,
    Reference NVARCHAR(100) NULL,
    MoneyIn DECIMAL(10,2) NOT NULL,
    Deleted BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(256) NOT NULL,
    CreatedDateTime DATETIME2 NOT NULL,
    ModifiedBy NVARCHAR(256) NULL,
    ModifiedDateTime DATETIME2 NULL
);

-- Index for duplicate detection
CREATE INDEX IX_HSBCBankCreditTransaction_DuplicateCheck
ON HSBCBankCreditTransaction (Date, MoneyIn, Description)
WHERE Deleted = 0;
```

### HSBC CSV File Format

**Example HSBC CSV:**

```csv
Date,Description,Money In,Money Out,Balance
01/12/2025,"FASTER PAYMENT REF JOHN SMITH VIA ONLINE BANKING",50.00,,1234.56
02/12/2025,"BANK CREDIT",100.00,,1334.56
03/12/2025,"FASTER PAYMENT REF OFFERING-DEC VIA MOBILE APP",25.50,,1360.06
04/12/2025,"ATM WITHDRAWAL",,20.00,1340.06
```

**Expected Columns:**

- Date: DD/MM/YYYY format
- Description: Free text
- Money In: Decimal amount (empty if not a credit)
- Money Out: Decimal amount (ignored for this feature)
- Balance: Decimal amount (ignored for this feature)

### Internal Service Interfaces

#### HsbcCsvParser Service

```csharp
public interface IHsbcCsvParser
{
    Task<HsbcParseResult> ParseAsync(Stream csvStream);
}

public class HsbcParseResult
{
    public List<HsbcTransaction> Transactions { get; set; }
    public int TotalRows { get; set; }
    public List<string> Errors { get; set; }
}

public class HsbcTransaction
{
    public DateTime Date { get; set; }
    public string Description { get; set; }
    public string Reference { get; set; }
    public decimal MoneyIn { get; set; }
}
```

#### Transaction Import Service

```csharp
public interface IHsbcTransactionImportService
{
    Task<ImportResult> ImportTransactionsAsync(
        List<HsbcTransaction> transactions,
        string uploadedBy);
}

public class ImportResult
{
    public int TotalProcessed { get; set; }
    public int NewTransactions { get; set; }
    public int DuplicatesSkipped { get; set; }
    public int IgnoredNoMoneyIn { get; set; }
    public bool Success { get; set; }
    public List<string> Errors { get; set; }
}
```

## 5. Acceptance Criteria

### Upload Widget Visibility

- **AC-001**: Given a user with FinancialAdministrator role, When they view the dashboard, Then the "Import Bank Statement" widget shall be visible
- **AC-002**: Given a user with FinancialContributor role, When they view the dashboard, Then the "Import Bank Statement" widget shall be visible
- **AC-003**: Given a user without financial roles, When they view the dashboard, Then the "Import Bank Statement" widget shall not be visible

### File Upload Process

- **AC-004**: Given a valid HSBC CSV file, When uploaded by authorized user, Then the system shall parse and import credit transactions
- **AC-005**: Given an invalid file format, When uploaded, Then the system shall display a clear error message without saving any data
- **AC-006**: Given a file with missing required columns, When uploaded, Then the system shall reject the file with specific error message

### Duplicate Detection

- **AC-007**: Given a transaction already exists with same Date, MoneyIn, and Description, When uploading that transaction again, Then the system shall skip it and increment duplicates counter
- **AC-008**: Given a transaction with same Date and MoneyIn but different Description, When uploaded, Then the system shall import it as a new transaction

### Reference Extraction

- **AC-009**: Given a description "FASTER PAYMENT REF JOHN SMITH VIA ONLINE BANKING", When processed, Then the Reference field shall be "JOHN SMITH"
- **AC-010**: Given a description "BANK CREDIT", When processed, Then the Reference field shall be empty string
- **AC-011**: Given a description "PAYMENT REF OFFERING-DEC2025 ON 01/12", When processed, Then the Reference field shall be "OFFERING-DEC2025"

### Transaction Filtering

- **AC-012**: Given a CSV row with MoneyIn value of 50.00, When processed, Then the transaction shall be imported
- **AC-013**: Given a CSV row with MoneyIn empty or zero, When processed, Then the transaction shall be skipped and counted in ignoredNoMoneyIn
- **AC-014**: Given a CSV row with only MoneyOut value, When processed, Then the transaction shall be ignored

### Progress and Feedback

- **AC-015**: Given a file with 100 transactions, When uploading, Then the progress bar shall update continuously during processing
- **AC-016**: Given a successful upload of 10 new transactions and 3 duplicates, When upload completes, Then the system shall display "10 new transactions imported, 3 duplicates skipped"
- **AC-017**: Given an upload with only duplicates, When processing completes, Then the system shall display success message with "0 new transactions, X duplicates skipped"

### Audit Trail

- **AC-018**: Given a successful transaction import, When saved to database, Then CreatedBy shall be set to current user's identifier
- **AC-019**: Given a successful transaction import, When saved to database, Then CreatedDateTime shall be set to current server timestamp

### Authorization

- **AC-020**: Given an unauthenticated user, When attempting to access the upload endpoint, Then the system shall return 401 Unauthorized
- **AC-021**: Given an authenticated user without financial roles, When attempting to access the upload endpoint, Then the system shall return 403 Forbidden

## 6. Test Automation Strategy

### Test Levels

- **Unit Testing**: Parser logic, reference extraction, duplicate detection logic
- **Integration Testing**: Database operations, full upload workflow
- **End-to-End Testing**: Complete user journey from dashboard widget to result display

### Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library
- **E2E**: Playwright or Cypress

### Test Data Management

- Create sample HSBC CSV files for various scenarios (valid, invalid, duplicates, edge cases)
- Use in-memory database or test database for integration tests
- Clean up test data after each test run

### CI/CD Integration

- Run all tests in GitHub Actions pipeline
- Block merge if tests fail
- Generate coverage reports

### Coverage Requirements

- Minimum 80% code coverage for parser and business logic
- 100% coverage for reference extraction function
- All happy paths and error scenarios covered

### Key Test Scenarios

1. **Valid CSV Import**: Upload valid file with mixed new and duplicate transactions
2. **Reference Extraction**: Test all reference patterns and edge cases
3. **Duplicate Detection**: Verify exact duplicate logic with various combinations
4. **Invalid Files**: Test missing columns, invalid data types, empty files
5. **Large Files**: Test performance with 1000+ transactions
6. **Authorization**: Verify role-based access control
7. **Progress Tracking**: Verify progress updates during long operations
8. **Error Handling**: Verify graceful handling of malformed CSV, database errors

## 7. Rationale & Context

### Why HSBC Specific?

The feature is designed specifically for HSBC CSV format as this is the primary bank used by the church. The parsing logic is flexible enough to handle common variations in HSBC exports.

### Why Credit Transactions Only?

The primary use case is tracking donations and contributions, which are credits to the church's account. Debit transactions (expenses) are handled separately in accounting systems.

### Why Reference Extraction?

HSBC includes payment references in the Description field following a "REF" keyword. Extracting this to a separate field enables:

- Grouping transactions by reference (e.g., all "OFFERING-DEC" payments)
- Easier reconciliation with expected donations
- Better reporting and analytics
- Searching by reference

### Why Duplicate Detection?

Bank statements often overlap when downloading multiple months. Duplicate detection prevents:

- Double-counting donations
- Database bloat with redundant records
- Confusion in financial reporting
- Need for manual deduplication

### Why Dashboard Widget?

Financial administrators need quick access to upload statements regularly (monthly). A dashboard widget provides:

- One-click access from the main landing page
- Visual prominence for important administrative task
- Consistent with other administrative functions

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: HSBC Online Banking - Source of CSV export files (user downloads manually)

### Infrastructure Dependencies

- **INF-001**: SQL Server Database - Storage for HSBCBankCreditTransaction table
- **INF-002**: ASP.NET Core - Web API framework for upload endpoint
- **INF-003**: React - Frontend framework for dashboard widget and modal

### Data Dependencies

- **DAT-001**: User Authentication System - Required for audit trail (CreatedBy field)
- **DAT-002**: Role-Based Access Control - FinancialAdministrator and FinancialContributor roles must exist

### Technology Platform Dependencies

- **PLT-001**: .NET 8.0 - Backend runtime environment
- **PLT-002**: Entity Framework Core - ORM for database operations
- **PLT-003**: CSV Parsing Library - System.Text or CsvHelper for robust CSV parsing
- **PLT-004**: React 18+ - Frontend framework with hooks support
- **PLT-005**: Material-UI - UI component library for modal and progress bar

### Compliance Dependencies

- **COM-001**: GDPR - Financial data handling must comply with data protection regulations
- **COM-002**: Financial Record Retention - Transactions must be retained per church policies

## 9. Examples & Edge Cases

### Example 1: Standard Upload

**Input CSV:**

```csv
Date,Description,Money In,Money Out,Balance
15/12/2025,"FASTER PAYMENT REF JOHN-DOE VIA ONLINE BANKING",100.00,,5000.00
16/12/2025,"BANK CREDIT",50.00,,5050.00
17/12/2025,"FASTER PAYMENT REF OFFERING-DEC MOBILE APP",25.50,,5075.50
```

**Expected Result:**

- 3 transactions processed
- 3 new transactions imported
- 0 duplicates skipped
- References: "JOHN-DOE", "", "OFFERING-DEC"

### Example 2: With Duplicates

**Existing Database Record:**

- Date: 15/12/2025, MoneyIn: 100.00, Description: "FASTER PAYMENT REF JOHN-DOE VIA ONLINE BANKING"

**Input CSV:**

```csv
Date,Description,Money In,Money Out,Balance
15/12/2025,"FASTER PAYMENT REF JOHN-DOE VIA ONLINE BANKING",100.00,,5000.00
16/12/2025,"FASTER PAYMENT REF JANE-SMITH VIA MOBILE APP",75.00,,5075.00
```

**Expected Result:**

- 2 transactions processed
- 1 new transaction imported (JANE-SMITH)
- 1 duplicate skipped (JOHN-DOE)

### Example 3: Reference Extraction Variations

```csharp
// Test cases for reference extraction
ExtractHsbcReference("FASTER PAYMENT REF JOHN SMITH VIA ONLINE BANKING")
// Expected: "JOHN SMITH"

ExtractHsbcReference("BANK CREDIT")
// Expected: ""

ExtractHsbcReference("TRANSFER REF OFFERING-DEC2025 ON 01/12/2025")
// Expected: "OFFERING-DEC2025"

ExtractHsbcReference("PAYMENT REF MULTI WORD REFERENCE AT BRANCH")
// Expected: "MULTI WORD REFERENCE"

ExtractHsbcReference("STANDING ORDER REF SO-123456")
// Expected: "SO-123456"
```

### Example 4: Edge Cases

**Empty MoneyIn Values:**

```csv
Date,Description,Money In,Money Out,Balance
15/12/2025,"ATM WITHDRAWAL",,20.00,4980.00
16/12/2025,"FASTER PAYMENT REF DONATION",50.00,,5030.00
```

**Expected:** Only the second transaction imported (first has no MoneyIn)

**Quoted Descriptions with Commas:**

```csv
Date,Description,Money In,Money Out,Balance
15/12/2025,"PAYMENT REF SMITH, JOHN VIA APP",100.00,,5100.00
```

**Expected:** Description correctly parsed as "PAYMENT REF SMITH, JOHN VIA APP", Reference: "SMITH, JOHN"

**Alternative Column Names:**

```csv
Transaction Date,Transaction Description,Credit Amount,Debit Amount,Balance
15/12/2025,"PAYMENT REF TEST",100.00,,5100.00
```

**Expected:** Successfully parsed with alternative column names

## 10. Validation Criteria

### Feature Completeness

- ✅ Dashboard widget displays for authorized users only
- ✅ Modal opens with file upload control
- ✅ CSV file is parsed correctly with column auto-detection
- ✅ References are extracted from descriptions
- ✅ Duplicates are detected and skipped
- ✅ Only credit transactions (MoneyIn > 0) are imported
- ✅ Progress bar updates during processing
- ✅ Result summary displays with accurate counts
- ✅ Transactions are saved with audit information
- ✅ Unauthorized users cannot access the feature

### Code Quality

- ✅ All unit tests pass with minimum 80% coverage
- ✅ Integration tests cover full upload workflow
- ✅ Code follows existing ChurchRegister patterns
- ✅ Error handling is comprehensive and graceful
- ✅ Logging is implemented for debugging and audit

### User Experience

- ✅ Upload process completes within reasonable time for 1000 transactions
- ✅ Error messages are clear and actionable
- ✅ Success feedback is informative and reassuring
- ✅ UI is responsive and intuitive

### Security

- ✅ Authentication is required for all operations
- ✅ Role-based authorization is enforced
- ✅ CSV files are not persisted on server
- ✅ Audit trail captures user and timestamp

## 11. Related Specifications / Further Reading

- [Church Members Management Specification](./church-members-spec.md)
- [Clean Architecture Patterns in ChurchRegister](../docs/local-development-setup.md)
- [HSBC UK CSV Export Format Documentation](https://www.hsbc.co.uk/) (External)
- [CSV RFC 4180 Standard](https://www.ietf.org/rfc/rfc4180.txt) (External)
- [GDPR Financial Data Guidelines](https://gdpr-info.eu/) (External)

---

**Document Control**

| Version | Date       | Author              | Changes               |
| ------- | ---------- | ------------------- | --------------------- |
| 1.0     | 2025-12-22 | ChurchRegister Team | Initial specification |
