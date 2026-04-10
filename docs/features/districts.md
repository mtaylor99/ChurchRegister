# Districts

## Overview

The Districts feature organises church members into geographical or organisational districts. Each member can be assigned to a district, and district leaders (Deacons) are responsible for pastoral oversight of their district's members.

## Who can use this feature

| Role | Access |
|------|--------|
| SystemAdministration | Full access |
| PastoralCare | View districts and member assignments |
| All other roles | No access |

## Where to find it

Navigate to **Districts** from the main menu (visible to authorised roles only).

## Key concepts

- **District** — a named grouping of church members (typically by geographical area)
- **Deacon** — the district leader responsible for pastoral care of district members
- **District member** — any active church member assigned to a district

## Member assignment

Members are assigned to districts from the Church Members section. A member can belong to only one district at a time. When a member's address changes, their district assignment may need to be updated manually.

## District member list export

An authorised user can export the full list of district members as:
- **PDF** — formatted for printing and distributing to deacons
- **CSV** — for further processing in spreadsheets

*Export design: [spec/design-district-members-list-export.md](../../spec/design-district-members-list-export.md)*

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/districts` | List all districts |
| `POST` | `/api/districts` | Create a district |
| `GET` | `/api/districts/{id}` | Get a specific district |
| `PUT` | `/api/districts/{id}` | Update a district |
| `DELETE` | `/api/districts/{id}` | Delete a district |
| `GET` | `/api/districts/{id}/members` | List members in a district |

---

*Full specification: [spec/church-district-spec.md](../../spec/church-district-spec.md)*  
*Deacon spec: [spec/district-decaons-spec.md](../../spec/district-decaons-spec.md)*
