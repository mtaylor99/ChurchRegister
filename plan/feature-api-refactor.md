---
goal: Refactor API to Ensure Consistent Clean Architecture Pattern Across All Features
version: 1.0
date_created: 2026-02-20
last_updated: 2026-03-01
owner: Development Team
status: "Completed"
tags: [refactor, architecture, clean-architecture, use-cases, consistency, backend]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This implementation plan addresses architectural inconsistencies in the ChurchRegister API. While the ChurchMembers and Contributions features follow a consistent Clean Architecture pattern with proper use case layer separation, other features (RiskAssessments, Reminders, DataProtection, Districts) have structural inconsistencies that violate this pattern.

The primary goal is to ensure all API features follow the same architectural standards established by the reference implementations, promoting maintainability, testability, and separation of concerns.

## Current State Analysis

**Reference Pattern (ChurchMembers, Contributions, Attendance, TrainingCertificates, Security):**
- Each use case in its own folder (e.g., `CreateChurchMember/`)
- Separate interface file: `ICreateChurchMemberUseCase.cs`
- Separate implementation file: `CreateChurchMemberUseCase.cs`
- Proper namespace: `ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember`
- Comprehensive XML documentation
- Logging at use case level
- Endpoints inject use case interfaces, not services directly

**Inconsistent Features:**
- **RiskAssessments**: Flat file structure, missing Create use case (endpoint calls service directly), interfaces and implementations in same file
- **Reminders**: Flat file structure, interfaces and implementations in same file
- **DataProtection**: Separate interfaces but not in folders
- **Districts**: Separate interfaces but not in folders (partially compliant)

## 1. Requirements & Constraints

### Requirements

- **REQ-001**: All features must follow the same Clean Architecture use case pattern
- **REQ-002**: Each use case must be in its own folder with separate interface and implementation files
- **REQ-003**: Endpoints must only inject and call use case interfaces, never services directly
- **REQ-004**: Maintain backward compatibility - no API contract changes
- **REQ-005**: All use cases must include comprehensive XML documentation
- **REQ-006**: Use cases must implement logging for observability
- **REQ-007**: Existing functionality must be preserved during refactoring
- **REQ-008**: Service layer interfaces and implementations remain unchanged
- **REQ-009**: Follow namespace convention: `ChurchRegister.ApiService.UseCase.{Feature}.{Operation}`
- **REQ-010**: All use cases must implement the base `IUseCase` interface pattern
- **REQ-011**: All refactored use cases must have unit tests with minimum 80% code coverage
- **REQ-012**: Integration tests must cover critical workflows and multi-feature interactions

### Security Requirements

- **SEC-001**: Maintain existing role-based access control in endpoints
- **SEC-002**: Ensure user context (username, userId) is properly passed to use cases
- **SEC-003**: No security regression during refactoring
- **SEC-004**: Audit logging must be preserved or enhanced at use case level

### Constraints

- **CON-001**: Cannot break existing API endpoints or change routes
- **CON-002**: Must maintain existing service layer without modification
- **CON-003**: All existing tests must continue to pass after refactoring
- **CON-004**: Refactoring must be completed incrementally, one feature at a time
- **CON-005**: Must update dependency injection registration in Program.cs
- **CON-006**: Cannot introduce new external dependencies
- **CON-007**: Must maintain existing error handling patterns

### Guidelines

- **GUD-001**: Follow existing XML documentation style from ChurchMembers use cases
- **GUD-002**: Use structured logging with ILogger<T> in all use cases
- **GUD-003**: Keep use cases thin - delegate business logic to services
- **GUD-004**: Use CancellationToken for async operations where applicable
- **GUD-005**: Include try-catch blocks for error handling and logging
- **GUD-006**: Return appropriate DTO types, not domain entities
- **GUD-007**: Use meaningful log messages with structured properties

### Patterns to Follow

- **PAT-001**: Use case folder structure: `UseCase/{Feature}/{Operation}/` containing `I{Operation}UseCase.cs` and `{Operation}UseCase.cs`
- **PAT-002**: Interface defines contract: `Task<TResponse> ExecuteAsync(TRequest request, ...)`
- **PAT-003**: Implementation injects services and logger via constructor
- **PAT-004**: Use case orchestrates service calls, adds logging, handles exceptions
- **PAT-005**: Endpoints inject `I{Operation}UseCase`, call `ExecuteAsync()`, handle HTTP response
- **PAT-006**: Register use cases in Program.cs: `builder.Services.AddScoped<IXxxUseCase, XxxUseCase>();`
- **PAT-007**: Use FastEndpoints patterns for request/response types in endpoints

## 2. Implementation Steps

### Phase 1: Risk Assessments - Create Use Case

**GOAL-001**: Create missing CreateRiskAssessmentUseCase and update endpoint to use it

| Task     | Description                                                                                                         | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create folder `UseCase/RiskAssessments/CreateRiskAssessment/`                                                        | ✅        | 2026-03-01 |
| TASK-002 | Create `ICreateRiskAssessmentUseCase.cs` with interface definition                                                  | ✅        | 2026-03-01 |
| TASK-003 | Create `CreateRiskAssessmentUseCase.cs` with implementation injecting IRiskAssessmentService and ILogger           | ✅        | 2026-03-01 |
| TASK-004 | Move business logic from CreateRiskAssessmentEndpoint.HandleAsync to CreateRiskAssessmentUseCase.ExecuteAsync      | ✅        | 2026-03-01 |
| TASK-005 | Update `CreateRiskAssessmentEndpoint.cs` to inject and call ICreateRiskAssessmentUseCase instead of service        | ✅        | 2026-03-01 |
| TASK-006 | Add use case registration to `Program.cs`: `AddScoped<ICreateRiskAssessmentUseCase, CreateRiskAssessmentUseCase>()` | ✅        | 2026-03-01 |
| TASK-007 | Test create risk assessment endpoint to ensure no regression                                                        | ✅        | 2026-03-01 |

### Phase 2: Risk Assessments - Restructure Existing Use Cases

**GOAL-002**: Refactor all RiskAssessments use cases into folder structure with separate interface files

| Task     | Description                                                                                                         | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-008 | Create folder `UseCase/RiskAssessments/GetRiskAssessments/`                                                          | ✅        | 2026-03-01 |
| TASK-009 | Move interface from `GetRiskAssessmentsUseCase.cs` to new `IGetRiskAssessmentsUseCase.cs` file                      | ✅        | 2026-03-01 |
| TASK-010 | Move implementation to new `GetRiskAssessmentsUseCase.cs` file in folder                                            | ✅        | 2026-03-01 |
| TASK-011 | Update namespace to `ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessments`                          | ✅        | 2026-03-01 |
| TASK-012 | Create folder `UseCase/RiskAssessments/GetRiskAssessmentById/` and migrate files                                     | ✅        | 2026-03-01 |
| TASK-013 | Create folder `UseCase/RiskAssessments/UpdateRiskAssessment/` and migrate files                                      | ✅        | 2026-03-01 |
| TASK-014 | Create folder `UseCase/RiskAssessments/ApproveRiskAssessment/` and migrate files                                     | ✅        | 2026-03-01 |
| TASK-015 | Create folder `UseCase/RiskAssessments/StartReview/` and migrate files                                               | ✅        | 2026-03-01 |
| TASK-016 | Create folder `UseCase/RiskAssessments/GetRiskAssessmentHistory/` and migrate files                                  | ✅        | 2026-03-01 |
| TASK-017 | Create folder `UseCase/RiskAssessments/GetRiskAssessmentCategories/` and migrate files                               | ✅        | 2026-03-01 |
| TASK-018 | Create folder `UseCase/RiskAssessments/GetDashboardRiskAssessmentSummary/` and migrate files                         | ✅        | 2026-03-01 |
| TASK-019 | Delete old flat use case files in `UseCase/RiskAssessments/` root                                                    | ✅        | 2026-03-01 |
| TASK-020 | Update all endpoint files to reference new namespaces                                                                | ✅        | 2026-03-01 |
| TASK-021 | Run build and verify no compilation errors                                                                           | ✅        | 2026-03-01 |
| TASK-022 | Test all RiskAssessments endpoints to ensure no regression                                                           | ✅        | 2026-03-01 |

