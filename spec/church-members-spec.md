---
title: Church Members Management Feature Specification
version: 1.0
date_created: 2025-11-20
last_updated: 2025-11-20
owner: ChurchRegister Development Team
tags: [design, feature, church-members, administration, data-management]
---

# Church Members Management Feature Specification

This specification defines the requirements, constraints, and interfaces for the Church Members Management feature, which provides comprehensive functionality for managing church member records, roles, statuses, and related information.

## 1. Purpose & Scope

### Purpose

This specification defines the Church Members Management feature, which enables authorized users to create, view, edit, and manage church member records within the ChurchRegister application. The feature provides a comprehensive administration interface similar to the existing user management grid, with specific functionality tailored to church member data management.

### Scope

This specification covers:

- Church member CRUD operations (Create, Read, Update, Delete)
- Church member role assignment and management (many-to-many relationship)
- Church member status management with optional notes
- Address management for church members
- Search, filter, and pagination capabilities
- Role-based access control for church member operations
- Audit trail for all member record changes
- Data validation for all input fields

### Out of Scope (Future Implementation)

- District assignment functionality
- ChurchMemberType field (will use ChurchMemberRoleTypes instead)
- Data Protection preferences
- Training Certificates
- Member self-service portal
- Bulk import/export operations
- Member communication features

### Intended Audience

- Backend developers implementing API endpoints and business logic
- Frontend developers creating UI components
- Database administrators managing schema changes
- QA engineers writing test cases
- Generative AI systems implementing features

### Assumptions

- The application uses ASP.NET Core with FastEndpoints
- Entity Framework Core is used for data access
- The existing user management patterns will be followed
- Authentication and authorization are already implemented
- The database schema for church members already exists

## 2. Definitions

### Acronyms & Abbreviations

- **CRUD**: Create, Read, Update, Delete
- **DTO**: Data Transfer Object
- **RBAC**: Role-Based Access Control
- **API**: Application Programming Interface
- **EF Core**: Entity Framework Core
- **UTC**: Coordinated Universal Time

### Domain-Specific Terms

- **Church Member**: An individual associated with the church, tracked in the system
- **Member Status**: Current state of a member (Active, Inactive, Expired, In Glory)
- **Member Role**: A specific responsibility or position held by a church member (e.g., Deacon, Treasurer)
- **In Glory**: A respectful term indicating a deceased member
- **Gift Aid**: UK tax relief scheme allowing charities to reclaim tax on donations
- **Baptised**: Indicates whether a member has been baptized

### Entity Relationships

- **ChurchMember**: Core entity representing a church member
- **ChurchMemberStatus**: Lookup table for member statuses
- **ChurchMemberRoleTypes**: Lookup table for available roles
- **ChurchMemberRoles**: Junction table linking members to their roles (many-to-many)
- **Address**: Optional address information for a member
- **Districts**: Future feature for geographical organization

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

#### Core Member Management

- **REQ-001**: System shall allow creating new church member records with required fields (FirstName, LastName, MemberSince, ChurchMemberStatusId)
- **REQ-002**: System shall allow updating existing church member records
- **REQ-003**: System shall allow viewing church member details
- **REQ-004**: System shall prevent hard deletion of church member records (use status instead)
- **REQ-005**: System shall support optional fields (PhoneNumber, EmailAddress, Address)
- **REQ-006**: System shall track Baptised status as a boolean field
- **REQ-007**: System shall track Gift Aid participation as a boolean field

#### Member Roles Management

- **REQ-008**: A church member may have zero or more roles
- **REQ-009**: A church member may hold multiple roles simultaneously (e.g., Member + Deacon)
- **REQ-010**: System shall support the following role types:
  - Non-Member
  - Member
  - Deacon
  - Auditor
  - Secretary
  - Treasurer
  - Minister
  - Junior Church Leader
- **REQ-011**: System shall allow adding and removing roles from a member
- **REQ-012**: Role assignments shall be tracked with audit information

#### Member Status Management

- **REQ-013**: System shall support the following member statuses:
  - Active
  - Inactive
  - Expired
  - In Glory
- **REQ-014**: System shall allow changing member status with an optional note
- **REQ-015**: Status changes shall be audited with timestamp and user information
- **REQ-016**: Status change notes shall be persisted for audit purposes

#### Address Management

- **REQ-017**: Address is optional for church members
- **REQ-018**: Address fields include: NameNumber, AddressLineOne, AddressLineTwo, Town, County, Postcode
- **REQ-019**: All address fields are optional
- **REQ-020**: Multiple members may share the same address

