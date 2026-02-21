---
title: Training Certificates and Checks Module Specification
version: 1.0
date_created: 2026-02-13
last_updated: 2026-02-13
owner: Product Owner
tags: [design, process, data, app]
---

# Introduction

This specification defines the training certificates and checks module for church members, including data model, statuses, UI behavior, permissions, a two-tab layout (Certification and Training/Checks), and dashboard indicators for upcoming expiries and pending items.

## 1. Purpose & Scope

The purpose of this specification is to define how training certificates and checks are tracked, managed, and surfaced in the application. The scope includes data entities, status rules, UI requirements for a training management area with two tabs (Certification and Training/Checks), and dashboard widgets, plus security/permissions. The intended audience is product, engineering, and QA teams implementing the module in the existing architecture used by the members area and attendance feature. Assumptions: church members already exist in the system, and the UI patterns for attendance and members can be reused for list, filter, and export behaviors.

## 2. Definitions

- **DBS**: Disclosure and Barring Service check.
- **Training/Check**: A compliance requirement such as DBS or Safeguarding.
- **Certificate**: Proof of completion or validity for a training/check.
- **Training Certificate Type**: A category such as DBS, Safeguarding Level 2, Safeguarding Level 3, Food Hygiene, First Aid, Fire Marshal.
- **Training/Check Type Status**: Active or InActive, indicating whether a type can be used for new certifications.
- **Expiry Date**: The date after which the training/check is no longer valid.
- **Allow to Expire**: A status indicating the member no longer requires the training/check and the certificate can lapse.
- **Pending**: A status indicating the training/check is required but not yet completed or verified.
- **RAG**: Red/Amber/Green; for this module only Red and Amber are used.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The system shall support tracking training/check items for church members with a status and optional expiry date.
- **REQ-002**: The system shall allow multiple training/check items per member and manage each item independently.
- **REQ-003**: The training/check list UI shall be a grid with one row per member per training/check item.
- **REQ-004**: The grid shall support filtering by Training/Check Type, status, and member name.
- **REQ-005**: The grid columns shall include Name, Role in the church, Contact, Status, Training/Check Type, and Expiry Date.
- **REQ-006**: The grid shall support exporting the filtered data set to XLSX.
- **REQ-007**: The system shall provide an Add workflow that allows selecting member, training/check type, status, and expiry date (expiry date optional).
- **REQ-008**: The dashboard shall include a widget highlighting training/check items that are Pending or near expiry within the default window of 60 days.
- **REQ-009**: The training/check management area shall use a two-tab layout: Certification and Training/Checks.
- **REQ-010**: The Certification tab shall contain the training/check grid defined in this specification.
- **REQ-011**: The Training/Checks tab shall manage training/check types and allow adding new types.
- **REQ-023**: Training/Check types shall have a status of Active or InActive; seeded types shall be Active.
- **REQ-024**: Training/Check types shall be editable, including name and status; delete is not permitted.
- **REQ-025**: Training/Checks tab shall provide filters aligned with attendance type management, scoped to training/check types.
- **REQ-012**: The look and feel of both tabs shall match the Members area and use the same architecture patterns.
- **REQ-013**: The system shall enforce permissions for TrainingViewer, TrainingContributor, and TrainingAdministrator, aligned with Members permissions semantics.
- **REQ-014**: The grid shall support sorting and pagination matching the Members grid behavior.
- **REQ-015**: The grid shall default sort by urgency: expired (Red) first, then expiring within 60 days (Amber), then remaining items.
- **REQ-016**: The grid shall visually highlight rows using RAG rules (Red and Amber only). Red applies to expired items where status is not Allow to Expire; Amber applies to items expiring within 60 days where status is not Allow to Expire.
- **REQ-017**: Records shall be retained; delete is not permitted from the UI.
- **REQ-018**: Items with status Allow to Expire shall be removed from the grid after their expiry date passes.
- **REQ-019**: The dashboard widget shall provide a grouped summary message when 5 or more members share the same training/check type and expiry date, or when 5 or more members share the same training/check type with status Pending and no expiry date.
- **REQ-020**: Exported data shall include the RAG indicator for each row.
- **REQ-021**: Exported data shall apply cell background color for Red and Amber in the XLSX export.
- **REQ-022**: The system shall seed initial TrainingCertificateTypes and allow administrators to add more types via the Training/Checks tab.
- **REQ-026**: InActive Training/Check types shall not be selectable for new certifications but remain visible for historical records.

- **STA-001**: Statuses shall include Pending, In Validity, Expired, and Allow to Expire.
- **STA-002**: An item with status Allow to Expire shall not be flagged as an alert on the dashboard.
- **STA-003**: Expiry Date may be blank while training/check is being arranged.

- **CON-001**: The module shall not require modifying existing church member records for display; it shall join via ChurchMemberId.
- **CON-002**: Data model shall support adding new training/check types without schema changes.

- **GUD-001**: Use existing grid, filter, sort, pagination, and export patterns established in the Members area for consistency.
- **GUD-002**: Dashboard widget should be concise and action-oriented to support quick follow-up.

## 4. Interfaces & Data Contracts

### Data Model

The data model shall support a training/check item per member. Suggested tables:

**TrainingCertificateTypes**

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| Id | Guid/Int | Yes | Primary key |
| Type | String | Yes | Training/Check type name |
| Status | String/Enum | Yes | Active, InActive |

**ChurchMemberTrainingCertificates**

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| Id | Guid/Int | Yes | Primary key |
| ChurchMemberId | Guid/Int | Yes | FK to church member |
| TrainingCertificateTypeId | Guid/Int | Yes | FK to training/check type |
| Status | String/Enum | Yes | Pending, In Validity, Expired, Allow to Expire |
| Expires | Date | No | Expiry date (nullable) |
| Notes | String | No | Optional notes/remarks |

