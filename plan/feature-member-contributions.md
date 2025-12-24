---
goal: Implement Automated Church Member Contributions Processing and Tracking System
version: 1.0
date_created: 2025-12-23
last_updated: 2025-12-23
owner: Church Register Development Team
status: "Planned"
tags:
  [
    feature,
    financial,
    data-processing,
    church-members,
    contributions,
    hsbc-integration,
    database,
  ]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan defines the phased approach to building an automated church member contributions processing system. The system will automatically match HSBC bank transactions to church members based on bank references, create contribution records, and provide comprehensive contribution tracking and reporting capabilities.

## 1. Requirements & Constraints

### Core Requirements

- **REQ-001**: System MUST automatically process HSBC transactions into member contributions immediately after successful file upload
- **REQ-002**: System MUST match HSBC transactions to ChurchMember records using case-insensitive comparison of HSBCBankCreditTransaction.Reference to ChurchMember.BankReference
- **REQ-003**: System MUST insert a record into ChurchMemberContributions for each successfully matched transaction
- **REQ-004**: System MUST mark matched HSBC transactions as processed by setting IsProcessed = 1
- **REQ-005**: System MUST leave unmatched transactions with IsProcessed = 0
- **REQ-006**: System MUST prevent insertion of duplicate contributions by checking if HSBCBankCreditTransaction.Id already exists in ChurchMemberContributions
- **REQ-007**: Processing logic MUST be structured as a reusable service method to support future re-process functionality
- **REQ-008**: System MUST enforce unique BankReference values across all active ChurchMember records
- **REQ-009**: Church Members Management grid MUST include a new column "ThisYearsContribution"
- **REQ-010**: System MUST provide a detailed contribution history view accessible from the church member row context menu

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

### Performance Constraints

- **PERF-001**: Processing 100 transactions must complete in under 5 seconds
- **PERF-002**: ThisYearsContribution calculation must add less than 200ms to members grid query
- **PERF-003**: Contribution history query must return results in under 1 second for members with 1000+ contributions

### Guidelines

- **GUD-001**: Processing service should be designed for testability with dependency injection
- **GUD-002**: Matching logic should be case-insensitive and trim whitespace
- **GUD-003**: Error messages for unmatched transactions should be clear and actionable
- **GUD-004**: UI should provide clear feedback during and after processing

### Patterns to Follow

- **PAT-001**: Use FastEndpoints for API endpoint implementation
- **PAT-002**: Follow existing repository pattern for data access
- **PAT-003**: Use Entity Framework Core for database operations
- **PAT-004**: Implement service layer with interface-based dependency injection
- **PAT-005**: Follow existing audit logging patterns for contribution records

## 2. Implementation Steps

### Phase 1: Database Schema and Entities

**GOAL-001**: Establish database foundation for contribution tracking with proper schema, indexes, and constraints

| Task     | Description                                                                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-001 | Create migration to add IsProcessed column to HSBCBankCreditTransactions table with default value 0, plus indexes on IsProcessed and Reference columns | ✅        | 2025-12-23 |
| TASK-002 | Create migration to add ChurchMemberContributions table with all required columns, foreign keys, check constraints, and indexes                        | ✅        | 2025-12-23 |
| TASK-003 | Create migration to add unique index on ChurchMembers.BankReference for active non-deleted members                                                     | ✅        | 2025-12-23 |
| TASK-004 | Create ContributionType enum in ChurchRegister.Database/Enums with values Cash=1, Transfer=2                                                           | ✅        | 2025-12-23 |
| TASK-005 | Create ChurchMemberContribution entity class in ChurchRegister.Database/Entities implementing IAuditableEntity with navigation properties              | ✅        | 2025-12-23 |
| TASK-006 | Update ChurchRegisterWebContext to include ChurchMemberContributions DbSet and configure entity relationships                                          | ✅        | 2025-12-23 |
| TASK-007 | Update HSBCBankCreditTransaction entity to include IsProcessed property and navigation to ChurchMemberContribution                                     | ✅        | 2025-12-23 |
| TASK-008 | Apply migrations to development database and verify schema creation                                                                                    | ✅        | 2025-12-23 |

