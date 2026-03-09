# Envelope contributions

## Overview

The Envelope Contributions feature allows financial staff to record and manage weekly giving envelopes submitted by church members. Each envelope is associated with a member and a financial year, and records the amount of each weekly contribution.

## Who can use this feature

| Role | Access |
|------|--------|
| FinancialAdministrator | Full access (entry, history, reports) |
| FinancialContributor | Entry and history |
| FinancialViewer | History and reports (read-only) |
| SystemAdministration | Full access |

## Where to find it

- **Entry:** Navigate to `Financial → Envelope Contributions → Entry` (`/app/financial/envelope-contributions/entry`)
- **History:** Navigate to `Financial → Envelope Contributions → History` (`/app/financial/envelope-contributions/history`)

## Key concepts

- **Envelope batch** — a group of envelope entries submitted together (typically for one Sunday service)
- **Envelope number** — each active member is assigned an envelope number at the start of each year
- **Financial year** — contributions are grouped by financial year for reporting purposes

## Entry workflow

1. Select the contribution date
2. Enter envelope number + amount for each submitted envelope
3. Submit the batch — the system validates and records each contribution
4. Batches appear immediately in the history view

## Bulk upload

Envelope contributions can be bulk-uploaded from the Excel template (`docs/assets/Envelope-Upload-Template.xlsx`). Download the template, populate it, and upload via the **Upload** button on the entry page.

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/financial/envelope-contributions` | Submit a contribution batch |
| `GET` | `/api/financial/envelope-contributions` | List contribution history |
| `GET` | `/api/financial/envelope-contributions/{id}` | Get a single batch |
| `DELETE` | `/api/financial/envelope-contributions/{id}` | Delete a batch |

---

*Full specification: [spec/envelope-contribution-spec.md](../../spec/envelope-contribution-spec.md)*  
*Upload template: [docs/assets/Envelope-Upload-Template.xlsx](../assets/Envelope-Upload-Template.xlsx)*
