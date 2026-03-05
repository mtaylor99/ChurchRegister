# Annual membership number generation

## Overview

Membership numbers are assigned to **Active** church members on an annual basis. Each year a fresh, sequential set of numbers is generated — Members receive numbers starting at **1**, and Non-Members receive numbers starting at **250** (configurable). Numbers reflect current membership seniority: the longest-standing active members receive the lowest numbers.

Only members with a status of **Active** are included. Members with a status of **Expired**, **In Glory**, or **InActive** are excluded and will not receive a number.

This process is run once per year, typically in advance of the new year, and is permanent once confirmed.

---

## Who can use this feature

| Role | Can preview | Can generate |
|------|------------|-------------|
| FinancialAdministrator | ✅ | ✅ |
| SystemAdministration | ✅ | ✅ |
| All other roles | ❌ | ❌ |

---

## Where to find it

1. Navigate to **Church Members** from the main menu.
2. Click the **Export** button (top-right of the page).
3. Select **Generate Membership Numbers** from the dropdown.

> The option only appears in the dropdown for users with the FinancialAdministrator or SystemAdministration role.

---

## How it works

### Number sequences

| Group | Starting number | Ordering |
|-------|----------------|---------|
| **Members** | 1, 2, 3 … | Oldest member first (by Member Since date), then surname A–Z |
| **Non-Members** | 250, 251, 252 … | Oldest member first (by Member Since date), then surname A–Z |

The starting number for Non-Members (default: 250) is configured in `appsettings.json` under `MembershipNumbers:NonMemberStartNumber`. It is set high enough to ensure there is no overlap with Member numbers.

### Target year

Numbers are always generated for **next calendar year**. For example, if today is any date in 2026, the dialog generates numbers for **2027**. You cannot generate numbers for the current year or any past year.

### Preview

When you open the dialog, a preview is automatically loaded showing the proposed assignments. The preview shows two side-by-side grids:

- **Left grid — Members**: everyone with the role "Member", numbered 1 upwards
- **Right grid — Non-Members**: everyone with the role "Non-Member", numbered 250 upwards

Each grid shows:

| Column | Description |
|--------|-------------|
| Name | Member's full name |
| Since | Date they joined the church |
| Current | Their register number from the current year (blank if none) |
| New | Their proposed number for the target year |

### Generating

Once you have reviewed the preview, click **Generate Numbers for YYYY**. A confirmation dialog will appear. Click **Generate Numbers** to commit the assignments permanently to the database.

> ⚠️ **This action cannot be undone.** Once generated, numbers are locked for the year.

---

## After generation

Once numbers have been generated, the dialog switches to read-only mode:

- An info banner shows who generated the numbers and when.
- The **Generate Numbers** button is replaced by an **Export** button.

### Exporting

| Format | Description | Filename |
|--------|-------------|----------|
| **CSV** | Columns: Register Number, Type, Member Name, Member Since, Current Number | `register-numbers-YYYY-HHMMSS.csv` |
| **Labels** | Formatted for printing membership card labels | *(coming soon)* |

---

## Mid-year new members

If a new member is added **after** the annual generation has already run:

- A new **Member** receives `max(existing member numbers) + 1`
- A new **Non-Member** receives `max(existing non-member numbers) + 1`

If generation has not yet run for the current year, newly added members are not assigned a number — they will be included in the next annual generation.

---

## Important notes

- **Role is mandatory.** Every active member must have either the "Member" or "Non-Member" role assigned before generation runs.
- **Only Active members are included.** Expired, In Glory, and InActive members are excluded.
- **The operation is atomic.** Either all numbers are saved or none are (wrapped in a database transaction).
- **Generation is blocked for already-generated years.** The button will not appear in the UI for a year that already has numbers.
- **Sort order determines number assignment.** Ordered by `MemberSince` date ascending, then surname ascending.
- **Numbers are stored as strings.** The `ChurchMemberRegisterNumbers.Number` column stores strings to support potential future non-numeric formats.

---

## Configuration reference

`appsettings.json`:

```json
{
  "MembershipNumbers": {
    "NonMemberStartNumber": 250
  }
}
```

If the church ever has more than 249 Members, this value must be increased to avoid sequence overlap. A server restart is required.

---

## API endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/api/register-numbers/preview/{year}` | Preview proposed (or view generated) assignments | Bearer |
| `POST` | `/api/register-numbers/generate` | Generate and persist numbers for the target year | Bearer — FinancialAdministrator, SystemAdministration |
| `GET` | `/api/register-numbers/status/{year}` | Check whether numbers have been generated for a year | Anonymous |

---

*Full specification: [spec/church-members-number-spec.md](../../spec/church-members-number-spec.md)*
