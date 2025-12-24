---
goal: Implement production security improvements and configuration management for ChurchRegister application
version: 1.0
date_created: 2025-11-25
last_updated: 2025-11-25
owner: Development Team
status: "In progress"
tags: [security, production, authentication, configuration, infrastructure]
---

# Production Security & Configuration Implementation Plan

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

This implementation plan details the steps required to implement critical security improvements and configuration management for the ChurchRegister application before production deployment. The plan focuses on removing hardcoded secrets, implementing proper authentication security, and establishing secure configuration patterns.

## 1. Requirements & Constraints

### Security Requirements

- **REQ-SEC-001**: All secrets must be removed from source control and managed via User Secrets (local) or Azure Key Vault (production)
- **REQ-SEC-002**: JWT signing keys must be minimum 256-bit (32 characters) cryptographically secure
- **REQ-SEC-003**: HTTPS must be enforced in production with HSTS headers
- **REQ-SEC-004**: Security headers must be implemented to prevent clickjacking and XSS attacks
- **REQ-SEC-005**: Admin accounts must require password change on first login
- **REQ-SEC-006**: Account lockout must be implemented after 5 failed login attempts for 15 minutes
- **REQ-SEC-007**: Input validation must be comprehensive with appropriate string length limits
- **REQ-SEC-008**: Database encryption at rest (TDE) must be verified on Azure SQL

### Authentication Requirements

- **REQ-AUTH-001**: JWT access tokens must expire in 1 hour (down from 12 hours)
- **REQ-AUTH-002**: Refresh tokens must be properly implemented with database storage and rotation
- **REQ-AUTH-003**: Password minimum length must be 12 characters with complexity requirements
- **REQ-AUTH-004**: MFA (SMS-based) must be optional and available for users who choose to enable it
- **REQ-AUTH-005**: Token revocation capability must be implemented

### Configuration Requirements

- **REQ-CON-001**: Application must support User Secrets for local development
- **REQ-CON-002**: Application must integrate with Azure Key Vault for production
- **REQ-CON-003**: Configuration validation must occur at startup with clear error messages
- **REQ-CON-004**: All sensitive configuration values must be cleared from appsettings.json files

### Constraints

- **CON-001**: Must maintain backward compatibility with existing user accounts during password policy changes
- **CON-002**: Changes must not break local development workflow
- **CON-003**: Database migrations must be reversible
- **CON-004**: Implementation must work with .NET 9 and FastEndpoints framework
- **CON-005**: Must comply with GDPR data protection requirements

### Guidelines

- **GUD-001**: Follow ASP.NET Core security best practices
- **GUD-002**: Use existing Identity Core framework for authentication features
- **GUD-003**: Maintain clear separation between development and production configurations
- **GUD-004**: Document all breaking changes and migration steps
- **GUD-005**: Implement changes incrementally with testing at each step

### Patterns

- **PAT-001**: Use Options pattern for configuration binding
- **PAT-002**: Use middleware for cross-cutting concerns (security headers, HSTS)
- **PAT-003**: Use repository pattern for refresh token storage
- **PAT-004**: Use UseCase pattern (existing) for authentication flows

## 2. Implementation Steps

### Phase 1: Configuration Security & Secrets Management

- **GOAL-001**: Remove all hardcoded secrets from source control and establish secure configuration patterns for local development and production deployment

| Task     | Description                                                                                                                 | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Add `ChurchRegister.ApiService/appsettings.json` to `.gitignore` to prevent sensitive values being pushed to source control | ✅        | 2025-11-25 |
| TASK-002 | Add `ChurchRegister.ApiService/appsettings.Production.json` to `.gitignore`                                                 | ✅        | 2025-11-25 |
| TASK-003 | Initialize User Secrets for ChurchRegister.ApiService project                                                               | ✅        | 2025-11-25 |
| TASK-004 | Create documentation for local development setup with User Secrets commands                                                 |           |            |
| TASK-005 | Add configuration validation method to `Program.cs` that validates Jwt:Key, ConnectionStrings:DefaultConnection at startup  | ✅        | 2025-11-25 |
| TASK-006 | Add JWT key length validation (minimum 32 characters for 256-bit security) in `Program.cs`                                  | ✅        | 2025-11-25 |
| TASK-007 | Add Azure Key Vault configuration support for production environment in `Program.cs`                                        | ✅        | 2025-11-25 |
| TASK-008 | Test application startup with missing configuration to verify validation works                                              |           |            |
| TASK-009 | Test application startup with valid User Secrets configuration                                                              |           |            |

