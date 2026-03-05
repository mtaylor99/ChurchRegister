# Training certificates

## Overview

The Training Certificates feature tracks mandatory and optional training completed by church staff and volunteers. It records the certificate details, expiry dates, and provides notifications when renewals are due.

## Who can use this feature

| Role | Access |
|------|--------|
| SystemAdministration | Full access |
| ChurchMembers.Edit permission | View and create own certificates |
| All other roles | No access |

## Where to find it

Navigate to a member's profile → **Training** tab, or via the **Training** section in the administration area.

## Key concepts

- **Training type** — the specific training course (e.g. Safeguarding Level 1, First Aid, DBS Check)
- **Certificate** — a completed training record with issue date, expiry date, and certificate reference
- **Expiry** — certificates have an expiry date; the system generates reminders ahead of expiry

## Certificate status

| Status | Meaning |
|--------|---------|
| Current | Valid and not yet expired |
| Expiring soon | Within 90 days of expiry |
| Expired | Past the expiry date |
| No expiry | Certificate has no expiry date (e.g. one-time certification) |

## Notifications

The system sends email reminders to the member and relevant staff when a certificate is approaching expiry. Reminder intervals are configurable.

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/training-certificates` | List training certificates |
| `POST` | `/api/training-certificates` | Record a new certificate |
| `GET` | `/api/training-certificates/{id}` | Get a specific certificate |
| `PUT` | `/api/training-certificates/{id}` | Update a certificate |
| `DELETE` | `/api/training-certificates/{id}` | Delete a certificate |

---

*Full specification: [spec/training-module-spec.md](../../spec/training-module-spec.md)*