### Phase 3: Risk Assessments - Category Use Cases

**GOAL-003**: Create use cases for risk assessment category CRUD operations

| Task     | Description                                                                                                         | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-023 | Create folder `UseCase/RiskAssessments/CreateRiskAssessmentCategory/` with interface and implementation             | ✅        | 2026-03-01 |
| TASK-024 | Update `CreateRiskAssessmentCategoryEndpoint.cs` to use new use case instead of service                             | ✅        | 2026-03-01 |
| TASK-025 | Create folder `UseCase/RiskAssessments/UpdateRiskAssessmentCategory/` with interface and implementation             | ✅        | 2026-03-01 |
| TASK-026 | Update `UpdateRiskAssessmentCategoryEndpoint.cs` to use new use case                                                 | ✅        | 2026-03-01 |
| TASK-027 | Create folder `UseCase/RiskAssessments/DeleteRiskAssessmentCategory/` with interface and implementation             | ✅        | 2026-03-01 |
| TASK-028 | Update `DeleteRiskAssessmentCategoryEndpoint.cs` to use new use case                                                 | ✅        | 2026-03-01 |
| TASK-029 | Register all new category use cases in `Program.cs`                                                                  | ✅        | 2026-03-01 |
| TASK-030 | Test category CRUD operations to ensure no regression                                                                | ✅        | 2026-03-01 |

### Phase 4: Reminders - Restructure Use Cases

**GOAL-004**: Refactor all Reminders use cases into folder structure with separate interface files

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-031 | Create folder `UseCase/Reminders/CreateReminder/` and migrate ICreateReminderUseCase + CreateReminderUseCase       | ✅        | 2026-03-01 |
| TASK-032 | Create folder `UseCase/Reminders/GetReminders/` and migrate files                                                    | ✅        | 2026-03-01 |
| TASK-033 | Create folder `UseCase/Reminders/GetReminderById/` and migrate files                                                 | ✅        | 2026-03-01 |
| TASK-034 | Create folder `UseCase/Reminders/UpdateReminder/` and migrate files                                                  | ✅        | 2026-03-01 |
| TASK-035 | Create folder `UseCase/Reminders/DeleteReminder/` and migrate files                                                  | ✅        | 2026-03-01 |
| TASK-036 | Create folder `UseCase/Reminders/CompleteReminder/` and migrate files                                                | ✅        | 2026-03-01 |
| TASK-037 | Create folder `UseCase/Reminders/GetDashboardReminderSummary/` and migrate files                                     | ✅        | 2026-03-01 |
| TASK-038 | Delete old flat use case files in `UseCase/Reminders/` root                                                          | ✅        | 2026-03-01 |
| TASK-039 | Update all Reminders endpoint files to reference new namespaces                                                      | ✅        | 2026-03-01 |
| TASK-040 | Run build and verify no compilation errors                                                                           | ✅        | 2026-03-01 |
| TASK-041 | Test all Reminders endpoints to ensure no regression                                                                 | ✅        | 2026-03-01 |

### Phase 5: Reminders - Category Use Cases

**GOAL-005**: Restructure reminder category use cases to match pattern

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-042 | Create folder `UseCase/Reminders/CreateReminderCategory/` and migrate files                                         | ✅        | 2026-03-01 |
| TASK-043 | Create folder `UseCase/Reminders/GetReminderCategories/` and migrate files                                          | ✅        | 2026-03-01 |
| TASK-044 | Create folder `UseCase/Reminders/GetReminderCategoryById/` and migrate files                                        | ✅        | 2026-03-01 |
| TASK-045 | Create folder `UseCase/Reminders/UpdateReminderCategory/` and migrate files                                         | ✅        | 2026-03-01 |
| TASK-046 | Create folder `UseCase/Reminders/DeleteReminderCategory/` and migrate files                                         | ✅        | 2026-03-01 |
| TASK-047 | Delete old flat category use case files                                                                              | ✅        | 2026-03-01 |
| TASK-048 | Update category endpoint files to reference new namespaces                                                           | ✅        | 2026-03-01 |
| TASK-049 | Test all reminder category operations to ensure no regression                                                        | ✅        | 2026-03-01 |

### Phase 6: DataProtection - Restructure Use Cases

**GOAL-006**: Refactor DataProtection use cases into folder structure

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-050 | Create folder `UseCase/DataProtection/GetDataProtection/`                                                           | ✅        | 2026-03-01 |
| TASK-051 | Move `IGetDataProtectionUseCase.cs` to new folder                                                                   | ✅        | 2026-03-01 |
| TASK-052 | Move `GetDataProtectionUseCase.cs` to new folder                                                                    | ✅        | 2026-03-01 |
| TASK-053 | Update namespace to `ChurchRegister.ApiService.UseCase.DataProtection.GetDataProtection`                            | ✅        | 2026-03-01 |
| TASK-054 | Create folder `UseCase/DataProtection/UpdateDataProtection/`                                                        | ✅        | 2026-03-01 |
| TASK-055 | Move `IUpdateDataProtectionUseCase.cs` to new folder                                                                | ✅        | 2026-03-01 |
| TASK-056 | Move `UpdateDataProtectionUseCase.cs` to new folder                                                                 | ✅        | 2026-03-01 |
| TASK-057 | Update namespace for UpdateDataProtection                                                                            | ✅        | 2026-03-01 |
| TASK-058 | Update endpoint references in `ChurchMembers/GetDataProtectionEndpoint.cs`                                           | ✅        | 2026-03-01 |
| TASK-059 | Update endpoint references in `ChurchMembers/UpdateDataProtectionEndpoint.cs`                                        | ✅        | 2026-03-01 |
| TASK-060 | Delete old flat use case files in `UseCase/DataProtection/` root                                                     | ✅        | 2026-03-01 |
| TASK-061 | Test DataProtection endpoints to ensure no regression                                                                | ✅        | 2026-03-01 |

### Phase 7: Districts - Restructure Use Cases

