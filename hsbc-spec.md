---
title: HSBC Bank Statement CSV Import Format Migration (v1 to v2)
version: 2.0
date_created: 2026-05-14
last_updated: 2026-05-14
owner: Development Team
tags: [data, infrastructure, hsbc, contributions, csv-import]
---

# HSBC Bank Statement CSV Import Format Migration

## Introduction

This specification defines the required changes to support the updated HSBC bank statement CSV format (v2). The previous format (v1) used estimated column names that did not match actual HSBC exports. The v2 format reflects the true structure of HSBC CSV exports and includes a transaction type classifier that enables more accurate filtering of contribution transactions.

## 1. Purpose & Scope

**Purpose**: Update the HSBC bank statement import functionality to support the actual CSV format exported by HSBC Online Banking, replacing the previous estimated format.

**Scope**: This specification covers:

- Changes to CSV column names and structure
- Introduction of transaction type filtering
- Simplified reference extraction logic
- Removal of legacy v1 format support
- Updates to parser, validator, and test suite

**Audience**: Backend developers implementing the CSV parser changes, QA engineers validating the import functionality, and AI code generators implementing the specification.

**Assumptions**:

- All future HSBC statement uploads will use the v2 format
- Existing data in the database remains unchanged
- The contribution matching workflow (associating references with church members) remains identical

## 2. Definitions

- **v1 Format**: The previous HSBC CSV format with columns `Date`, `Description`, `Money In`, `Money Out`, `Balance`
- **v2 Format**: The actual HSBC CSV format with columns `Date`, `Type`, `Description`, `Paid Out`, `Paid In`, `Balance`
- **CR Transaction**: Credit transaction (money received into the account)
- **BP Transaction**: Bank Payment (money paid out via bank transfer)
- **DD Transaction**: Direct Debit payment (money paid out via direct debit)
- **Reference**: The unique identifier used to match a bank transaction to a church member's contribution record
- **HsbcCsvParser**: The service class responsible for parsing HSBC CSV files
- **HsbcReferenceExtractor**: The utility class that extracts payment references from transaction descriptions

## 3. Requirements, Constraints & Guidelines

### CSV Format Requirements

**REQ-001**: The parser MUST recognize and accept CSV files with the following v2 column structure:

- `Date` - Transaction date in DD-MMM-YY format (e.g., "30-Dec-25")
- `Type` - Transaction type code (CR, BP, or DD)
- `Description` - Transaction description/reference
- `Paid Out` - Debit amount (money paid out)
- `Paid In` - Credit amount (money received)
- `Balance` - Account balance after transaction

**REQ-002**: The parser MUST accept column names with spaces (e.g., "Paid In", "Paid Out") as they appear in actual HSBC exports.

**REQ-003**: The parser MUST only import transactions where `Type = "CR"` (credit transactions).

**REQ-004**: The parser MUST ignore/skip transactions where `Type = "BP"` or `Type = "DD"`.

**REQ-005**: The `Description` column value MUST be used directly as the transaction reference without parsing or extraction.

**REQ-006**: The parser MUST NOT use `HsbcReferenceExtractor.ExtractReference()` for v2 format files.

### Column Name Mapping

**REQ-007**: Update column detection to recognize these v2 column names:

- `"paid in"` (case-insensitive) → maps to `MoneyIn` property
- `"paid out"` (case-insensitive) → maps to `MoneyOut` property
- `"type"` (case-insensitive) → new column for transaction type filtering

**REQ-008**: Remove support for v1 column name alternatives:

- `"money in"` - no longer supported
- `"money out"` - no longer supported
- `"credit amount"` - no longer supported
- `"credit"` - no longer supported

### Backward Compatibility

**CON-001**: The system SHALL NOT support v1 format files after this change is implemented.

**CON-002**: If a v1 format file is uploaded, the parser MUST return an error indicating missing required columns.

### Reference Extraction

**REQ-009**: For v2 format, the `Reference` field MUST be populated with the complete `Description` column value, trimmed of leading/trailing whitespace only.

**REQ-010**: Remove the reference parsing logic that searches for " REF " markers and strips trailing tokens (VIA, ONLINE BANKING, etc.).

### Data Validation

**REQ-011**: The parser MUST validate that the `Type` column exists in the CSV header.

**REQ-012**: The parser MUST validate that `Type` values are one of: CR, BP, or DD. Invalid type codes should log a warning but not fail the import.

**REQ-013**: Empty or whitespace-only `Description` values MUST result in an empty reference string (not an error).

**REQ-014**: The parser MUST continue to enforce that transactions have a positive `Paid In` amount to be imported.

### Testing Requirements

**REQ-015**: All existing unit tests for `HsbcCsvParser` MUST be updated to use v2 format CSV data.

**REQ-016**: New unit tests MUST verify that BP and DD transactions are filtered out correctly.

**REQ-017**: Integration tests MUST verify end-to-end import of a sample v2 HSBC statement file.

## 4. Interfaces & Data Contracts

### CSV File Structure (v2 Format)

