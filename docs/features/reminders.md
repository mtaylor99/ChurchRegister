# Reminders

## Overview

The Reminders feature allows authorised staff to schedule and manage automated email reminders sent to church members or staff for important events, deadlines, or follow-up actions.

## Who can use this feature

| Role | Access |
|------|--------|
| SystemAdministration | Full access |
| PastoralCare | Create and manage pastoral reminders |
| FinancialAdministrator | Create and manage financial reminders |

## Where to find it

Navigate to **Reminders** from the administration section.

## Key concepts

- **Reminder** — a scheduled notification with a trigger date, recipient, and message
- **Reminder category** — classifies the purpose of the reminder (e.g. Training Renewal, Pastoral Follow-up, Contribution Deadline)
- **Status** — Pending, Sent, Cancelled
- **Recurrence** — reminders can be one-time or recurring (daily, weekly, monthly, annually)

## Workflow

1. Create a reminder for a member or staff member
2. Set the trigger date and (optionally) a recurrence rule
3. Assign a category
4. The system sends the email automatically on the trigger date
5. Sent reminders appear in the history with a delivery timestamp

## Email delivery

Emails are sent via Azure Communication Services. The sender address and display name are configured in `appsettings.json` under `AzureEmailService`. See [operations/environment-variables.md](../operations/environment-variables.md) for configuration details.

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/reminders` | List reminders |
| `POST` | `/api/reminders` | Create a reminder |
| `GET` | `/api/reminders/{id}` | Get a specific reminder |
| `PUT` | `/api/reminders/{id}` | Update a reminder |
| `DELETE` | `/api/reminders/{id}` | Delete a reminder |
| `GET` | `/api/reminder-categories` | List reminder categories |
| `POST` | `/api/reminder-categories` | Create a category |

---

*Full specification: [spec/reminders-spec.md](../../spec/reminders-spec.md)*
