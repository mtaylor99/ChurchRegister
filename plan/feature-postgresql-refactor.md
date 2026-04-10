---
goal: Migrate ChurchRegister application from SQL Server to PostgreSQL
version: 1.0
date_created: 2026-02-21
last_updated: 2026-02-21
owner: Development Team
status: 'Planned'
tags: [refactor, database, migration, postgresql, infrastructure]
---

# Migrate ChurchRegister Application from SQL Server to PostgreSQL

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan outlines the steps required to migrate the ChurchRegister application from SQL Server to PostgreSQL. This migration will modernize the database infrastructure, improve cross-platform compatibility, and reduce licensing costs. No data migration is required as the database will be recreated from scratch.

## 1. Requirements & Constraints

### Requirements

- **REQ-001**: Replace all SQL Server dependencies with PostgreSQL equivalents
- **REQ-002**: Maintain full compatibility with existing Entity Framework Core models and configurations
- **REQ-003**: Update all connection strings across all environments (development, production, Docker)
- **REQ-004**: Ensure PostgreSQL is used in both runtime and test environments
- **REQ-005**: Remove all SQL Server specific migrations and generate new PostgreSQL migrations
- **REQ-006**: Update Docker Compose configuration to use PostgreSQL container instead of SQL Server
- **REQ-007**: Maintain all existing features, constraints, and indexes in PostgreSQL
- **REQ-008**: Ensure case-insensitive collation behavior matches SQL Server where needed

### Security Requirements

- **SEC-001**: Connection strings in production must use Azure Key Vault or environment variables
- **SEC-002**: PostgreSQL passwords must meet complexity requirements (minimum 12 characters, mixed case, numbers, symbols)
- **SEC-003**: Database connections must use SSL/TLS in production environments

### Constraints

- **CON-001**: No data migration required - fresh database start
- **CON-002**: Must maintain existing Entity Framework Core models without modifications
- **CON-003**: Must support PostgreSQL 14 or higher
- **CON-004**: Migration must not break existing API contracts or endpoints
- **CON-005**: All existing tests must pass after migration

### Guidelines

- **GUD-001**: Use Npgsql Entity Framework Core Provider version compatible with .NET 9
- **GUD-002**: Follow PostgreSQL naming conventions (lowercase with underscores)
- **GUD-003**: Document all PostgreSQL-specific configurations
- **GUD-004**: Retain Entity Framework migration history in version control

### Patterns to Follow

- **PAT-001**: Use parameterized queries to prevent SQL injection (maintained by EF Core)
- **PAT-002**: Implement database health checks in Docker Compose
- **PAT-003**: Use connection pooling for optimal performance
- **PAT-004**: Maintain separation between development, testing, and production database configurations

## 2. Implementation Steps

### Phase 1: Update Database Project Dependencies

**GOAL-001**: Replace SQL Server NuGet packages with PostgreSQL equivalents in the Database project

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Remove `Microsoft.EntityFrameworkCore.SqlServer` package (version 9.0.10) from `ChurchRegister.Database.csproj` | | |
| TASK-002 | Add `Npgsql.EntityFrameworkCore.PostgreSQL` package (version 9.0.10 or latest stable) to `ChurchRegister.Database.csproj` | | |
| TASK-003 | Verify all other EF Core packages remain at version 9.0.10 for compatibility | | |
| TASK-004 | Run `dotnet restore` on Database project to validate package resolution | | |

### Phase 2: Update Application Configuration Files

**GOAL-002**: Update all connection strings and configuration files to use PostgreSQL

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Update `appsettings.json` DefaultConnection to use PostgreSQL format: `Host=localhost;Port=5432;Database=ChurchRegister;Username=churchregister;Password=<dev-password>` | | |
| TASK-006 | Update `appsettings.Development.json` if it contains connection string overrides | | |
| TASK-007 | Update `appsettings.Production.json` DefaultConnection to use Azure PostgreSQL format or environment variable placeholder | | |
| TASK-008 | Remove commented SQL Server connection strings from configuration files | | |

### Phase 3: Update Application Startup Code

**GOAL-003**: Modify Program.cs to use PostgreSQL provider instead of SQL Server

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | In `ChurchRegister.ApiService/Program.cs` line ~41, replace `options.UseSqlServer(connectionString)` with `options.UseNpgsql(connectionString)` | | |
| TASK-010 | Add `using Npgsql.EntityFrameworkCore.PostgreSQL;` namespace import if not automatically resolved | | |
| TASK-011 | Verify AuditInterceptor registration remains compatible with PostgreSQL provider | | |
| TASK-012 | Build the ApiService project to verify no compilation errors | | |