**GOAL-007**: Refactor Districts use cases into folder structure (already partially compliant)

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-062 | Create folder `UseCase/Districts/GetDistricts/`                                                                      | ✅        | 2026-03-01 |
| TASK-063 | Move `IGetDistrictsUseCase.cs` to new folder                                                                         | ✅        | 2026-03-01 |
| TASK-064 | Move `GetDistrictsUseCase.cs` to new folder                                                                          | ✅        | 2026-03-01 |
| TASK-065 | Update namespace to `ChurchRegister.ApiService.UseCase.Districts.GetDistricts`                                       | ✅        | 2026-03-01 |
| TASK-066 | Create folder `UseCase/Districts/ExportDistricts/`                                                                   | ✅        | 2026-03-01 |
| TASK-067 | Move `IExportDistrictsUseCase.cs` to new folder                                                                      | ✅        | 2026-03-01 |
| TASK-068 | Move `ExportDistrictsUseCase.cs` to new folder                                                                       | ✅        | 2026-03-01 |
| TASK-069 | Update namespace for ExportDistricts                                                                                 | ✅        | 2026-03-01 |
| TASK-070 | Update Districts endpoint files to reference new namespaces                                                          | ✅        | 2026-03-01 |
| TASK-071 | Delete old flat use case files in `UseCase/Districts/` root                                                          | ✅        | 2026-03-01 |
| TASK-072 | Test Districts endpoints to ensure no regression                                                                     | ✅        | 2026-03-01 |

### Phase 8: Logging Enhancement

**GOAL-008**: Ensure consistent structured logging across all refactored use cases

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-082 | Add ILogger injection to all RiskAssessments use cases                                                               | ✅        | 2026-03-01 |
| TASK-083 | Add LogInformation at entry point with structured properties (parameters) in RiskAssessments use cases              | ✅        | 2026-03-01 |
| TASK-084 | Add try-catch with LogError for exceptions in RiskAssessments use cases                                              | ✅        | 2026-03-01 |
| TASK-085 | Add LogInformation on successful completion in RiskAssessments use cases                                             | ✅        | 2026-03-01 |
| TASK-086 | Apply same logging pattern to all Reminders use cases                                                                | ✅        | 2026-03-01 |
| TASK-087 | Apply same logging pattern to DataProtection use cases                                                               | ✅        | 2026-03-01 |
| TASK-088 | Apply same logging pattern to Districts use cases                                                                    | ✅        | 2026-03-01 |
| TASK-089 | Verify logging output in development environment during testing                                                      | ✅        | 2026-03-01 |

### Phase 9: Code Cleanup & Final Review

**GOAL-009**: Clean up old files and perform final code quality review

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-110 | Verify all old flat use case files have been deleted                                                                 | ✅        | 2026-03-01 |
| TASK-111 | Search codebase for any remaining direct service injections in endpoints (should all use use cases)                 | ✅        | 2026-03-01 |
| TASK-112 | Review Program.cs dependency injection for duplicate or missing registrations                                        | ✅        | 2026-03-01 |
| TASK-113 | Run code analyzer and fix any warnings related to refactored code                                                    | ✅        | 2026-03-01 |
| TASK-114 | Review all namespaces follow consistent pattern                                                                      | ✅        | 2026-03-01 |
| TASK-115 | Ensure all files have proper copyright headers if required                                                           | ✅        | 2026-03-01 |
| TASK-116 | Update any documentation referencing old file structure                                                              | ✅        | 2026-03-01 |
| TASK-117 | Create architecture decision record (ADR) documenting use case layer pattern and why it's required                   | ✅        | 2026-03-01 |
| TASK-118 | Run full build in Release configuration to verify production readiness                                               | ✅        | 2026-03-01 |

### Phase 10: Testing Improvements

**GOAL-010**: Increase test coverage and add integration tests for critical API flows

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-090 | Audit current test coverage in ChurchRegister.Tests and identify gaps                                               | ✅        | 2026-03-01 |
| TASK-091 | Add unit tests for all RiskAssessments use cases                                                                     | ✅        | 2026-03-01 |
| TASK-092 | Add unit tests for all Reminders use cases                                                                           | ✅        | 2026-03-01 |
| TASK-093 | Add unit tests for DataProtection use cases                                                                          | ✅        | 2026-03-01 |
| TASK-094 | Add unit tests for Districts use cases                                                                               | ✅        | 2026-03-01 |
| TASK-095 | Add integration tests for RiskAssessments workflows (create, approve, review)                                        | ✅        | 2026-03-01 |
| TASK-096 | Add integration tests for Reminders workflows (create, complete with next reminder)                                  | ✅        | 2026-03-01 |
| TASK-097 | Add integration tests for category CRUD operations (RiskAssessments and Reminders)                                   | ✅        | 2026-03-01 |
| TASK-098 | Test endpoint authorization with different user roles                                                                | ✅        | 2026-03-01 |
| TASK-099 | Add tests for validation edge cases and error handling                                                               | ✅        | 2026-03-01 |
| TASK-100 | Ensure test coverage is above 80% for business logic in use cases                                                    | ✅        | 2026-03-01 |
| TASK-101 | Run tests in CI/CD pipeline and verify all pass                                                                      | ✅        | 2026-03-01 |

### Phase 11: Documentation & Code Quality

**GOAL-011**: Improve code documentation and maintain high quality standards

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-102 | Update `docs/ARCHITECTURE.md` with use case layer architecture section                                               | ✅        | 2026-03-01 |
| TASK-107 | Run code analyzer (dotnet format, StyleCop) and fix all warnings                                                     | ✅        | 2026-03-01 |
| TASK-108 | Review code for SOLID principles compliance                                                                          | ✅        | 2026-03-01 |
| TASK-109 | Create use case template file in `UseCase/TEMPLATE.md` for future reference                                          | ✅        | 2026-03-01 |

### Phase 12: Dashboard & MonthlyReportPack - Logging + Structural Fixes

**GOAL-012**: Add missing `ILogger` to `GetDashboardStatisticsUseCase`, move flat `AssignDistrictUseCase` files into their own subfolder, and add unit tests for Dashboard and MonthlyReportPack

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-119 | Add `ILogger<GetDashboardStatisticsUseCase>` constructor injection to `GetDashboardStatisticsUseCase`               | ✅        | 2026-03-01 |
| TASK-120 | Add `LogInformation` entry/success calls and `LogError` try-catch to `GetDashboardStatisticsUseCase`                | ✅        | 2026-03-01 |
| TASK-121 | Create folder `UseCase/ChurchMembers/AssignDistrict/` and move `AssignDistrictUseCase.cs` into it                   | ✅        | 2026-03-01 |
| TASK-122 | Move `IAssignDistrictUseCase.cs` into `UseCase/ChurchMembers/AssignDistrict/`                                       | ✅        | 2026-03-01 |
| TASK-123 | Update namespace in both files to `ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrict`                  | ✅        | 2026-03-01 |
| TASK-124 | Update endpoint `using` statement in `Endpoints/ChurchMembers/AssignDistrictEndpoint.cs`                            | ✅        | 2026-03-01 |
| TASK-125 | Update `Program.cs` DI registration for `IAssignDistrictUseCase` to new fully-qualified namespace                   | ✅        | 2026-03-01 |
| TASK-126 | Delete old flat `UseCase/ChurchMembers/AssignDistrictUseCase.cs` and `IAssignDistrictUseCase.cs`                    | ✅        | 2026-03-01 |
| TASK-127 | Add unit tests for `GetDashboardStatisticsUseCase` in `ChurchRegister.Tests/Dashboard/`                             | ✅        | 2026-03-01 |
| TASK-128 | Add unit tests for `GenerateMonthlyReportPackUseCase` in `ChurchRegister.Tests/MonthlyReportPack/`                  | ✅        | 2026-03-01 |
| TASK-129 | Build and run tests — verify 0 errors, all new tests pass                                                           | ✅        | 2026-03-01 |

