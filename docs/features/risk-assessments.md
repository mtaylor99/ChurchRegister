# Risk assessments

## Overview

The Risk Assessment feature enables church staff to record, track, and action pastoral risk assessments for church members. Each assessment captures potential areas of concern, assigns a risk level, and tracks the status through to resolution.

## Who can use this feature

| Role | Access |
|------|--------|
| SystemAdministration | Full access |
| PastoralCare | Create, view, update |
| All other roles | No access |

## Where to find it

Navigate to **Risk Assessments** from the main menu. Access is restricted to authorised roles — other users will not see the menu item.

## Key concepts

- **Risk category** — a classification for the type of risk (e.g. safeguarding, welfare, health)
- **Risk level** — severity rating assigned to each assessment (Low, Medium, High, Critical)
- **Status** — Open, In Progress, Resolved, Closed
- **Actions** — follow-up steps recorded against each assessment

## Workflow

1. Create a new risk assessment for a member
2. Assign a risk category and level
3. Record notes and initial actions
4. Update the status as actions are completed
5. Close the assessment when resolved

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/risk-assessments` | List all risk assessments |
| `POST` | `/api/risk-assessments` | Create a new risk assessment |
| `GET` | `/api/risk-assessments/{id}` | Get a specific risk assessment |
| `PUT` | `/api/risk-assessments/{id}` | Update a risk assessment |
| `DELETE` | `/api/risk-assessments/{id}` | Delete a risk assessment |
| `POST` | `/api/risk-assessments/{id}/approve` | Approve a risk assessment |
| `GET` | `/api/risk-assessment-categories` | List risk categories |
| `POST` | `/api/risk-assessment-categories` | Create a category |

---

*Full specification: [spec/risk-assessment-spec.md](../../spec/risk-assessment-spec.md)*