### Phase 4: Update Docker Infrastructure

**GOAL-004**: Replace SQL Server container with PostgreSQL container in Docker Compose

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | In `docker/docker-compose.yml`, replace `sqlserver` service with `postgres` service using image `postgres:16-alpine` | | |
| TASK-014 | Configure PostgreSQL environment variables: `POSTGRES_DB=ChurchRegister`, `POSTGRES_USER=churchregister`, `POSTGRES_PASSWORD=ChurchRegister123!` | | |
| TASK-015 | Update port mapping from `1433:1433` to `5432:5432` | | |
| TASK-016 | Update volume name from `sqlserver-data` to `postgres-data` and map to `/var/lib/postgresql/data` | | |
| TASK-017 | Update healthcheck command to use `pg_isready -U churchregister -d ChurchRegister` | | |
| TASK-018 | Update `app` service connection string environment variable to PostgreSQL format: `Host=postgres;Port=5432;Database=ChurchRegister;Username=churchregister;Password=ChurchRegister123!` | | |
| TASK-019 | Update service dependency from `sqlserver` to `postgres` in app service | | |
| TASK-020 | Test Docker Compose startup with `docker-compose up` to verify PostgreSQL container starts correctly | | |

### Phase 5: Database Migrations Management

**GOAL-005**: Remove SQL Server migrations and create new PostgreSQL-compatible migrations

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Delete all existing migration files in `ChurchRegister.Database/Migrations/` directory | | |
| TASK-022 | Run `dotnet ef database drop --force --project ChurchRegister.Database --startup-project ChurchRegister.ApiService` to remove any existing database | | |
| TASK-023 | Create new initial migration using task "Create Initial Migration" or command: `dotnet ef migrations add InitialPostgreSQLMigration --project ChurchRegister.Database --startup-project ChurchRegister.ApiService --context ChurchRegisterWebContext --output-dir Migrations` | | |
| TASK-024 | Review generated migration file to ensure PostgreSQL-specific syntax is correct (identity columns, check constraints, indexes) | | |
| TASK-025 | Apply migration to create database: `dotnet ef database update --project ChurchRegister.Database --startup-project ChurchRegister.ApiService` | | |
| TASK-026 | Verify all tables, indexes, constraints, and seed data are created correctly in PostgreSQL | | |

### Phase 6: Verify Database Context Configuration

**GOAL-006**: Ensure all EF Core configurations are PostgreSQL-compatible

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-027 | Review `ChurchRegisterWebContext.cs` for SQL Server-specific HasFilter expressions and update to PostgreSQL syntax if needed (SQL Server uses `[Column] IS NOT NULL`, PostgreSQL uses `"Column" IS NOT NULL`) | | |
| TASK-028 | Verify decimal precision configurations (`decimal(18,2)`, `decimal(10,2)`) are preserved | | |
| TASK-029 | Review check constraints syntax for PostgreSQL compatibility | | |
| TASK-030 | Verify unique indexes with filters work correctly in PostgreSQL | | |
| TASK-031 | Test that audit interceptor functions correctly with PostgreSQL | | |

### Phase 7: Update Test Infrastructure

