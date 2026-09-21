---
goal: Implement HSBC CSV Format Migration from v1 to v2
version: 1.0
date_created: 2026-05-14
last_updated: 2026-05-14
owner: Development Team
status: "Completed"
tags: [feature, data, hsbc, csv-import, migration, contributions]
---

# Implementation Plan: HSBC CSV Format Migration (v1 → v2)

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This implementation plan defines the systematic approach to migrate the HSBC bank statement import functionality from the estimated v1 format to the actual v2 format exported by HSBC Online Banking. The changes include updated column names, transaction type filtering, and simplified reference extraction.

## 1. Requirements & Constraints

### Requirements

**REQ-001**: Update CSV parser to recognize v2 column names: `Date`, `Type`, `Description`, `Paid Out`, `Paid In`, `Balance`

**REQ-002**: Implement transaction type filtering to import only `Type = "CR"` (credit) transactions

**REQ-003**: Replace reference extraction logic with direct assignment from `Description` field

**REQ-004**: Remove support for v1 column name alternatives: `"money in"`, `"credit amount"`, `"credit"`

**REQ-005**: Update all unit tests to use v2 CSV format

**REQ-006**: Maintain backward compatibility for existing database records (no schema changes required)

**REQ-007**: Ensure zero breaking changes to downstream services (`ContributionProcessingService`, `HsbcTransactionImportService`)

### Constraints

**CON-001**: All changes must be implemented in `HsbcCsvParser.cs` only; no database migrations required

**CON-002**: Unit tests in `HsbcCsvParserTests.cs` will break and must be fixed atomically with parser changes

**CON-003**: `HsbcReferenceExtractor.ExtractReference()` must not be called from the parser for v2 format

**CON-004**: Maintain the same `HsbcTransaction` model structure (no breaking API changes)

**CON-005**: Date parsing must continue to support UK date format (DD/MM/YYYY or DD-MMM-YY)

### Guidelines

**GUD-001**: Use descriptive error messages that clearly indicate v2 format expectations

**GUD-002**: Log warnings for invalid transaction types but continue processing valid rows

**GUD-003**: Preserve existing error handling patterns for consistency

**GUD-004**: Add inline comments explaining v2-specific logic

## 2. Implementation Steps

### Implementation Phase 1: Parser Core Updates

**GOAL-001**: Update `HsbcCsvParser.cs` to support v2 column structure and transaction type filtering

| Task     | Description                                                                                                                                          | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Update `HasRequiredColumns()` method to check for `"type"` and `"paid in"` columns (remove `"money in"`, `"credit amount"`, `"credit"` alternatives) | ✅        | 2026-05-14 |
| TASK-002 | Add `GetTransactionType()` helper method to extract the `Type` column value                                                                          | ✅        | 2026-05-14 |
| TASK-003 | Update the main parsing loop to filter transactions where `Type != "CR"` (skip BP and DD)                                                            | ✅        | 2026-05-14 |
| TASK-004 | Update `ParseDecimal()` calls to use `"paid in"` instead of multiple alternatives                                                                    | ✅        | 2026-05-14 |
| TASK-005 | Replace `tx.Reference = HsbcReferenceExtractor.ExtractReference(tx.Description)` with `tx.Reference = tx.Description` (trimmed)                      | ✅        | 2026-05-14 |
| TASK-006 | Update error message for missing columns to reference v2 column names                                                                                | ✅        | 2026-05-14 |

**Files Modified**: `ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs`

### Implementation Phase 2: Date Parsing Enhancement

**GOAL-002**: Ensure date parsing supports both v1 format (DD/MM/YYYY) and v2 format (DD-MMM-YY)

| Task     | Description                                                                            | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Verify `ParseDate()` method handles "30-Dec-25" format (test with sample v2 data)      | ✅        | 2026-05-14 |
| TASK-008 | Add fallback parsing for multiple date formats if needed (DD/MM/YYYY, DD-MMM-YY, etc.) | ✅        | 2026-05-14 |
| TASK-009 | Add unit test for v2 date format parsing ("30-Dec-25" → December 30, 2025)             | ✅        | 2026-05-14 |

