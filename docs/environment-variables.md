# Environment Variables & Configuration Guide

## Overview

This document describes all required and optional environment variables for the Church Register application across different environments.

## Backend (.NET API Service)

### Required Environment Variables

#### JWT Configuration

| Variable                           | Description                    | Example                          | Storage                                    |
| ---------------------------------- | ------------------------------ | -------------------------------- | ------------------------------------------ |
| `Jwt:Key`                          | JWT signing key (min 32 chars) | `your-secure-random-key-here...` | User Secrets (Dev), Azure Key Vault (Prod) |
| `Jwt:Issuer`                       | JWT token issuer               | `ChurchRegister.ApiService`      | appsettings.json                           |
| `Jwt:Audience`                     | JWT token audience             | `ChurchRegister.React`           | appsettings.json                           |
| `Jwt:AccessTokenExpirationMinutes` | Access token lifetime          | `720` (12 hours)                 | appsettings.json                           |
| `Jwt:RefreshTokenExpirationDays`   | Refresh token lifetime         | `7` days                         | appsettings.json                           |

#### Database Configuration

| Variable                              | Description                  | Example                                  | Storage                                    |
| ------------------------------------- | ---------------------------- | ---------------------------------------- | ------------------------------------------ |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string | `Server=...;Database=ChurchRegister;...` | User Secrets (Dev), Azure Key Vault (Prod) |

#### Azure Services

| Variable                                    | Description                           | Example                                | Storage                                    |
| ------------------------------------------- | ------------------------------------- | -------------------------------------- | ------------------------------------------ |
| `AzureEmailService:ConnectionString`        | Azure Communication Services endpoint | `endpoint=https://...;accesskey=...`   | User Secrets (Dev), Azure Key Vault (Prod) |
| `AzureEmailService:SenderEmail`             | From email address                    | `noreply@churchregister.azurecomm.net` | appsettings.json                           |
| `AzureEmailService:SenderDisplayName`       | From display name                     | `ChurchRegister System`                | appsettings.json                           |
| `AzureEmailService:EnableEmailVerification` | Enable email verification             | `true` / `false`                       | appsettings.json                           |

### Optional Environment Variables

#### CORS Configuration

| Variable              | Description                                  | Example                                                     | Storage                     |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| `CORS:AllowedOrigins` | Comma-separated allowed origins (Production) | `https://churchregister.com,https://www.churchregister.com` | appsettings.Production.json |

#### Azure Key Vault

| Variable            | Description         | Example                                      | Storage                     |
| ------------------- | ------------------- | -------------------------------------------- | --------------------------- |
| `KeyVault:Endpoint` | Azure Key Vault URL | `https://churchregister-kv.vault.azure.net/` | appsettings.Production.json |

#### Logging

| Variable                                | Description                     | Example                  | Storage             |
| --------------------------------------- | ------------------------------- | ------------------------ | ------------------- |
| `ApplicationInsights:ConnectionString`  | Application Insights connection | `InstrumentationKey=...` | Azure Configuration |
| `Logging:LogLevel:Default`              | Default log level               | `Information`            | appsettings.json    |
| `Logging:LogLevel:Microsoft.AspNetCore` | ASP.NET Core log level          | `Warning`                | appsettings.json    |

### Setting Environment Variables

#### Development (User Secrets)

**Recommended for local development:**

```powershell
# Navigate to API project
cd ChurchRegister.ApiService

# Set JWT key
dotnet user-secrets set "Jwt:Key" "your-development-jwt-key-minimum-32-characters-long"

# Set database connection
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True;MultipleActiveResultSets=true"

# Set Azure Email Service connection
dotnet user-secrets set "AzureEmailService:ConnectionString" "endpoint=https://churchregister-email.communication.azure.com/;accesskey=YOUR_KEY_HERE"
```

**View current secrets:**

```powershell
dotnet user-secrets list --project ChurchRegister.ApiService
```

#### Production (Azure Key Vault)

**1. Create Azure Key Vault:**

```bash
az keyvault create --name churchregister-kv --resource-group churchregister-rg --location eastus
```

**2. Add secrets to Key Vault:**

```bash
# JWT Key
az keyvault secret set --vault-name churchregister-kv --name "Jwt--Key" --value "your-production-jwt-key"

# Database connection
az keyvault secret set --vault-name churchregister-kv --name "ConnectionStrings--DefaultConnection" --value "Server=...;Database=..."

# Azure Email
az keyvault secret set --vault-name churchregister-kv --name "AzureEmailService--ConnectionString" --value "endpoint=...;accesskey=..."
```