### Phase 13: TrainingCertificates - Unit Tests

**GOAL-013**: Add unit test coverage for all 8 `TrainingCertificates` use cases (`CreateTrainingCertificate`, `CreateTrainingCertificateType`, `GetTrainingCertificates`, `GetTrainingCertificateById`, `GetTrainingCertificateTypes`, `UpdateTrainingCertificate`, `UpdateTrainingCertificateType`, `GetDashboardTrainingSummary`)

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-130 | Create `ChurchRegister.Tests/TrainingCertificates/` folder                                                          | ✅        | 2026-03-01 |
| TASK-131 | Add unit tests for `CreateTrainingCertificateUseCase` — happy path, service error propagation                       | ✅        | 2026-03-01 |
| TASK-132 | Add unit tests for `CreateTrainingCertificateTypeUseCase` — happy path, duplicate prevention                        | ✅        | 2026-03-01 |
| TASK-133 | Add unit tests for `GetTrainingCertificatesUseCase` — returns list, empty list, filter parameters passed correctly   | ✅        | 2026-03-01 |
| TASK-134 | Add unit tests for `GetTrainingCertificateByIdUseCase` — found, not found (null)                                    | ✅        | 2026-03-01 |
| TASK-135 | Add unit tests for `GetTrainingCertificateTypesUseCase` — returns all types, empty list                             | ✅        | 2026-03-01 |
| TASK-136 | Add unit tests for `UpdateTrainingCertificateUseCase` — happy path, service error propagation                       | ✅        | 2026-03-01 |
| TASK-137 | Add unit tests for `UpdateTrainingCertificateTypeUseCase` — happy path, service error propagation                   | ✅        | 2026-03-01 |
| TASK-138 | Add unit tests for `GetDashboardTrainingSummaryUseCase` — returns summary DTO, service called once                  | ✅        | 2026-03-01 |
| TASK-139 | Run all TrainingCertificates use case tests and verify all passing                                                   | ✅        | 2026-03-01 |

### Phase 14: ChurchMembers - Unit Tests

**GOAL-014**: Add unit test coverage for all 12 `ChurchMembers` use cases (`CreateChurchMember`, `GetChurchMembers`, `GetChurchMemberById`, `UpdateChurchMember`, `UpdateChurchMemberStatus`, `DeleteChurchMember`, `AssignDistrict`, `GetChurchMemberRoles`, `GetChurchMemberStatuses`, `GenerateRegisterNumbers`, `PreviewRegisterNumbers`, `ExportPastoralCareReport`)

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-140 | Create `ChurchRegister.Tests/ChurchMembers/UseCases/` folder for use case tests (separate from existing service tests) | ✅        | 2026-03-01 |
| TASK-141 | Add unit tests for `CreateChurchMemberUseCase` — happy path, invalid input validation, service error propagation    | ✅        | 2026-03-01 |
| TASK-142 | Add unit tests for `GetChurchMembersUseCase` — returns paged list, empty results, filter parameters passed          | ✅        | 2026-03-01 |
| TASK-143 | Add unit tests for `GetChurchMemberByIdUseCase` — found, not found (null), invalid ID throws                        | ✅        | 2026-03-01 |
| TASK-144 | Add unit tests for `UpdateChurchMemberUseCase` — happy path, invalid input, service error propagation               | ✅        | 2026-03-01 |
| TASK-145 | Add unit tests for `UpdateChurchMemberStatusUseCase` — happy path, invalid status ID, member not found              | ✅        | 2026-03-01 |
| TASK-146 | Add unit tests for `DeleteChurchMemberUseCase` — happy path, service called once, member not found                  | ✅        | 2026-03-01 |
| TASK-147 | Add unit tests for `AssignDistrictUseCase` — happy path, invalid member ID throws, service called once              | ✅        | 2026-03-01 |
| TASK-148 | Add unit tests for `GetChurchMemberRolesUseCase` — returns all roles, empty list                                    | ✅        | 2026-03-01 |
| TASK-149 | Add unit tests for `GetChurchMemberStatusesUseCase` — returns all statuses, service called once                     | ✅        | 2026-03-01 |
| TASK-150 | Add unit tests for `GenerateRegisterNumbersUseCase` — happy path, invalid input, generation count verified          | ✅        | 2026-03-01 |
| TASK-151 | Add unit tests for `PreviewRegisterNumbersUseCase` — returns preview list, empty, filter parameters passed          | ✅        | 2026-03-01 |
| TASK-152 | Add unit tests for `ExportPastoralCareReportUseCase` — returns byte array, service called once                      | ✅        | 2026-03-01 |
| TASK-153 | Run all ChurchMembers use case tests and verify all passing                                                          | ✅        | 2026-03-01 |

### Phase 15: Contributions - Unit Tests

**GOAL-015**: Add unit test coverage for all 6 `Contributions` use cases (`GetContributionHistory`, `GetEnvelopeBatchList`, `GetEnvelopeBatchDetails`, `SubmitEnvelopeBatch`, `ValidateRegisterNumber`, `UploadHsbcStatement`)

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-154 | Create `ChurchRegister.Tests/Contributions/` folder                                                                  | ✅        | 2026-03-01 |
| TASK-155 | Add unit tests for `GetContributionHistoryUseCase` — returns history for member, empty history, invalid member ID   | ✅        | 2026-03-01 |
| TASK-156 | Add unit tests for `GetEnvelopeBatchListUseCase` — returns list, empty list, year filter applied                    | ✅        | 2026-03-01 |
| TASK-157 | Add unit tests for `GetEnvelopeBatchDetailsUseCase` — found, not found (null), invalid batch ID throws              | ✅        | 2026-03-01 |
| TASK-158 | Add unit tests for `SubmitEnvelopeBatchUseCase` — happy path, validation fails, service error propagation           | ✅        | 2026-03-01 |
| TASK-159 | Add unit tests for `ValidateRegisterNumberUseCase` — valid number returns true, invalid returns false               | ✅        | 2026-03-01 |
| TASK-160 | Add unit tests for `UploadHsbcStatementUseCase` — successful parse, invalid file format, empty file                 | ✅        | 2026-03-01 |
| TASK-161 | Run all Contributions use case tests and verify all passing                                                          | ✅        | 2026-03-01 |

### Phase 16: Attendance - Unit Tests

**GOAL-016**: Add unit test coverage for all 10 `Attendance` use cases (`CreateAttendance`, `GetAttendance`, `UpdateAttendance`, `DeleteAttendance`, `CreateEvent`, `GetEvents`, `UpdateEvent`, `GetAttendanceAnalytics`, `EmailAttendanceAnalytics`, `UploadAttendanceTemplate`)

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-162 | Create `ChurchRegister.Tests/Attendance/` folder                                                                     | ✅        | 2026-03-01 |
| TASK-163 | Add unit tests for `CreateAttendanceUseCase` — happy path, duplicate entry handling, invalid event ID               | ✅        | 2026-03-01 |
| TASK-164 | Add unit tests for `GetAttendanceUseCase` — returns records, filtered by event, empty result                        | ✅        | 2026-03-01 |
| TASK-165 | Add unit tests for `UpdateAttendanceUseCase` — happy path, record not found, service error propagation              | ✅        | 2026-03-01 |
| TASK-166 | Add unit tests for `DeleteAttendanceUseCase` — happy path, service called once, not found                           | ✅        | 2026-03-01 |
| TASK-167 | Add unit tests for `CreateEventUseCase` — happy path, invalid date range, service error propagation                 | ✅        | 2026-03-01 |
| TASK-168 | Add unit tests for `GetEventsUseCase` — returns all events, date filter applied, empty list                         | ✅        | 2026-03-01 |
| TASK-169 | Add unit tests for `UpdateEventUseCase` — happy path, event not found, service error propagation                    | ✅        | 2026-03-01 |
| TASK-170 | Add unit tests for `GetAttendanceAnalyticsUseCase` — returns analytics DTO, parameters passed to service            | ✅        | 2026-03-01 |
| TASK-171 | Add unit tests for `EmailAttendanceAnalyticsUseCase` — happy path, email failure handled, service called once       | ✅        | 2026-03-01 |
| TASK-172 | Add unit tests for `UploadAttendanceTemplateUseCase` — successful upload, invalid file, parse error handling         | ✅        | 2026-03-01 |
| TASK-173 | Run all Attendance use case tests and verify all passing                                                             | ✅        | 2026-03-01 |

