# Documentation index

Welcome to the ChurchRegister documentation. All files are plain Markdown. Start with the project [README.md](../README.md) at the repository root for a quick-start guide.

---

## Architecture

| Document | Description |
|----------|-------------|
| [architecture/backend-architecture.md](architecture/backend-architecture.md) | Clean Architecture layers, project layout, FastEndpoints, middleware pipeline, DI conventions |
| [architecture/frontend-architecture.md](architecture/frontend-architecture.md) | React 19 project structure, component types, state management, routing, auth |
| [architecture/adr-001-use-case-layer.md](architecture/adr-001-use-case-layer.md) | ADR: Use Case layer between endpoints and services |
| [architecture/adr-002-fastendpoints.md](architecture/adr-002-fastendpoints.md) | ADR: FastEndpoints instead of controllers |
| [architecture/adr-003-aspire-app-host.md](architecture/adr-003-aspire-app-host.md) | ADR: .NET Aspire for local service orchestration |

---

## Development

| Document | Description |
|----------|-------------|
| [development/error-handling-patterns.md](development/error-handling-patterns.md) | Backend exceptions, `ValidationHelpers`, `GlobalExceptionHandlerMiddleware`, frontend `ErrorAlert`, React Query retry logic |
| [development/react-best-practices.md](development/react-best-practices.md) | Component architecture, TypeScript, forms, state, API services, query keys, performance, accessibility, testing |
| [development/routing-navigation-conventions.md](development/routing-navigation-conventions.md) | Route table, protected-route components, sidebar navigation, redirect patterns |
| [development/testing-guide.md](development/testing-guide.md) | `TestWebApplicationFactory`, in-memory DB, writing test classes, running tests |
| [development/database-migrations.md](development/database-migrations.md) | EF Core migration workflow, naming conventions, applying migrations, `AuditInterceptor` |

---

## Operations

| Document | Description |
|----------|-------------|
| [operations/environment-variables.md](operations/environment-variables.md) | All backend and frontend environment variables, User Secrets, Azure Key Vault setup |
| [operations/security-configuration.md](operations/security-configuration.md) | JWT config, CORS, auth policies, security headers, password rules, token revocation, incident response |
| [operations/docker-deployment.md](operations/docker-deployment.md) | Docker Compose setup, deploy/backup/restore scripts, Nginx, production deployment notes |

---

## Features

| Document | Description |
|----------|-------------|
| [features/annual-membership-number-generation.md](features/annual-membership-number-generation.md) | Annual sequential membership number generation for Members and Non-Members |
| [features/envelope-contributions.md](features/envelope-contributions.md) | Weekly giving envelope recording, batch entry, bulk upload |
| [features/hsbc-bank-import.md](features/hsbc-bank-import.md) | HSBC CSV statement import and transaction matching |
| [features/risk-assessments.md](features/risk-assessments.md) | Pastoral risk assessment recording, categorisation, and approval workflow |
| [features/pastoral-care.md](features/pastoral-care.md) | Confidential pastoral visit and contact log |
| [features/training-certificates.md](features/training-certificates.md) | Training certificate tracking with expiry reminders |
| [features/reminders.md](features/reminders.md) | Automated email reminders — scheduled, categorised, with recurrence support |
| [features/districts.md](features/districts.md) | Geographical/organisational district management and member assignment |

---

## Templates

| Document | Description |
|----------|-------------|
| [templates/react-component-template.md](templates/react-component-template.md) | Standard React component file structure, rules, and a complete copy-paste template |

---

## Assets

| File | Description |
|------|-------------|
| [assets/Attendance-Upload-Template.xlsx](assets/Attendance-Upload-Template.xlsx) | Excel template for bulk attendance uploads |
| [assets/Envelope-Upload-Template.xlsx](assets/Envelope-Upload-Template.xlsx) | Excel template for bulk envelope contribution uploads |
| [assets/sample-hsbc-statement.csv](assets/sample-hsbc-statement.csv) | Sample HSBC CSV export for testing the bank import feature |
| [assets/church-members-dataprotection-update.sql](assets/church-members-dataprotection-update.sql) | One-off SQL script for the data protection migration |
| [assets/feature-church-members-import.sql](assets/feature-church-members-import.sql) | One-off SQL script for the initial member import |
| [assets/data-protection.csv](assets/data-protection.csv) | Data protection source data (historical import artefact) |
| [assets/greenfield-members-for-import.csv](assets/greenfield-members-for-import.csv) | Original member listing used for the initial data import |

---

## Further reading

- [spec/](../spec/) — full feature specifications for every major feature area
- [plan/](../plan/) — implementation plans tracking what was built and how
- [docker/README.md](../docker/README.md) — additional Docker notes
