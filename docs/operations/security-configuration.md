# Security configuration guide

## Authentication & authorisation

### JWT token configuration

| Token | Expiry | Algorithm |
|-------|--------|-----------|
| Access token | 12 hours (720 minutes) | HS256 (HMAC-SHA256) |
| Refresh token | 7 days | HS256 |

**Minimum JWT key length:** 32 characters (256-bit). Generate with a cryptographically secure random source.

Refresh tokens are rotated on use (old token revoked in the database on each refresh). The database stores an audit trail of all refresh tokens.

**`appsettings.json` skeleton:**

```json
{
  "Jwt": {
    "Key": "[Store in Azure Key Vault — never commit]",
    "Issuer": "ChurchRegister.ApiService",
    "Audience": "ChurchRegister.React",
    "AccessTokenExpirationMinutes": 720,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Frontend token storage

Access and refresh tokens are stored in `localStorage` (keyed by `VITE_AUTH_TOKEN_KEY` / `VITE_AUTH_REFRESH_KEY`). Tokens are cleared on logout. Token rotation and automatic refresh are handled by `useTokenRefresh`.

**Future consideration:** migrating to `httpOnly` cookies would protect against XSS. This requires backend support for cookie-based auth and CSRF protection.

### Setting secrets

**Development:**

```powershell
dotnet user-secrets set "Jwt:Key" "your-development-jwt-key-minimum-32-characters-long" --project ChurchRegister.ApiService
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..." --project ChurchRegister.ApiService
dotnet user-secrets set "AzureEmailService:ConnectionString" "..." --project ChurchRegister.ApiService
```

**Production:** Store in Azure Key Vault. See [environment-variables.md](environment-variables.md) for Key Vault setup steps.

---

## CORS policy

| Environment | Policy name | Origins |
|------------|-------------|---------|
| Development | `ReactDevelopment` | `http://localhost:3000`–`3005` |
| Production | `ReactProduction` | From `CORS:AllowedOrigins` config (comma-separated) |

Both policies: any method, any header, credentials allowed.

**`appsettings.Production.json`:**

```json
{
  "CORS": {
    "AllowedOrigins": "https://churchregister.com,https://www.churchregister.com"
  }
}
```

---

## Endpoint authorisation

All API endpoints require authentication via the `Bearer` JWT policy unless explicitly decorated with `AllowAnonymous()`.

### Anonymous endpoints

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/refresh` | Token refresh (requires valid refresh token) |

All other endpoints require a valid JWT.

### Authorization policies (defined in `Program.cs`)

| Policy | Requirement |
|--------|------------|
| `Bearer` | Valid JWT, any role |
| `AttendanceViewPolicy` | `Attendance.View` claim **or** `SystemAdministration` role |
| `AttendanceRecordPolicy` | `Attendance.Record` claim **or** `SystemAdministration` role |
| `AttendanceAnalyticsPolicy` | `Attendance.ViewAnalytics` claim **or** `SystemAdministration` role |
| `AttendanceSharePolicy` | `Attendance.ShareAnalytics` claim **or** `SystemAdministration` role |
| `EventCreatePolicy` | `EventManagement.Create` claim **or** `SystemAdministration` role |
| `EventUpdatePolicy` | `EventManagement.Update` claim **or** `SystemAdministration` role |

---

## Security headers

Applied by middleware registered in `Program.cs`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configured for React/Vite]
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**HTTPS enforcement (production):**
- HSTS enabled
- HTTPS redirect enabled
- Antiforgery tokens use `SecurePolicy.Always`

---

## Password requirements

Configured in ASP.NET Core Identity options in `Program.cs`:

| Setting | Value |
|---------|-------|
| Minimum length | 12 characters |
| Require digit | Yes |
| Require non-alphanumeric | Yes |
| Require uppercase | Yes |
| Require lowercase | Yes |

### Account lockout

| Setting | Value |
|---------|-------|
| Lockout duration | 15 minutes |
| Max failed attempts | 5 |
| Applies to new users | Yes |

---

## Database security

### Development

- Use User Secrets for the connection string
- Windows Authentication on local SQL Server

### Production

- Store in Azure Key Vault
- Use Managed Identity for Azure SQL where possible
- Application account granted minimum privileges:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO ChurchRegisterApp;
DENY CREATE TABLE TO ChurchRegisterApp;
DENY DROP TO ChurchRegisterApp;
```

- Use a separate, elevated migration account for `dotnet ef database update`

### Audit trail

`AuditInterceptor` tracks all `INSERT`/`UPDATE`/`DELETE` operations automatically. It records the current user ID from `ClaimsPrincipal` and a UTC timestamp. This cannot be bypassed through application code.

---

## Token revocation

The `UseTokenRevocation()` middleware (registered after authentication in `Program.cs`) checks the `RefreshTokens` table and returns `401` for any revoked or replaced tokens.

Admin endpoint to revoke all tokens for a user:

```
POST /api/auth/revoke-user-tokens
Body: { "userId": "..." }
Auth: SystemAdministration role required
```

---

## Sensitive data logging

Never log in plain text:
- Passwords
- JWT tokens (access or refresh)
- Email addresses in error messages
- Azure connection strings

```csharp
// ✅ Good
_logger.LogInformation("User login successful for {UserId}", user.Id);

// ❌ Bad
_logger.LogInformation("User logged in: {Email} with token {Token}", user.Email, token);
```

---

## File upload security

```
MultipartBodyLengthLimit: 10 MB
Allowed content type: text/csv (HSBC statement imports)
```

Applicable endpoints require `FinancialAdministrator` or `SystemAdministration` role.

---

## Rate limiting

Status: **not yet implemented**. Recommended approach:
- `AspNetCoreRateLimit` package
- 5 login/refresh attempts per minute per IP
- Distributed Redis cache for production scaling

---

## Pre-production security checklist

- [ ] Rotate all secrets (JWT key, database passwords, Azure keys)
- [ ] Configure Azure Key Vault with Managed Identity
- [ ] Implement rate limiting on auth endpoints
- [ ] Configure CORS for production domain only
- [ ] Review and restrict database account permissions
- [ ] Enable SSL/TLS for database connections
- [ ] Enable Application Insights
- [ ] Configure Web Application Firewall (WAF)
- [ ] Review all authorization policies
- [ ] Run `dotnet list package --vulnerable` and `npm audit`

---

## Incident response

### Token compromise

1. Revoke all affected tokens via `POST /api/auth/revoke-user-tokens`
2. Force password reset for affected accounts
3. Rotate JWT signing key in Azure Key Vault
4. Audit logs for unauthorised access

### Data breach

1. Identify scope
2. Isolate affected systems
3. Preserve evidence (logs, DB snapshots)
4. Notify stakeholders (GDPR compliance)
5. Implement remediation
6. Post-incident review

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ASP.NET Core Security docs](https://learn.microsoft.com/en-us/aspnet/core/security/)
- [Azure Key Vault docs](https://learn.microsoft.com/en-us/azure/key-vault/)
