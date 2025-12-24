---
title: Azure Cloud Deployment Specification for ChurchRegister Application
version: 1.0
date_created: 2025-11-26
last_updated: 2025-11-26
owner: Development Team
tags: [infrastructure, deployment, azure, cloud, react, dotnet]
---

# Introduction

This specification provides a comprehensive, step-by-step guide for deploying the ChurchRegister application to Microsoft Azure. The ChurchRegister application consists of a React frontend (Vite-based SPA) and a .NET 8 Web API backend with SQL Server database. This guide is designed for developers new to Azure and provides detailed instructions for setting up all required Azure resources, configuring CI/CD pipelines, and deploying the application to production.

## 1. Purpose & Scope

**Purpose**: Define the complete deployment architecture, prerequisites, step-by-step procedures, and configuration requirements for deploying ChurchRegister to Azure App Service with automated CI/CD using GitHub Actions.

**Scope**: This specification covers:

- Azure resource provisioning and configuration
- React SPA build and deployment process
- .NET 8 API deployment to Azure App Service
- Azure SQL Database setup and migration
- Application configuration and secrets management
- CI/CD pipeline implementation using GitHub Actions
- Monitoring and logging setup
- Security best practices for production deployment

**Audience**: Developers, DevOps engineers, and system administrators deploying ChurchRegister to Azure for the first time.

**Assumptions**:

- You have an active Azure subscription
- You have a GitHub account with repository access
- Local development environment is already set up
- Application is version-controlled in GitHub repository (mtaylor99-ChurchRegister)

## 2. Definitions

- **SPA**: Single Page Application - The React frontend application
- **App Service**: Azure's PaaS offering for hosting web applications
- **App Service Plan**: Defines the compute resources for App Service
- **Azure SQL Database**: Microsoft's cloud-based relational database service
- **Key Vault**: Azure service for securely storing application secrets
- **Application Insights**: Azure monitoring and analytics service
- **Resource Group**: Logical container for Azure resources
- **CI/CD**: Continuous Integration/Continuous Deployment
- **GitHub Actions**: GitHub's automation and workflow platform
- **Managed Identity**: Azure AD identity for secure access to Azure services
- **CORS**: Cross-Origin Resource Sharing - security feature for web browsers
- **JWT**: JSON Web Token - authentication token format
- **Connection String**: Database connection configuration string
- **Environment Variables**: Configuration values for application settings

## 3. Requirements, Constraints & Guidelines

### Prerequisites

- **REQ-001**: Azure subscription with sufficient credits/budget for App Services and SQL Database
- **REQ-002**: GitHub repository access with admin permissions for Actions and Secrets
- **REQ-003**: Azure CLI installed locally for manual deployment steps
- **REQ-004**: Node.js 18+ and npm installed for React build
- **REQ-005**: .NET 8 SDK installed for API build
- **REQ-006**: Git installed and configured

### Azure Resources

- **REQ-007**: Create Resource Group in appropriate Azure region (e.g., East US, West Europe)
- **REQ-008**: Provision App Service Plan (minimum B1 tier for production)
- **REQ-009**: Create two App Services: one for API, one for React SPA
- **REQ-010**: Provision Azure SQL Database (minimum S0 tier for production)
- **REQ-011**: Create Azure Key Vault for secrets management
- **REQ-012**: Configure Application Insights for monitoring

### Security Requirements

- **SEC-001**: All secrets (JWT keys, connection strings, API keys) must be stored in Azure Key Vault
- **SEC-002**: Enable HTTPS-only access for all App Services
- **SEC-003**: Configure App Service Managed Identity for Key Vault access
- **SEC-004**: Set minimum TLS version to 1.2
- **SEC-005**: Enable Azure SQL Database firewall to allow only Azure services
- **SEC-006**: Use strong passwords for SQL Database admin account (store in Key Vault)
- **SEC-007**: Configure CORS to allow only frontend domain

### Deployment Constraints

- **CON-001**: React app must be built as static files before deployment
- **CON-002**: API must target net8.0 framework
- **CON-003**: Database migrations must run before API deployment
- **CON-004**: Environment-specific configuration must use Azure App Settings