### Phase 2: HTTPS Enforcement & Security Headers

- **GOAL-002**: Implement HTTPS enforcement and comprehensive security headers to protect against common web vulnerabilities

| Task     | Description                                                                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-011 | Add HSTS middleware to `Program.cs` for non-development environments                                                                                        | ✅        | 2025-11-25 |
| TASK-012 | Add HTTPS redirection middleware to `Program.cs` for non-development environments                                                                           | ✅        | 2025-11-25 |
| TASK-013 | Create security headers middleware in `Program.cs` with X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Content-Security-Policy | ✅        | 2025-11-25 |
| TASK-014 | Configure Content-Security-Policy header with appropriate directives for React app                                                                          | ✅        | 2025-11-25 |
| TASK-015 | Test HTTPS redirection in local development                                                                                                                 |           |            |
| TASK-016 | Test security headers are present in HTTP responses                                                                                                         |           |            |
| TASK-017 | Document security headers configuration and rationale                                                                                                       |           |            |

### Phase 3: Forced Password Change for Admin Accounts

- **GOAL-003**: Implement forced password change functionality to require admin users to change default passwords on first login

| Task     | Description                                                                                                                              | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-018 | Add `RequirePasswordChange` property (bool) to `ChurchRegisterWebUser` entity in `ChurchRegister.Database/Data/ChurchRegisterWebUser.cs` | ✅        | 2025-11-25 |
| TASK-019 | Create EF Core migration for `RequirePasswordChange` column addition                                                                     | ✅        | 2025-11-25 |
| TASK-020 | Update `DatabaseSeeder.cs` to set `RequirePasswordChange = true` for admin user                                                          | ✅        | 2025-11-25 |
| TASK-021 | Change admin temporary password in `DatabaseSeeder.cs` to "TempAdmin123!ChangeMe"                                                        | ✅        | 2025-11-25 |
| TASK-022 | Add `RequirePasswordChange` property to `LoginResponse` model in `ChurchRegister.ApiService/Models/Authentication/`                      | ✅        | 2025-11-25 |
| TASK-023 | Update `LoginUseCase.cs` to check `RequirePasswordChange` and return appropriate response                                                | ✅        | 2025-11-25 |
| TASK-024 | Create `GenerateTemporaryToken` method in token service for short-lived tokens (15 min expiration)                                       | ✅        | 2025-11-25 |
| TASK-025 | Create or update Change Password endpoint to clear `RequirePasswordChange` flag after successful change                                  | ✅        | 2025-11-25 |
| TASK-026 | Update React login flow to handle `RequirePasswordChange` response and redirect to password change page                                  | ✅        | 2025-11-25 |
| TASK-027 | Test forced password change flow end-to-end                                                                                              |           |            |
| TASK-028 | Apply and test database migration                                                                                                        | ✅        | 2025-11-25 |

### Phase 4: Account Lockout Implementation

- **GOAL-004**: Implement account lockout after failed login attempts to prevent brute force attacks