### Phase 2: Core Processing Service

**GOAL-002**: Implement contribution processing service with matching logic and duplicate prevention

| Task     | Description                                                                                                                                                                                                                                                                                                          | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-009 | Create IContributionProcessingService interface in ChurchRegister.ApiService/Services with ProcessHsbcTransactionsAsync method                                                                                                                                                                                       | ✅        | 2025-12-23 |
| TASK-010 | Create ContributionProcessingResult model class in ChurchRegister.ApiService/Services with Success, MatchedCount, UnmatchedCount, TotalAmount, UnmatchedReferences, Errors properties                                                                                                                                | ✅        | 2025-12-23 |
| TASK-011 | Implement ContributionProcessingService class with constructor injecting IChurchRegisterWebContext and ILogger                                                                                                                                                                                                       | ✅        | 2025-12-23 |
| TASK-012 | Implement matching logic: query unprocessed HSBC transactions (IsProcessed=0), case-insensitive trim Reference matching against ChurchMember.BankReference                                                                                                                                                           | ✅        | 2025-12-23 |
| TASK-013 | Implement contribution record creation: for each matched transaction, create ChurchMemberContribution with Amount=MoneyIn, Date=transaction date, TransactionRef=Reference, Description=Description, ContributionTypeId=2, HSBCBankCreditTransactionId=transaction.Id, CreatedBy=uploadedBy, CreatedDateTime=UTC now | ✅        | 2025-12-23 |
| TASK-014 | Implement duplicate prevention: check if HSBCBankCreditTransactionId already exists in ChurchMemberContributions before inserting                                                                                                                                                                                    | ✅        | 2025-12-23 |
| TASK-015 | Implement IsProcessed flag update: set IsProcessed=1 for all matched transactions                                                                                                                                                                                                                                    | ✅        | 2025-12-23 |
| TASK-016 | Implement unmatched transaction tracking: collect References for transactions that don't match any member, return in UnmatchedReferences list                                                                                                                                                                        | ✅        | 2025-12-23 |
| TASK-017 | Implement error handling: wrap in try-catch, log errors, return Success=false with error details                                                                                                                                                                                                                     | ✅        | 2025-12-23 |
| TASK-018 | Register ContributionProcessingService in Program.cs as scoped service                                                                                                                                                                                                                                               | ✅        | 2025-12-23 |

### Phase 3: API Integration

**GOAL-003**: Integrate contribution processing into HSBC upload endpoint with enhanced response data

| Task     | Description                                                                                                                                                                                    | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-019 | Create ContributionProcessingSummary model in ChurchRegister.ApiService/Models/Financial with MatchedTransactions, UnmatchedTransactions, TotalAmountProcessed, UnmatchedReferences properties | ✅        | 2025-12-23 |
| TASK-020 | Update UploadHsbcStatementResponse model to include ProcessingSummary property of type ContributionProcessingSummary                                                                           | ✅        | 2025-12-23 |
| TASK-021 | Update UploadHsbcStatementEndpoint to inject IContributionProcessingService in constructor                                                                                                     | ✅        | 2025-12-23 |
| TASK-022 | Update UploadHsbcStatementEndpoint.HandleAsync: after successful HSBC import, call ProcessHsbcTransactionsAsync with user email                                                                | ✅        | 2025-12-23 |
| TASK-023 | Map ContributionProcessingResult to ContributionProcessingSummary and add to response                                                                                                          | ✅        | 2025-12-23 |
| TASK-024 | Update response message to include contribution processing summary details                                                                                                                     | ✅        | 2025-12-23 |

### Phase 4: BankReference Validation

**GOAL-004**: Enforce unique BankReference constraint with proper validation feedback