#### Search and Filtering

- **REQ-021**: System shall support searching members by FirstName, LastName, EmailAddress, PhoneNumber
- **REQ-022**: System shall support filtering by ChurchMemberStatusId
- **REQ-023**: System shall support filtering by role type
- **REQ-024**: System shall support filtering by Baptised status
- **REQ-025**: System shall support filtering by Gift Aid status
- **REQ-026**: Search shall be case-insensitive and support partial matches

#### Pagination and Sorting

- **REQ-027**: System shall support paginated results with configurable page size
- **REQ-028**: System shall support sorting by FirstName, LastName, MemberSince, Status
- **REQ-029**: System shall support both ascending and descending sort directions
- **REQ-030**: System shall return total count of records for pagination

### Security Requirements

#### Authentication & Authorization

- **SEC-001**: All church member endpoints shall require authentication
- **SEC-002**: System shall implement three access levels:
  - **ChurchMembersViewer**: Read-only access to church member records
  - **ChurchMembersContributor**: Read and write access (create, update)
  - **ChurchMembersAdministrator**: Full access including status changes and role management
- **SEC-003**: Only ChurchMembersContributor and ChurchMembersAdministrator roles can create members
- **SEC-004**: Only ChurchMembersContributor and ChurchMembersAdministrator roles can update members
- **SEC-005**: Only ChurchMembersAdministrator role can change member status
- **SEC-006**: Only ChurchMembersAdministrator role can assign/remove member roles
- **SEC-007**: All roles (Viewer, Contributor, Administrator) can view member lists and details

#### Data Protection

- **SEC-008**: Personal data (email, phone, address) shall only be accessible to authorized users
- **SEC-009**: Audit logs shall not expose sensitive personal information
- **SEC-010**: API responses shall not include deleted or archived records unless explicitly requested

### Data Validation Constraints

#### Required Field Validation

- **CON-001**: FirstName is required, maximum 50 characters
- **CON-002**: LastName is required, maximum 50 characters
- **CON-003**: MemberSince is required and must be a valid date
- **CON-004**: ChurchMemberStatusId is required and must reference an existing status

#### Optional Field Validation

- **CON-005**: PhoneNumber maximum 20 characters
- **CON-006**: EmailAddress maximum 100 characters, must be valid email format if provided
- **CON-007**: Address.NameNumber maximum 50 characters
- **CON-008**: Address.AddressLineOne maximum 100 characters
- **CON-009**: Address.AddressLineTwo maximum 100 characters
- **CON-010**: Address.Town maximum 50 characters
- **CON-011**: Address.County maximum 50 characters
- **CON-012**: Address.Postcode maximum 20 characters

#### Business Logic Validation

- **CON-013**: MemberSince date cannot be in the future
- **CON-014**: EmailAddress must be unique if provided (optional constraint)
- **CON-015**: At least one role should be assigned to active members (recommendation, not enforced)
- **CON-016**: Members with status "In Glory" should not be assigned new roles

### Audit Trail Guidelines

- **GUD-001**: All create operations shall record CreatedBy and CreatedDateTime
- **GUD-002**: All update operations shall record ModifiedBy and ModifiedDateTime
- **GUD-003**: Status changes shall be logged with previous status, new status, change reason, and timestamp
- **GUD-004**: Role assignments and removals shall be logged
- **GUD-005**: Audit records shall be immutable
- **GUD-006**: Audit logs shall retain data for compliance requirements (7 years minimum)

### API Design Guidelines

- **GUD-007**: Follow RESTful conventions for endpoint design
- **GUD-008**: Use FastEndpoints pattern consistent with existing user management endpoints
- **GUD-009**: Return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- **GUD-010**: Use DTOs for all API requests and responses
- **GUD-011**: Include pagination metadata in list responses
- **GUD-012**: Use consistent error response format

### Performance Guidelines

- **GUD-013**: List queries shall support efficient pagination to handle large datasets
- **GUD-014**: Search operations shall use database indexes on searchable fields
- **GUD-015**: Eager loading shall be used for related entities to prevent N+1 queries
- **GUD-016**: API responses shall complete within 2 seconds under normal load

### UI/UX Guidelines

- **GUD-017**: Grid interface shall follow existing user administration grid patterns
- **GUD-018**: Form validation shall provide clear, actionable error messages
- **GUD-019**: Status changes shall require confirmation dialog
- **GUD-020**: Role assignment shall use multi-select interface
- **GUD-021**: Search results shall update in real-time as user types (debounced)

