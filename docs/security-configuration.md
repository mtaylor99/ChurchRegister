# Security Configuration Guide

## Overview

This document outlines the security measures implemented in the Church Register application and provides guidance for maintaining security in production.

## Authentication & Authorization

### JWT Token Configuration

**Access Token:**

- Expiration: 12 hours (720 minutes)
- Algorithm: HS256 (HMAC with SHA-256)
- Minimum key length: 32 characters (256-bit)

**Refresh Token:**

- Expiration: 7 days
- Rotation: Automatic (old tokens revoked on refresh)
- Storage: Database with audit trail

**Configuration:**

```json
{
  "Jwt": {
    "Key": "[Store in Azure Key Vault]",
    "Issuer": "ChurchRegister.ApiService",
    "Audience": "ChurchRegister.React",
    "AccessTokenExpirationMinutes": 720,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Required Environment Variables (Backend)

#### Development (User Secrets)

Set these using: `dotnet user-secrets set "Key" "Value" --project ChurchRegister.ApiService`

```bash
# JWT Configuration
dotnet user-secrets set "Jwt:Key" "your-development-jwt-key-minimum-32-characters-long"

# Database Connection
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True"

# Azure Email Service
dotnet user-secrets set "AzureEmailService:ConnectionString" "endpoint=https://...;accesskey=..."
```

#### Production (Azure Key Vault)

Store these in Azure Key Vault and reference in appsettings.Production.json:

- `Jwt--Key` - JWT signing key (minimum 32 characters, use cryptographically secure random generation)
- `ConnectionStrings--DefaultConnection` - Production database connection string
- `AzureEmailService--ConnectionString` - Azure Communication Services connection string

**Azure Key Vault Setup:**

```json
{
  "KeyVault": {
    "Endpoint": "https://your-keyvault-name.vault.azure.net/"
  }
}
```

### Frontend Token Storage

**Current Implementation:**

- Access Token: localStorage (with automatic refresh)
- Refresh Token: localStorage (secure key naming)

**Security Measures:**

- Tokens cleared on logout
- Automatic token refresh before expiration
- Token rotation on refresh
- HTTPS-only in production (enforced by CORS)

**Recommended Enhancement (Future):**
Consider httpOnly cookies for production:

- Protection against XSS attacks
- Automatic CSRF protection with SameSite=Strict
- Backend would need to support cookie-based auth

## CORS Configuration

### Development

```csharp
"ReactDevelopment" policy:
- Origins: http://localhost:3000-3005
- Methods: Any
- Headers: Any
- Credentials: Allowed
```

### Production

```csharp
"ReactProduction" policy:
- Origins: From configuration (CORS:AllowedOrigins)
- Methods: Any
- Headers: Any
- Credentials: Allowed
- Wildcards: Subdomain support enabled
```

**appsettings.Production.json:**

```json
{
  "CORS": {
    "AllowedOrigins": "https://churchregister.com,https://www.churchregister.com"
  }
}
```

## Endpoint Authorization

### Authorization Policies

All API endpoints require authentication unless explicitly marked with `AllowAnonymous()`.

**Policies:**

- `Bearer` - Basic JWT authentication (all authenticated users)
- `AttendanceViewPolicy` - Attendance.View permission or SystemAdministration
- `AttendanceRecordPolicy` - Attendance.Record permission or SystemAdministration
- `AttendanceAnalyticsPolicy` - Attendance.ViewAnalytics permission or SystemAdministration
- `AttendanceSharePolicy` - Attendance.ShareAnalytics permission or SystemAdministration
- `EventCreatePolicy` - EventManagement.Create permission or SystemAdministration
- `EventUpdatePolicy` - EventManagement.Update permission or SystemAdministration

### Anonymous Endpoints

Only these endpoints allow anonymous access:

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh (requires valid refresh token)

**All other endpoints require authentication.**

## Security Headers

Implemented in Program.cs middleware:

```csharp
X-Frame-Options: DENY                           // Prevent clickjacking
X-Content-Type-Options: nosniff                 // Prevent MIME sniffing
X-XSS-Protection: 1; mode=block                 // Enable XSS protection
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [Configured for React/Vite]
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### HTTPS Enforcement

**Production:**

- HSTS enabled (HTTP Strict Transport Security)
- HTTPS redirect enabled
- Antiforgery tokens with SecurePolicy.Always

**Development:**

- HTTPS optional for local testing
- TrustServerCertificate enabled for local SQL Server

## Password Requirements

Configured in Program.cs Identity options:

```csharp
RequireDigit: true
RequiredLength: 12
RequireNonAlphanumeric: true
RequireUppercase: true
RequireLowercase: true
```

### Account Lockout

```csharp
DefaultLockoutTimeSpan: 15 minutes
MaxFailedAccessAttempts: 5
AllowedForNewUsers: true
```

