# Local Development Setup

## User Secrets Configuration

To protect sensitive configuration data, this project uses .NET User Secrets for local development. Follow these steps to configure your development environment.

### Prerequisites

- .NET 10 SDK installed
- Access to development Azure resources (if applicable)

### Setting Up User Secrets

User Secrets have been initialized for the `ChurchRegister.ApiService` project. To configure the required secrets:

#### 1. JWT Configuration

Set the JWT signing key (must be at least 32 characters):

```powershell
dotnet user-secrets set "Jwt:Key" "your-secure-jwt-key-at-least-32-characters-long-here" --project ChurchRegister.ApiService
dotnet user-secrets set "Jwt:Issuer" "http://localhost" --project ChurchRegister.ApiService
dotnet user-secrets set "Jwt:Audience" "http://localhost" --project ChurchRegister.ApiService
```

#### 2. Database Connection String

Set your local SQL Server connection string:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=ChurchRegister;Trusted_Connection=True;TrustServerCertificate=True" --project ChurchRegister.ApiService
```

#### 3. Azure Email Service (Optional)

If testing email functionality locally:

```powershell
dotnet user-secrets set "AzureEmailService:ConnectionString" "your-azure-communication-services-connection-string" --project ChurchRegister.ApiService
dotnet user-secrets set "AzureEmailService:SenderAddress" "donotreply@yourdomain.com" --project ChurchRegister.ApiService
```

#### 4. SMS MFA Configuration (Optional)

If testing SMS-based MFA locally:

```powershell
dotnet user-secrets set "AzureSms:ConnectionString" "your-azure-communication-services-connection-string" --project ChurchRegister.ApiService
dotnet user-secrets set "AzureSms:PhoneNumber" "+1234567890" --project ChurchRegister.ApiService
```

### Viewing Current Secrets

To view all configured secrets:

```powershell
dotnet user-secrets list --project ChurchRegister.ApiService
```

### Removing Secrets

To remove a specific secret:

```powershell
dotnet user-secrets remove "SecretKey" --project ChurchRegister.ApiService
```

To clear all secrets:

```powershell
dotnet user-secrets clear --project ChurchRegister.ApiService
```

## Configuration Validation

The application validates configuration on startup. If required secrets are missing or invalid, the application will fail to start with a clear error message indicating which configuration values need to be set.

### Required Configuration

- `Jwt:Key` - Must be at least 32 characters (256 bits)
- `ConnectionStrings:DefaultConnection` - SQL Server connection string

### Optional Configuration

- `AzureEmailService:ConnectionString` - Required for email functionality
- `AzureEmailService:SenderAddress` - Required for email functionality
- `AzureSms:ConnectionString` - Required for SMS MFA
- `AzureSms:PhoneNumber` - Required for SMS MFA

## Production Configuration

In production, all secrets are stored in **Azure Key Vault**. The application automatically loads secrets from Key Vault when running in production mode using Managed Identity.

### Key Vault Configuration

Set the Key Vault endpoint in production `appsettings.Production.json`:

```json
{
  "KeyVault": {
    "Endpoint": "https://your-keyvault-name.vault.azure.net/"
  }
}
```

The following secrets should be configured in Azure Key Vault:

- `Jwt--Key` (note the double dash separator)
- `Jwt--Issuer`
- `Jwt--Audience`
- `ConnectionStrings--DefaultConnection`
- `AzureEmailService--ConnectionString`
- `AzureEmailService--SenderAddress`
- `AzureSms--ConnectionString`
- `AzureSms--PhoneNumber`

## Troubleshooting

### Application Won't Start

1. **Check for configuration validation errors** - The startup validation will indicate which secrets are missing
2. **Verify User Secrets are set** - Run `dotnet user-secrets list --project ChurchRegister.ApiService`
3. **Ensure JWT key is long enough** - Must be at least 32 characters

### Database Connection Issues

1. **Verify SQL Server is running** - Check that your local SQL Server instance is accessible
2. **Check connection string** - Ensure the connection string in User Secrets matches your SQL Server configuration
3. **Trust Server Certificate** - Ensure `TrustServerCertificate=True` is in the connection string for local development

## Security Notes

- **Never commit secrets to source control** - All sensitive files are in `.gitignore`
- **User Secrets are stored locally** - Located in `%APPDATA%\Microsoft\UserSecrets\c28c1d1f-1821-4de2-8d0f-931d642f41bd\secrets.json`
- **Rotate keys regularly** - Especially JWT signing keys and database passwords
- **Use strong keys** - JWT key should be cryptographically random, at least 32 characters
