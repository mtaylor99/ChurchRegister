# Environment variables & configuration guide

## Backend (.NET API service)

### Required variables

#### JWT configuration

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `Jwt:Key` | JWT signing key (min 32 chars) | `your-secure-random-key-here...` | User Secrets (dev), Azure Key Vault (prod) |
| `Jwt:Issuer` | JWT token issuer | `ChurchRegister.ApiService` | `appsettings.json` |
| `Jwt:Audience` | JWT token audience | `ChurchRegister.React` | `appsettings.json` |
| `Jwt:AccessTokenExpirationMinutes` | Access token lifetime | `720` (12 hours) | `appsettings.json` |
| `Jwt:RefreshTokenExpirationDays` | Refresh token lifetime | `7` | `appsettings.json` |

#### Database

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string | `Server=...;Database=ChurchRegister;...` | User Secrets (dev), Azure Key Vault (prod) |

#### Azure services

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `AzureEmailService:ConnectionString` | Azure Communication Services endpoint | `endpoint=https://...;accesskey=...` | User Secrets (dev), Azure Key Vault (prod) |
| `AzureEmailService:SenderEmail` | From email address | `noreply@churchregister.azurecomm.net` | `appsettings.json` |
| `AzureEmailService:SenderDisplayName` | From display name | `ChurchRegister System` | `appsettings.json` |
| `AzureEmailService:EnableEmailVerification` | Enable email verification | `true` / `false` | `appsettings.json` |

#### Membership numbers

| Variable | Description | Default | Storage |
|----------|-------------|---------|---------|
| `MembershipNumbers:NonMemberStartNumber` | First number for non-members in annual sequence | `250` | `appsettings.json` |

### Optional variables

#### CORS (production only)

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `CORS:AllowedOrigins` | Comma-separated allowed origins | `https://churchregister.com,https://www.churchregister.com` | `appsettings.Production.json` |

#### Azure Key Vault (production only)

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `KeyVault:Endpoint` | Azure Key Vault URL | `https://churchregister-kv.vault.azure.net/` | `appsettings.Production.json` |

#### Logging

| Variable | Description | Example | Storage |
|----------|-------------|---------|---------|
| `Logging:LogLevel:Default` | Default log level | `Information` | `appsettings.json` |
| `Logging:LogLevel:Microsoft.AspNetCore` | ASP.NET Core log level | `Warning` | `appsettings.json` |
| `ApplicationInsights:ConnectionString` | Application Insights connection | `InstrumentationKey=...` | Azure config |

---

### Setting variables — development (user secrets)

Run from the repository root:

```powershell
cd ChurchRegister.ApiService

dotnet user-secrets set "Jwt:Key" "your-development-jwt-key-minimum-32-characters-long"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True;MultipleActiveResultSets=true"
dotnet user-secrets set "AzureEmailService:ConnectionString" "endpoint=https://...;accesskey=..."
```

View current secrets:

```powershell
dotnet user-secrets list --project ChurchRegister.ApiService
```

### Setting variables — production (Azure Key Vault)

**1. Create Key Vault:**

```bash
az keyvault create --name churchregister-kv --resource-group churchregister-rg --location eastus
```

**2. Add secrets:**

```bash
az keyvault secret set --vault-name churchregister-kv --name "Jwt--Key" --value "..."
az keyvault secret set --vault-name churchregister-kv --name "ConnectionStrings--DefaultConnection" --value "..."
az keyvault secret set --vault-name churchregister-kv --name "AzureEmailService--ConnectionString" --value "..."
```

**3. Grant App Service access (Managed Identity):**

```bash
az webapp identity assign --name churchregister-api --resource-group churchregister-rg
az keyvault set-policy --name churchregister-kv --object-id <identity-object-id> --secret-permissions get list
```

**4. Configure endpoint in `appsettings.Production.json`:**

```json
{
  "KeyVault": {
    "Endpoint": "https://churchregister-kv.vault.azure.net/"
  }
}
```

### Setting variables — testing

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=(localdb)\\mssqllocaldb;Database=ChurchRegisterTest;..."
$env:Jwt__Key = "test-jwt-key-for-integration-testing-purposes-only"
```

### Configuration file load order

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. User Secrets (development only)
4. Azure Key Vault (production)
5. Environment variables (override all)

---

## Frontend (React / Vite)

### Required variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5502` (dev) / `https://api.churchregister.com` (prod) |
| `VITE_API_TIMEOUT` | API timeout (ms) | `30000` |
| `VITE_AUTH_TOKEN_KEY` | `localStorage` key for access token | `churchregister_auth_token` |
| `VITE_AUTH_REFRESH_KEY` | `localStorage` key for refresh token | `churchregister_refresh_token` |

### Development (`.env.development`)

```env
VITE_API_BASE_URL=http://localhost:5502
VITE_API_TIMEOUT=30000
VITE_AUTH_TOKEN_KEY=churchregister_auth_token_dev
VITE_AUTH_REFRESH_KEY=churchregister_refresh_token_dev
VITE_ENABLE_DEVTOOLS=true
VITE_DEBUG_MODE=true
VITE_ENABLE_ANALYTICS=false
```

### Production (`.env.production`)

```env
VITE_API_BASE_URL=https://api.churchregister.com
VITE_API_TIMEOUT=30000
VITE_AUTH_TOKEN_KEY=churchregister_auth_token
VITE_AUTH_REFRESH_KEY=churchregister_refresh_token
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
```

### Connection string formats

| Environment | Format |
|-------------|--------|
| Dev — Windows auth | `Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True;MultipleActiveResultSets=true` |
| Dev — SQL pass | `Server=localhost;Database=ChurchRegister;User Id=sa;Password=...;TrustServerCertificate=True` |
| Prod — Azure SQL | `Server=tcp:churchregister.database.windows.net,1433;Database=ChurchRegister;User ID=...;Password=...;Encrypt=True` |
| Prod — Managed Identity | `Server=tcp:...;Database=ChurchRegister;Authentication=Active Directory Managed Identity;Encrypt=True` |

---

## Secrets management checklist

### Do

- Store production secrets in Azure Key Vault
- Use .NET User Secrets for local development
- Rotate secrets quarterly
- Use Managed Identity where possible
- Document all required variables (this file)

### Do not

- Commit secrets to Git
- Share secrets via email or chat
- Use the same secrets for dev/staging/production
- Hardcode secrets in code
- Use weak or predictable passwords