| Task     | Description                                                                                                                                                                                                                                                        | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-025 | Identify ChurchMember create/update endpoints in ChurchRegister.ApiService/Endpoints/Administration                                                                                                                                                                | ✅        | 2025-12-23 |
| TASK-026 | Add BankReference uniqueness validation: query ChurchMembers for existing BankReference (case-insensitive, excluding current member ID for updates, excluding deleted/inactive)                                                                                    | ✅        | 2025-12-23 |
| TASK-027 | Return validation error with clear message if duplicate BankReference found: "Bank reference '{reference}' is already in use by another active member"                                                                                                             | ✅        | 2025-12-23 |
| TASK-028 | Add unit tests for BankReference validation covering: new member with unique reference (success), new member with duplicate reference (fail), update with same reference (success), update with another member's reference (fail), null/empty references (success) | ✅        | 2025-12-23 |

### Phase 5: Frontend - Upload Modal Enhancement

**GOAL-005**: Display contribution processing summary in HSBC upload modal with clear success metrics

| Task     | Description                                                                                                                        | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-029 | Update UploadHsbcStatementResponse TypeScript interface in ChurchRegister.React/src/api/types to include processingSummary field   | ✅        | 2025-12-23 |
| TASK-030 | Verify HsbcUploadModal.tsx already displays result.processingSummary data (from previous implementation)                           | ✅        | 2025-12-23 |
| TASK-031 | Ensure modal shows: matched transactions count, unmatched transactions count, total amount processed, list of unmatched references | ✅        | 2025-12-23 |
| TASK-032 | Ensure matched transactions count is highlighted in green to indicate successful processing                                        | ✅        | 2025-12-23 |
| TASK-033 | Add conditional display: only show unmatched references section if unmatchedTransactions > 0                                       | ✅        | 2025-12-23 |

### Phase 6: Frontend - ThisYearsContribution Column

**GOAL-006**: Add calculated contribution column to Church Members Management grid with proper formatting

| Task     | Description                                                                                                                                                                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-034 | Update ChurchMembersManagement backend endpoint (identify in ChurchRegister.ApiService/Endpoints/Administration) to include LEFT JOIN to ChurchMemberContributions with date filter for current calendar year | ✅        | 2025-12-23 |
| TASK-035 | Add calculated column: ISNULL(SUM(cmc.Amount), 0) AS ThisYearsContribution with GROUP BY on member fields                                                                                                     | ✅        | 2025-12-23 |
| TASK-036 | Update ChurchMemberDto model to include ThisYearsContribution property of type decimal                                                                                                                        | ✅        | 2025-12-23 |
| TASK-037 | Update ChurchMembersManagement.tsx data grid columns to include ThisYearsContribution column with header "This Year's Contribution"                                                                           | ✅        | 2025-12-23 |
| TASK-038 | Format ThisYearsContribution column with currency symbol (£) and 2 decimal places using valueFormatter                                                                                                        | ✅        | 2025-12-23 |
| TASK-039 | Enable sorting on ThisYearsContribution column (sortable: true)                                                                                                                                               | ✅        | 2025-12-23 |
| TASK-040 | Set appropriate column width (e.g., 180px) for ThisYearsContribution                                                                                                                                          | ✅        | 2025-12-23 |

### Phase 7: Frontend - Contribution History View

**GOAL-007**: Implement contribution history dialog with date filtering and export capabilities

