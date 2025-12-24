---
goal: Implement Church Members Management Feature with CRUD Operations, Role Management, and Search/Filter Grid
version: 1.0
date_created: 2025-11-20
last_updated: 2025-11-25
owner: ChurchRegister Development Team
status: "In progress"
tags: [feature, church-members, administration, crud, grid]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

Implement a complete Church Members management feature following the existing user administration patterns. This feature will manage church member records with support for:

- **Member Information**: FirstName, LastName, PhoneNumber (optional), EmailAddress (optional), MemberSince, Baptised status, GiftAid participation
- **Member Statuses**: Active, Expired, In Glory (deceased), InActive
- **Member Roles**: Non-Member, Member, Deacon, Auditor, Secretary, Treasurer, Minister, Junior Church Leader (members can have multiple roles)
- **Address Management**: Optional address sharing between family members
- **Access Control**: ChurchMembersViewer (read-only), ChurchMembersContributor (create/edit), ChurchMembersAdministrator (status changes)
- **Grid Interface**: Search, filter by status/role/baptised/giftaid, pagination, sorting - modeled after existing Users grid

**Key Pattern**: Follow `UserManagementService` and `GetUsersEndpoint` patterns exactly for consistency.

## 1. Requirements & Constraints

### From Specification

- **REQ-001**: Manage church members with fields: Id, FirstName, LastName, PhoneNumber (optional), EmailAddress (optional), ChurchMemberTypeId (future), AddressId (optional), MemberSince, ChurchMemberStatusId, DistrictId (future), Baptised, GiftAid
- **REQ-002**: Support 4 member statuses: Active, Expired, In Glory, InActive
- **REQ-003**: Support 8 member role types: Non-Member, Member, Deacon, Auditor, Secretary, Treasurer, Minister, Junior Church Leader
- **REQ-004**: Members can have multiple roles simultaneously (many-to-many via ChurchMemberRoles junction table)
- **REQ-005**: Optional address with fields: NameNumber, AddressLineOne, AddressLineTwo, Town, County, Postcode
- **REQ-006**: Support status changes with optional notes (admin only)
- **REQ-007**: Three access levels: ChurchMembersViewer (read), ChurchMembersContributor (read/write), ChurchMembersAdministrator (full access)
- **REQ-008**: Grid interface similar to existing users administration with search, filter, pagination

### Technical Constraints

- **CON-001**: Use FastEndpoints following GetUsersEndpoint pattern
- **CON-002**: Service layer must follow UserManagementService pattern
- **CON-003**: Database schema already exists - do NOT modify ChurchMember, Address, ChurchMemberRoles, ChurchMemberStatus, ChurchMemberRoleTypes tables
- **CON-004**: MemberSince is required and cannot be in the future
- **CON-005**: FirstName and LastName are required (max 50 chars each)
- **CON-006**: No hard deletion - use status change to "InActive" or "In Glory"
- **CON-007**: Districts and ChurchMemberType fields exist but NOT implemented in this phase

### Guidelines

- **GUD-001**: All operations must populate audit fields (CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime)
- **GUD-002**: Use eager loading for roles and address to prevent N+1 queries
- **GUD-003**: Reuse existing PagedResult<T>, validation attributes, and error handling patterns from user management
- **GUD-004**: Status change requires confirmation dialog in UI with optional note field
- **GUD-005**: No bulk operations in this phase

## 2. Implementation Steps

### Phase 1: Backend Foundation - Models & DTOs

- GOAL-001: Create all DTOs and request/response models matching the ChurchMember entity structure