## 4. Step-by-Step Deployment Guide

### STEP 1: Install Prerequisites

```powershell
# Install Azure CLI (Windows)
winget install Microsoft.AzureCLI

# Login to Azure
az login

# Verify subscription
az account list --output table
az account set --subscription "Your Subscription Name"

# Install .NET 8 SDK (if not already installed)
winget install Microsoft.DotNet.SDK.8

# Install Node.js 18 LTS (if not already installed)
winget install OpenJS.NodeJS.LTS
```

### STEP 2: Create Azure Resources

```powershell
# Set variables
$resourceGroup = "churchregister-prod-rg"
$location = "eastus"
$appServicePlan = "churchregister-prod-plan"
$apiApp = "churchregister-prod-api"
$webApp = "churchregister-prod-web"
$sqlServer = "churchregister-prod-sql"
$sqlDatabase = "ChurchRegisterDB"
$keyVault = "churchregister-prod-kv"

# Create Resource Group
az group create --name $resourceGroup --location $location

# Create App Service Plan (Linux, B1 tier)
az appservice plan create `
  --name $appServicePlan `
  --resource-group $resourceGroup `
  --location $location `
  --is-linux `
  --sku B1

# Create API App Service (.NET 8)
az webapp create `
  --name $apiApp `
  --resource-group $resourceGroup `
  --plan $appServicePlan `
  --runtime "DOTNET:8.0"

# Create Web App Service (Node.js 18)
az webapp create `
  --name $webApp `
  --resource-group $resourceGroup `
  --plan $appServicePlan `
  --runtime "NODE:18-lts"

# Create SQL Server
$sqlAdminPassword = Read-Host "Enter SQL Admin Password" -AsSecureString
az sql server create `
  --name $sqlServer `
  --resource-group $resourceGroup `
  --location $location `
  --admin-user sqladmin `
  --admin-password $sqlAdminPassword

# Create SQL Database
az sql db create `
  --name $sqlDatabase `
  --resource-group $resourceGroup `
  --server $sqlServer `
  --service-objective S0

# Configure SQL firewall to allow Azure services
az sql server firewall-rule create `
  --name AllowAzureServices `
  --resource-group $resourceGroup `
  --server $sqlServer `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0

# Create Key Vault
az keyvault create `
  --name $keyVault `
  --resource-group $resourceGroup `
  --location $location `
  --enable-rbac-authorization false
```

### STEP 3: Configure Managed Identity and Key Vault Access

```powershell
# Enable Managed Identity for API App Service
az webapp identity assign `
  --name $apiApp `
  --resource-group $resourceGroup

# Get the identity principal ID
$principalId = az webapp identity show `
  --name $apiApp `
  --resource-group $resourceGroup `
  --query principalId `
  --output tsv

# Grant Key Vault access to Managed Identity
az keyvault set-policy `
  --name $keyVault `
  --object-id $principalId `
  --secret-permissions get list
```

### STEP 4: Store Secrets in Key Vault

```powershell
# Generate JWT key (256-bit random string)
$jwtKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Store JWT Key
az keyvault secret set `
  --vault-name $keyVault `
  --name "JwtKey" `
  --value $jwtKey

# Build SQL connection string
$sqlConnectionString = "Server=tcp:$sqlServer.database.windows.net,1433;Initial Catalog=$sqlDatabase;Persist Security Info=False;User ID=sqladmin;Password=<YOUR_PASSWORD>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Store SQL Connection String
az keyvault secret set `
  --vault-name $keyVault `
  --name "SqlConnectionString" `
  --value $sqlConnectionString
```

### STEP 5: Configure API App Service Settings

```powershell
# Get Key Vault URI
$keyVaultUri = az keyvault show --name $keyVault --query properties.vaultUri --output tsv