## 4. Interfaces & Data Contracts

### API Endpoints

#### Get Church Members (Paginated List)

```http
GET /api/church-members
Authorization: Bearer {token}
Roles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator
```

**Query Parameters:**

```typescript
{
  page: number;              // Default: 1
  pageSize: number;          // Default: 25, Max: 100
  sortBy?: string;           // Default: "LastName"
  sortDirection?: "asc" | "desc"; // Default: "asc"
  searchTerm?: string;       // Search across name, email, phone
  statusFilter?: number;     // Filter by ChurchMemberStatusId
  roleFilter?: number;       // Filter by ChurchMemberRoleTypeId
  baptisedFilter?: boolean;  // Filter by baptism status
  giftAidFilter?: boolean;   // Filter by Gift Aid participation
}
```

**Response:**

```typescript
{
  items: ChurchMemberDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

#### Get Church Member by ID

```http
GET /api/church-members/{id}
Authorization: Bearer {token}
Roles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator
```

**Response:**

```typescript
ChurchMemberDetailDto;
```

#### Create Church Member

```http
POST /api/church-members
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
Content-Type: application/json
```

**Request Body:**

```typescript
{
  firstName: string;              // Required, max 50
  lastName: string;               // Required, max 50
  phoneNumber?: string;           // Optional, max 20
  emailAddress?: string;          // Optional, max 100, valid email
  memberSince: string;            // Required, ISO 8601 date
  churchMemberStatusId: number;   // Required, valid status ID
  baptised: boolean;              // Required, default false
  giftAid: boolean;               // Required, default false
  address?: {                     // Optional
    nameNumber?: string;          // Max 50
    addressLineOne?: string;      // Max 100
    addressLineTwo?: string;      // Max 100
    town?: string;                // Max 50
    county?: string;              // Max 50
    postcode?: string;            // Max 20
  };
  roleIds?: number[];             // Optional, array of role type IDs
}
```

**Response:** `201 Created`

```typescript
{
  id: number;
  message: string;
  member: ChurchMemberDetailDto;
}
```

#### Update Church Member

```http
PUT /api/church-members/{id}
Authorization: Bearer {token}
Roles: ChurchMembersContributor, ChurchMembersAdministrator
Content-Type: application/json
```

**Request Body:**

```typescript
{
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailAddress?: string;
  memberSince: string;
  baptised: boolean;
  giftAid: boolean;
  address?: AddressDto;
  roleIds?: number[];
}
```

**Response:** `200 OK`

```typescript
ChurchMemberDetailDto;
```

#### Update Church Member Status

```http
PATCH /api/church-members/{id}/status
Authorization: Bearer {token}
Roles: ChurchMembersAdministrator
Content-Type: application/json
```

**Request Body:**

```typescript
{
  statusId: number;      // Required, valid status ID
  note?: string;         // Optional, reason for status change
}
```

**Response:** `200 OK`

```typescript
ChurchMemberDetailDto;
```

#### Get Available Roles

```http
GET /api/church-members/roles
Authorization: Bearer {token}
Roles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator
```

**Response:**

```typescript
{
  id: number;
  type: string;
}
[];
```

#### Get Available Statuses

```http
GET /api/church-members/statuses
Authorization: Bearer {token}
Roles: ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator
```

**Response:**

```typescript
{
  id: number;
  name: string;
}
[];
```

### Data Transfer Objects

#### ChurchMemberDto (List View)

```typescript
{
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;              // Computed: "FirstName LastName"
  emailAddress?: string;
  phoneNumber?: string;
  memberSince: string;           // ISO 8601 date
  status: {
    id: number;
    name: string;
  };
  roles: string[];               // Array of role type names
  baptised: boolean;
  giftAid: boolean;
  createdAt: string;             // ISO 8601 datetime
  lastModified?: string;         // ISO 8601 datetime
}
```

#### ChurchMemberDetailDto (Detail View)

```typescript
{
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  emailAddress?: string;
  phoneNumber?: string;
  memberSince: string;
  status: {
    id: number;
    name: string;
  };
  address?: {
    id: number;
    nameNumber?: string;
    addressLineOne?: string;
    addressLineTwo?: string;
    town?: string;
    county?: string;
    postcode?: string;
    formattedAddress: string;    // Computed full address
  };
  roles: {
    id: number;
    type: string;
  }[];
  baptised: boolean;
  giftAid: boolean;
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  lastModified?: string;
}
```

#### AddressDto

```typescript
{
  id?: number;                   // Optional for new addresses
  nameNumber?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  town?: string;
  county?: string;
  postcode?: string;
}
```

### Database Schema

#### ChurchMember Table

```sql
CREATE TABLE ChurchMembers (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  FirstName NVARCHAR(50) NOT NULL,
  LastName NVARCHAR(50) NOT NULL,
  PhoneNumber NVARCHAR(20) NULL,
  EmailAddress NVARCHAR(100) NULL,
  ChurchMemberTypeId INT NULL,           -- Future use
  AddressId INT NULL,
  MemberSince DATETIME2 NULL,
  ChurchMemberStatusId INT NULL,
  DistrictId INT NULL,                   -- Future use
  Baptised BIT NOT NULL DEFAULT 0,
  GiftAid BIT NOT NULL DEFAULT 0,
  CreatedBy NVARCHAR(MAX) NOT NULL,
  CreatedDateTime DATETIME2 NOT NULL,
  ModifiedBy NVARCHAR(MAX) NULL,
  ModifiedDateTime DATETIME2 NULL,

  CONSTRAINT FK_ChurchMember_Address
    FOREIGN KEY (AddressId) REFERENCES Addresses(Id) ON DELETE SET NULL,
  CONSTRAINT FK_ChurchMember_Status
    FOREIGN KEY (ChurchMemberStatusId) REFERENCES ChurchMemberStatus(Id) ON DELETE SET NULL
);
```

#### ChurchMemberStatus Table

```sql
CREATE TABLE ChurchMemberStatus (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(50) NOT NULL,
  CreatedBy NVARCHAR(MAX) NOT NULL,
  CreatedDateTime DATETIME2 NOT NULL,
  ModifiedBy NVARCHAR(MAX) NULL,
  ModifiedDateTime DATETIME2 NULL
);

