# HSBC bank statement import

## Overview

The HSBC Bank Statement Import feature allows financial administrators to upload an HSBC current account CSV statement and automatically match transactions against expected member contributions. It reduces manual reconciliation work and provides an audit trail of matched/unmatched transactions.

## Who can use this feature

| Role                   | Access      |
| ---------------------- | ----------- |
| FinancialAdministrator | Full access |
| SystemAdministration   | Full access |
| All other roles        | No access   |

## Where to find it

Navigate to `Financial → Contributions` → **Upload HSBC Statement**.

## Supported file format

The application imports CSV files exported from HSBC Online Banking. The current format (v2) includes columns: `Date`, `Type`, `Description`, `Paid Out`, `Paid In`, and `Balance`.

**Important**: Only CR (Credit) transactions are imported. BP (Bank Payment) and DD (Direct Debit) transactions are automatically excluded.

Sample files:

- **v2 format** (current): `docs/sample-hsbc-statement_v2.csv`
- v1 format (deprecated): `docs/sample-hsbc-statement_v1.csv`

The application accepts only `text/csv` files up to **10 MB**.

## Import workflow

1. Export a statement from HSBC Online Banking in CSV format
2. In the application, click **Upload HSBC Statement**
3. Select the `.csv` file — the application parses and validates the contents
4. Review the matched and unmatched transactions
5. Confirm the import — matched transactions are recorded; unmatched rows are flagged for manual review

## Excluded references

Certain reference patterns can be excluded from import (e.g. internal transfers, standing orders that are not member contributions). These are configured via the `HSBCExcludedReferences` table in the database, managed through the administration section.

## API endpoints

| Method   | Route                                          | Description                          |
| -------- | ---------------------------------------------- | ------------------------------------ |
| `POST`   | `/api/financial/upload-hsbc-statement`         | Upload and parse a CSV statement     |
| `GET`    | `/api/financial/hsbc-transactions`             | List imported transactions           |
| `GET`    | `/api/financial/hsbc-excluded-references`      | List excluded reference patterns     |
| `POST`   | `/api/financial/hsbc-excluded-references`      | Add an excluded reference pattern    |
| `DELETE` | `/api/financial/hsbc-excluded-references/{id}` | Remove an excluded reference pattern |

---

_Full specification: [hsbc-spec.md](../../hsbc-spec.md)_  
_Sample v2 file: [docs/sample-hsbc-statement_v2.csv](../sample-hsbc-statement_v2.csv)_  
_Sample v1 file (deprecated): [docs/sample-hsbc-statement_v1.csv](../sample-hsbc-statement_v1.csv)_
