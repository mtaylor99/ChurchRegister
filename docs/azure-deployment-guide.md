# Azure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Church Register application to Microsoft Azure.

## Architecture

**Production Architecture:**

- Frontend: Azure Static Web Apps (React SPA)
- Backend: Azure App Service (ASP.NET Core API)
- Database: Azure SQL Database
- Email: Azure Communication Services
- Secrets: Azure Key Vault
- Monitoring: Application Insights
- CDN: Azure CDN (optional)

## Prerequisites

### Required Tools

- Azure CLI: `az --version` (latest)
- .NET 10.0 SDK: `dotnet --version`
- Node.js 20+: `node --version`
- Azure Subscription with permissions to create resources

### Required Information

- Azure Subscription ID
- Resource Group name (e.g., `churchregister-rg`)
- Deployment region (e.g., `eastus`, `westeurope`)
- Production domain name (e.g., `churchregister.com`)
- SSL certificate (or use Azure managed)

## Step 1: Create Azure Resources

### 1.1 Login to Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

### 1.2 Create Resource Group

```bash
az group create \
  --name churchregister-rg \
  --location eastus
```

### 1.3 Create Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name churchregister-sql \
  --resource-group churchregister-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password "YourStrongPassword123!"

# Configure firewall (allow Azure services)
az sql server firewall-rule create \
  --resource-group churchregister-rg \
  --server churchregister-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create database
az sql db create \
  --resource-group churchregister-rg \
  --server churchregister-sql \
  --name ChurchRegister \
  --service-objective S0 \
  --backup-storage-redundancy Local
```

### 1.4 Create Azure Key Vault

```bash
az keyvault create \
  --name churchregister-kv \
  --resource-group churchregister-rg \
  --location eastus \
  --enable-soft-delete true \
  --enable-purge-protection false
```

### 1.5 Create App Service Plan & API Service

```bash
# Create App Service Plan (Linux, P1V2 tier)
az appservice plan create \
  --name churchregister-plan \
  --resource-group churchregister-rg \
  --location eastus \
  --is-linux \
  --sku P1V2

# Create Web App
az webapp create \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --plan churchregister-plan \
  --runtime "DOTNET|10.0"

# Enable system-assigned managed identity
az webapp identity assign \
  --name churchregister-api \
  --resource-group churchregister-rg
```

### 1.6 Create Static Web App (Frontend)

```bash
az staticwebapp create \
  --name churchregister-webapp \
  --resource-group churchregister-rg \
  --location eastus2 \
  --sku Standard \
  --source https://github.com/your-org/ChurchRegister \
  --branch main \
  --app-location "/ChurchRegister.React" \
  --output-location "dist" \
  --login-with-github
```

### 1.7 Create Azure Communication Services

```bash
az communication create \
  --name churchregister-email \
  --resource-group churchregister-rg \
  --location global \
  --data-location UnitedStates
```

### 1.8 Create Application Insights

```bash
az monitor app-insights component create \
  --app churchregister-insights \
  --location eastus \
  --resource-group churchregister-rg \
  --application-type web
```

## Step 2: Configure Secrets

### 2.1 Store Secrets in Key Vault

```bash
# Get App Service managed identity object ID
IDENTITY_ID=$(az webapp identity show --name churchregister-api --resource-group churchregister-rg --query principalId -o tsv)

# Grant Key Vault access to App Service
az keyvault set-policy \
  --name churchregister-kv \
  --object-id $IDENTITY_ID \
  --secret-permissions get list

# Generate secure JWT key (PowerShell)
$jwtKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Store JWT key
az keyvault secret set \
  --vault-name churchregister-kv \
  --name "Jwt--Key" \
  --value "$jwtKey"

# Store database connection string
$connectionString = "Server=tcp:churchregister-sql.database.windows.net,1433;Database=ChurchRegister;User ID=sqladmin;Password=YourStrongPassword123!;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

az keyvault secret set \
  --vault-name churchregister-kv \
  --name "ConnectionStrings--DefaultConnection" \
  --value "$connectionString"

# Store Azure Communication Services connection string
$emailConnectionString = "endpoint=https://churchregister-email.communication.azure.com/;accesskey=YOUR_KEY"

az keyvault secret set \
  --vault-name churchregister-kv \
  --name "AzureEmailService--ConnectionString" \
  --value "$emailConnectionString"
```

### 2.2 Configure App Service Settings

```bash
# Set Key Vault endpoint
az webapp config appsettings set \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --settings \
    KeyVault__Endpoint="https://churchregister-kv.vault.azure.net/"

# Set Application Insights
APPINSIGHTS_KEY=$(az monitor app-insights component show --app churchregister-insights --resource-group churchregister-rg --query instrumentationKey -o tsv)