| Task     | Description                                                                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-041 | Create GET endpoint /api/church-members/{memberId}/contributions in ChurchRegister.ApiService/Endpoints/Financial with [Authorize] requiring FinancialViewer/FinancialContributor/FinancialAdministrator roles | ✅        | 2025-12-23 |
| TASK-042 | Implement endpoint to accept query parameters: startDate (optional, defaults to Jan 1 current year), endDate (optional, defaults to Dec 31 current year)                                                       | ✅        | 2025-12-23 |
| TASK-043 | Query ChurchMemberContributions with ChurchMemberId filter, date range filter, join to ContributionTypes, order by Date DESC                                                                                   | ✅        | 2025-12-23 |
| TASK-044 | Return List<ContributionHistoryDto> with Id, Date, Amount, ContributionType, TransactionRef, Description                                                                                                       | ✅        | 2025-12-23 |
| TASK-045 | Create ContributionHistoryDto TypeScript interface in ChurchRegister.React/src/api/types matching backend model                                                                                                | ✅        | 2025-12-23 |
| TASK-046 | Create contributionHistoryApi.ts in ChurchRegister.React/src/api with getContributionHistory(memberId, startDate, endDate) method                                                                              | ✅        | 2025-12-23 |
| TASK-047 | Create ContributionHistoryDialog.tsx component in ChurchRegister.React/src/components/Administration with Material-UI Dialog, DataGrid, and date range pickers                                                 | ✅        | 2025-12-23 |
| TASK-048 | Implement data grid columns: Date (formatted), Amount (formatted with £), Contribution Type, Transaction Reference, Description                                                                                | ✅        | 2025-12-23 |
| TASK-049 | Add date range filter controls with default to current calendar year (Jan 1 to Dec 31)                                                                                                                         | ✅        | 2025-12-23 |
| TASK-050 | Add "Export to CSV" button that triggers export functionality (using DataGrid export features)                                                                                                                 | ✅        | 2025-12-23 |
| TASK-051 | Ensure grid is read-only: no edit/delete actions visible                                                                                                                                                       | ✅        | 2025-12-23 |
| TASK-052 | Add context menu option "View Contributions" to ChurchMembersManagement.tsx data grid row actions                                                                                                              | ✅        | 2025-12-23 |
| TASK-053 | Wire context menu option to open ContributionHistoryDialog with selected member ID                                                                                                                             | ✅        | 2025-12-23 |

### Phase 8: Testing

**GOAL-008**: Comprehensive test coverage for all contribution processing functionality

| Task     | Description                                                                                                                                               | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-054 | Create ContributionProcessingServiceTests.cs in ChurchRegister.Tests/Services with test fixtures for members and transactions                             |           |      |
| TASK-055 | Test case: ProcessHsbcTransactions_MatchesCorrectly_CaseInsensitive - verify "TEST-REF" matches "test-ref"                                                |           |      |
| TASK-056 | Test case: ProcessHsbcTransactions_PreventsDuplicates - verify no duplicate contributions created for same transaction                                    |           |      |
| TASK-057 | Test case: ProcessHsbcTransactions_HandlesUnmatched - verify unmatched transactions remain IsProcessed=0 and appear in UnmatchedReferences                |           |      |
| TASK-058 | Test case: ProcessHsbcTransactions_SetsIsProcessedFlag - verify IsProcessed=1 for all matched transactions                                                |           |      |
| TASK-059 | Test case: ProcessHsbcTransactions_CreatesCorrectContributions - verify Amount, Date, TransactionRef, Description, ContributionTypeId populated correctly |           |      |
| TASK-060 | Test case: ProcessHsbcTransactions_TrimsWhitespace - verify " REF-001 " matches "REF-001"                                                                 |           |      |
| TASK-061 | Create UploadHsbcStatementEndpointTests.cs integration test to verify contribution processing called after upload                                         |           |      |
| TASK-062 | Create ContributionHistoryEndpointTests.cs integration test for: successful query, date filtering, authorization checks (403 for non-financial users)     |           |      |
| TASK-063 | Create BankReferenceValidationTests.cs for: duplicate detection, case-insensitive validation, update scenarios                                            |           |      |
| TASK-064 | Frontend: Create ContributionHistoryDialog.test.tsx with Vitest to test dialog rendering, data fetching, date filtering, export functionality             |           |      |

### Phase 9: Documentation and Deployment

**GOAL-009**: Complete documentation and prepare for production deployment