-- Seed data
INSERT INTO ChurchMemberStatus (Name, CreatedBy, CreatedDateTime)
VALUES
  ('Active', 'system', GETUTCDATE()),
  ('Inactive', 'system', GETUTCDATE()),
  ('Expired', 'system', GETUTCDATE()),
  ('In Glory', 'system', GETUTCDATE());
```

#### ChurchMemberRoleTypes Table

```sql
CREATE TABLE ChurchMemberRoleTypes (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Type NVARCHAR(50) NOT NULL,
  CreatedBy NVARCHAR(MAX) NOT NULL,
  CreatedDateTime DATETIME2 NOT NULL,
  ModifiedBy NVARCHAR(MAX) NULL,
  ModifiedDateTime DATETIME2 NULL
);

-- Seed data
INSERT INTO ChurchMemberRoleTypes (Type, CreatedBy, CreatedDateTime)
VALUES
  ('Non-Member', 'system', GETUTCDATE()),
  ('Member', 'system', GETUTCDATE()),
  ('Deacon', 'system', GETUTCDATE()),
  ('Auditor', 'system', GETUTCDATE()),
  ('Secretary', 'system', GETUTCDATE()),
  ('Treasurer', 'system', GETUTCDATE()),
  ('Minister', 'system', GETUTCDATE()),
  ('Junior Church Leader', 'system', GETUTCDATE());
