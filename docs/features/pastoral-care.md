# Pastoral care

## Overview

The Pastoral Care feature enables church staff to record and track pastoral visits, phone calls, and other care interactions with church members. It provides a confidential log of pastoral contact to help the church maintain consistent care for its congregation.

## Who can use this feature

| Role | Access |
|------|--------|
| SystemAdministration | Full access |
| PastoralCare | Full access |
| All other roles | No access |

## Where to find it

Navigate to **Pastoral Care** from the main menu. Access is restricted to authorised roles.

## Key concepts

- **Care record** — a single pastoral interaction (visit, phone call, letter, etc.)
- **Care type** — the category of interaction (Home Visit, Hospital Visit, Phone Call, etc.)
- **Follow-up required** — flag indicating whether a further contact needs to be scheduled

## Workflow

1. Navigate to a member's profile or the Pastoral Care section
2. Create a new care record
3. Select the care type, date, and staff member responsible
4. Record notes (notes are confidential and visible only to authorised roles)
5. Flag for follow-up if required

## Confidentiality

Pastoral care records are accessible **only** to users with the `PastoralCare` or `SystemAdministration` role. They are not visible in general member views.

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/pastoral-care` | List pastoral care records |
| `POST` | `/api/pastoral-care` | Create a care record |
| `GET` | `/api/pastoral-care/{id}` | Get a specific care record |
| `PUT` | `/api/pastoral-care/{id}` | Update a care record |
| `DELETE` | `/api/pastoral-care/{id}` | Delete a care record |

---

*Full specification: [spec/pastoral-care-spec.md](../../spec/pastoral-care-spec.md)*