| Task     | Description                                                                                                                               | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-065 | Update local-development-setup.md with instructions for running contribution migrations                                                   |           |      |
| TASK-066 | Document BankReference field usage in church member management documentation                                                              |           |      |
| TASK-067 | Create SQL script for production migration deployment in SQL Scripts folder                                                               |           |      |
| TASK-068 | Add seed data for ContributionTypes table (if not already present) in Seed Scripts.sql                                                    |           |      |
| TASK-069 | Update HSBC-Feature-Verification.md with contribution processing verification steps                                                       |           |      |
| TASK-070 | Create release notes describing new contribution tracking features                                                                        |           |      |
| TASK-071 | Perform end-to-end testing in staging environment: upload HSBC file, verify processing, check grid column, view history, test permissions |           |      |
| TASK-072 | Deploy database migrations to production                                                                                                  |           |      |
| TASK-073 | Deploy application updates to production                                                                                                  |           |      |
| TASK-074 | Verify production deployment: smoke test upload, processing, and display features                                                         |           |      |

## 3. Alternatives

- **ALT-001**: Background job processing - Considered using Hangfire or Azure Functions to process contributions in background after upload, but rejected in favor of immediate processing for instant user feedback and simpler architecture. Can be reconsidered later if performance issues arise.

- **ALT-002**: Lifetime contributions display - Considered adding a "Total Contributions" column showing all-time giving, but rejected to keep UI focused on current year patterns and avoid query complexity. Can be added later via separate reports.

- **ALT-003**: Manual contribution entry - Considered building UI for manual contribution entry (for cash donations), but deferred as out of scope for initial implementation. Future enhancement will add this capability.

- **ALT-004**: Editable contribution records - Considered allowing users to edit contribution amounts/dates, but rejected to maintain audit trail integrity. Corrections will be handled through adjustment records in future enhancement.

- **ALT-005**: Multiple BankReferences per member - Considered allowing members to have multiple bank references (e.g., joint account and personal account), but rejected for simplicity. Future enhancement can add one-to-many relationship if needed.

- **ALT-006**: Soft delete for unmatched transactions - Considered marking unmatched transactions as "ignored" with soft delete, but rejected in favor of immutable IsProcessed flag that preserves all data for future re-processing.

## 4. Dependencies

- **DEP-001**: HSBC bank statement upload functionality must be operational (already exists in UploadHsbcStatementEndpoint)
- **DEP-002**: ChurchMembers table must have BankReference column (verify existence before Phase 1)
- **DEP-003**: ContributionTypes lookup table must exist with values 1=Cash, 2=Transfer (verify or create in Phase 1)
- **DEP-004**: HSBCBankCreditTransactions table must have Id, Date, Description, Reference, MoneyIn columns (already exists)
- **DEP-005**: Entity Framework Core migrations infrastructure must be configured (already exists)
- **DEP-006**: FastEndpoints package must be installed and configured (already in use)
- **DEP-007**: ASP.NET Core Identity with role-based authorization must be configured (already exists)
- **DEP-008**: Material-UI DataGrid component must be available in React frontend (verify or install)
- **DEP-009**: React date picker component must be available (Material-UI DatePicker or similar)
- **DEP-010**: Frontend API client infrastructure must exist (apiClient already configured in hsbcTransactionsApi.ts pattern)

## 5. Files

### Backend Files - Database Layer

- **FILE-001**: `ChurchRegister.Database/Migrations/[Timestamp]_AddIsProcessedToHsbcTransactions.cs` - Migration for IsProcessed column
- **FILE-002**: `ChurchRegister.Database/Migrations/[Timestamp]_CreateChurchMemberContributions.cs` - Migration for contributions table
- **FILE-003**: `ChurchRegister.Database/Migrations/[Timestamp]_AddBankReferenceUniqueConstraint.cs` - Migration for unique index
- **FILE-004**: `ChurchRegister.Database/Enums/ContributionType.cs` - New enum for contribution types
- **FILE-005**: `ChurchRegister.Database/Entities/ChurchMemberContribution.cs` - New entity class
- **FILE-006**: `ChurchRegister.Database/Entities/HSBCBankCreditTransaction.cs` - Update with IsProcessed property
- **FILE-007**: `ChurchRegister.Database/Data/ChurchRegisterWebContext.cs` - Update with DbSet and configuration