| Task     | Description                                                                                                                                               | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create ChurchMemberDto.cs with: Id, FirstName, LastName, FullName, Email, Phone, MemberSince, Status, Roles[], Baptised, GiftAid, CreatedAt, LastModified | ✅        | 2025-11-25 |
| TASK-002 | Create ChurchMemberDetailDto.cs extending list DTO with Address{NameNumber, Lines, Town, County, Postcode}, CreatedBy, ModifiedBy                         | ✅        | 2025-11-25 |
| TASK-003 | Create CreateChurchMemberRequest.cs with [Required] FirstName, LastName, MemberSince, StatusId; optional Email, Phone, Address, RoleIds[]                 | ✅        | 2025-11-25 |
| TASK-004 | Create UpdateChurchMemberRequest.cs with Id + all editable fields (same as create)                                                                        | ✅        | 2025-11-25 |
| TASK-005 | Create UpdateChurchMemberStatusRequest.cs with StatusId (required), Note (optional string)                                                                | ✅        | 2025-11-25 |
| TASK-006 | Create ChurchMemberGridQuery.cs extending PagedQuery with StatusFilter, RoleFilter, BaptisedFilter, GiftAidFilter                                         | ✅        | 2025-11-25 |
| TASK-007 | Create ChurchMemberRoleDto.cs {Id, Type} and ChurchMemberStatusDto.cs {Id, Name}                                                                          | ✅        | 2025-11-25 |
| TASK-008 | Create AddressDto.cs with optional fields: Id, NameNumber, AddressLineOne, AddressLineTwo, Town, County, Postcode                                         | ✅        | 2025-11-25 |
| TASK-009 | Create CreateChurchMemberResponse.cs with Id, Message, Member (ChurchMemberDetailDto)                                                                     | ✅        | 2025-11-25 |

### Phase 2: Backend Foundation - Service Layer

- GOAL-002: Implement ChurchMemberService following UserManagementService pattern with full CRUD operations

| Task     | Description                                                                                                                               | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-010 | Create IChurchMemberService.cs interface with all method signatures                                                                       | ✅        | 2025-11-25 |
| TASK-011 | Create ChurchMemberService.cs injecting ChurchRegisterWebContext, UserManager for audit                                                   | ✅        | 2025-11-25 |
| TASK-012 | Implement GetChurchMembersAsync: apply search (name, email, phone), filters (status, role, baptised, giftaid), pagination, sorting        | ✅        | 2025-11-25 |
| TASK-013 | Implement GetChurchMemberByIdAsync with .Include(m => m.Address).Include(m => m.Roles).ThenInclude(r => r.RoleType)                       | ✅        | 2025-11-25 |
| TASK-014 | Implement CreateChurchMemberAsync: create member, handle optional address, assign roles via junction table                                | ✅        | 2025-11-25 |
| TASK-015 | Implement UpdateChurchMemberAsync: update member fields, manage address, sync roles (remove old, add new)                                 | ✅        | 2025-11-25 |
| TASK-016 | Implement UpdateChurchMemberStatusAsync: validate status exists, update, log note in audit (need audit log table or use ModifiedBy field) | ✅        | 2025-11-25 |
| TASK-017 | Implement GetRolesAsync: return all from ChurchMemberRoleTypes table                                                                      | ✅        | 2025-11-25 |
| TASK-018 | Implement GetStatusesAsync: return all from ChurchMemberStatus table                                                                      | ✅        | 2025-11-25 |
| TASK-019 | Register service in Program.cs: builder.Services.AddScoped<IChurchMemberService, ChurchMemberService>()                                   | ✅        | 2025-11-25 |

### Phase 3: Backend - API Endpoints

- GOAL-003: Create FastEndpoints for all church member operations

| Task     | Description                                                                        | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-018 | Create GetChurchMembersEndpoint.cs (GET /api/church-members)                       | ✅        | 2025-11-25 |
| TASK-019 | Create GetChurchMemberByIdEndpoint.cs (GET /api/church-members/{id})               | ✅        | 2025-11-25 |
| TASK-020 | Create CreateChurchMemberEndpoint.cs (POST /api/church-members)                    | ✅        | 2025-11-25 |
| TASK-021 | Create UpdateChurchMemberEndpoint.cs (PUT /api/church-members/{id})                | ✅        | 2025-11-25 |
| TASK-022 | Create UpdateChurchMemberStatusEndpoint.cs (PATCH /api/church-members/{id}/status) | ✅        | 2025-11-25 |
| TASK-023 | Create GetChurchMemberRolesEndpoint.cs (GET /api/church-members/roles)             | ✅        | 2025-11-25 |
| TASK-024 | Create GetChurchMemberStatusesEndpoint.cs (GET /api/church-members/statuses)       | ✅        | 2025-11-25 |
| TASK-025 | Add role-based authorization attributes to all endpoints                           | ✅        | 2025-11-25 |