**Files Modified**: `ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs`, `ChurchRegister.Tests/Contributions/HsbcCsvParserTests.cs`

### Implementation Phase 3: Unit Test Migration

**GOAL-003**: Update all existing unit tests to use v2 CSV format and add new tests for v2-specific functionality

| Task     | Description                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-009 | Add unit test for v2 date format parsing ("30-Dec-25" → December 30, 2025)                                     | ✅        | 2026-05-14 |
| TASK-010 | Update `ParseAsync_WithMissingMoneyInColumn_ReturnsError()` to check for "Paid In" instead of "Money In"       | ✅        | 2026-05-14 |
| TASK-011 | Update `ParseAsync_WithValidCsv_ReturnsTransactions()` to use v2 format with Type column                       | ✅        | 2026-05-14 |
| TASK-012 | Update `ParseAsync_ExtractsReferenceFromDescription()` to verify direct assignment (no " REF " parsing)        | ✅        | 2026-05-14 |
| TASK-013 | Remove or update tests for v1 column alternatives (`AcceptsCreditAmountColumnName`, `AcceptsCreditColumnName`) | ✅        | 2026-05-14 |
| TASK-014 | Add test `ParseAsync_WithTypeColumn_FiltersNonCRTransactions()` to verify BP and DD rows are skipped           | ✅        | 2026-05-14 |
| TASK-015 | Add test `ParseAsync_WithV2Format_UsesDescriptionAsReference()` to verify no reference extraction              | ✅        | 2026-05-14 |
| TASK-016 | Add test `ParseAsync_WithMissingTypeColumn_ReturnsError()` to verify Type column is required                   | ✅        | 2026-05-14 |
| TASK-017 | Add test `ParseAsync_WithV2DateFormat_ParsesCorrectly()` for "DD-MMM-YY" format                                | ✅        | 2026-05-14 |
| TASK-018 | Update all test CSV strings to include `Date,Type,Description,Paid Out,Paid In,Balance` header                 | ✅        | 2026-05-14 |
| TASK-019 | Update `ParseAsync_HandlesQuotedFields()` test to use v2 format                                                | ✅        | 2026-05-14 |

**Files Modified**: `ChurchRegister.Tests/Contributions/HsbcCsvParserTests.cs`

### Implementation Phase 4: Integration Testing

**GOAL-004**: Verify end-to-end functionality with real v2 sample data

| Task     | Description                                                            | Completed | Date       |
| -------- | ---------------------------------------------------------------------- | --------- | ---------- |
| TASK-020 | Create integration test using `sample-hsbc-statement_v2.csv` file      | ✅        | 2026-05-14 |
| TASK-021 | Verify all 35+ CR transactions from sample file are imported correctly | ✅        | 2026-05-14 |
| TASK-022 | Verify BP and DD transactions are excluded from import                 | ✅        | 2026-05-14 |
| TASK-023 | Verify references match descriptions exactly (e.g., "DAVIES SP&SJ")    | ✅        | 2026-05-14 |
| TASK-024 | Run full test suite and verify 100% pass rate                          | ✅        | 2026-05-14 |

**Files Modified**: `ChurchRegister.Tests/Contributions/HsbcCsvParserTests.cs`, potentially new integration test file

### Implementation Phase 5: Documentation & Cleanup

**GOAL-005**: Update documentation and remove obsolete code references

| Task     | Description                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-025 | Update `docs/features/hsbc-bank-import.md` to reference v2 format                                           | ✅        | 2026-05-14 |
| TASK-026 | Add comment in `HsbcReferenceExtractor.cs` noting it's no longer used by parser (but may be used elsewhere) | ✅        | 2026-05-14 |
| TASK-027 | Update XML documentation comments in `HsbcCsvParser.cs` to reflect v2 format                                | ✅        | 2026-05-14 |
| TASK-028 | Review and update any inline comments referencing v1 format                                                 | ✅        | 2026-05-14 |
| TASK-029 | Archive or document `sample-hsbc-statement_v1.csv` as deprecated                                            | ✅        | 2026-05-14 |