```csv
Date,Type,Description,Paid Out,Paid In,Balance
30-Dec-25,CR,DAVIES SP&SJ,,40,
30-Dec-25,BP,HMRC PAYE/NIC CUMB 615PZ00126603,713.27,,36393.9
31-Dec-25,CR,DAVID & YVONNE JONES DET&YN,,400,
02-Jan-26,DD,DWR CYMRU WELSH WA,30.54,,
02-Jan-26,CR,MICHAEL WOOLLER WOOLLER,,30,
```

### Column Name Detection (case-insensitive)

| Column Purpose        | v2 Column Name | v1 Column Name (Removed)              |
| --------------------- | -------------- | ------------------------------------- |
| Transaction Date      | `date`         | `date`                                |
| Transaction Type      | `type`         | _(new)_                               |
| Description/Reference | `description`  | `description`                         |
| Credit Amount         | `paid in`      | `money in`, `credit amount`, `credit` |
| Debit Amount          | `paid out`     | `money out`                           |
| Account Balance       | `balance`      | `balance`                             |

### HsbcTransaction Model (unchanged)

```csharp
public class HsbcTransaction
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal MoneyIn { get; set; }
}
```

**Note**: The internal model does not change. The `Reference` field will now contain the raw `Description` value instead of an extracted reference.

### Parser Method Signature (unchanged)

```csharp
Task<HsbcParseResult> ParseAsync(Stream csvStream, CancellationToken cancellationToken = default);
```

## 5. Acceptance Criteria

**AC-001**: Given a v2 format CSV file with CR, BP, and DD transactions, When the file is parsed, Then only CR transactions are imported.

**AC-002**: Given a v2 format CSV with Description "DAVIES SP&SJ", When the transaction is parsed, Then the Reference field equals "DAVIES SP&SJ" (no parsing applied).

**AC-003**: Given a v2 format CSV with column header "Paid In", When the parser validates columns, Then the "Paid In" column is recognized as the credit amount column.

**AC-004**: Given a v1 format CSV file (with "Money In" column), When the file is parsed, Then an error is returned indicating missing required columns.

**AC-005**: Given a v2 format CSV with empty Description field, When the transaction is parsed, Then the Reference field is an empty string.

**AC-006**: Given a v2 format CSV with Type="BP", When the file is parsed, Then that row is not added to the transactions list.

**AC-007**: Given the sample file `sample-hsbc-statement_v2.csv`, When imported via the upload endpoint, Then all CR transactions are successfully imported and matched to members.

**AC-008**: Given a v2 transaction with Paid In amount of 0, When the row is processed, Then the transaction is skipped (not imported).

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: `HsbcCsvParserTests.cs` - Test individual parser methods with various CSV formats
- **Integration Tests**: End-to-end upload and processing of v2 HSBC statements
- **Manual Testing**: Upload actual HSBC export files to validate real-world compatibility

### Test Frameworks

- **MSTest**: Primary test framework
- **FluentAssertions**: Assertion library for readable test expectations
- **Moq**: Mocking framework for dependencies

### Test Data Management

- Use embedded CSV strings in unit tests for isolation
- Include `sample-hsbc-statement_v2.csv` in the repository as the reference test file
- Test data should cover:
  - Valid CR transactions
  - BP and DD transactions that should be filtered
  - Edge cases: empty descriptions, zero amounts, malformed dates

### CI/CD Integration

- All parser tests must pass before merging changes
- No reduction in overall code coverage
- Integration tests run against a test database instance

### Coverage Requirements

- Minimum 90% code coverage for `HsbcCsvParser.cs`
- All public methods must have corresponding unit tests
- All acceptance criteria must have automated test coverage

## 7. Rationale & Context

### Why Remove v1 Support?

The v1 format was based on estimated column names and did not match actual HSBC exports. Supporting both formats adds unnecessary complexity and increases the risk of parsing errors. Since v1 was never used with real HSBC files, removing it has no impact on existing users.

### Why Use Description Directly as Reference?

In the v2 format, HSBC provides clean, concise references in the Description field (e.g., "DAVIES SP&SJ", "TAYLOR MATHEW MTAYLOR COMMUNION"). These are suitable for direct use as member-matching references without the parsing logic designed for v1's verbose descriptions (e.g., "FASTER PAYMENT REF JOHN SMITH VIA ONLINE BANKING").

### Why Filter by Type Column?

The Type column enables precise filtering of contribution-relevant transactions. By importing only CR (credit) transactions, we avoid processing outgoing payments (BP, DD) that are not contributions. This reduces noise in the unmatched transactions list and improves matching accuracy.

### Design Decisions

- **Simplification over Flexibility**: Rather than supporting multiple formats, we standardize on the actual HSBC format
- **Fail Fast**: If a v1 file is uploaded, reject it immediately with a clear error message
- **Data Integrity**: Continue to validate that imported transactions have positive amounts and valid dates

## 8. Dependencies & External Integrations

### External Systems

**EXT-001**: HSBC Online Banking - Source of CSV export files. The application depends on HSBC maintaining the v2 column structure.

### Data Dependencies

