# Assets

This folder contains data files and templates referenced by the feature documentation. These are not documentation themselves — they are supporting artefacts (spreadsheet templates, CSV samples, SQL scripts).

| File | Description | Referenced by |
|------|-------------|--------------|
| `Attendance-Upload-Template.xlsx` | Excel template for bulk attendance uploads | Attendance feature |
| `Envelope-Upload-Template.xlsx` | Excel template for bulk envelope contribution uploads | [features/envelope-contributions.md](../features/envelope-contributions.md) |
| `sample-hsbc-statement.csv` | Sample HSBC CSV export for testing the bank import feature | [features/hsbc-bank-import.md](../features/hsbc-bank-import.md) |
| `church-members-dataprotection-update.sql` | One-off SQL script for the data protection migration | Historical — for reference only |
| `feature-church-members-import.sql` | One-off SQL script for the initial member import | Historical — for reference only |
| `data-protection.csv` | Data protection source data | Historical import artefact |
| `greenfield-members-for-import.csv` | Original member listing for the initial data import | Historical import artefact |

> The physical files (`xlsx`, `csv`, `sql`) are migrated here from `docs_OLD/` as part of [plan/feature-docs.md](../../plan/feature-docs.md) TASK-013 and TASK-014. If a file is missing, it can be recovered from Git history under `docs_OLD/`.