**Files Modified**: `docs/features/hsbc-bank-import.md`, `ChurchRegister.ApiService/Services/Contributions/HsbcReferenceExtractor.cs`, `ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs`

## 3. Alternatives

**ALT-001**: Support both v1 and v2 formats with automatic detection

- **Rejected**: Adds unnecessary complexity; v1 was never used with real HSBC files
- **Trade-off**: Simpler codebase vs. theoretical backward compatibility

**ALT-002**: Create a new `HsbcCsvParserV2` class and maintain both parsers

- **Rejected**: Code duplication and maintenance burden
- **Trade-off**: Cleaner separation vs. duplicate logic

**ALT-003**: Keep reference extraction logic and apply it conditionally based on format detection

- **Rejected**: Unnecessary complexity; v2 descriptions are already clean references
- **Trade-off**: Flexibility vs. simplicity

**ALT-004**: Use a third-party CSV parsing library (CsvHelper, Sylvan.Data.Csv)

- **Rejected**: Current implementation is sufficient and has no external dependencies
- **Trade-off**: Feature-rich library vs. lightweight custom solution

**ALT-005**: Implement transaction type as an enum rather than string comparison

- **Considered**: Would be more type-safe but requires additional mapping logic
- **Trade-off**: Type safety vs. simplicity (current string comparison is adequate)

## 4. Dependencies

**DEP-001**: `sample-hsbc-statement_v2.csv` - Real v2 format sample file from HSBC export (already exists in repo)

**DEP-002**: No new NuGet packages required - all changes use existing .NET libraries

**DEP-003**: Entity Framework Core - Used by downstream services but no changes required

**DEP-004**: MSTest, FluentAssertions - Test frameworks for updated unit tests

**DEP-005**: No database schema changes required - existing `HSBCBankCreditTransaction` table schema remains unchanged

## 5. Files

**FILE-001**: `ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs`

- Primary implementation file
- Updates: Column name detection, type filtering, reference assignment
- Lines affected: ~90-110 (HasRequiredColumns, parsing loop, reference extraction)

**FILE-002**: `ChurchRegister.Tests/Contributions/HsbcCsvParserTests.cs`

- All test methods will be updated to use v2 format
- New tests added for type filtering and v2 date format
- Approximately 20+ test methods affected

**FILE-003**: `ChurchRegister.ApiService/Services/Contributions/HsbcReferenceExtractor.cs`

- No functional changes
- Documentation update only (note that parser no longer uses this for v2)

**FILE-004**: `docs/features/hsbc-bank-import.md`

- Update documentation to reference v2 format
- Add note about v1 deprecation

**FILE-005**: `docs/sample-hsbc-statement_v1.csv`

- Mark as deprecated in documentation (file can remain for historical reference)

**FILE-006**: `docs/sample-hsbc-statement_v2.csv`

- Already exists; serves as reference for v2 format

## 6. Testing

### Unit Tests

**TEST-001**: `ParseAsync_WithMissingTypeColumn_ReturnsError()`

- Verify parser rejects CSV without Type column
- Expected: Error message contains "Type"

**TEST-002**: `ParseAsync_WithV2Format_FiltersNonCRTransactions()`

- Input: CSV with 3 CR, 2 BP, 1 DD transactions
- Expected: Only 3 CR transactions imported

**TEST-003**: `ParseAsync_WithV2Format_UsesDescriptionAsReference()`

- Input: Description = "DAVIES SP&SJ"
- Expected: Reference = "DAVIES SP&SJ" (no extraction)

**TEST-004**: `ParseAsync_WithV2DateFormat_ParsesCorrectly()`