**DAT-001**: HSBC CSV Export - Format: CSV with headers. Encoding: UTF-8. Line endings: CRLF or LF. Frequency: Ad-hoc (uploaded by users). Access: User downloads from HSBC, then uploads to application.

### Technology Platform Dependencies

**PLT-001**: .NET 10.0 - Required runtime for the application. CSV parsing uses built-in `StreamReader` and string manipulation (no external CSV parsing libraries).

**PLT-002**: Entity Framework Core - Used by `HsbcTransactionImportService` to persist parsed transactions to the database.

### Compliance Dependencies

**COM-001**: Data Protection - HSBC statements may contain personal financial information. Files are processed server-side and not stored permanently in file form (only parsed transaction records are persisted).

## 9. Examples & Edge Cases

### Example 1: Valid v2 CSV with Mixed Transaction Types

```csv
Date,Type,Description,Paid Out,Paid In,Balance
30-Dec-25,CR,DAVIES SP&SJ,,40,
30-Dec-25,BP,HMRC PAYE/NIC CUMB 615PZ00126603,713.27,,36393.9
31-Dec-25,CR,DAVID & YVONNE JONES DET&YN,,400,
02-Jan-26,DD,DWR CYMRU WELSH WA,30.54,,
```

**Expected**: Only 2 transactions imported (the CR rows). Reference values are "DAVIES SP&SJ" and "DAVID & YVONNE JONES DET&YN".

### Example 2: CR Transaction with Complex Description

```csv
Date,Type,Description,Paid Out,Paid In,Balance
02-Jan-26,CR,TAYLOR MATHEW MTAYLOR COMMUNION,,10,38000
```

**Expected**: Transaction imported with Reference = "TAYLOR MATHEW MTAYLOR COMMUNION" (entire description preserved).

### Example 3: Empty Balance Field (Edge Case)

```csv
Date,Type,Description,Paid Out,Paid In,Balance
30-Dec-25,CR,DAVIES SP&SJ,,40,
```

**Expected**: Transaction imported successfully. Balance column is not used by the parser.

### Example 4: v1 Format File (Error Case)

```csv
Date,Description,Money In,Money Out,Balance
01/01/2026 09:15,FASTER PAYMENT REF JOHN SMITH,50,,5050
```

**Expected**: Parser returns error: "Missing required columns: Type, Paid In".

### Example 5: Transaction with Zero Paid In Amount

```csv
Date,Type,Description,Paid Out,Paid In,Balance
30-Dec-25,CR,REFUND REVERSAL,,0,40000
```

**Expected**: Transaction skipped (not imported) due to zero amount.

### Implementation Code Snippet

```csharp
// Updated HasRequiredColumns method
private static bool HasRequiredColumns(Dictionary<string, int> colIndex, out List<string> missingColumns)
{
    missingColumns = new List<string>();

    if (!colIndex.ContainsKey("date"))
        missingColumns.Add("Date");

    if (!colIndex.ContainsKey("type"))
        missingColumns.Add("Type");

    if (!colIndex.ContainsKey("description"))
        missingColumns.Add("Description");

    if (!colIndex.ContainsKey("paid in"))
        missingColumns.Add("Paid In");

    return !missingColumns.Any();
}

// Updated parsing logic with type filtering
var transactionType = Get(cols, colIndex, "type");
if (transactionType != "CR")
    continue; // Skip non-credit transactions

var tx = new HsbcTransaction
{
    Date = ParseDate(cols, colIndex, "date"),
    Description = Get(cols, colIndex, "description"),
    MoneyIn = ParseDecimal(cols, colIndex, "paid in") ?? 0,
    Reference = Get(cols, colIndex, "description") // Direct assignment, no extraction
};
```

## 10. Validation Criteria

**VAL-001**: Upload `sample-hsbc-statement_v2.csv` and verify all CR transactions are imported.

**VAL-002**: Verify that no BP or DD transactions appear in the imported transaction list.

**VAL-003**: Verify that the Reference field in the database matches the Description field from the CSV exactly.

**VAL-004**: Attempt to upload a v1 format file and verify a clear error message is returned.

**VAL-005**: Run the full test suite (`HsbcCsvParserTests.cs`) and verify all tests pass.

**VAL-006**: Perform end-to-end contribution matching with v2 data and verify members are matched correctly by reference.

**VAL-007**: Verify no errors or warnings are logged when processing a clean v2 CSV file.

**VAL-008**: Code review to confirm `HsbcReferenceExtractor.ExtractReference()` is no longer called in the parser logic.

## 11. Related Specifications / Further Reading

- [HSBC Bank Import Feature Documentation](docs/features/hsbc-bank-import.md)
- [Sample v1 CSV File](docs/sample-hsbc-statement_v1.csv)
- [Sample v2 CSV File](docs/sample-hsbc-statement_v2.csv)
- [HsbcCsvParser Implementation](ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs)
- [HsbcReferenceExtractor Implementation](ChurchRegister.ApiService/Services/Contributions/HsbcReferenceExtractor.cs)
- [Contribution Processing Service](ChurchRegister.ApiService/Services/Contributions/ContributionProcessingService.cs)