### Backend Files - Service Layer

- **FILE-008**: `ChurchRegister.ApiService/Services/IContributionProcessingService.cs` - New service interface
- **FILE-009**: `ChurchRegister.ApiService/Services/ContributionProcessingService.cs` - New service implementation
- **FILE-010**: `ChurchRegister.ApiService/Services/ContributionProcessingResult.cs` - New result model

### Backend Files - API Layer

- **FILE-011**: `ChurchRegister.ApiService/Models/Financial/ContributionProcessingSummary.cs` - New API response model
- **FILE-012**: `ChurchRegister.ApiService/Models/Financial/UploadHsbcStatementResponse.cs` - Update with ProcessingSummary
- **FILE-013**: `ChurchRegister.ApiService/Models/Financial/ContributionHistoryDto.cs` - New DTO for contribution history
- **FILE-014**: `ChurchRegister.ApiService/Endpoints/Financial/UploadHsbcStatementEndpoint.cs` - Update with processing service call
- **FILE-015**: `ChurchRegister.ApiService/Endpoints/Financial/GetContributionHistoryEndpoint.cs` - New endpoint for contribution history
- **FILE-016**: `ChurchRegister.ApiService/Endpoints/Administration/[ChurchMemberEndpoint].cs` - Update with BankReference validation
- **FILE-017**: `ChurchRegister.ApiService/Endpoints/Administration/[GetChurchMembersEndpoint].cs` - Update query for ThisYearsContribution
- **FILE-018**: `ChurchRegister.ApiService/Program.cs` - Register ContributionProcessingService

### Frontend Files - Type Definitions

- **FILE-019**: `ChurchRegister.React/src/api/types/financial.ts` - Update UploadHsbcStatementResponse interface
- **FILE-020**: `ChurchRegister.React/src/api/types/contributions.ts` - New types for ContributionHistoryDto

### Frontend Files - API Clients

- **FILE-021**: `ChurchRegister.React/src/api/contributionHistoryApi.ts` - New API client for contribution history

### Frontend Files - Components

- **FILE-022**: `ChurchRegister.React/src/components/Financial/HsbcUploadModal.tsx` - Verify/update processing summary display
- **FILE-023**: `ChurchRegister.React/src/components/Administration/ChurchMembersManagement.tsx` - Add ThisYearsContribution column and context menu
- **FILE-024**: `ChurchRegister.React/src/components/Administration/ContributionHistoryDialog.tsx` - New dialog component

### Test Files

- **FILE-025**: `ChurchRegister.Tests/Services/ContributionProcessingServiceTests.cs` - New unit test class
- **FILE-026**: `ChurchRegister.Tests/Endpoints/UploadHsbcStatementEndpointTests.cs` - Update with contribution processing tests
- **FILE-027**: `ChurchRegister.Tests/Endpoints/ContributionHistoryEndpointTests.cs` - New integration test class
- **FILE-028**: `ChurchRegister.Tests/Endpoints/BankReferenceValidationTests.cs` - New validation test class
- **FILE-029**: `ChurchRegister.React/src/components/Administration/ContributionHistoryDialog.test.tsx` - New frontend test

### Documentation Files

- **FILE-030**: `docs/local-development-setup.md` - Update with contribution feature setup
- **FILE-031**: `HSBC-Feature-Verification.md` - Update with contribution verification steps
- **FILE-032**: `SQL Scripts/Database Schema.sql` - Update with new tables and columns
- **FILE-033**: `SQL Scripts/Seed Scripts.sql` - Update with ContributionTypes seed data

## 6. Testing

### Unit Tests