# Configure App Settings
az webapp config appsettings set `
  --name $apiApp `
  --resource-group $resourceGroup `
  --settings `
    ASPNETCORE_ENVIRONMENT="Production" `
    "ConnectionStrings__DefaultConnection=@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/SqlConnectionString/)" `
    "Jwt__Key=@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/JwtKey/)" `
    "Jwt__Issuer=ChurchRegister.ApiService" `
    "Jwt__Audience=ChurchRegister.React" `
    "Jwt__ExpiryMinutes=60"

# Enable HTTPS only
az webapp update `
  --name $apiApp `
  --resource-group $resourceGroup `
  --https-only true

# Configure CORS
az webapp cors add `
  --name $apiApp `
  --resource-group $resourceGroup `
  --allowed-origins "https://$webApp.azurewebsites.net"
```

### STEP 6: Deploy and Run Database Migrations

```powershell
# Navigate to solution root
cd C:\GitHub\Personal\ChurchRegister

# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef

# Get actual connection string from Key Vault
$connString = az keyvault secret show --vault-name $keyVault --name SqlConnectionString --query value --output tsv

# Run migrations using connection string
dotnet ef database update --project ChurchRegister.Database --startup-project ChurchRegister.ApiService --connection "$connString"
```

### STEP 7: Build and Deploy API

```powershell
# Build API in Release mode
dotnet publish ChurchRegister.ApiService/ChurchRegister.ApiService.csproj `
  --configuration Release `
  --output ./publish/api

# Create deployment package
Compress-Archive -Path ./publish/api/* -DestinationPath ./api-deploy.zip -Force

# Deploy to Azure App Service
az webapp deploy `
  --name $apiApp `
  --resource-group $resourceGroup `
  --src-path ./api-deploy.zip `
  --type zip

# Verify deployment
$apiUrl = "https://$apiApp.azurewebsites.net/health"
curl $apiUrl
```

### STEP 8: Build and Deploy React App

```powershell
# Navigate to React project
cd ChurchRegister.React

# Create .env.production file
@"
VITE_API_BASE_URL=https://$apiApp.azurewebsites.net
NODE_ENV=production
"@ | Out-File -FilePath .env.production -Encoding utf8

# Install dependencies
npm install

# Build for production
npm run build

# Zip the dist folder contents
cd ..
Compress-Archive -Path ./ChurchRegister.React/dist/* -DestinationPath ./web-deploy.zip -Force

# Deploy to Azure App Service
az webapp deploy `
  --name $webApp `
  --resource-group $resourceGroup `
  --src-path ./web-deploy.zip `
  --type zip

# Configure Web App for SPA routing
az webapp config set `
  --name $webApp `
  --resource-group $resourceGroup `
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

### STEP 9: Verify Deployment

```powershell
# Test API
$apiUrl = "https://$apiApp.azurewebsites.net/health"
Invoke-WebRequest -Uri $apiUrl

# Open React app in browser
Start-Process "https://$webApp.azurewebsites.net"
```

## 5. Common Issues and Solutions

### Issue 1: React App Shows Blank Page

**Problem**: Deployed React app shows blank page or 404 errors on refresh

**Solution**: Add web.config for URL rewriting

1. Create `web.config` in your React `public` folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

2. Rebuild and redeploy

### Issue 2: CORS Errors

**Problem**: Browser shows CORS policy errors

**Solution**: Update CORS configuration

```powershell
az webapp cors remove --name $apiApp --resource-group $resourceGroup --allowed-origins *
az webapp cors add --name $apiApp --resource-group $resourceGroup `
  --allowed-origins "https://$webApp.azurewebsites.net"
```

### Issue 3: Database Connection Fails

**Problem**: API cannot connect to SQL Database

**Solution**: Verify connection string and firewall

```powershell
# Check firewall rules
az sql server firewall-rule list --server $sqlServer --resource-group $resourceGroup

# Add your IP for testing
az sql server firewall-rule create `
  --name MyLocalIP `
  --server $sqlServer `
  --resource-group $resourceGroup `
  --start-ip-address <your-ip> `
  --end-ip-address <your-ip>
```

### Issue 4: Key Vault Access Denied

**Problem**: API returns errors accessing Key Vault secrets

**Solution**: Re-grant Managed Identity permissions

```powershell
$principalId = az webapp identity show `
  --name $apiApp `
  --resource-group $resourceGroup `
  --query principalId --output tsv