```

#### ChurchMemberRoles Table (Junction)

```sql
CREATE TABLE ChurchMemberRoles (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ChurchMemberId INT NOT NULL,
  ChurchMemberRoleTypeId INT NOT NULL,
  CreatedBy NVARCHAR(MAX) NOT NULL,
  CreatedDateTime DATETIME2 NOT NULL,
  ModifiedBy NVARCHAR(MAX) NULL,
  ModifiedDateTime DATETIME2 NULL,

  CONSTRAINT FK_ChurchMemberRole_Member
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMembers(Id) ON DELETE CASCADE,
  CONSTRAINT FK_ChurchMemberRole_RoleType
    FOREIGN KEY (ChurchMemberRoleTypeId) REFERENCES ChurchMemberRoleTypes(Id) ON DELETE CASCADE,
  CONSTRAINT UQ_ChurchMemberRole
    UNIQUE (ChurchMemberId, ChurchMemberRoleTypeId)
);
```

#### Address Table

```sql
CREATE TABLE Addresses (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  NameNumber NVARCHAR(50) NULL,
  AddressLineOne NVARCHAR(100) NULL,
  AddressLineTwo NVARCHAR(100) NULL,
  Town NVARCHAR(50) NULL,
  County NVARCHAR(50) NULL,
  Postcode NVARCHAR(20) NULL,
  CreatedBy NVARCHAR(MAX) NOT NULL,
  CreatedDateTime DATETIME2 NOT NULL,
  ModifiedBy NVARCHAR(MAX) NULL,
  ModifiedDateTime DATETIME2 NULL
);
```

## 5. Acceptance Criteria

### Church Member Creation

- **AC-001**: Given a user with ChurchMembersContributor role, When they submit a valid create member request with all required fields, Then a new church member record is created and returned with HTTP 201
- **AC-002**: Given a create request with missing required fields (FirstName, LastName, MemberSince, StatusId), When submitted, Then the API returns HTTP 400 with validation errors
- **AC-003**: Given a create request with an invalid email format, When submitted, Then the API returns HTTP 400 with email validation error
- **AC-004**: Given a create request with MemberSince date in the future, When submitted, Then the API returns HTTP 400 with date validation error
- **AC-005**: Given a user with ChurchMembersViewer role, When they attempt to create a member, Then the API returns HTTP 403 Forbidden

### Church Member Retrieval

- **AC-006**: Given a user with any ChurchMembers role, When they request the members list, Then they receive a paginated response with members matching their filters
- **AC-007**: Given a search term, When a user searches for members, Then the system returns members whose FirstName, LastName, Email, or Phone contains the search term (case-insensitive)
- **AC-008**: Given a status filter, When applied to the member list, Then only members with that status are returned
- **AC-009**: Given a role filter, When applied, Then only members assigned to that role are returned
- **AC-010**: Given a member ID, When requesting member details, Then the full member record with address and roles is returned

### Church Member Updates

- **AC-011**: Given a user with ChurchMembersContributor role, When they submit valid updates to a member, Then the member record is updated and audit fields are populated
- **AC-012**: Given an update request with invalid data, When submitted, Then the API returns HTTP 400 with specific validation errors
- **AC-013**: Given a user with ChurchMembersViewer role, When they attempt to update a member, Then the API returns HTTP 403 Forbidden
- **AC-014**: Given an update to member roles, When saved, Then the junction table records are updated correctly (additions and removals)

### Status Changes

- **AC-015**: Given a user with ChurchMembersAdministrator role, When they change a member status with a note, Then the status is updated and the note is recorded in audit log
- **AC-016**: Given a user with ChurchMembersContributor role, When they attempt to change member status, Then the API returns HTTP 403 Forbidden
- **AC-017**: Given a status change request with an invalid status ID, When submitted, Then the API returns HTTP 400 with validation error
- **AC-018**: Given a member status change to "In Glory", When confirmed, Then the status is updated and member remains in the system for historical records

### Role Management

- **AC-019**: Given valid role IDs, When assigning roles to a member, Then the roles are added to the member without duplicates
- **AC-020**: Given existing roles on a member, When new roles are assigned, Then previous roles are removed and new roles are added
- **AC-021**: Given an invalid role ID, When attempting to assign, Then the API returns HTTP 400 with validation error
- **AC-022**: Given a member with status "In Glory", When attempting to add new roles, Then the system should allow it but log a warning (soft constraint)

### Address Management

- **AC-023**: Given an address is provided during member creation, When the address doesn't exist, Then a new address record is created
- **AC-024**: Given an existing address ID, When updated to null, Then the member's AddressId is set to null (address remains in database)
- **AC-025**: Given address fields are all null or empty, When creating a member, Then no address record is created

### Pagination & Sorting

- **AC-026**: Given a page size of 25, When requesting page 2, Then items 26-50 are returned with correct pagination metadata
- **AC-027**: Given a sort by LastName ascending, When retrieving members, Then results are ordered alphabetically by last name A-Z
- **AC-028**: Given a sort by MemberSince descending, When retrieving members, Then newest members appear first
- **AC-029**: Given more than 100 items requested per page, When submitted, Then the system limits to maximum 100 items

### Audit Trail

- **AC-030**: Given any create operation, When completed, Then CreatedBy and CreatedDateTime are populated with current user and UTC timestamp
- **AC-031**: Given any update operation, When completed, Then ModifiedBy and ModifiedDateTime are updated with current user and UTC timestamp
- **AC-032**: Given a status change, When executed, Then an audit log entry is created with previous status, new status, note, user, and timestamp

## 6. Test Automation Strategy

### Test Levels

#### Unit Tests

- **Service Layer Tests**: Test ChurchMemberService business logic in isolation
- **Validation Tests**: Test all validation rules for create/update operations
- **Mapping Tests**: Test DTO to Entity mappings
- **Repository Tests**: Test data access patterns with in-memory database

#### Integration Tests

- **Endpoint Tests**: Test all API endpoints with test database
- **Authentication Tests**: Verify role-based access control for all endpoints
- **Database Tests**: Verify EF Core migrations and relationships
- **Search & Filter Tests**: Test query performance and correctness

#### End-to-End Tests

- **UI Workflow Tests**: Test complete user journeys (create, edit, status change)
- **Grid Functionality Tests**: Test search, filter, pagination, sorting in UI
- **Role Permission Tests**: Verify UI elements show/hide based on user roles

### Testing Frameworks

- **Backend**: MSTest, FluentAssertions, Moq
- **Frontend**: Vitest, React Testing Library
- **API Testing**: Custom WebApplicationFactory for integration tests
- **Database**: In-memory SQLite for fast tests, SQL Server for integration tests

### Test Data Management

- **Seed Data**: Standard set of members, roles, and statuses for tests
- **Test Builders**: Fluent builders for creating test church members
- **Cleanup**: Automatic cleanup after each test using IDisposable pattern
- **Isolation**: Each test uses isolated database context

### CI/CD Integration

- **GitHub Actions**: Run all tests on pull requests
- **Code Coverage**: Minimum 80% coverage for new code
- **Performance Tests**: Load tests for list endpoints (1000+ records)
- **Security Tests**: Automated OWASP dependency checks

### Coverage Requirements

- **Unit Test Coverage**: Minimum 85% for service layer
- **Integration Test Coverage**: All API endpoints must have tests
- **Validation Coverage**: Every validation rule must have positive and negative tests
- **Permission Coverage**: Every role combination must be tested

### Performance Testing

- **Load Testing**: Test with 10,000 member records
- **Response Time**: All queries under 2 seconds
- **Concurrent Users**: Support 50 concurrent users
- **Database Performance**: Monitor and optimize N+1 query patterns

## 7. Rationale & Context

### Design Decisions

#### Why Use ChurchMemberRoleTypes Instead of ChurchMemberType?

The original schema included both `ChurchMemberTypeId` and roles. After analysis, we determined that the role-based system provides more flexibility:

- Members can have multiple roles simultaneously (e.g., Member + Deacon)
- Roles are extensible without schema changes
- Role-based filtering and reporting is more useful
- ChurchMemberTypeId field is preserved in schema for future use but not actively used

#### Why Soft Delete via Status Instead of Hard Delete?

Church member records have historical significance:

- Contribution records reference members
- Attendance records reference members
- Audit compliance requires retention
- "In Glory" status provides respectful handling of deceased members
- Historical reports need complete member data

#### Why Optional Address with Nullable Foreign Key?

Address management needs flexibility:

- Not all members provide addresses
- Multiple members may share addresses (families)
- Address changes shouldn't create orphaned records
- Null foreign key allows members without addresses

#### Why Separate Status Change Endpoint?

Status changes are privileged operations:

- Requires ChurchMembersAdministrator role only
- Often requires approval or notes
- Audit trail is critical for status changes
- Prevents accidental status changes during regular edits

#### Why Multi-Select for Roles?

Church members often hold multiple responsibilities:

- A member can be both Member and Treasurer
- Deacons are also Members
- Junior Church Leaders are Members
- Flexible role assignment supports real-world scenarios

### Integration with Existing Patterns

#### User Management Pattern Reuse

The church members feature follows the established user management patterns:

- Similar grid interface with search, filter, pagination
- Consistent endpoint structure and naming
- Same authentication and authorization patterns
- Reuse of pagination, sorting, and filtering logic
- Consistent audit trail approach

#### FastEndpoints Architecture

All endpoints follow the FastEndpoints pattern:

- Strongly-typed request/response objects
- Built-in validation
- Automatic OpenAPI documentation
- Consistent error handling
- Role-based authorization attributes

#### Entity Framework Core Patterns

- IAuditableEntity interface for audit fields
- Navigation properties for relationships
- Fluent API configuration in DbContext
- Repository pattern with service layer
- Eager loading to prevent N+1 queries

### Future Extensibility

#### District Assignment (Deferred)

Districts table exists but not actively used:

- Will enable geographical organization
- Useful for pastoral care assignment
- May influence future reporting features
- Schema supports it when needed

#### Data Protection & Training Certificates (Deferred)

Tables exist for future compliance features:

- GDPR consent tracking
- Training certification management
- Safeguarding compliance
- Schema prepared for future implementation

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: ASP.NET Core Identity - Required for authentication and role management
- **EXT-002**: SQL Server Database - Primary data store for church member records
- **EXT-003**: Entity Framework Core - ORM for database access and migrations

### Third-Party Services

- **SVC-001**: Email Service (Azure Communication Services) - For future notifications (not in MVP)
- **SVC-002**: Authentication Service - JWT token validation for API requests

### Infrastructure Dependencies

- **INF-001**: Database Server - SQL Server 2019+ for production, LocalDB for development
- **INF-002**: Web Server - IIS or Kestrel for hosting API service
- **INF-003**: File Storage - Local or Azure Blob Storage for future document attachments

### Data Dependencies

- **DAT-001**: ChurchMemberStatus lookup data - Must be seeded before creating members
- **DAT-002**: ChurchMemberRoleTypes lookup data - Must be seeded before assigning roles
- **DAT-003**: AspNetRoles - ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator roles must exist

### Technology Platform Dependencies

- **PLT-001**: .NET 9.0 SDK - Required for building and running the API service
- **PLT-002**: React 18+ - Required for frontend UI components
- **PLT-003**: TypeScript 5+ - Required for type-safe frontend development
- **PLT-004**: Material-UI v5+ - UI component library for consistent design

### Compliance Dependencies

- **COM-001**: GDPR Compliance - Personal data handling must comply with UK GDPR
- **COM-002**: Data Retention Policy - Member records retained for 7+ years after inactive status
- **COM-003**: Audit Trail Requirements - All changes must be logged for compliance

## 9. Examples & Edge Cases

### Example: Create New Church Member

#### Request

```http
POST /api/church-members
Content-Type: application/json
Authorization: Bearer {token}