- **TEST-001**: ContributionProcessingService - Case-insensitive matching with various reference formats (UPPERCASE, lowercase, MixedCase)
- **TEST-002**: ContributionProcessingService - Whitespace trimming in references (" REF ", "REF ", " REF")
- **TEST-003**: ContributionProcessingService - Duplicate prevention when HSBCBankCreditTransactionId already exists in contributions
- **TEST-004**: ContributionProcessingService - Unmatched transaction handling returns correct UnmatchedReferences list
- **TEST-005**: ContributionProcessingService - IsProcessed flag set to 1 for matched transactions
- **TEST-006**: ContributionProcessingService - IsProcessed flag remains 0 for unmatched transactions
- **TEST-007**: ContributionProcessingService - Contribution record has correct Amount, Date, TransactionRef, Description, ContributionTypeId=2
- **TEST-008**: ContributionProcessingService - CreatedBy and CreatedDateTime populated correctly
- **TEST-009**: ContributionProcessingService - Null/empty references handled correctly
- **TEST-010**: ContributionProcessingService - Error handling returns Success=false with error details
- **TEST-011**: BankReference validation - Duplicate detection case-insensitive
- **TEST-012**: BankReference validation - Allow update with same reference
- **TEST-013**: BankReference validation - Reject update with another member's reference
- **TEST-014**: BankReference validation - Allow null/empty references

### Integration Tests

- **TEST-015**: UploadHsbcStatementEndpoint - Contribution processing called after successful HSBC import
- **TEST-016**: UploadHsbcStatementEndpoint - ProcessingSummary included in response with correct counts
- **TEST-017**: GetContributionHistoryEndpoint - Returns contributions for specified member
- **TEST-018**: GetContributionHistoryEndpoint - Date filtering works correctly (startDate, endDate)
- **TEST-019**: GetContributionHistoryEndpoint - Results ordered by Date DESC
- **TEST-020**: GetContributionHistoryEndpoint - Returns 403 for users without financial roles
- **TEST-021**: GetContributionHistoryEndpoint - FinancialViewer can access data
- **TEST-022**: GetChurchMembersEndpoint - ThisYearsContribution calculated correctly
- **TEST-023**: GetChurchMembersEndpoint - ThisYearsContribution returns 0 for members with no contributions
- **TEST-024**: Database - ChurchMemberContributions foreign keys enforce referential integrity
- **TEST-025**: Database - ChurchMemberContributions amount check constraint rejects negative values
- **TEST-026**: Database - BankReference unique index prevents duplicate active member references

### End-to-End Tests

- **TEST-027**: Upload HSBC file Processing completes ProcessingSummary displayed in modal with matched/unmatched counts
- **TEST-028**: Upload HSBC file View ChurchMembers grid ThisYearsContribution column shows correct amounts
- **TEST-029**: Right-click member row Select "View Contributions" Dialog opens with contribution history
- **TEST-030**: Contribution history dialog Change date range Results update correctly
- **TEST-031**: Contribution history dialog Click export CSV file downloads with correct data
- **TEST-032**: Create/edit member Enter duplicate BankReference Validation error displayed
- **TEST-033**: Upload HSBC file with 100 transactions Processing completes in under 5 seconds (performance)

### Frontend Tests

- **TEST-034**: ContributionHistoryDialog - Renders with correct columns
- **TEST-035**: ContributionHistoryDialog - Fetches data on mount with default date range (current year)
- **TEST-036**: ContributionHistoryDialog - Date filter updates trigger new data fetch
- **TEST-037**: ContributionHistoryDialog - Export button calls export function
- **TEST-038**: ContributionHistoryDialog - Displays "No contributions found" message when empty
- **TEST-039**: HsbcUploadModal - ProcessingSummary section displays matched/unmatched counts
- **TEST-040**: HsbcUploadModal - Unmatched references list displays when unmatchedTransactions > 0
- **TEST-041**: ChurchMembersManagement - ThisYearsContribution column renders with currency formatting
- **TEST-042**: ChurchMembersManagement - Context menu includes "View Contributions" option

## 7. Risks & Assumptions

### Risks