### Phase 4: Database Verification & Seeding

- GOAL-004: Verify schema and seed required lookup data

| Task     | Description                                                                                   | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-026 | Verify ChurchMember, Address, ChurchMemberRoles tables exist                                  | ✅        | 2025-11-25 |
| TASK-027 | Verify ChurchMemberStatus and ChurchMemberRoleTypes tables exist                              | ✅        | 2025-11-25 |
| TASK-028 | Create/update database seeder for ChurchMemberStatus (Active, Inactive, Expired, In Glory)    | ✅        | 2025-11-25 |
| TASK-029 | Create/update database seeder for ChurchMemberRoleTypes (8 roles)                             | ✅        | 2025-11-25 |
| TASK-030 | Create AspNetRoles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator | ✅        | 2025-11-25 |
| TASK-031 | Test migrations and seed data in development environment                                      | ✅        | 2025-11-25 |

### Phase 5: Frontend - TypeScript Types & API Client

- GOAL-005: Create TypeScript interfaces and API integration

| Task     | Description                                                                     | Completed | Date       |
| -------- | ------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-032 | Create src/types/churchMembers.ts with all DTOs matching C# models              | ✅        | 2025-11-25 |
| TASK-033 | Create src/services/api/churchMembersApi.ts following administrationApi pattern | ✅        | 2025-11-25 |
| TASK-034 | Implement getChurchMembers with query parameters                                | ✅        | 2025-11-25 |
| TASK-035 | Implement getChurchMemberById, createChurchMember, updateChurchMember           | ✅        | 2025-11-25 |
| TASK-036 | Implement updateChurchMemberStatus, getRoles, getStatuses                       | ✅        | 2025-11-25 |
| TASK-037 | Export API client as singleton instance                                         | ✅        | 2025-11-25 |

### Phase 6: Frontend - Grid Component

- GOAL-006: Build church members grid interface with search, filter, pagination

| Task     | Description                                                                            | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-038 | Create src/pages/admin/ChurchMembersPage.tsx component                                 | ✅        | 2025-11-25 |
| TASK-039 | Implement Material-UI DataGrid with columns: Name, Status, Roles, Contact, MemberSince | ✅        | 2025-11-25 |
| TASK-040 | Add search bar with debounced input (search name, email, phone)                        | ✅        | 2025-11-25 |
| TASK-041 | Add filter dropdowns: Status, Role, Baptised, GiftAid                                  | ✅        | 2025-11-25 |
| TASK-042 | Implement pagination controls with page size selector                                  | ✅        | 2025-11-25 |
| TASK-043 | Add sorting for all sortable columns                                                   | ✅        | 2025-11-25 |
| TASK-044 | Add "Create Member" button (role-based visibility)                                     | ✅        | 2025-11-25 |
| TASK-045 | Implement row actions: View, Edit, Change Status (role-based)                          | ✅        | 2025-11-25 |

### Phase 7: Frontend - Create/Edit Forms

- GOAL-007: Build member creation and editing forms with validation

| Task     | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-046 | Create src/components/admin/ChurchMemberForm.tsx              | ✅        | 2025-11-25 |
| TASK-047 | Add required fields: FirstName, LastName, MemberSince, Status | ✅        | 2025-11-25 |
| TASK-048 | Add optional fields: Email, Phone, Baptised, GiftAid          | ✅        | 2025-11-25 |
| TASK-049 | Add Address section with collapsible fields                   | ✅        | 2025-11-25 |
| TASK-050 | Add multi-select for roles with checkboxes                    | ✅        | 2025-11-25 |
| TASK-051 | Implement client-side validation matching backend rules       | ✅        | 2025-11-25 |
| TASK-052 | Add form submit with loading state and error handling         | ✅        | 2025-11-25 |
| TASK-053 | Create status change dialog with note field (admin only)      | ✅        | 2025-11-25 |