| Task     | Description                                                                                                            | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-029 | Update Identity configuration in `Program.cs` to set `Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15)`       | ✅        | 2025-11-25 |
| TASK-030 | Update Identity configuration in `Program.cs` to set `Lockout.MaxFailedAccessAttempts = 5`                             | ✅        | 2025-11-25 |
| TASK-031 | Update Identity configuration in `Program.cs` to set `Lockout.AllowedForNewUsers = true`                               | ✅        | 2025-11-25 |
| TASK-032 | Update Identity configuration in `Program.cs` to set `Password.RequiredLength = 12`                                    | ✅        | 2025-11-25 |
| TASK-033 | Ensure all password complexity requirements are enabled in Identity configuration                                      | ✅        | 2025-11-25 |
| TASK-034 | Update `LoginUseCase.cs` to check if user is locked out before attempting sign-in                                      | ✅        | 2025-11-25 |
| TASK-035 | Update `LoginUseCase.cs` to change `lockoutOnFailure: false` to `lockoutOnFailure: true` in `CheckPasswordSignInAsync` | ✅        | 2025-11-25 |
| TASK-036 | Add lockout end time calculation and message to lockout exception in `LoginUseCase.cs`                                 | ✅        | 2025-11-25 |
| TASK-037 | Add `ResetAccessFailedCountAsync` call on successful login in `LoginUseCase.cs`                                        | ✅        | 2025-11-25 |
| TASK-038 | Update React login error handling to display lockout messages appropriately                                            | ✅        | 2025-11-25 |
| TASK-039 | Test account lockout after 5 failed attempts                                                                           |           |            |
| TASK-040 | Test account auto-unlock after 15 minutes                                                                              |           |            |
| TASK-041 | Test successful login resets failed attempt counter                                                                    |           |            |

### Phase 5: Input Validation & Sanitization Review

- **GOAL-005**: Review and enhance input validation across all API endpoints to prevent injection attacks and ensure data integrity

| Task     | Description                                                                                                                    | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-042 | Audit all request models in `ChurchRegister.ApiService/Models/` for appropriate validation attributes                          | ✅        | 2025-11-25 |
| TASK-043 | Add `[StringLength]` attributes where missing on string properties (recommend max 100 for names, 500 for notes)                | ✅        | 2025-11-25 |
| TASK-044 | Add `[RegularExpression]` validation for name fields to prevent special characters: `@"^[a-zA-Z\\s\\-']+$"`                    | ✅        | 2025-11-25 |
| TASK-045 | Add `[EmailAddress]` validation for email fields                                                                               | ✅        | 2025-11-25 |
| TASK-046 | Add `[Phone]` validation for phone number fields                                                                               | ✅        | 2025-11-25 |
| TASK-047 | Enable antiforgery in `Program.cs` with `builder.Services.AddAntiforgery(options => { options.HeaderName = "X-XSRF-TOKEN"; })` | ✅        | 2025-11-25 |
| TASK-048 | Test validation with malicious input (SQL injection patterns, XSS scripts)                                                     |           |            |
| TASK-049 | Verify FastEndpoints automatic validation is working correctly                                                                 | ✅        | 2025-11-25 |
| TASK-050 | Document validation rules and patterns used                                                                                    |           |            |

### Phase 6: JWT Token Improvements

- **GOAL-006**: Reduce JWT access token expiration time and improve token security

| Task     | Description                                                                                                                                | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-051 | Update `LoginUseCase.cs` to change JWT expiration from `AddHours(12)` to `AddHours(1)`                                                     | ✅        | 2025-11-25 |
| TASK-052 | Add token expiration configuration to `appsettings.json`: `"Jwt": { "AccessTokenExpirationMinutes": 60, "RefreshTokenExpirationDays": 7 }` | ✅        | 2025-11-25 |
| TASK-053 | Update token generation to use configuration-based expiration times                                                                        | ✅        | 2025-11-25 |
| TASK-054 | Add `Issuer` and `Audience` claims validation to JWT configuration in `Program.cs`                                                         | ✅        | 2025-11-25 |
| TASK-055 | Test token expiration with 1-hour tokens                                                                                                   |           |            |
| TASK-056 | Update React token refresh logic to handle shorter-lived tokens                                                                            |           |            |
| TASK-057 | Document new token expiration policy                                                                                                       |           |            |

### Phase 7: Refresh Token Implementation

- **GOAL-007**: Implement proper refresh token mechanism with database storage and token rotation