- **RISK-001**: Performance degradation - If church has many members (10,000+) and many contributions (100,000+), the LEFT JOIN for ThisYearsContribution calculation may slow down the members grid query. Mitigation: Add database indexes, consider denormalization/caching if performance issues arise.

- **RISK-002**: Data quality issues - Existing BankReference values in ChurchMembers table may have duplicates or inconsistent formatting. Mitigation: Run data quality checks before applying unique constraint, clean up duplicates, provide migration script to standardize formatting.

- **RISK-003**: IsProcessed immutability - Once IsProcessed is set to 1, there's no built-in way to "reprocess" transactions if matching logic changes or corrections are needed. Mitigation: Design reprocessing feature as future enhancement with proper audit trail.

- **RISK-004**: Concurrent uploads - Multiple users uploading HSBC files simultaneously could cause race conditions in contribution processing. Mitigation: Use database transactions with appropriate isolation level, consider adding upload queue if this becomes an issue.

- **RISK-005**: Missing ContributionTypes data - If ContributionTypes table doesn't exist or doesn't have required values (1=Cash, 2=Transfer), migrations will fail. Mitigation: Verify table exists before Phase 1, add to seed scripts if missing.

- **RISK-006**: Authorization configuration - If financial roles (FinancialViewer, FinancialContributor, FinancialAdministrator) are not properly configured in ASP.NET Core Identity, authorization checks will fail. Mitigation: Verify role configuration exists before Phase 7.

- **RISK-007**: Frontend date picker compatibility - Material-UI date pickers may have version compatibility issues or require additional dependencies. Mitigation: Test date picker component early in Phase 7, consider alternative if issues arise.

### Assumptions

- **ASSUMPTION-001**: HSBC bank statement upload functionality is working correctly and reliably imports transactions into HSBCBankCreditTransactions table

- **ASSUMPTION-002**: ChurchMembers table has BankReference column (NVARCHAR) - if not, need additional migration to add it

- **ASSUMPTION-003**: ContributionTypes lookup table exists with Id (INT) and Name (NVARCHAR) columns

- **ASSUMPTION-004**: HSBCBankCreditTransaction.Reference field contains the member's bank reference exactly as entered (may vary in case/whitespace)

- **ASSUMPTION-005**: Church members use unique bank references when making transfers - no two members share the same reference

- **ASSUMPTION-006**: Calendar year for ThisYearsContribution is based on transaction date, not fiscal year or other date range

- **ASSUMPTION-007**: All monetary amounts are in GBP (£) - no multi-currency support needed

- **ASSUMPTION-008**: Contribution history export to CSV is sufficient - Excel/PDF export can be added later if requested

- **ASSUMPTION-009**: Read-only contribution history is acceptable - edit/delete functionality not required in initial release

- **ASSUMPTION-010**: Immediate processing after upload is acceptable - background job processing not required for initial release

- **ASSUMPTION-011**: Existing audit logging infrastructure (IAuditableEntity, CreatedBy, CreatedDateTime) is sufficient for contribution records

- **ASSUMPTION-012**: SQL Server database is used - no need for multi-database support (PostgreSQL, MySQL, etc.)

## 8. Related Specifications / Further Reading

- [Church Member Contributions Specification](../spec/member-contributions-spec.md) - Complete technical specification with requirements, data contracts, and acceptance criteria
- [HSBC Transactions Specification](../spec/hsbc-transactions-spec.md) - HSBC file upload and parsing functionality
- [Church Members Specification](../spec/church-members-spec.md) - Church member management system
- [Financial Roles and Permissions](../docs/security-roles.md) - Role-based access control for financial features
- [Entity Framework Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/) - Database migration documentation
- [FastEndpoints Documentation](https://fast-endpoints.com/) - API endpoint framework
- [Material-UI DataGrid](https://mui.com/x/react-data-grid/) - Frontend data grid component
- [UK Gift Aid Guidance](https://www.gov.uk/claim-gift-aid) - For future Gift Aid claiming functionality