### Phase 17: Final Coverage Verification

**GOAL-017**: Run the complete test suite across all feature areas, verify overall use case test coverage, and update plan status to Completed

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-174 | Run full `dotnet test ChurchRegister.Tests` and verify 0 failures across all features                               | ✅        | 2026-03-01 |
| TASK-175 | Verify Security use case tests still pass (Login, Logout, CreateUser, RevokeUserTokens, ChangePassword, RefreshToken) | ✅        | 2026-03-01 |
| TASK-176 | Run Release build `dotnet build --configuration Release` and confirm 0 errors                                       | ✅        | 2026-03-01 |
| TASK-177 | Update plan `status` field to `Completed` and badge to bright green                                                  | ✅        | 2026-03-01 |

## 3. Alternatives

Alternative approaches that were considered:

- **ALT-001**: **Keep Mixed Architecture** - Allow different features to have different patterns. Rejected because it creates confusion, makes onboarding harder, reduces code discoverability, and violates principle of consistency.

- **ALT-002**: **Flatten All Use Cases** - Convert reference implementations to flat structure like RiskAssessments. Rejected because folder structure provides better organization, clearer separation of concerns, and easier navigation in large codebases.

- **ALT-003**: **Combine Interface and Implementation** - Put both interface and implementation in same file like current RiskAssessments. Rejected because separating interface from implementation follows SOLID principles, makes testing easier, and is .NET best practice.

- **ALT-004**: **Skip Use Case Layer Entirely** - Endpoints call services directly. Rejected because use case layer provides crucial orchestration, logging, and business logic that should not be in endpoints or services. Violates Clean Architecture principles.

- **ALT-005**: **Create Monolithic Use Cases** - One use case per feature instead of per operation. Rejected because fine-grained use cases provide better separation of concerns, are easier to test, and follow single responsibility principle.

- **ALT-006**: **Batch Refactor All Features** - Refactor all features simultaneously. Rejected in favor of incremental approach to reduce risk, allow testing between phases, and avoid large merge conflicts.

- **ALT-007**: **Auto-Generate Use Cases** - Use code generation tools to create use case boilerplate. Considered for future but rejected for this refactor to maintain manual control and ensure proper understanding of each use case.

- **ALT-008**: **Skip Unit Testing** - Only do integration testing for refactored use cases. Rejected because unit tests are crucial for testing use case logic in isolation, faster to run, and easier to maintain than integration tests alone.

## 4. Dependencies

External and internal dependencies for this refactoring:

- **DEP-001**: FastEndpoints library (already installed) - Endpoint framework
- **DEP-002**: Microsoft.Extensions.Logging.Abstractions - ILogger<T> for logging
- **DEP-003**: Microsoft.Extensions.DependencyInjection - DI container for use case registration
- **DEP-004**: Existing service layer interfaces (IRiskAssessmentService, IReminderService, etc.) - Business logic
- **DEP-005**: Existing DTO/Model definitions (must remain unchanged)
- **DEP-006**: ChurchRegister.Database project - Entity definitions
- **DEP-007**: Existing endpoint implementations (will be modified to use use cases)
- **DEP-008**: Program.cs - Must be updated with new DI registrations
- **DEP-009**: Development environment with .NET 8 SDK
- **DEP-010**: Knowledge of existing ChurchMembers/Contributions use case pattern as reference
- **DEP-011**: xUnit testing framework (already installed) - Unit testing
- **DEP-012**: Moq library (already installed) - Mocking for unit tests
- **DEP-013**: FluentAssertions (recommended) - Readable test assertions
- **DEP-014**: Microsoft.AspNetCore.Mvc.Testing - Integration testing
- **DEP-015**: TestWebApplicationFactory - Test harness for integration tests

## 5. Files

Files that will be created, modified, or deleted during this refactoring:

### New Use Case Files - RiskAssessments

- **FILE-001**: `UseCase/RiskAssessments/CreateRiskAssessment/ICreateRiskAssessmentUseCase.cs` - NEW
- **FILE-002**: `UseCase/RiskAssessments/CreateRiskAssessment/CreateRiskAssessmentUseCase.cs` - NEW
- **FILE-003**: `UseCase/RiskAssessments/GetRiskAssessments/IGetRiskAssessmentsUseCase.cs` - MIGRATED
- **FILE-004**: `UseCase/RiskAssessments/GetRiskAssessments/GetRiskAssessmentsUseCase.cs` - MIGRATED
- **FILE-005**: `UseCase/RiskAssessments/GetRiskAssessmentById/IGetRiskAssessmentByIdUseCase.cs` - MIGRATED
- **FILE-006**: `UseCase/RiskAssessments/GetRiskAssessmentById/GetRiskAssessmentByIdUseCase.cs` - MIGRATED
- **FILE-007**: `UseCase/RiskAssessments/UpdateRiskAssessment/IUpdateRiskAssessmentUseCase.cs` - MIGRATED
- **FILE-008**: `UseCase/RiskAssessments/UpdateRiskAssessment/UpdateRiskAssessmentUseCase.cs` - MIGRATED
- **FILE-009**: `UseCase/RiskAssessments/ApproveRiskAssessment/IApproveRiskAssessmentUseCase.cs` - MIGRATED
- **FILE-010**: `UseCase/RiskAssessments/ApproveRiskAssessment/ApproveRiskAssessmentUseCase.cs` - MIGRATED
- **FILE-011**: `UseCase/RiskAssessments/StartReview/IStartReviewUseCase.cs` - MIGRATED
- **FILE-012**: `UseCase/RiskAssessments/StartReview/StartReviewUseCase.cs` - MIGRATED
- **FILE-013**: `UseCase/RiskAssessments/GetRiskAssessmentHistory/IGetRiskAssessmentHistoryUseCase.cs` - MIGRATED
- **FILE-014**: `UseCase/RiskAssessments/GetRiskAssessmentHistory/GetRiskAssessmentHistoryUseCase.cs` - MIGRATED
- **FILE-015**: `UseCase/RiskAssessments/GetRiskAssessmentCategories/IGetRiskAssessmentCategoriesUseCase.cs` - MIGRATED
- **FILE-016**: `UseCase/RiskAssessments/GetRiskAssessmentCategories/GetRiskAssessmentCategoriesUseCase.cs` - MIGRATED
- **FILE-017**: `UseCase/RiskAssessments/GetDashboardRiskAssessmentSummary/IGetDashboardRiskAssessmentSummaryUseCase.cs` - MIGRATED
- **FILE-018**: `UseCase/RiskAssessments/GetDashboardRiskAssessmentSummary/GetDashboardRiskAssessmentSummaryUseCase.cs` - MIGRATED
- **FILE-019**: `UseCase/RiskAssessments/CreateRiskAssessmentCategory/ICreateRiskAssessmentCategoryUseCase.cs` - NEW
- **FILE-020**: `UseCase/RiskAssessments/CreateRiskAssessmentCategory/CreateRiskAssessmentCategoryUseCase.cs` - NEW
- **FILE-021**: `UseCase/RiskAssessments/UpdateRiskAssessmentCategory/IUpdateRiskAssessmentCategoryUseCase.cs` - NEW
- **FILE-022**: `UseCase/RiskAssessments/UpdateRiskAssessmentCategory/UpdateRiskAssessmentCategoryUseCase.cs` - NEW
- **FILE-023**: `UseCase/RiskAssessments/DeleteRiskAssessmentCategory/IDeleteRiskAssessmentCategoryUseCase.cs` - NEW
- **FILE-024**: `UseCase/RiskAssessments/DeleteRiskAssessmentCategory/DeleteRiskAssessmentCategoryUseCase.cs` - NEW