### UI Interfaces

- Training/Check management area route and layout aligned to Members area and attendance-style tabs.
- Two tabs are displayed: Certification and Training/Checks.
- Certification tab grid supports filter, sort, pagination, and export with existing shared components.
- Certification grid rows display Red/Amber highlighting based on RAG rules.
- Certification Add/Edit modal or page with dropdown for member and training/check type, status selector, and optional expiry date picker.
- Training/Checks tab provides a types list with add (and optional edit) capability for TrainingCertificateTypes.
- Training/Checks tab includes search and status filters for training/check types.

### Dashboard Widget

- Inputs: training/check items joined to members.
- Outputs: counts and list of items that are Pending or expiring within the default window of 60 days.
- Outputs: optional grouped message when 5 or more members share the same training/check type and expiry date, for example "5+ members [Type] expiring soon".
- Outputs: optional grouped message when 5 or more members share the same training/check type with status Pending and no expiry date, for example "5+ members [Type] pending".

## 5. Acceptance Criteria

- **AC-001**: Given a member with two training/check items, When the training list is opened, Then two rows are displayed, one per item.
- **AC-002**: Given an item with no expiry date, When it is saved with status Pending, Then the system stores the item with a null expiry date.
- **AC-003**: Given a user with TrainingViewer, When they view the training grid, Then they can view rows but cannot add or edit items.
- **AC-004**: Given a user with TrainingContributor, When they add a training/check item, Then the item is persisted and appears in the grid.
- **AC-005**: Given a user with TrainingAdministrator, When they edit an item, Then the change is persisted.
- **AC-006**: Given an item with status Allow to Expire, When the dashboard widget loads, Then the item is not included in the alerts list.
- **AC-007**: Given an item with expiry within 60 days, When the dashboard widget loads, Then the item appears in the expiring list.
- **AC-008**: Given filters for Training/Check Type, status, and name, When a user applies them, Then the grid shows only matching rows.
- **AC-009**: Given the export action, When invoked, Then the export contains all rows that match the current filters, including the RAG color indicator.
- **AC-010**: Given an item is expired and not Allow to Expire, When the grid loads, Then the row is highlighted Red and sorted above Amber rows.
- **AC-011**: Given an item expires within 60 days, When the grid loads, Then the row is highlighted Amber and sorted below Red rows.
- **AC-012**: Given an item is Allow to Expire and its expiry date has passed, When the grid loads, Then the row is not shown.
- **AC-013**: Given 5 or more members share the same training/check type and expiry date within 60 days, When the dashboard widget loads, Then a grouped summary message is shown.
- **AC-014**: Given 5 or more members share the same training/check type with status Pending and no expiry date, When the dashboard widget loads, Then a grouped summary message is shown.
- **AC-015**: Given the export format supports styling, When the export is generated, Then Red/Amber rows have matching background colors.
- **AC-016**: Given a user opens the training module, When the page loads, Then the Certification and Training/Checks tabs are visible.
- **AC-017**: Given a TrainingAdministrator or TrainingContributor, When they add a new Training/Check type in the Training/Checks tab, Then the type is persisted and appears in the type list.
- **AC-018**: Given a TrainingAdministrator or TrainingContributor, When they edit a Training/Check type name or status, Then the changes are persisted.
- **AC-019**: Given a Training/Check type is InActive, When a user adds a certification, Then the InActive type is not available for selection.

## 6. Test Automation Strategy

- **Test Levels**: Unit, Integration, End-to-End.
- **Frameworks**: MSTest, FluentAssertions, Moq (for .NET applications).
- **Test Data Management**: Use factory builders for members and training items; clean up after tests by removing created rows or using transactional rollbacks.
- **CI/CD Integration**: Run unit and integration tests in GitHub Actions; E2E tests triggered on main branch merges.
- **Coverage Requirements**: Minimum 80% coverage on training/check services and UI list filtering, sorting, and RAG logic.
- **Performance Testing**: Validate dashboard widget load time under 1 second for 1,000 training items.

## 7. Rationale & Context

Training and check compliance is time-bound and requires proactive follow-up. Managing training/check items independently per member ensures clarity and supports multiple obligations for a single person. Dashboard visibility enables timely action on pending and expiring items without scanning the full list.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: None required for initial implementation.

### Third-Party Services
- **SVC-001**: None required for initial implementation.

### Infrastructure Dependencies
- **INF-001**: Existing application database and API service hosting.

### Data Dependencies
- **DAT-001**: Church member data for joining training/check items.

### Technology Platform Dependencies
- **PLT-001**: .NET runtime and existing data access layer used by Members area.

### Compliance Dependencies
- **COM-001**: DBS-related data handling must adhere to internal data protection policies.

## 9. Examples & Edge Cases

```code
// Example: A member with two training/check items.
// Member: Jane Doe
// Items:
// - DBS, Status: In Validity, Expires: 2027-05-01
// - Safeguarding Level 2, Status: Pending, Expires: null
// Expected: Two grid rows; DBS appears in expiring list only when within 60 days.
```

## 10. Validation Criteria

- All requirements and acceptance criteria are implemented and automated tests pass.
- Permissions enforce view, add, and edit actions as specified.
- Dashboard widget correctly excludes Allow to Expire and includes Pending and expiring items.
- Grid export matches visible filters and columns.
- Grid ordering and RAG highlighting follow the defined urgency rules.

## 11. Related Specifications / Further Reading

- [church-members-spec](church-members-spec.md)
- [member-contributions-spec](member-contributions-spec.md)