- Input: Date = "30-Dec-25"
- Expected: DateTime = December 30, 2025

**TEST-005**: `ParseAsync_WithV2ColumnNames_RecognizesPaidIn()`

- Input: CSV with "Paid In" column
- Expected: Transactions parsed successfully

**TEST-006**: Update all existing 20+ tests to use v2 CSV format

- Replace "Money In" with "Paid In"
- Add "Type" column with "CR" value
- Update reference expectations (no " REF " marker)

### Integration Tests

**TEST-007**: `ParseAsync_WithSampleV2File_ImportsAllCRTransactions()`

- Input: `sample-hsbc-statement_v2.csv`
- Expected: 35+ CR transactions imported, 0 BP/DD transactions

**TEST-008**: End-to-end upload test with v2 file

- Upload sample v2 file via API endpoint
- Verify transactions stored in database
- Verify contribution matching works correctly

### Manual Testing

**TEST-009**: Export actual HSBC statement and upload

- Download CSV from HSBC Online Banking
- Upload via application UI
- Verify successful import and member matching

**TEST-010**: Attempt to upload v1 format file (if any exist)

- Expected: Clear error message about missing columns

## 7. Risks & Assumptions

### Risks

**RISK-001**: HSBC changes CSV format again in the future

- **Mitigation**: Implement robust column detection and provide clear error messages
- **Impact**: Medium - would require another parser update
- **Probability**: Low - bank CSV formats are typically stable

**RISK-002**: Existing v1 data in database becomes orphaned

- **Mitigation**: Database records remain unchanged; only new uploads affected
- **Impact**: None - existing records are unaffected
- **Probability**: Zero - no database changes

**RISK-003**: Unit tests may reveal edge cases not covered in specification

- **Mitigation**: Address edge cases as they're discovered during test updates
- **Impact**: Low - may require additional test cases
- **Probability**: Medium

**RISK-004**: Description field in v2 format may contain unwanted text requiring parsing

- **Mitigation**: Monitor real-world imports; can reintroduce parsing if needed
- **Impact**: Low - user can manually adjust references in UI
- **Probability**: Low - v2 samples show clean descriptions

**RISK-005**: Date parsing may fail for some v2 date format variations

- **Mitigation**: Implement multiple format attempts in ParseDate method
- **Impact**: Medium - failed imports require manual intervention
- **Probability**: Low - UK culture parsing should handle both formats

### Assumptions

**ASSUMPTION-001**: All future HSBC exports will use the v2 format (columns: Date, Type, Description, Paid Out, Paid In, Balance)

**ASSUMPTION-002**: The Type column will only contain values CR, BP, DD (or possibly new codes that we can safely ignore)

**ASSUMPTION-003**: The Description field in v2 format is suitable for direct use as reference without parsing

**ASSUMPTION-004**: No users have v1 format files that need to be imported after this change

**ASSUMPTION-005**: Downstream services (`ContributionProcessingService`, `HsbcTransactionImportService`) do not depend on the reference extraction logic

**ASSUMPTION-006**: The date format in v2 (DD-MMM-YY) is consistently used and parseable by UK culture settings

**ASSUMPTION-007**: Empty or missing Balance column values are acceptable (parser doesn't use this field)

## 8. Related Specifications / Further Reading

- [HSBC CSV Format Specification v2](hsbc-spec.md)
- [HSBC Bank Import Feature Documentation](docs/features/hsbc-bank-import.md)
- [Sample v1 CSV File (Deprecated)](docs/sample-hsbc-statement_v1.csv)
- [Sample v2 CSV File](docs/sample-hsbc-statement_v2.csv)
- [HsbcCsvParser Source](ChurchRegister.ApiService/Services/Contributions/HsbcCsvParser.cs)
- [HsbcCsvParserTests Source](ChurchRegister.Tests/Contributions/HsbcCsvParserTests.cs)
- [Contribution Processing Service](ChurchRegister.ApiService/Services/Contributions/ContributionProcessingService.cs)