**GOAL-007**: Ensure test suite remains functional with PostgreSQL

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-032 | Verify `TestWebApplicationFactory.cs` uses in-memory database correctly (no changes needed as it doesn't use SQL Server directly) | | |
| TASK-033 | Run full test suite: `dotnet test ChurchRegister.Tests/ChurchRegister.Tests.csproj` | | |
| TASK-034 | Fix any test failures related to database provider differences | | |
| TASK-035 | Verify integration tests create and tear down test databases correctly | | |

### Phase 8: Documentation and Scripts Update

**GOAL-008**: Update documentation and helper scripts for PostgreSQL

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-036 | Update `docker/README.md` with PostgreSQL connection instructions and defaults | | |
| TASK-037 | Update `docker/backup-database.ps1` script to use `pg_dump` instead of SQL Server backup commands | | |
| TASK-038 | Update `docker/restore-database.ps1` script to use `pg_restore` or `psql` instead of SQL Server restore | | |
| TASK-039 | Update `docs/environment-variables.md` with PostgreSQL connection string examples | | |
| TASK-040 | Create or update database setup documentation with PostgreSQL installation and configuration instructions | | |

### Phase 9: Validation and Testing

**GOAL-009**: Comprehensive validation of PostgreSQL migration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-041 | Start application locally with PostgreSQL and verify successful startup | | |
| TASK-042 | Test all CRUD operations for each entity (ChurchMembers, Contributions, Events, etc.) | | |
| TASK-043 | Verify Identity authentication and authorization functions correctly | | |
| TASK-044 | Test file upload endpoints and contribution processing | | |
| TASK-045 | Verify all unique constraints, check constraints, and foreign key relationships work correctly | | |
| TASK-046 | Test database seeding creates expected default data | | |
| TASK-047 | Perform load testing to ensure PostgreSQL performance meets requirements | | |
| TASK-048 | Validate Docker Compose deployment creates fully functional environment | | |

### Phase 10: Production Readiness

**GOAL-010**: Prepare PostgreSQL configuration for production deployment

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-049 | Document Azure Database for PostgreSQL configuration requirements (SKU, compute, storage) | | |
| TASK-050 | Configure SSL/TLS connection parameters for production connection string | | |
| TASK-051 | Set up Azure Key Vault integration for PostgreSQL credentials | | |
| TASK-052 | Configure connection pooling parameters for optimal performance | | |
| TASK-053 | Set up database monitoring and alerting for PostgreSQL | | |
| TASK-054 | Create database backup and disaster recovery plan for PostgreSQL | | |
| TASK-055 | Update CI/CD pipelines to use PostgreSQL for automated deployments | | |

## 3. Alternatives

- **ALT-001**: **Keep SQL Server with SQL Server LocalDB for development** - Rejected because it maintains licensing concerns and complicates cross-platform development (LocalDB is Windows-only)

- **ALT-002**: **Use MySQL/MariaDB instead of PostgreSQL** - Rejected because PostgreSQL offers better feature parity with SQL Server (advanced indexing, JSON support, full-text search) and stronger ACID compliance

- **ALT-003**: **Use SQLite for development and PostgreSQL for production** - Rejected because database feature differences between SQLite and PostgreSQL could lead to development/production parity issues

- **ALT-004**: **Implement data migration from existing SQL Server database** - Rejected per user requirement; fresh database start is acceptable for this project

- **ALT-005**: **Keep existing migrations and use cross-database compatibility layer** - Rejected because it introduces complexity and potential bugs; clean PostgreSQL migrations are more maintainable

## 4. Dependencies

- **DEP-001**: **Npgsql.EntityFrameworkCore.PostgreSQL** (version 9.0.10 or compatible with .NET 9.0 and EF Core 9.0.10)

- **DEP-002**: **PostgreSQL 14+** server or container for development and testing

- **DEP-003**: **Azure Database for PostgreSQL** (Flexible Server) for production deployment

- **DEP-004**: **Docker Desktop** or compatible container runtime for local PostgreSQL container

- **DEP-005**: **Entity Framework Core Tools** (`dotnet ef`) version 9.0.10 for migration management

- **DEP-006**: **PostgreSQL client tools** (`psql`, `pg_dump`, `pg_restore`) for database administration

## 5. Files

### Files to Modify

- **FILE-001**: `ChurchRegister.Database/ChurchRegister.Database.csproj` - Update NuGet package references
- **FILE-002**: `ChurchRegister.ApiService/Program.cs` - Change UseSqlServer to UseNpgsql
- **FILE-003**: `ChurchRegister.ApiService/appsettings.json` - Update connection string to PostgreSQL format
- **FILE-004**: `ChurchRegister.ApiService/appsettings.Development.json` - Update dev connection string
- **FILE-005**: `ChurchRegister.ApiService/appsettings.Production.json` - Update production connection string template
- **FILE-006**: `docker/docker-compose.yml` - Replace SQL Server service with PostgreSQL
- **FILE-007**: `docker/README.md` - Update documentation for PostgreSQL
- **FILE-008**: `docker/backup-database.ps1` - Update to use pg_dump
- **FILE-009**: `docker/restore-database.ps1` - Update to use pg_restore/psql
- **FILE-010**: `docs/environment-variables.md` - Update connection string documentation
- **FILE-011**: `ChurchRegister.Database/Data/ChurchRegisterWebContext.cs` - Review and update filter expressions for PostgreSQL syntax if needed

### Files to Delete

- **FILE-012**: All files in `ChurchRegister.Database/Migrations/` (will be recreated)

### Files to Create

- **FILE-013**: New PostgreSQL migration file (generated by `dotnet ef migrations add`)
- **FILE-014**: PostgreSQL setup and configuration documentation (optional)

## 6. Testing

### Unit and Integration Tests

- **TEST-001**: Verify all existing unit tests in `ChurchRegister.Tests` pass with PostgreSQL provider
- **TEST-002**: Test database context initialization and configuration
- **TEST-003**: Test entity CRUD operations for all DbSets
- **TEST-004**: Test Identity authentication, registration, login, and JWT token generation
- **TEST-005**: Test unique constraint enforcement (BankReference, BatchDate, ReminderCategory Name)
- **TEST-006**: Test check constraint enforcement (Amount >= 0, EnvelopeCount > 0)
- **TEST-007**: Test foreign key relationships and cascade behaviors
- **TEST-008**: Test audit interceptor populates CreatedDateTime and ModifiedDateTime

### Functional Tests

- **TEST-009**: Test ChurchMember endpoints (Create, Read, Update, Delete, List, Search)
- **TEST-010**: Test Contribution endpoints and processing
- **TEST-011**: Test HSBC transaction import and matching
- **TEST-012**: Test Envelope contribution batch processing
- **TEST-013**: Test Reminder creation and management
- **TEST-014**: Test Risk Assessment workflows and approvals
- **TEST-015**: Test Event and Attendance tracking
- **TEST-016**: Test file upload and template processing endpoints

### Database-Specific Tests

- **TEST-017**: Test case-insensitive queries work correctly (e.g., searching by name)
- **TEST-018**: Test date/time handling and timezone behavior
- **TEST-019**: Test decimal precision is maintained for financial amounts
- **TEST-020**: Test index performance on large datasets
- **TEST-021**: Test connection pooling under concurrent load
- **TEST-022**: Test database migrations can be applied and rolled back

### Environment Tests

- **TEST-023**: Test local development environment with PostgreSQL container
- **TEST-024**: Test Docker Compose full stack deployment
- **TEST-025**: Verify health checks function correctly in all environments
- **TEST-026**: Test production connection string with SSL/TLS

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **PostgreSQL SQL dialect differences** - Some SQL Server specific functions or syntax in raw queries may not work in PostgreSQL
  - *Mitigation*: Review all raw SQL queries and stored procedures; prefer LINQ queries where possible

- **RISK-002**: **Case sensitivity behavior** - PostgreSQL is case-sensitive by default for identifiers while SQL Server is case-insensitive
  - *Mitigation*: Use lowercase for all schema objects; configure appropriate collations; test string comparisons

- **RISK-003**: **DateTime handling differences** - PostgreSQL handles timestamps differently than SQL Server
  - *Mitigation*: Use UTC timestamps; test all date/time operations thoroughly

- **RISK-004**: **Migration generation failures** - Complex constraints or configurations may not migrate correctly
  - *Mitigation*: Review generated migrations carefully; test on fresh database before production

- **RISK-005**: **Performance degradation** - Query performance characteristics differ between databases
  - *Mitigation*: Benchmark critical queries; add appropriate indexes; use EXPLAIN ANALYZE

- **RISK-006**: **Production deployment complexity** - Azure PostgreSQL configuration may require additional setup
  - *Mitigation*: Test in staging environment first; document all configuration steps

- **RISK-007**: **Connection pooling issues** - Npgsql uses different connection pooling than SQL Server
  - *Mitigation*: Configure appropriate pool sizes; monitor connection usage

### Assumptions

- **ASSUMPTION-001**: All database operations use Entity Framework Core (no direct SQL Server dependencies in application code)

- **ASSUMPTION-002**: No SQL Server stored procedures, functions, or views are being used

- **ASSUMPTION-003**: Application uses standard LINQ queries that translate well to PostgreSQL

- **ASSUMPTION-004**: Development team has access to PostgreSQL instance or can run Docker containers

- **ASSUMPTION-005**: Azure Database for PostgreSQL is available and approved for production use

- **ASSUMPTION-006**: No existing production data needs to be migrated (fresh start)

- **ASSUMPTION-007**: All third-party integrations are database-agnostic and won't be affected

- **ASSUMPTION-008**: Current Entity Framework Core models and configurations are provider-agnostic

## 8. Related Specifications / Further Reading

- [Npgsql Entity Framework Core Provider Documentation](https://www.npgsql.org/efcore/)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Entity Framework Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Azure Database for PostgreSQL - Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [SQL Server to PostgreSQL Migration Guide](https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL)
- [docs/environment-variables.md](../docs/environment-variables.md) - Environment configuration
- [docker/README.md](../docker/README.md) - Docker deployment instructions
- [ChurchRegister.Database/Data/ChurchRegisterWebContext.cs](../ChurchRegister.Database/Data/ChurchRegisterWebContext.cs) - Database context configuration