| Task     | Description                                                                                                                                                      | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-058 | Create `RefreshToken` entity in `ChurchRegister.Database/Entities/RefreshToken.cs` with properties: Id, Token, UserId, ExpiryDate, IsRevoked, CreatedDate        | ✅        | 2025-11-25 |
| TASK-059 | Add `RefreshToken` DbSet to `ChurchRegisterWebContext`                                                                                                           | ✅        | 2025-11-25 |
| TASK-060 | Create EF Core migration for RefreshToken table                                                                                                                  | ✅        | 2025-11-25 |
| TASK-061 | Create `IRefreshTokenRepository` interface in `ChurchRegister.Database/Interfaces/`                                                                              | ✅        | 2025-11-25 |
| TASK-062 | Create `RefreshTokenRepository` implementation in `ChurchRegister.Database/Data/` with methods: CreateAsync, GetByTokenAsync, RevokeAsync, RevokeAllForUserAsync | ✅        | 2025-11-25 |
| TASK-063 | Register `IRefreshTokenRepository` in DI container in `Program.cs`                                                                                               | ✅        | 2025-11-25 |
| TASK-064 | Create `RefreshTokenUseCase` in `ChurchRegister.ApiService/UseCase/Authentication/RefreshToken/`                                                                 | ✅        | 2025-11-25 |
| TASK-065 | Implement token rotation in `RefreshTokenUseCase` (revoke old token, issue new token pair)                                                                       | ✅        | 2025-11-25 |
| TASK-066 | Update `LoginUseCase.cs` to generate and store refresh token in database (replace GUID placeholder)                                                              | ✅        | 2025-11-25 |
| TASK-067 | Create `RefreshTokenEndpoint` in `ChurchRegister.ApiService/Endpoints/Authentication/`                                                                           | ✅        | 2025-11-25 |
| TASK-068 | Add refresh token cleanup job to remove expired tokens (optional background service)                                                                             |           |            |
| TASK-069 | Test refresh token flow end-to-end                                                                                                                               |           |            |
| TASK-070 | Test token rotation works correctly                                                                                                                              |           |            |
| TASK-071 | Test revoked tokens cannot be used                                                                                                                               |           |            |
| TASK-072 | Apply and test database migration                                                                                                                                | ✅        | 2025-11-25 |

### Phase 8: Token Revocation Implementation

- **GOAL-008**: Implement token revocation capability for logout and security scenarios

| Task     | Description                                                                     | Completed | Date       |
| -------- | ------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-073 | Create `RevokedToken` entity or add `IsRevoked` flag to existing token tracking | ✅        | 2025-11-25 |
| TASK-074 | Create token revocation service/repository methods                              | ✅        | 2025-11-25 |
| TASK-075 | Update `LogoutEndpoint` to revoke all user tokens on logout                     | ✅        | 2025-11-25 |
| TASK-076 | Create admin endpoint to revoke tokens for specific users                       | ✅        | 2025-11-25 |
| TASK-077 | Add JWT validation middleware to check token revocation status                  | ✅        | 2025-11-25 |
| TASK-078 | Test token revocation on logout                                                 |           |            |
| TASK-079 | Test revoked tokens are rejected                                                |           |            |

### Phase 9: Azure Key Vault Setup & Deployment

- **GOAL-009**: Configure Azure Key Vault and establish production deployment configuration