## Rate Limiting

**Status:** Not yet implemented (TASK-166)

**Recommended Implementation:**

- Use AspNetCoreRateLimit package
- Apply to authentication endpoints
- Limits: 5 attempts per minute per IP for login/refresh
- Use distributed cache (Redis) for production scaling

## Sensitive Data Logging

### Protected Data Types

Never log these in plain text:

- Passwords
- JWT tokens (access or refresh)
- Email addresses (in error messages)
- Azure connection strings
- Database connection strings

### Logging Best Practices

**✅ Good:**

```csharp
_logger.LogInformation("User login successful", new { UserId = user.Id });
```

**❌ Bad:**

```csharp
_logger.LogInformation("User logged in: {Email} with token {Token}", user.Email, token);
```

### Current Status

✅ No password/token logging found in codebase (verified TASK-165)

## XSS Protection

### Frontend (React)

**Built-in Protection:**

- React automatically escapes all rendered content
- Material-UI components use safe rendering

**Additional Measures:**

- No `dangerouslySetInnerHTML` usage
- Input sanitization via React Hook Form validation
- CSP headers on backend API

### Backend (ASP.NET Core)

**Protection:**

- Automatic HTML encoding in responses
- FastEndpoints validation
- Antiforgery tokens for state-changing operations

## Database Security

### Connection String Security

**Development:**

- Use User Secrets (never commit to repository)
- Windows Authentication for local SQL Server

**Production:**

- Store in Azure Key Vault
- Use Managed Identity for Azure SQL
- Enable connection string encryption

### Application Account Permissions

**Recommended Minimum Privileges:**

```sql
-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO ChurchRegisterApp
DENY CREATE TABLE TO ChurchRegisterApp
DENY DROP TO ChurchRegisterApp
DENY ALTER ON SCHEMA::dbo TO ChurchRegisterApp
```

**EF Core Migrations:**
Use separate account with elevated permissions for migrations:

```bash
dotnet ef database update --connection "Server=...;User Id=MigrationUser;Password=..."
```

### Audit Trail

Implemented via AuditInterceptor:

- All INSERT/UPDATE/DELETE operations tracked
- User ID captured from ClaimsPrincipal
- Timestamp in UTC
- Cannot be disabled (always active)

## Token Revocation

### Implementation

Middleware: `UseTokenRevocation()` (after authentication)

**Features:**

- Checks RefreshTokens table for revoked tokens
- Validates token hasn't been replaced
- Returns 401 for revoked tokens
- Admin can revoke all user tokens

**Endpoint:**

```
POST /api/auth/revoke-user-tokens
Body: { "userId": "..." }
Authorization: SystemAdministration role required
```

## File Upload Security

### Configuration

```csharp
MultipartBodyLengthLimit: 10 MB
ContentTypes: text/csv only (for HSBC imports)
Validation: Strict CSV parsing with error handling
```

### Upload Endpoints

- `POST /api/financial/upload-hsbc-statement`
- Authorization: Financial roles required
- Virus scanning: Recommended for production (not yet implemented)

## Security Checklist

### Pre-Production

- [ ] Rotate all secrets (JWT key, database passwords, Azure keys)
- [ ] Configure Azure Key Vault
- [ ] Set up Managed Identity for Azure resources
- [ ] Implement rate limiting on auth endpoints
- [ ] Enable Application Insights for monitoring
- [ ] Configure CORS for production domain only
- [ ] Review and restrict database account permissions
- [ ] Enable SSL/TLS for database connections
- [ ] Set up Web Application Firewall (WAF)
- [ ] Configure DDoS protection
- [ ] Review and test all authorization policies
- [ ] Penetration testing
- [ ] Security audit

### Post-Deployment

- [ ] Monitor failed login attempts
- [ ] Review Application Insights for anomalies
- [ ] Regular security updates (npm audit, dotnet list package --vulnerable)
- [ ] Quarterly password rotation policy
- [ ] Review audit logs monthly
- [ ] Backup encryption verification

## Incident Response

### Token Compromise

1. Revoke all affected user tokens via admin endpoint
2. Force password reset for compromised accounts
3. Rotate JWT signing key in Azure Key Vault
4. Audit logs for unauthorized access
5. Notify affected users

### Data Breach

1. Identify scope of breach
2. Isolate affected systems
3. Preserve evidence (logs, database snapshots)
4. Notify stakeholders and authorities (GDPR compliance)
5. Implement remediation measures
6. Post-incident review

## Security Contacts

- Security Team: security@churchregister.com
- Azure Support: [Azure Portal] → Support
- Database Administrator: dba@churchregister.com

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ASP.NET Core Security](https://docs.microsoft.com/en-us/aspnet/core/security/)
- [React Security Best Practices](https://react.dev/learn/writing-secure-react)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