**3. Grant App Service access:**

```bash
# Enable managed identity on App Service
az webapp identity assign --name churchregister-api --resource-group churchregister-rg

# Grant access to Key Vault
az keyvault set-policy --name churchregister-kv --object-id <app-identity-object-id> --secret-permissions get list
```

**4. Configure App Service:**

```json
{
  "KeyVault": {
    "Endpoint": "https://churchregister-kv.vault.azure.net/"
  }
}
```

#### Testing (Environment Variables)

For integration tests, set environment variables:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=(localdb)\\mssqllocaldb;Database=ChurchRegisterTest;..."
$env:Jwt__Key = "test-jwt-key-for-integration-testing-purposes-only"
```

## Frontend (React / Vite)

### Required Environment Variables

#### API Configuration

| Variable            | Description              | Example                                                                   | Default                 |
| ------------------- | ------------------------ | ------------------------------------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API URL          | `http://localhost:5502` (Dev)<br/>`https://api.churchregister.com` (Prod) | `http://localhost:5502` |
| `VITE_API_TIMEOUT`  | API request timeout (ms) | `30000`                                                                   | `30000`                 |

#### Authentication

| Variable                | Description                        | Example                        | Default                         |
| ----------------------- | ---------------------------------- | ------------------------------ | ------------------------------- |
| `VITE_AUTH_TOKEN_KEY`   | localStorage key for access token  | `churchregister_auth_token`    | `church_register_access_token`  |
| `VITE_AUTH_REFRESH_KEY` | localStorage key for refresh token | `churchregister_refresh_token` | `church_register_refresh_token` |

### Optional Environment Variables

#### Feature Flags

| Variable                | Description           | Example          | Default                      |
| ----------------------- | --------------------- | ---------------- | ---------------------------- |
| `VITE_ENABLE_DEVTOOLS`  | Enable Redux DevTools | `true` / `false` | `true` (Dev), `false` (Prod) |
| `VITE_ENABLE_STORYBOOK` | Enable Storybook      | `true` / `false` | `true` (Dev), `false` (Prod) |
| `VITE_DEBUG_MODE`       | Enable debug logging  | `true` / `false` | `true` (Dev), `false` (Prod) |

#### Monitoring

| Variable                | Description               | Example                     | Default                      |
| ----------------------- | ------------------------- | --------------------------- | ---------------------------- |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `true` / `false`            | `false` (Dev), `true` (Prod) |
| `VITE_ENABLE_LOGGING`   | Enable console logging    | `true` / `false`            | `true` (Dev), `false` (Prod) |
| `VITE_SENTRY_DSN`       | Sentry error tracking DSN | `https://...@sentry.io/...` | ``                           |

### Setting Environment Variables

#### Development (.env.development)

Create `.env.development` file in `ChurchRegister.React` directory:

```env
# Development Environment Configuration

# API Configuration
VITE_API_BASE_URL=http://localhost:5502
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_TOKEN_KEY=churchregister_auth_token_dev
VITE_AUTH_REFRESH_KEY=churchregister_refresh_token_dev

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_STORYBOOK=true

# Monitoring
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_LOGGING=true
VITE_SENTRY_DSN=

# Debug
VITE_DEBUG_MODE=true
```

#### Production (.env.production)

Create `.env.production` file (not committed, created during deployment):

```env
# Production Environment Configuration

# API Configuration
VITE_API_BASE_URL=https://api.churchregister.com
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_TOKEN_KEY=churchregister_auth_token
VITE_AUTH_REFRESH_KEY=churchregister_refresh_token

# Environment
VITE_NODE_ENV=production

# Feature Flags
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_STORYBOOK=false

# Monitoring
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=false
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Debug
VITE_DEBUG_MODE=false
```

#### Azure Static Web Apps (Production)

**Configure in Azure Portal:**

1. Navigate to: Static Web App → Configuration → Application settings
2. Add each `VITE_*` variable as a setting
3. Values are injected at build time

```bash
# Example: Set via Azure CLI
az staticwebapp appsettings set \
  --name churchregister-webapp \
  --setting-names \
    VITE_API_BASE_URL=https://api.churchregister.com \
    VITE_ENABLE_ANALYTICS=true \
    VITE_SENTRY_DSN=https://...
```

## Database Configuration

### Connection String Formats

#### Development (Windows Authentication)

```
Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True;MultipleActiveResultSets=true
```

#### Development (SQL Server)

```
Server=localhost;Database=ChurchRegister;User Id=sa;Password=YourPassword;TrustServerCertificate=True;MultipleActiveResultSets=true
```