| Task     | Description                                                                                     | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-102 | Create Azure Key Vault resource in Azure Portal or via CLI                                      |           |      |
| TASK-103 | Generate production JWT secret key (64+ character cryptographically secure string)              |           |      |
| TASK-104 | Add JWT secret to Key Vault as secret named `Jwt--Key`                                          |           |      |
| TASK-105 | Add production connection string to Key Vault as `ConnectionStrings--DefaultConnection`         |           |      |
| TASK-106 | Add Azure Email Service connection string to Key Vault as `AzureEmailService--ConnectionString` |           |      |
| TASK-107 | Add Azure Communication Services connection string to Key Vault for SMS MFA                     |           |      |
| TASK-108 | Enable Managed Identity on Azure App Service                                                    |           |      |
| TASK-109 | Grant App Service Managed Identity access to Key Vault (Get Secrets permission)                 |           |      |
| TASK-110 | Configure App Service to reference Key Vault secrets using `@Microsoft.KeyVault(...)` syntax    |           |      |
| TASK-111 | Add `KeyVault:Endpoint` to App Service configuration pointing to Key Vault URI                  |           |      |
| TASK-112 | Test Key Vault integration in staging environment                                               |           |      |
| TASK-113 | Document Key Vault setup and configuration steps                                                |           |      |

## 3. Alternatives

- **ALT-001**: Use AWS Secrets Manager instead of Azure Key Vault - Not chosen because target deployment is Azure-based and Key Vault provides better integration with Azure services
- **ALT-002**: Implement custom token storage instead of database - Not chosen because database storage provides better audit trail and supports token rotation
- **ALT-003**: Use TOTP-based MFA (authenticator apps) instead of SMS - Not chosen because SMS is more accessible to users and Azure Communication Services already in use for email
- **ALT-004**: Store secrets in Azure App Configuration instead of Key Vault - Not chosen because Key Vault provides better security for highly sensitive data like JWT keys
- **ALT-005**: Implement custom authentication instead of Identity Core - Not chosen because Identity Core is well-tested, secure, and meets all requirements
- **ALT-006**: Use certificate-based JWT signing instead of symmetric key - Deferred for future consideration, symmetric key with Key Vault is sufficient for current requirements

## 4. Dependencies

### NuGet Packages