### New Use Case Files - Reminders

- **FILE-025**: `UseCase/Reminders/CreateReminder/ICreateReminderUseCase.cs` - MIGRATED
- **FILE-026**: `UseCase/Reminders/CreateReminder/CreateReminderUseCase.cs` - MIGRATED
- **FILE-027**: `UseCase/Reminders/GetReminders/IGetRemindersUseCase.cs` - MIGRATED
- **FILE-028**: `UseCase/Reminders/GetReminders/GetRemindersUseCase.cs` - MIGRATED
- **FILE-029**: `UseCase/Reminders/GetReminderById/IGetReminderByIdUseCase.cs` - MIGRATED
- **FILE-030**: `UseCase/Reminders/GetReminderById/GetReminderByIdUseCase.cs` - MIGRATED
- **FILE-031**: `UseCase/Reminders/UpdateReminder/IUpdateReminderUseCase.cs` - MIGRATED
- **FILE-032**: `UseCase/Reminders/UpdateReminder/UpdateReminderUseCase.cs` - MIGRATED
- **FILE-033**: `UseCase/Reminders/DeleteReminder/IDeleteReminderUseCase.cs` - MIGRATED
- **FILE-034**: `UseCase/Reminders/DeleteReminder/DeleteReminderUseCase.cs` - MIGRATED
- **FILE-035**: `UseCase/Reminders/CompleteReminder/ICompleteReminderUseCase.cs` - MIGRATED
- **FILE-036**: `UseCase/Reminders/CompleteReminder/CompleteReminderUseCase.cs` - MIGRATED
- **FILE-037**: `UseCase/Reminders/GetDashboardReminderSummary/IGetDashboardReminderSummaryUseCase.cs` - MIGRATED
- **FILE-038**: `UseCase/Reminders/GetDashboardReminderSummary/GetDashboardReminderSummaryUseCase.cs` - MIGRATED
- **FILE-039**: `UseCase/Reminders/CreateReminderCategory/ICreateReminderCategoryUseCase.cs` - MIGRATED
- **FILE-040**: `UseCase/Reminders/CreateReminderCategory/CreateReminderCategoryUseCase.cs` - MIGRATED
- **FILE-041**: `UseCase/Reminders/GetReminderCategories/IGetReminderCategoriesUseCase.cs` - MIGRATED
- **FILE-042**: `UseCase/Reminders/GetReminderCategories/GetReminderCategoriesUseCase.cs` - MIGRATED
- **FILE-043**: `UseCase/Reminders/GetReminderCategoryById/IGetReminderCategoryByIdUseCase.cs` - MIGRATED
- **FILE-044**: `UseCase/Reminders/GetReminderCategoryById/GetReminderCategoryByIdUseCase.cs` - MIGRATED
- **FILE-045**: `UseCase/Reminders/UpdateReminderCategory/IUpdateReminderCategoryUseCase.cs` - MIGRATED
- **FILE-046**: `UseCase/Reminders/UpdateReminderCategory/UpdateReminderCategoryUseCase.cs` - MIGRATED
- **FILE-047**: `UseCase/Reminders/DeleteReminderCategory/IDeleteReminderCategoryUseCase.cs` - MIGRATED
- **FILE-048**: `UseCase/Reminders/DeleteReminderCategory/DeleteReminderCategoryUseCase.cs` - MIGRATED

### New Use Case Files - DataProtection & Districts

- **FILE-049**: `UseCase/DataProtection/GetDataProtection/IGetDataProtectionUseCase.cs` - MIGRATED
- **FILE-050**: `UseCase/DataProtection/GetDataProtection/GetDataProtectionUseCase.cs` - MIGRATED
- **FILE-051**: `UseCase/DataProtection/UpdateDataProtection/IUpdateDataProtectionUseCase.cs` - MIGRATED
- **FILE-052**: `UseCase/DataProtection/UpdateDataProtection/UpdateDataProtectionUseCase.cs` - MIGRATED
- **FILE-053**: `UseCase/Districts/GetDistricts/IGetDistrictsUseCase.cs` - MIGRATED
- **FILE-054**: `UseCase/Districts/GetDistricts/GetDistrictsUseCase.cs` - MIGRATED
- **FILE-055**: `UseCase/Districts/ExportDistricts/IExportDistrictsUseCase.cs` - MIGRATED
- **FILE-056**: `UseCase/Districts/ExportDistricts/ExportDistrictsUseCase.cs` - MIGRATED

### Modified Endpoint Files

- **FILE-057**: `Endpoints/RiskAssessments/CreateRiskAssessmentEndpoint.cs` - MODIFIED (inject use case)
- **FILE-058**: `Endpoints/RiskAssessments/GetRiskAssessmentsEndpoint.cs` - MODIFIED (namespace update)
- **FILE-059**: `Endpoints/RiskAssessments/GetRiskAssessmentByIdEndpoint.cs` - MODIFIED (namespace update)
- **FILE-060**: `Endpoints/RiskAssessments/UpdateRiskAssessmentEndpoint.cs` - MODIFIED (namespace update)
- **FILE-061**: `Endpoints/RiskAssessments/ApproveRiskAssessmentEndpoint.cs` - MODIFIED (namespace update)
- **FILE-062**: `Endpoints/RiskAssessments/StartReviewEndpoint.cs` - MODIFIED (namespace update)
- **FILE-063**: `Endpoints/RiskAssessments/GetRiskAssessmentHistoryEndpoint.cs` - MODIFIED (namespace update)
- **FILE-064**: `Endpoints/RiskAssessments/GetRiskAssessmentCategoriesEndpoint.cs` - MODIFIED (namespace update)
- **FILE-065**: `Endpoints/RiskAssessments/GetDashboardSummaryEndpoint.cs` - MODIFIED (namespace update)
- **FILE-066**: `Endpoints/RiskAssessments/CreateRiskAssessmentCategoryEndpoint.cs` - MODIFIED (inject use case)
- **FILE-067**: `Endpoints/RiskAssessments/UpdateRiskAssessmentCategoryEndpoint.cs` - MODIFIED (inject use case)
- **FILE-068**: `Endpoints/RiskAssessments/DeleteRiskAssessmentCategoryEndpoint.cs` - MODIFIED (inject use case)
- **FILE-069**: `Endpoints/Reminders/*.cs` (12 files) - MODIFIED (namespace updates)
- **FILE-070**: `Endpoints/ChurchMembers/GetDataProtectionEndpoint.cs` - MODIFIED (namespace update)
- **FILE-071**: `Endpoints/ChurchMembers/UpdateDataProtectionEndpoint.cs` - MODIFIED (namespace update)
- **FILE-072**: `Endpoints/Districts/*.cs` - MODIFIED (namespace updates)