### Phase 8: Testing - Backend

- GOAL-008: Comprehensive backend testing for all endpoints and services

| Task     | Description                                                            | Completed | Date |
| -------- | ---------------------------------------------------------------------- | --------- | ---- |
| TASK-054 | Create ChurchMemberServiceTests.cs with service layer unit tests       |           |      |
| TASK-055 | Create ChurchMemberEndpointsTests.cs integration tests                 |           |      |
| TASK-056 | Test role-based authorization for all endpoints                        |           |      |
| TASK-057 | Test search and filter combinations                                    |           |      |
| TASK-058 | Test pagination edge cases (empty results, page beyond limit)          |           |      |
| TASK-059 | Test validation rules (required fields, date validation, email format) |           |      |
| TASK-060 | Test role assignment/removal with junction table updates               |           |      |
| TASK-061 | Test audit trail population on create/update operations                |           |      |

### Phase 9: Testing - Frontend

- GOAL-009: Frontend component and integration testing

| Task     | Description                                   | Completed | Date |
| -------- | --------------------------------------------- | --------- | ---- |
| TASK-062 | Create ChurchMembersPage.test.tsx with Vitest |           |      |
| TASK-063 | Test grid rendering with mock data            |           |      |
| TASK-064 | Test search functionality                     |           |      |
| TASK-065 | Test filter dropdowns                         |           |      |
| TASK-066 | Test pagination controls                      |           |      |
| TASK-067 | Test form validation                          |           |      |
| TASK-068 | Test role-based UI element visibility         |           |      |
| TASK-069 | Test error handling and loading states        |           |      |

### Phase 10: Documentation & Deployment

- GOAL-010: Complete documentation and prepare for deployment

| Task     | Description                                           | Completed | Date |
| -------- | ----------------------------------------------------- | --------- | ---- |
| TASK-070 | Update API documentation/Swagger with new endpoints   |           |      |
| TASK-071 | Create user guide for church members management       |           |      |
| TASK-072 | Update navigation menu to include Church Members link |           |      |
| TASK-073 | Add route configuration for Church Members page       |           |      |
| TASK-074 | Run full test suite and verify 80%+ coverage          |           |      |
| TASK-075 | Perform load testing with 1000+ member records        |           |      |
| TASK-076 | Code review and address feedback                      |           |      |
| TASK-077 | Deploy to development environment for UAT             |           |      |

## 3. Alternatives

- **ALT-001**: Single-page CRUD vs Modal-based editing - Chose modal to match user management UX
- **ALT-002**: Separate status change endpoint vs combined update - Chose separate for admin-only access control
- **ALT-003**: Hard delete vs soft delete via status - Chose soft delete for audit trail and historical data
- **ALT-004**: Shared address entity vs embedded - Chose shared to support family address reuse

## 4. Dependencies

- **DEP-001**: ChurchRegister.Database project with entity definitions
- **DEP-002**: FastEndpoints NuGet package
- **DEP-003**: Material-UI DataGrid component
- **DEP-004**: React Router for navigation
- **DEP-005**: Existing authentication/authorization infrastructure
- **DEP-006**: Database migrations must be applied before testing

## 5. Files

### Backend Files (C#)