{
  "firstName": "John",
  "lastName": "Smith",
  "emailAddress": "john.smith@example.com",
  "phoneNumber": "01234 567890",
  "memberSince": "2020-01-15",
  "churchMemberStatusId": 1,
  "baptised": true,
  "giftAid": true,
  "address": {
    "nameNumber": "42",
    "addressLineOne": "High Street",
    "town": "London",
    "postcode": "SW1A 1AA"
  },
  "roleIds": [2, 3]
}
```

#### Response

```json
{
  "id": 123,
  "message": "Church member created successfully",
  "member": {
    "id": 123,
    "firstName": "John",
    "lastName": "Smith",
    "fullName": "John Smith",
    "emailAddress": "john.smith@example.com",
    "phoneNumber": "01234 567890",
    "memberSince": "2020-01-15T00:00:00Z",
    "status": {
      "id": 1,
      "name": "Active"
    },
    "roles": [
      { "id": 2, "type": "Member" },
      { "id": 3, "type": "Deacon" }
    ],
    "baptised": true,
    "giftAid": true,
    "address": {
      "id": 45,
      "nameNumber": "42",
      "addressLineOne": "High Street",
      "town": "London",
      "postcode": "SW1A 1AA",
      "formattedAddress": "42 High Street, London, SW1A 1AA"
    },
    "createdBy": "admin@churchregister.com",
    "createdAt": "2025-11-20T10:30:00Z"
  }
}
```

### Example: Search Members

```http
GET /api/church-members?searchTerm=smith&statusFilter=1&page=1&pageSize=10
```

Returns all members with "Smith" in their name, email, or phone with Active status.

### Example: Update Member Status

```http
PATCH /api/church-members/123/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "statusId": 4,
  "note": "Passed away peacefully on 2025-11-15"
}
```

Changes member to "In Glory" status with note for audit trail.

### Edge Cases

#### Edge Case 1: Member with No Email or Phone

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "memberSince": "2015-03-20",
  "churchMemberStatusId": 1,
  "baptised": false,
  "giftAid": false
}
```