### Configuration Files

- **FILE-073**: `Program.cs` - MODIFIED (DI registration for all new/refactored use cases)

### Deleted Files (Old Flat Structure)

- **FILE-074**: `UseCase/RiskAssessments/GetRiskAssessmentsUseCase.cs` - DELETED
- **FILE-075**: `UseCase/RiskAssessments/GetRiskAssessmentByIdUseCase.cs` - DELETED
- **FILE-076**: `UseCase/RiskAssessments/UpdateRiskAssessmentUseCase.cs` - DELETED
- **FILE-077**: `UseCase/RiskAssessments/ApproveRiskAssessmentUseCase.cs` - DELETED
- **FILE-078**: `UseCase/RiskAssessments/StartReviewUseCase.cs` - DELETED
- **FILE-079**: `UseCase/RiskAssessments/GetRiskAssessmentHistoryUseCase.cs` - DELETED
- **FILE-080**: `UseCase/RiskAssessments/GetRiskAssessmentCategoriesUseCase.cs` - DELETED
- **FILE-081**: `UseCase/RiskAssessments/GetDashboardRiskAssessmentSummaryUseCase.cs` - DELETED
- **FILE-082**: `UseCase/Reminders/*.cs` (12 files) - DELETED
- **FILE-083**: `UseCase/DataProtection/GetDataProtectionUseCase.cs` - DELETED
- **FILE-084**: `UseCase/DataProtection/IGetDataProtectionUseCase.cs` - DELETED
- **FILE-085**: `UseCase/DataProtection/UpdateDataProtectionUseCase.cs` - DELETED
- **FILE-086**: `UseCase/DataProtection/IUpdateDataProtectionUseCase.cs` - DELETED
- **FILE-087**: `UseCase/Districts/GetDistrictsUseCase.cs` - DELETED
- **FILE-088**: `UseCase/Districts/IGetDistrictsUseCase.cs` - DELETED
- **FILE-089**: `UseCase/Districts/ExportDistrictsUseCase.cs` - DELETED
- **FILE-090**: `UseCase/Districts/IExportDistrictsUseCase.cs` - DELETED

### Test Files

- **FILE-091**: `ChurchRegister.Tests/RiskAssessments/CreateRiskAssessmentUseCaseTests.cs` - NEW
- **FILE-092**: `ChurchRegister.Tests/RiskAssessments/UpdateRiskAssessmentUseCaseTests.cs` - NEW
- **FILE-093**: `ChurchRegister.Tests/RiskAssessments/ApproveRiskAssessmentUseCaseTests.cs` - NEW
- **FILE-094**: `ChurchRegister.Tests/RiskAssessments/RiskAssessmentCategoryUseCaseTests.cs` - NEW
- **FILE-095**: `ChurchRegister.Tests/RiskAssessments/RiskAssessmentIntegrationTests.cs` - NEW
- **FILE-096**: `ChurchRegister.Tests/Reminders/CreateReminderUseCaseTests.cs` - NEW
- **FILE-097**: `ChurchRegister.Tests/Reminders/CompleteReminderUseCaseTests.cs` - NEW
- **FILE-098**: `ChurchRegister.Tests/Reminders/ReminderCategoryUseCaseTests.cs` - NEW
- **FILE-099**: `ChurchRegister.Tests/Reminders/ReminderIntegrationTests.cs` - NEW
- **FILE-100**: `ChurchRegister.Tests/DataProtection/DataProtectionUseCaseTests.cs` - NEW
- **FILE-101**: `ChurchRegister.Tests/Districts/DistrictUseCaseTests.cs` - NEW

### Documentation Files

- **FILE-102**: `UseCase/README.md` - UPDATED (document use case layer pattern and folder structure)
- **FILE-103**: `UseCase/TEMPLATE.md` - NEW (use case template for future implementations)
- **FILE-104**: `docs/ARCHITECTURE.md` - UPDATED (add use case layer architecture section)

### New Files - Phases 12–17

- **FILE-105**: `UseCase/ChurchMembers/AssignDistrict/IAssignDistrictUseCase.cs` - MOVED (from root of ChurchMembers)
- **FILE-106**: `UseCase/ChurchMembers/AssignDistrict/AssignDistrictUseCase.cs` - MOVED (from root of ChurchMembers)
- **FILE-107**: `UseCase/ChurchMembers/AssignDistrictUseCase.cs` - DELETED (flat file replaced by subfolder)
- **FILE-108**: `UseCase/ChurchMembers/IAssignDistrictUseCase.cs` - DELETED (flat file replaced by subfolder)
- **FILE-109**: `ChurchRegister.Tests/Dashboard/DashboardUseCaseTests.cs` - NEW
- **FILE-110**: `ChurchRegister.Tests/MonthlyReportPack/MonthlyReportPackUseCaseTests.cs` - NEW
- **FILE-111**: `ChurchRegister.Tests/TrainingCertificates/TrainingCertificateUseCaseTests.cs` - NEW
- **FILE-112**: `ChurchRegister.Tests/ChurchMembers/UseCases/ChurchMemberUseCaseTests.cs` - NEW
- **FILE-113**: `ChurchRegister.Tests/Contributions/ContributionUseCaseTests.cs` - NEW
- **FILE-114**: `ChurchRegister.Tests/Attendance/AttendanceUseCaseTests.cs` - NEW

## 6. Testing

Testing requirements to verify successful implementation of refactoring (detailed in Phase 10):