az keyvault set-policy `
  --name $keyVault `
  --object-id $principalId `
  --secret-permissions get list
```

## 6. CI/CD with GitHub Actions

After successful manual deployment, automate future deployments using the existing GitHub Actions workflow.

### STEP 10: Configure GitHub Secrets

Navigate to your GitHub repository settings and add the following secrets:

1. **AZURE_CREDENTIALS**: Azure service principal credentials
2. **AZURE_SUBSCRIPTION_ID**: Your Azure subscription ID
3. **AZURE_RG**: Resource group name (e.g., `churchregister-prod-rg`)
4. **SQL_ADMIN_LOGIN**: SQL Server admin username (e.g., `sqladmin`)
5. **SQL_ADMIN_PASSWORD**: SQL Server admin password
6. **SQL_CONNECTION_STRING**: Full connection string for EF migrations

### Create Azure Service Principal

```powershell
# Create service principal for GitHub Actions
$subscriptionId = az account show --query id --output tsv
$spName = "github-actions-churchregister"

az ad sp create-for-rbac `
  --name $spName `
  --role contributor `
  --scopes /subscriptions/$subscriptionId/resourceGroups/$resourceGroup `
  --sdk-auth

# Copy the JSON output to GitHub secret AZURE_CREDENTIALS
# It should look like:
# {
#   "clientId": "...",
#   "clientSecret": "...",
#   "subscriptionId": "...",
#   "tenantId": "...",
#   ...
# }
```

### GitHub Actions Workflow Overview

The existing workflow file `.github/workflows/deploy-azure-free.yml` includes:

**Triggers:**

- Push to `main` branch
- Pull request merge to `main` branch

**Jobs:**

1. **build-and-test**:

   - Builds both .NET API and React app
   - Runs .NET tests
   - Creates deployment artifact with React built into API wwwroot

2. **deploy-infrastructure**:

   - Deploys Azure resources using ARM template
   - Only runs on main branch pushes

3. **deploy-application**:
   - Deploys the compiled application to Azure App Service
   - Runs database migrations (placeholder for EF Core migrations)
   - Only runs on main branch pushes

### Workflow Configuration Details

**Environment Variables:**

```yaml
env:
  AZURE_WEBAPP_NAME: "church-register-api-${{ github.run_number }}"
  AZURE_WEBAPP_PACKAGE_PATH: "./publish"
  DOTNET_VERSION: "8.0.x"
  NODE_VERSION: "20.x"
```

**Key Steps:**

- Checkout code
- Setup .NET 8 SDK
- Setup Node.js 20.x
- Restore dependencies
- Build React app (`npm run build`)
- Run .NET tests
- Publish .NET API
- Copy React build to API wwwroot folder
- Upload build artifact
- Login to Azure
- Deploy infrastructure (if needed)
- Deploy application to App Service
- Run database migrations

### Customizing the Workflow

**To enable database migrations**, update the migration step in the workflow:

```yaml
- name: Run database migrations
  run: |
    dotnet tool install --global dotnet-ef
    dotnet ef database update \
      --project ChurchRegister.Database/ChurchRegister.Database.csproj \
      --startup-project ChurchRegister.ApiService/ChurchRegister.ApiService.csproj \
      --connection "${{ secrets.SQL_CONNECTION_STRING }}"
```

**To deploy API and React as separate services**, modify the workflow to:

1. Create separate artifacts for API and React
2. Deploy API to `$apiApp`
3. Deploy React to `$webApp`
4. Configure CORS to allow React domain

### Testing the Workflow

```powershell
# Make a small change and commit
git add .
git commit -m "Test automated deployment"
git push origin main

# Watch the workflow run
# Go to: https://github.com/mtaylor99/ChurchRegister/actions
```

### Workflow Validation Checklist

- [ ] All GitHub secrets are configured
- [ ] Service principal has contributor access to resource group
- [ ] ARM template exists at `.azure/infrastructure.json`
- [ ] Workflow runs successfully on push to main
- [ ] Database migrations execute without errors
- [ ] Application is accessible after deployment
- [ ] React app loads correctly with API integration
- [ ] No CORS errors in browser console