- **FILE-001**: ChurchRegister.ApiService/Models/Administration/ChurchMemberDto.cs
- **FILE-002**: ChurchRegister.ApiService/Models/Administration/ChurchMemberDetailDto.cs
- **FILE-003**: ChurchRegister.ApiService/Models/Administration/CreateChurchMemberRequest.cs
- **FILE-004**: ChurchRegister.ApiService/Models/Administration/UpdateChurchMemberRequest.cs
- **FILE-005**: ChurchRegister.ApiService/Models/Administration/UpdateChurchMemberStatusRequest.cs
- **FILE-006**: ChurchRegister.ApiService/Models/Administration/ChurchMemberGridQuery.cs
- **FILE-007**: ChurchRegister.ApiService/Services/IChurchMemberService.cs
- **FILE-008**: ChurchRegister.ApiService/Services/ChurchMemberService.cs
- **FILE-009**: ChurchRegister.ApiService/Endpoints/Administration/GetChurchMembersEndpoint.cs
- **FILE-010**: ChurchRegister.ApiService/Endpoints/Administration/GetChurchMemberByIdEndpoint.cs
- **FILE-011**: ChurchRegister.ApiService/Endpoints/Administration/CreateChurchMemberEndpoint.cs
- **FILE-012**: ChurchRegister.ApiService/Endpoints/Administration/UpdateChurchMemberEndpoint.cs
- **FILE-013**: ChurchRegister.ApiService/Endpoints/Administration/UpdateChurchMemberStatusEndpoint.cs
- **FILE-014**: ChurchRegister.ApiService/Endpoints/Administration/GetChurchMemberRolesEndpoint.cs
- **FILE-015**: ChurchRegister.ApiService/Endpoints/Administration/GetChurchMemberStatusesEndpoint.cs
- **FILE-016**: ChurchRegister.Database/Data/DatabaseSeeder.cs (update)
- **FILE-017**: ChurchRegister.ApiService/Program.cs (update for DI registration)

### Frontend Files (TypeScript/React)

- **FILE-018**: ChurchRegister.React/src/types/churchMembers.ts
- **FILE-019**: ChurchRegister.React/src/services/api/churchMembersApi.ts
- **FILE-020**: ChurchRegister.React/src/pages/admin/ChurchMembersPage.tsx
- **FILE-021**: ChurchRegister.React/src/components/admin/ChurchMemberForm.tsx
- **FILE-022**: ChurchRegister.React/src/components/admin/ChurchMemberStatusDialog.tsx

### Test Files

- **FILE-023**: ChurchRegister.ApiService.Tests/ChurchMemberServiceTests.cs
- **FILE-024**: ChurchRegister.ApiService.Tests/ChurchMemberEndpointsTests.cs
- **FILE-025**: ChurchRegister.React/src/pages/admin/ChurchMembersPage.test.tsx

## 6. Testing

- **TEST-001**: Unit tests for ChurchMemberService (all public methods)
- **TEST-002**: Integration tests for all 7 API endpoints
- **TEST-003**: Authorization tests for ChurchMembersViewer role (read-only)
- **TEST-004**: Authorization tests for ChurchMembersContributor role (create/update)
- **TEST-005**: Authorization tests for ChurchMembersAdministrator role (status change)
- **TEST-006**: Search functionality tests (partial match, case-insensitive)
- **TEST-007**: Filter combination tests (status + role, baptised + giftaid)
- **TEST-008**: Pagination tests (page navigation, page size limits)
- **TEST-009**: Validation tests (required fields, email format, date validation)
- **TEST-010**: Role assignment tests (add/remove multiple roles)
- **TEST-011**: Address management tests (create, update, shared addresses)
- **TEST-012**: Audit trail verification tests
- **TEST-013**: Frontend component rendering tests
- **TEST-014**: Frontend form validation tests
- **TEST-015**: Load testing with 10,000 records

## 7. Risks & Assumptions

- **RISK-001**: Existing database schema may need adjustments - Mitigation: Verify schema early in Phase 4
- **RISK-002**: Performance issues with large datasets - Mitigation: Implement database indexes and test with 10k+ records
- **RISK-003**: Role hierarchy conflicts with existing user roles - Mitigation: Use distinct naming (ChurchMembers prefix)
- **RISK-004**: Address sharing logic may cause update conflicts - Mitigation: Use immutable addresses, create new on edit
- **ASSUMPTION-001**: Database migrations are up to date and applied to dev environment
- **ASSUMPTION-002**: User authentication system supports custom role claims
- **ASSUMPTION-003**: Frontend build process supports Material-UI DataGrid
- **ASSUMPTION-004**: Existing API client patterns can be reused for church members

## 8. Related Specifications / Further Reading

- [Church Members Feature Specification](../spec/church-members-spec.md)
- [User Management Implementation](../ChurchRegister.ApiService/Endpoints/Administration/)
- [FastEndpoints Documentation](https://fast-endpoints.com/)
- [Material-UI DataGrid](https://mui.com/x/react-data-grid/)