- **TEST-001**: **Build Verification** - Solution builds without errors after each phase
- **TEST-002**: **Namespace Resolution** - All using statements resolve correctly, no missing references
- **TEST-003**: **DI Registration** - Application starts without DI resolution errors
- **TEST-004**: **RiskAssessments CRUD** - Create, read, update, delete risk assessments work
- **TEST-005**: **RiskAssessments Workflows** - Approve and start review workflows function correctly
- **TEST-006**: **RiskAssessments Categories** - Category CRUD operations work
- **TEST-007**: **RiskAssessments Filtering** - Filter by category, status, overdue works correctly
- **TEST-008**: **RiskAssessments History** - History retrieval returns correct data
- **TEST-009**: **Reminders CRUD** - Create, read, update, delete reminders work
- **TEST-010**: **Reminders Complete** - Complete reminder workflow functions correctly
- **TEST-011**: **Reminders Categories** - Category CRUD operations work
- **TEST-012**: **Reminders Filtering** - Filter by status, category, assigned user works
- **TEST-013**: **DataProtection Get** - Retrieve data protection settings for member
- **TEST-014**: **DataProtection Update** - Update data protection settings
- **TEST-015**: **Districts Get** - Retrieve all districts
- **TEST-016**: **Districts Export** - Export districts to PDF
- **TEST-017**: **API Contracts** - All endpoints return expected response formats (no breaking changes)
- **TEST-018**: **Error Handling** - Error responses maintain same format and status codes
- **TEST-019**: **Authorization** - RBAC still enforces correct role requirements
- **TEST-020**: **Logging Output** - Structured logs appear in console during operations
- **TEST-021**: **Performance** - No performance regression (response times similar to before)
- **TEST-022**: **Integration Tests** - All existing integration tests pass (minimum 80% coverage for use cases)
- **TEST-023**: **Unit Tests** - All use case unit tests pass with appropriate mocking
- **TEST-024**: **Swagger Documentation** - Swagger UI displays all endpoints correctly
- **TEST-025**: **Cross-Feature Integration** - Features that depend on each other still work (e.g., Dashboard summaries)
- **TEST-026**: **Dashboard Logging** - Verify `GetDashboardStatisticsUseCase` emits structured log entries on execution
- **TEST-027**: **TrainingCertificates unit tests** - All 8 use cases covered with happy path and error scenarios
- **TEST-028**: **ChurchMembers use case unit tests** - All 12 use cases covered (separate from existing service layer tests)
- **TEST-029**: **Contributions use case unit tests** - All 6 use cases covered with happy path and error scenarios
- **TEST-030**: **Attendance use case unit tests** - All 10 use cases covered with happy path and error scenarios
- **TEST-031**: **Dashboard & MonthlyReportPack unit tests** - Both use cases covered including error propagation
- **TEST-032**: **Full suite regression** - Complete `dotnet test` passes with 0 failures across all features

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Namespace Conflicts** - New folder structure may cause namespace conflicts. Mitigation: Careful namespace planning and thorough build testing after each phase.

- **RISK-002**: **Missed Endpoint Updates** - Some endpoint might still reference old namespaces causing runtime errors. Mitigation: Comprehensive search and systematic testing of all endpoints.

- **RISK-003**: **DI Registration Errors** - Missing use case registrations in Program.cs cause runtime failures. Mitigation: Add one feature at a time, test after each registration.

- **RISK-004**: **Merge Conflicts** - Large-scale file moves could cause merge conflicts if other work is in progress. Mitigation: Coordinate with team, work in dedicated branch, communicate refactoring scope.

- **RISK-005**: **Regression Bugs** - Refactoring logic during migration could introduce bugs. Mitigation: Keep logic changes minimal, focus on structural changes, comprehensive testing.

- **RISK-006**: **Documentation Drift** - Documentation may not reflect new structure. Mitigation: Update docs as part of each phase, include in task list.

- **RISK-007**: **Performance Impact** - Additional use case layer could add overhead. Mitigation: Use cases should be thin wrappers, delegate to services, minimal impact expected.

- **RISK-008**: **Testing Coverage Gaps** - Incomplete testing may miss edge cases. Mitigation: Test all CRUD operations, workflows, filters, error cases systematically.

- **RISK-009**: **Build Time Increase** - More files could increase build time. Mitigation: Monitor build times, optimize if necessary, likely minimal impact.

- **RISK-010**: **Dashboard use case hits database directly** - `GetDashboardStatisticsUseCase` queries `ChurchRegisterWebContext` directly rather than through a service interface. This makes it impossible to pure-mock in unit tests. Mitigation: Mock the DbContext using `InMemoryDatabase` (already used in `ChurchMemberServiceTests`) or extract a `IDashboardService` interface if queries grow complex.

- **RISK-011**: **ChurchMembers service-layer tests overlap with new use case tests** - `ChurchMemberServiceTests.cs` tests the service directly; new use case tests will mock the service. Ensure no confusion about which layer is under test. Mitigation: Place new use case tests in a dedicated `UseCases/` subfolder within `ChurchRegister.Tests/ChurchMembers/`.

### Assumptions

- **ASSUMPTION-001**: Existing service layer implementations are correct and don't need changes
- **ASSUMPTION-002**: Current API contracts are stable and should not be modified
- **ASSUMPTION-003**: Team agrees on Clean Architecture pattern as standard for all features
- **ASSUMPTION-004**: No new features will be added to RiskAssessments/Reminders during refactoring period
- **ASSUMPTION-005**: Existing integration tests provide adequate coverage for regression detection
- **ASSUMPTION-006**: Development team has capacity to review and test refactored code
- **ASSUMPTION-007**: ChurchMembers/Contributions use case pattern is accepted as reference implementation
- **ASSUMPTION-008**: Use case layer should be thin - no complex business logic
- **ASSUMPTION-009**: Logging at use case level provides sufficient observability
- **ASSUMPTION-010**: Folder structure per operation is maintainable long-term
- **ASSUMPTION-011**: No breaking changes to backend API allowed during refactoring
- **ASSUMPTION-012**: Refactoring can be completed incrementally over multiple sprints if needed

## 8. Related Specifications / Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Principles of Clean Architecture
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- [FastEndpoints Documentation](https://fast-endpoints.com/) - Endpoint framework used in project
- [Microsoft Dependency Injection](https://docs.microsoft.com/en-us/dotnet/core/extensions/dependency-injection) - .NET DI container
- [Structured Logging Best Practices](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/) - Logging patterns
- [Namespace Naming Conventions](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/names-of-namespaces) - .NET namespace guidelines
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions) - C# standards
- [xUnit Documentation](https://xunit.net/) - Unit testing framework
- [Moq Quickstart](https://github.com/moq/moq4/wiki/Quickstart) - Mocking framework for .NET
- [FluentAssertions](https://fluentassertions.com/introduction) - Readable test assertions
- [ASP.NET Core Integration Tests](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests) - Integration testing guide

### Internal Documentation

- [UseCase/TEMPLATE.md](../ChurchRegister.ApiService/UseCase/TEMPLATE.md) - Use case template and pattern documentation
- [UseCase/README.md](../ChurchRegister.ApiService/UseCase/README.md) - Use case layer overview
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Application architecture documentation
- [docs/refactor-implementation-summary.md](../docs/refactor-implementation-summary.md) - Previous backend refactoring summary
- [docs/error-handling-patterns.md](../docs/error-handling-patterns.md) - Error handling standards

### Reference Implementations

- [UseCase/ChurchMembers/CreateChurchMember/](../ChurchRegister.ApiService/UseCase/ChurchMembers/CreateChurchMember/) - Reference use case structure
- [UseCase/Contributions/SubmitEnvelopeBatch/](../ChurchRegister.ApiService/UseCase/Contributions/SubmitEnvelopeBatch/) - Reference use case pattern
- [UseCase/Attendance/CreateAttendance/](../ChurchRegister.ApiService/UseCase/Attendance/CreateAttendance/) - Reference use case pattern
- [UseCase/TrainingCertificates/CreateTrainingCertificate/](../ChurchRegister.ApiService/UseCase/TrainingCertificates/CreateTrainingCertificate/) - Reference use case pattern
- [ChurchRegister.Tests/ChurchMembers/](../ChurchRegister.Tests/ChurchMembers/) - Reference test structure and patterns
- [ChurchRegister.Tests/TestWebApplicationFactory.cs](../ChurchRegister.Tests/TestWebApplicationFactory.cs) - Integration test setup
- [UseCase/TrainingCertificates/CreateTrainingCertificate/](../ChurchRegister.ApiService/UseCase/TrainingCertificates/CreateTrainingCertificate/) - Reference use case pattern