#### Production (Azure SQL)

```
Server=tcp:churchregister.database.windows.net,1433;Database=ChurchRegister;User ID=churchregister_app;Password=YourStrongPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

#### Production (Managed Identity)

```
Server=tcp:churchregister.database.windows.net,1433;Database=ChurchRegister;Authentication=Active Directory Managed Identity;Encrypt=True;
```

### Migration Connection Strings

**Separate accounts for migrations (elevated privileges):**

```
Server=tcp:churchregister.database.windows.net,1433;Database=ChurchRegister;User ID=churchregister_migration;Password=YourMigrationPassword;Encrypt=True;
```

Run migrations:

```bash
dotnet ef database update --connection "Server=...;User ID=churchregister_migration;..."
```

## Environment-Specific Configuration Files

### Backend

```
appsettings.json                 # Base configuration (no secrets)
appsettings.Development.json     # Development overrides
appsettings.Production.json      # Production overrides
appsettings.Staging.json         # Staging overrides (create if needed)
```

**Load order:**

1. appsettings.json
2. appsettings.{Environment}.json
3. User Secrets (Development only)
4. Azure Key Vault (Production)
5. Environment Variables (override all)

### Frontend

```
.env                    # Not used (use .env.development or .env.production)
.env.development        # Development configuration
.env.production         # Production configuration
.env.local              # Local overrides (gitignored)
.env.example            # Template for developers
```

**Load order:**

1. .env.{mode} (mode = development, production)
2. .env.local (local overrides, not committed)
3. Environment variables (build-time)

## Secrets Management Best Practices

### ✅ Do

- Use Azure Key Vault for production secrets
- Use .NET User Secrets for development
- Rotate secrets regularly (quarterly minimum)
- Use strong, randomly generated passwords
- Implement least privilege access
- Enable audit logging for secret access
- Use Managed Identity where possible
- Document all required variables

### ❌ Don't

- Commit secrets to Git repository
- Share secrets via email or chat
- Use same secrets for dev/staging/production
- Hardcode secrets in code
- Store secrets in plain text files
- Use weak or predictable passwords
- Grant broad access to Key Vault

## Validation

### Backend Validation

Program.cs includes validation on startup:

```csharp
static void ValidateConfiguration(IConfiguration config)
{
    var required = new Dictionary<string, string>
    {
        ["Jwt:Key"] = "JWT signing key",
        ["ConnectionStrings:DefaultConnection"] = "Database connection string"
    };

    // Validates existence and minimum requirements
    // Throws InvalidOperationException if missing or invalid
}
```

**JWT Key Requirements:**

- Minimum 32 characters (256-bit security)
- Cryptographically secure random generation recommended

### Frontend Validation

tokenService.ts validates configuration:

```typescript
const getEnvironmentConfig = () => {
  // Validates VITE_API_BASE_URL exists and is properly formatted
  // Falls back to defaults with console warnings
};
```

## Deployment Checklist

### Pre-Deployment

- [ ] All secrets stored in Key Vault (production)
- [ ] Connection strings updated for environment
- [ ] CORS configured for production domain
- [ ] JWT keys rotated from development
- [ ] API base URL configured correctly
- [ ] Feature flags set appropriately
- [ ] Logging levels configured
- [ ] Application Insights connected

### Post-Deployment

- [ ] Verify API connectivity from frontend
- [ ] Test authentication flow
- [ ] Verify database connectivity
- [ ] Check email service functionality
- [ ] Monitor Application Insights for errors
- [ ] Validate CORS headers
- [ ] Test all critical user flows

## Troubleshooting

### Common Issues

**"Required configuration missing: JWT signing key"**

- Solution: Set `Jwt:Key` in User Secrets or Key Vault

**"Connection string not found"**

- Solution: Set `ConnectionStrings:DefaultConnection` in User Secrets or Key Vault

**"API calls failing with CORS errors"**

- Solution: Add frontend URL to `CORS:AllowedOrigins` in appsettings.Production.json

**"Token expired immediately after login"**

- Solution: Check `Jwt:AccessTokenExpirationMinutes` is set correctly

**"Unable to connect to SQL Server"**

- Solution: Verify connection string format and server accessibility

## Support

For configuration issues:

- Check logs: Application Insights (production) or console (development)
- Verify environment variables are loaded: Log at startup
- Test connection strings: Use SQL Server Management Studio
- Contact: devops@churchregister.com

## References

- [ASP.NET Core Configuration](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [.NET User Secrets](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
