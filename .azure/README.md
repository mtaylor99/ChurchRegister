# Azure Deployment Setup (Free Tier)

This guide will help you deploy your ChurchRegister Aspire.NET application to Azure using **free tier services**.

## 🆓 Azure Free Services Used

- **Azure App Service** (F1 Free tier - free forever)
- **Azure SQL Database Serverless** (100,000 vCore seconds/month + 32GB storage - FREE with Azure free account)
- **Application Insights** (Free tier - 1GB/month)

## 📋 Prerequisites

1. **Azure Account**: Create a free Azure account at [azure.microsoft.com](https://azure.microsoft.com/free/)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Azure CLI**: Install from [docs.microsoft.com](https://docs.microsoft.com/cli/azure/install-azure-cli)

## 🔧 Setup Instructions

### Step 1: Create Azure Service Principal

Run these commands in Azure CLI (replace placeholders with your values):

```bash
# Login to Azure
az login

# Create a resource group
az group create --name "rg-church-register" --location "East US"

# Create service principal for GitHub Actions
az ad sp create-for-rbac --name "github-actions-church-register" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-church-register \
  --sdk-auth

# Note: Save the output JSON for GitHub secrets
```

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name             | Value                                                                             | Description                                 |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `AZURE_CREDENTIALS`     | `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}` | Output from service principal creation      |
| `AZURE_SUBSCRIPTION_ID` | `your-subscription-id`                                                            | Your Azure subscription ID                  |
| `AZURE_RG`              | `rg-church-register`                                                              | Resource group name                         |
| `SQL_ADMIN_LOGIN`       | `churchadmin`                                                                     | SQL Server admin username                   |
| `SQL_ADMIN_PASSWORD`    | `YourStrongP@ssw0rd!`                                                             | SQL Server admin password (must be complex) |

### Step 3: Get Your Subscription ID

```bash
# Get your subscription ID
az account show --query id --output tsv
```

### Step 4: Deploy

1. Push your code to the `main` branch
2. GitHub Actions will automatically:
   - Build your .NET application
   - Build your React frontend
   - Run tests
   - Deploy infrastructure to Azure
   - Deploy your application

## 🌐 Access Your Application

After deployment, your application will be available at:

```
https://church-register-api-[BUILD_NUMBER].azurewebsites.net
```

## 💰 Cost Estimation

**With Azure Free Account:**

- App Service F1: **FREE** (forever)
- SQL Database Serverless: **FREE** (100,000 vCore seconds/month + 32GB storage)
- Application Insights: **FREE** (1GB included)

**Total: $0/month for typical church usage!** 🎉

**If you exceed free limits:**

- App Service F1: **Still FREE** (no usage limits)
- SQL Database Serverless: **Pay-per-use** (~$0.52/vCore-hour only when active)
- Application Insights: **FREE** (1GB included)

**Estimated cost even with heavy usage: $5-10/month**

## 🔍 Monitoring

Access your application monitoring through:

- **Azure Portal**: Application Insights dashboard
- **Live Metrics**: Real-time performance monitoring
- **Logs**: Application logs and traces

## 🚨 Important Notes

1. **F1 App Service limitations**:

   - 60 minutes of compute time per day
   - 1GB memory
   - 1GB storage
   - No custom domains (but free subdomain)
   - No SSL certificates (but HTTPS is available on \*.azurewebsites.net)

2. **SQL Database Basic limitations**:

   - 2GB storage
   - 5 DTU (Database Transaction Units)
   - Suitable for light workloads

3. **Scaling**: If you need more resources later, you can upgrade to paid tiers through the Azure portal.

## 🛠️ Troubleshooting

### Common Issues:

1. **Build fails**: Check that all NuGet packages are restored
2. **SQL connection fails**: Verify firewall rules allow Azure services
3. **React app not loading**: Ensure the build output is correctly copied to wwwroot

### Logs:

```bash
# View App Service logs
az webapp log tail --name YOUR_APP_NAME --resource-group rg-church-register
```

## 🔄 Manual Deployment Alternative

If you prefer manual deployment:

```bash
# Build and publish locally
dotnet publish ChurchRegister.ApiService/ChurchRegister.ApiService.csproj -c Release -o ./publish

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group rg-church-register \
  --name YOUR_APP_NAME \
  --src ./publish.zip
```

## 📞 Support

- **Azure Support**: [Azure free support](https://azure.microsoft.com/support/plans/)
- **GitHub Actions**: [GitHub Actions documentation](https://docs.github.com/actions)
- **Aspire.NET**: [Aspire documentation](https://docs.microsoft.com/aspnet/core/aspire)