**Expected**: Member created successfully with null email and phone.

#### Edge Case 2: Member with Multiple Roles

```json
{
  "roleIds": [2, 3, 5, 6, 7]
}
```

**Expected**: Member assigned as Member, Deacon, Secretary, Treasurer, and Minister simultaneously.

#### Edge Case 3: Family Members Sharing Address

```json
// Member 1
{
  "firstName": "John",
  "lastName": "Smith",
  "addressId": 45
}

// Member 2 (created separately)
{
  "firstName": "Jane",
  "lastName": "Smith",
  "addressId": 45
}
```

**Expected**: Both members reference the same address record.

#### Edge Case 4: Deceased Member Role Assignment

```json
PATCH /api/church-members/123/status
{
  "statusId": 4  // In Glory
}

// Later attempt to add role
PUT /api/church-members/123
{
  "roleIds": [3]  // Try to add Deacon
}
```

**Expected**: System allows the update but logs a warning. Business rule: don't assign new roles to deceased members, but technically allowed for historical corrections.

#### Edge Case 5: MemberSince Date Validation

```json
{
  "memberSince": "2030-01-01" // Future date
}
```

**Expected**: HTTP 400 with error "MemberSince cannot be in the future".

#### Edge Case 6: Pagination Beyond Available Records

```http
GET /api/church-members?page=999&pageSize=25
```