az webapp config appsettings set \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$APPINSIGHTS_KEY"

# Set production CORS
az webapp config appsettings set \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --settings \
    CORS__AllowedOrigins="https://churchregister.com,https://www.churchregister.com"
```

## Step 3: Database Migration

### 3.1 Update Database Schema

```bash
# From local machine, run migrations against Azure SQL
cd ChurchRegister.ApiService

dotnet ef database update \
  --connection "Server=tcp:churchregister-sql.database.windows.net,1433;Database=ChurchRegister;User ID=sqladmin;Password=YourStrongPassword123!;Encrypt=True;"
```

### 3.2 Verify Database

```sql
-- Connect using SQL Server Management Studio or Azure Data Studio
-- Server: churchregister-sql.database.windows.net
-- Database: ChurchRegister
-- Authentication: SQL Server Authentication

-- Verify tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Verify seed data
SELECT * FROM AspNetRoles;
SELECT * FROM Events;
```

## Step 4: Deploy Backend API

### 4.1 Build & Publish API

```bash
cd ChurchRegister.ApiService

# Build in Release mode
dotnet build --configuration Release

# Publish to folder
dotnet publish --configuration Release --output ./publish
```

### 4.2 Deploy to App Service

**Option A: Azure CLI**

```bash
cd publish

# Create deployment zip
Compress-Archive -Path * -DestinationPath ../deploy.zip -Force

# Deploy to App Service
az webapp deploy \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --src-path ../deploy.zip \
  --type zip
```

**Option B: GitHub Actions (Recommended)**

Create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API to Azure

on:
  push:
    branches: [main]
    paths:
      - "ChurchRegister.ApiService/**"
      - "ChurchRegister.Database/**"

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: "9.0.x"

      - name: Build
        run: dotnet build --configuration Release

      - name: Publish
        run: dotnet publish ChurchRegister.ApiService/ChurchRegister.ApiService.csproj --configuration Release --output ./publish

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: "churchregister-api"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./publish
```

### 4.3 Verify API Deployment

```bash
# Check API health
curl https://churchregister-api.azurewebsites.net/health

# Check API endpoints
curl https://churchregister-api.azurewebsites.net/api/events
```

## Step 5: Deploy Frontend

### 5.1 Configure Static Web App

```bash
# Set environment variables
az staticwebapp appsettings set \
  --name churchregister-webapp \
  --setting-names \
    VITE_API_BASE_URL=https://churchregister-api.azurewebsites.net \
    VITE_ENABLE_ANALYTICS=true \
    VITE_ENABLE_DEVTOOLS=false \
    VITE_DEBUG_MODE=false
```

### 5.2 Build & Deploy Frontend

**Option A: Manual Deployment**

```bash
cd ChurchRegister.React

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy using Azure CLI
az staticwebapp upload \
  --name churchregister-webapp \
  --resource-group churchregister-rg \
  --source ./dist
```

**Option B: GitHub Actions (Recommended)**

Static Web Apps automatically creates a GitHub Actions workflow when created. Update `.github/workflows/azure-static-web-apps-*.yml`:

```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [main]
    paths:
      - "ChurchRegister.React/**"
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/ChurchRegister.React"
          api_location: ""
          output_location: "dist"
        env:
          VITE_API_BASE_URL: https://churchregister-api.azurewebsites.net
```

### 5.3 Configure Custom Domain

```bash
# Add custom domain
az staticwebapp hostname set \
  --name churchregister-webapp \
  --resource-group churchregister-rg \
  --hostname www.churchregister.com

# Azure will automatically provision SSL certificate
```

## Step 6: Post-Deployment Configuration

### 6.1 Configure CORS on API

Update in Azure Portal or CLI:

```bash
az webapp cors add \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --allowed-origins \
    https://churchregister.com \
    https://www.churchregister.com
```

### 6.2 Enable Logging

```bash
# Enable application logging
az webapp log config \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --application-logging filesystem \
  --level information

# Enable HTTP logging
az webapp log config \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --web-server-logging filesystem
```

### 6.3 Configure Backup

```bash
# Create storage account for backups
az storage account create \
  --name churchregisterbackup \
  --resource-group churchregister-rg \
  --location eastus \
  --sku Standard_LRS

# Configure automated backups
az webapp config backup update \
  --resource-group churchregister-rg \
  --webapp-name churchregister-api \
  --container-url "<storage-container-sas-url>" \
  --frequency 1d \
  --retain-one true \
  --retention 30
```

## Step 7: Monitoring & Alerts

### 7.1 Configure Application Insights

Already configured during deployment. View in Azure Portal:

- Navigate to Application Insights → churchregister-insights
- Review Live Metrics, Failures, Performance

### 7.2 Create Alerts

```bash
# Alert for high error rate
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group churchregister-rg \
  --scopes $(az webapp show --name churchregister-api --resource-group churchregister-rg --query id -o tsv) \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group email-admins

# Alert for high response time
az monitor metrics alert create \
  --name "Slow Response Time" \
  --resource-group churchregister-rg \
  --scopes $(az webapp show --name churchregister-api --resource-group churchregister-rg --query id -o tsv) \
  --condition "avg requests/duration > 1000" \
  --window-size 5m
```

## Step 8: Testing

### 8.1 Smoke Tests

```bash
# Test API health
curl https://churchregister-api.azurewebsites.net/health

# Test authentication
curl -X POST https://churchregister-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@churchregister.com","password":"YourPassword"}'

# Test frontend
curl https://churchregister.com
```

### 8.2 End-to-End Tests

- Navigate to https://churchregister.com
- Test login flow
- Test all major features
- Verify data loads correctly
- Check browser console for errors

## Step 9: DNS Configuration

### 9.1 Configure DNS Records

At your domain registrar (e.g., GoDaddy, Namecheap):

**For Static Web App:**

```
Type: CNAME
Name: www
Value: <static-web-app-url>.azurestaticapps.net
TTL: 3600
```

**For root domain:**

```
Type: A
Name: @
Value: <provided-by-azure-static-web-apps>
```

**For API subdomain (optional):**

```
Type: CNAME
Name: api
Value: churchregister-api.azurewebsites.net
TTL: 3600
```

## Deployment Checklist

### Pre-Deployment

- [ ] All Azure resources created
- [ ] Secrets stored in Key Vault
- [ ] Database migrated to Azure SQL
- [ ] CORS configured for production domain
- [ ] SSL certificates configured
- [ ] Application Insights connected
- [ ] Backup strategy configured
- [ ] Monitoring alerts set up

### Deployment

- [ ] Backend API deployed successfully
- [ ] Frontend deployed successfully
- [ ] Custom domains configured
- [ ] DNS records updated
- [ ] SSL certificates active

### Post-Deployment

- [ ] API health endpoint responding
- [ ] Frontend loads successfully
- [ ] Login/authentication working
- [ ] Database connectivity verified
- [ ] Email service operational
- [ ] Application Insights receiving data
- [ ] All critical features tested
- [ ] Performance acceptable
- [ ] No errors in logs

## Rollback Procedure

### If Backend Fails

```bash
# Rollback to previous deployment slot
az webapp deployment slot swap \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --slot staging \
  --target-slot production

# Or restore from backup
az webapp config backup restore \
  --resource-group churchregister-rg \
  --webapp-name churchregister-api \
  --backup-name <backup-name>
```

### If Frontend Fails

```bash
# GitHub Actions allows rolling back to previous commit
# Or manually deploy previous version
az staticwebapp upload \
  --name churchregister-webapp \
  --resource-group churchregister-rg \
  --source ./previous-build/dist
```

### If Database Fails

```bash
# Restore from automated backup
az sql db restore \
  --resource-group churchregister-rg \
  --server churchregister-sql \
  --name ChurchRegister \
  --dest-name ChurchRegisterRestored \
  --time "2024-12-24T10:00:00Z"
```

## Cost Estimation

**Monthly Costs (approximate):**

| Service                      | Tier          | Monthly Cost    |
| ---------------------------- | ------------- | --------------- |
| App Service Plan             | P1V2          | $73             |
| Azure SQL Database           | S0 (10 DTU)   | $15             |
| Static Web Apps              | Standard      | $9              |
| Azure Key Vault              | Standard      | $1              |
| Application Insights         | Basic         | $2              |
| Azure Communication Services | Pay-as-you-go | ~$5             |
| **Total**                    |               | **~$105/month** |

**Cost Optimization:**

- Use Azure Reserved Instances (save 30-60%)
- Scale down non-production environments
- Use Azure Dev/Test pricing
- Monitor and optimize database DTUs

## Support & Troubleshooting

### Common Issues

**API not starting:**

- Check Application Insights for startup errors
- Verify Key Vault access permissions
- Check connection string is correct

**Frontend can't connect to API:**

- Verify CORS configuration
- Check API URL in Static Web App settings
- Verify SSL certificates

**Database connection failures:**

- Check firewall rules allow Azure services
- Verify connection string in Key Vault
- Test with SQL Server Management Studio

### Getting Help

- Azure Support: [Azure Portal] → Support → New support request
- Application Insights: Review Failures and Performance tabs
- Logs: `az webapp log tail --name churchregister-api --resource-group churchregister-rg`

## References

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