- **DEP-001**: `Azure.Identity` (>= 1.12.0) - For Managed Identity and Azure Key Vault integration
- **DEP-002**: `Azure.Extensions.AspNetCore.Configuration.Secrets` (>= 1.3.0) - For Key Vault configuration provider
- **DEP-003**: `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (already installed) - For Identity features
- **DEP-004**: `Microsoft.EntityFrameworkCore.Tools` (already installed) - For EF migrations
- **DEP-005**: `Microsoft.AspNetCore.Authentication.JwtBearer` (already installed) - For JWT authentication

### Azure Resources

- **DEP-006**: Azure Key Vault instance - Must be created before production deployment
- **DEP-007**: Azure App Service with Managed Identity enabled
- **DEP-008**: Azure SQL Database with TDE enabled
- **DEP-009**: Azure Communication Services (for email and SMS MFA functionality)
- **DEP-010**: Azure Communication Services SMS capability enabled

### Internal Dependencies

- **DEP-011**: Existing Identity Core setup in `Program.cs`
- **DEP-012**: Existing `ChurchRegisterWebContext` DbContext
- **DEP-013**: Existing FastEndpoints configuration
- **DEP-014**: Existing UseCase pattern implementation
- **DEP-015**: React frontend authentication flow

### Documentation Dependencies

- **DEP-016**: Production deployment runbook (to be created)
- **DEP-017**: Local development setup guide (to be created)
- **DEP-018**: Security configuration documentation (to be created)

## 5. Files

### Configuration Files

- **FILE-001**: `.gitignore` - Add appsettings.json and appsettings.Production.json to prevent committing sensitive configuration
- **FILE-002**: `ChurchRegister.ApiService/appsettings.json` - Add token expiration configuration (file will be ignored by git)
- **FILE-003**: `ChurchRegister.ApiService/appsettings.Production.json` - Production-specific configuration (file will be ignored by git)
- **FILE-004**: `ChurchRegister.ApiService/appsettings.Development.json` - Verify no sensitive values present

### Program & Startup

- **FILE-005**: `ChurchRegister.ApiService/Program.cs` - Add Key Vault integration, configuration validation, HSTS, security headers, update Identity configuration
- **FILE-006**: `ChurchRegister.ApiService/ChurchRegister.ApiService.csproj` - Add Azure.Identity and Azure.Extensions.AspNetCore.Configuration.Secrets packages

### Database Entities

- **FILE-007**: `ChurchRegister.Database/Data/ChurchRegisterWebUser.cs` - Add RequirePasswordChange, TwoFactorEnabled properties (PhoneNumber already exists in IdentityUser)
- **FILE-008**: `ChurchRegister.Database/Entities/RefreshToken.cs` - Create new entity for refresh token storage
- **FILE-009**: `ChurchRegister.Database/Entities/RevokedToken.cs` - Create new entity for revoked token tracking (optional)
- **FILE-010**: `ChurchRegister.Database/Data/ChurchRegisterWebContext.cs` - Add DbSet<RefreshToken> and DbSet<RevokedToken>

### Database Seeding

- **FILE-011**: `ChurchRegister.Database/Data/DatabaseSeeder.cs` - Update admin user creation with RequirePasswordChange = true and temporary password

### Repositories

- **FILE-012**: `ChurchRegister.Database/Interfaces/IRefreshTokenRepository.cs` - Create new interface
- **FILE-013**: `ChurchRegister.Database/Data/RefreshTokenRepository.cs` - Create new repository implementation

### Authentication Models

- **FILE-014**: `ChurchRegister.ApiService/Models/Authentication/LoginResponse.cs` - Add RequirePasswordChange property
- **FILE-015**: `ChurchRegister.ApiService/Models/Authentication/RefreshTokenRequest.cs` - Create new request model
- **FILE-016**: `ChurchRegister.ApiService/Models/Authentication/RefreshTokenResponse.cs` - Create new response model
- **FILE-017**: `ChurchRegister.ApiService/Models/Authentication/EnableMfaRequest.cs` - Create new request model with phone number
- **FILE-018**: `ChurchRegister.ApiService/Models/Authentication/VerifyMfaRequest.cs` - Create new request model for SMS code verification
- **FILE-019**: `ChurchRegister.ApiService/Models/Authentication/DisableMfaRequest.cs` - Create new request model

### UseCases

- **FILE-020**: `ChurchRegister.ApiService/UseCase/Authentication/Login/LoginUseCase.cs` - Add RequirePasswordChange check, reduce token expiration, enable lockout, add refresh token generation, send SMS MFA code if enabled
- **FILE-021**: `ChurchRegister.ApiService/UseCase/Authentication/RefreshToken/RefreshTokenUseCase.cs` - Create new use case
- **FILE-022**: `ChurchRegister.ApiService/UseCase/Authentication/EnableMfa/EnableMfaUseCase.cs` - Create new use case for SMS MFA
- **FILE-023**: `ChurchRegister.ApiService/UseCase/Authentication/VerifyMfa/VerifyMfaCodeUseCase.cs` - Create new use case for SMS code verification
- **FILE-024**: `ChurchRegister.ApiService/UseCase/Authentication/SendMfaCode/SendMfaCodeUseCase.cs` - Create new use case for sending SMS codes
- **FILE-025**: `ChurchRegister.ApiService/UseCase/Authentication/DisableMfa/DisableMfaUseCase.cs` - Create new use case
- **FILE-026**: `ChurchRegister.ApiService/UseCase/Authentication/ChangePassword/ChangePasswordUseCase.cs` - Update to clear RequirePasswordChange flag

### Endpoints

- **FILE-027**: `ChurchRegister.ApiService/Endpoints/Authentication/RefreshTokenEndpoint.cs` - Create new endpoint
- **FILE-028**: `ChurchRegister.ApiService/Endpoints/Authentication/EnableMfaEndpoint.cs` - Create new endpoint for SMS MFA
- **FILE-029**: `ChurchRegister.ApiService/Endpoints/Authentication/VerifyMfaEndpoint.cs` - Create new endpoint for SMS code verification
- **FILE-030**: `ChurchRegister.ApiService/Endpoints/Authentication/DisableMfaEndpoint.cs` - Create new endpoint
- **FILE-031**: `ChurchRegister.ApiService/Endpoints/Authentication/LogoutEndpoint.cs` - Update to revoke tokens

### Frontend Files (React)

- **FILE-032**: `ChurchRegister.React/src/pages/Authentication/LoginPage.tsx` - Update to handle RequirePasswordChange response, lockout messages, and SMS MFA verification
- **FILE-033**: `ChurchRegister.React/src/pages/Authentication/ChangePasswordPage.tsx` - Create or update for forced password change flow
- **FILE-034**: `ChurchRegister.React/src/pages/Authentication/MfaSetupPage.tsx` - Create new page for SMS MFA setup with phone number entry
- **FILE-035**: `ChurchRegister.React/src/pages/Authentication/MfaVerifyPage.tsx` - Create new page for SMS code verification during login
- **FILE-036**: `ChurchRegister.React/src/pages/Profile/SecuritySettingsPage.tsx` - Create or update page for MFA toggle and management
- **FILE-037**: `ChurchRegister.React/src/services/authService.ts` - Update token refresh logic for shorter-lived tokens
- **FILE-038**: `ChurchRegister.React/src/services/smsService.ts` - Create new service for SMS MFA operations

### Migrations

- **FILE-039**: `ChurchRegister.Database/Migrations/{timestamp}_AddRequirePasswordChange.cs` - New migration
- **FILE-040**: `ChurchRegister.Database/Migrations/{timestamp}_AddRefreshTokenTable.cs` - New migration
- **FILE-041**: `ChurchRegister.Database/Migrations/{timestamp}_AddMfaFields.cs` - New migration for TwoFactorEnabled

### Documentation

- **FILE-042**: `docs/local-development-setup.md` - Create new documentation
- **FILE-043**: `docs/azure-keyvault-setup.md` - Create new documentation
- **FILE-044**: `docs/security-configuration.md` - Create new documentation including SMS MFA setup
- **FILE-045**: `docs/pre-deployment-checklist.md` - Create new documentation
- **FILE-046**: `README.md` - Update with new setup instructions

## 6. Testing

### Unit Tests

- **TEST-001**: Test configuration validation throws exception when JWT key is missing
- **TEST-002**: Test configuration validation throws exception when JWT key is less than 32 characters
- **TEST-003**: Test RefreshTokenRepository CreateAsync creates token correctly
- **TEST-004**: Test RefreshTokenRepository GetByTokenAsync retrieves correct token
- **TEST-005**: Test RefreshTokenRepository RevokeAsync marks token as revoked
- **TEST-006**: Test LoginUseCase returns RequirePasswordChange when user flag is set
- **TEST-007**: Test LoginUseCase generates temporary token with 15-minute expiration
- **TEST-008**: Test password validation rejects passwords under 12 characters

### Integration Tests

- **TEST-009**: Test forced password change flow end-to-end (login → change password → normal login)
- **TEST-010**: Test account lockout after 5 failed login attempts
- **TEST-011**: Test account auto-unlock after 15 minutes
- **TEST-012**: Test successful login resets failed attempt counter
- **TEST-013**: Test refresh token flow (login → get refresh token → use refresh token → get new access token)
- **TEST-014**: Test token rotation (old refresh token is revoked after use)
- **TEST-015**: Test revoked refresh tokens cannot be used
- **TEST-016**: Test logout revokes all user tokens
- **TEST-017**: Test MFA setup sends SMS verification code to phone number
- **TEST-018**: Test MFA verification accepts valid SMS codes
- **TEST-019**: Test MFA verification rejects invalid SMS codes
- **TEST-020**: Test login flow with MFA enabled sends SMS code and requires verification
- **TEST-021**: Test MFA can be disabled with password verification
- **TEST-022**: Test SMS codes expire after configured time period

### Security Tests

- **TEST-023**: Test SQL injection attempts are blocked by validation
- **TEST-024**: Test XSS script injection is blocked by validation
- **TEST-025**: Test security headers are present in all HTTP responses
- **TEST-026**: Test HTTPS redirection works correctly
- **TEST-027**: Test HSTS headers are present in production mode
- **TEST-028**: Test expired JWT tokens are rejected
- **TEST-029**: Test JWT tokens with invalid signatures are rejected
- **TEST-030**: Test revoked JWT tokens are rejected

### Configuration Tests

- **TEST-031**: Test User Secrets configuration loads correctly in development
- **TEST-032**: Test Azure Key Vault configuration loads correctly (integration test with test Key Vault)
- **TEST-033**: Test application fails to start with missing required configuration

## 7. Risks & Assumptions

### Risks

- **RISK-001**: Breaking change - Users will need to re-authenticate after JWT expiration change (Mitigation: Communicate change to users, implement graceful token refresh)
- **RISK-002**: Breaking change - Admin must change password on next login (Mitigation: Document in release notes, provide clear UI messaging)
- **RISK-003**: Database migration failures could prevent application startup (Mitigation: Test migrations thoroughly, have rollback plan)
- **RISK-004**: Azure Key Vault misconfiguration could prevent production deployment (Mitigation: Test in staging environment first, document setup carefully)
- **RISK-005**: Existing users with passwords under 12 characters won't be able to login (Mitigation: Password policy only applies to new passwords, existing passwords grandfathered)
- **RISK-006**: SMS MFA could fail if user changes phone number or loses access to phone (Mitigation: Provide MFA disable option with password verification, admin unlock capability)
- **RISK-007**: Refresh token storage could grow large over time (Mitigation: Implement cleanup job for expired tokens)
- **RISK-008**: Development workflow disruption if User Secrets not set up correctly (Mitigation: Provide clear setup documentation, helpful error messages)

### Assumptions

- **ASSUMPTION-001**: Azure subscription is available with permissions to create Key Vault and manage App Service
- **ASSUMPTION-002**: Development team has access to Azure Portal for Key Vault configuration
- **ASSUMPTION-003**: SQL Server database supports TDE (assumption: using Azure SQL which has TDE by default)
- **ASSUMPTION-004**: Existing user accounts are compatible with Identity Core lockout features
- **ASSUMPTION-005**: React frontend can be updated to handle new authentication flows
- **ASSUMPTION-006**: Users who enable MFA have access to SMS-capable mobile phones
- **ASSUMPTION-009**: Azure Communication Services SMS functionality is available in user regions
- **ASSUMPTION-007**: Network connectivity between App Service and Key Vault is reliable
- **ASSUMPTION-008**: .NET 9 and latest FastEndpoints version support all required features

## 8. Related Specifications / Further Reading

### Internal Documentation

- [Production Readiness Specification](../spec/production-ready-spec.md) - Full specification this plan implements
- [Church Members Specification](../spec/church-members-spec.md) - Related feature specification
- [Church Members Feature Plan](./feature-church-members.md) - Related implementation plan

### Microsoft Documentation

- [ASP.NET Core Data Protection](https://docs.microsoft.com/aspnet/core/security/data-protection/introduction)
- [ASP.NET Core Identity](https://docs.microsoft.com/aspnet/core/security/authentication/identity)
- [Configure ASP.NET Core to work with Azure Key Vault](https://docs.microsoft.com/aspnet/core/security/key-vault-configuration)
- [Azure Key Vault Developer's Guide](https://docs.microsoft.com/azure/key-vault/general/developers-guide)
- [Managed Identities for Azure Resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure SQL Database Security](https://docs.microsoft.com/azure/azure-sql/database/security-overview)
- [Transparent Data Encryption](https://docs.microsoft.com/sql/relational-databases/security/encryption/transparent-data-encryption)

### Security Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### GDPR Compliance

- [GDPR Official Site](https://gdpr.eu/)
- [Microsoft GDPR Resources](https://www.microsoft.com/trust-center/privacy/gdpr-overview)
- [Data Protection by Design](https://edps.europa.eu/data-protection/data-protection/legislation/history-general-data-protection-regulation_en)