**Expected**: Returns empty items array with correct pagination metadata (hasNextPage: false).

#### Edge Case 7: Invalid Email Format

```json
{
  "emailAddress": "not-a-valid-email"
}
```

**Expected**: HTTP 400 with error "Invalid email address format".

#### Edge Case 8: Removing All Roles

```json
{
  "roleIds": []
}
```

**Expected**: All roles removed from member. Member can exist without roles (may trigger warning in UI).

#### Edge Case 9: Concurrent Updates

Two users update the same member simultaneously.
**Expected**: Last write wins. EF Core concurrency token can be added for optimistic concurrency if needed.

#### Edge Case 10: Search with Special Characters

```http
GET /api/church-members?searchTerm=O'Brien
```

**Expected**: Proper SQL escaping, returns members with apostrophes in names.

## 10. Validation Criteria

### API Contract Validation

- **VAL-001**: All endpoint request/response DTOs match the specified contracts
- **VAL-002**: HTTP status codes match the specification for all scenarios
- **VAL-003**: Pagination metadata is accurate for all list endpoints
- **VAL-004**: Error responses include actionable messages for clients

### Data Integrity Validation

- **VAL-005**: All required fields are enforced at database and API level
- **VAL-006**: Foreign key relationships prevent orphaned records
- **VAL-007**: Unique constraints prevent duplicate role assignments
- **VAL-008**: Audit fields (CreatedBy, CreatedDateTime) are populated for all records

### Business Logic Validation

- **VAL-009**: MemberSince date cannot be in the future
- **VAL-010**: Email addresses are validated against RFC 5322 format
- **VAL-011**: Status changes are restricted to valid transitions
- **VAL-012**: Role assignments reference existing role types

### Security Validation

- **VAL-013**: All endpoints require valid JWT authentication
- **VAL-014**: Role-based authorization is enforced for all operations
- **VAL-015**: Personal data is only accessible to authorized users
- **VAL-016**: Audit logs capture all data modifications

### Performance Validation

- **VAL-017**: List queries with 10,000+ records complete within 2 seconds
- **VAL-018**: Search operations use database indexes effectively
- **VAL-019**: No N+1 query patterns in entity loading
- **VAL-020**: API responses are cached where appropriate

### UI/UX Validation

- **VAL-021**: Grid displays all required columns (Name, Status, Roles, Contact)
- **VAL-022**: Search filters update results without page refresh
- **VAL-023**: Form validation shows errors inline with fields
- **VAL-024**: Status changes require confirmation dialog
- **VAL-025**: Role multi-select is intuitive and accessible

## 11. Related Specifications / Further Reading

### Internal Documentation

- [User Management Specification](./spec-user-management.md) _(if exists)_
- [Authentication & Authorization Specification](./spec-authentication.md) _(if exists)_
- [Database Schema Documentation](../SQL%20Scripts/Database%20Schema.sql)
- [API Endpoint Conventions](../ChurchRegister.ApiService/UseCase/README.md)

### External References

- [FastEndpoints Documentation](https://fast-endpoints.com/)
- [Entity Framework Core Best Practices](https://learn.microsoft.com/en-us/ef/core/)
- [ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity)
- [RESTful API Design Guidelines](https://restfulapi.net/)
- [GDPR Compliance for Member Data](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [Material-UI Data Grid Documentation](https://mui.com/x/react-data-grid/)

### Architecture Patterns

- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [DTO Pattern](https://martinfowler.com/eaaCatalog/dataTransferObject.html)
- [Use Case Pattern](../ChurchRegister.ApiService/UseCase/README.md)

---

**Document Status**: Draft for Review  
**Next Steps**: Review with development team, validate against existing codebase patterns, create implementation tasks