## 7. Validation Criteria

After deployment, verify the following:

### API Validation

```powershell
# Test health endpoint
$apiUrl = "https://$apiApp.azurewebsites.net/health"
Invoke-WebRequest -Uri $apiUrl -UseBasicParsing

# Test authentication endpoint
$loginUrl = "https://$apiApp.azurewebsites.net/api/authentication/login"
$body = @{
    email = "admin@churchregister.com"
    password = "Admin123!Admin"
} | ConvertTo-Json

Invoke-WebRequest -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
```

### React App Validation

- [ ] Homepage loads without errors
- [ ] Login page is accessible
- [ ] React routing works (refresh on `/app/members` should not 404)
- [ ] API calls from React app succeed
- [ ] No console errors in browser DevTools

### Database Validation

```powershell
# Connect to Azure SQL Database
$serverName = "$sqlServer.database.windows.net"
$databaseName = $sqlDatabase

# Use Azure Data Studio or SSMS to verify:
# - All tables created
# - Seed data present
# - No migration errors in __EFMigrationsHistory table
```

### Security Validation

- [ ] HTTPS-only enforced on all App Services
- [ ] Key Vault secrets accessible via Managed Identity
- [ ] SQL Database firewall configured correctly
- [ ] No connection strings in source code
- [ ] CORS configured to allow only production React domain

### Monitoring Validation

- [ ] Application Insights receiving telemetry
- [ ] Logs visible in Azure Portal
- [ ] Performance metrics showing data
- [ ] Failed request tracking enabled

## 8. Rollback Procedures

If deployment fails, follow these rollback steps:

### Rollback API Deployment

```powershell
# List deployment history
az webapp deployment list --name $apiApp --resource-group $resourceGroup

# Rollback to previous version
az webapp deployment source show --name $apiApp --resource-group $resourceGroup
```

### Rollback Database Migrations

```powershell
# Get migration history
dotnet ef migrations list --project ChurchRegister.Database --startup-project ChurchRegister.ApiService

# Rollback to specific migration
dotnet ef database update <PreviousMigrationName> \
  --project ChurchRegister.Database \
  --startup-project ChurchRegister.ApiService \
  --connection "$connString"
```

### Emergency: Delete and Recreate Resources

```powershell
# Only if complete reset needed
az group delete --name $resourceGroup --yes --no-wait

# Then re-run all steps from STEP 2
```

## 9. Cost Optimization Tips

### Free/Low-Cost Configuration

- **App Service Plan**: F1 (Free) or B1 (Basic ~$13/month)
- **SQL Database**: Basic tier (~$5/month) or use serverless
- **Key Vault**: Pay-per-operation (minimal cost for small apps)
- **Application Insights**: First 5GB/month free

### Cost Monitoring

```powershell
# Check current costs
az consumption usage list --start-date 2025-11-01 --end-date 2025-11-30

# Set up budget alerts in Azure Portal
# Navigate to: Cost Management + Billing > Budgets
```

## 10. Additional Resources

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Azure SQL Database Documentation](https://learn.microsoft.com/azure/azure-sql/)
- [Azure Key Vault Documentation](https://learn.microsoft.com/azure/key-vault/)
- [GitHub Actions for Azure](https://learn.microsoft.com/azure/developer/github/github-actions)
- [EF Core Migrations](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)

## 11. Support and Troubleshooting

### Azure Support Resources

- Azure Portal: https://portal.azure.com
- Azure Status: https://status.azure.com
- Azure CLI Reference: https://learn.microsoft.com/cli/azure/

### Common Commands for Troubleshooting

```powershell
# View App Service logs
az webapp log tail --name $apiApp --resource-group $resourceGroup

# Check App Service status
az webapp show --name $apiApp --resource-group $resourceGroup --query state

# Restart App Service
az webapp restart --name $apiApp --resource-group $resourceGroup

# View recent deployments
az webapp deployment list --name $apiApp --resource-group $resourceGroup --output table

# Download App Service logs
az webapp log download --name $apiApp --resource-group $resourceGroup --log-file logs.zip
```
