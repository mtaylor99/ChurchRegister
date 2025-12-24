# Azure Setup Script for ChurchRegister Deployment
# This script helps you set up Azure resources and GitHub secrets for deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "rg-church-register",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$true)]
    [string]$AppName = "church-register-app",
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo = "mtaylor99/ChurchRegister"
)

Write-Host "🚀 Setting up Azure resources for ChurchRegister deployment..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    az --version | Out-Null
} catch {
    Write-Error "❌ Azure CLI is not installed. Please install it from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
az login

# Get subscription ID
$subscriptionId = az account show --query id --output tsv
Write-Host "📋 Using subscription: $subscriptionId" -ForegroundColor Blue

# Create resource group
Write-Host "📦 Creating resource group: $ResourceGroupName..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Create service principal for GitHub Actions
Write-Host "🔑 Creating service principal for GitHub Actions..." -ForegroundColor Yellow
$servicePrincipal = az ad sp create-for-rbac --name "github-actions-$AppName" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroupName" `
    --sdk-auth

Write-Host "✅ Azure setup complete!" -ForegroundColor Green
Write-Host ""

# Display GitHub Secrets that need to be configured
Write-Host "🔧 Configure these GitHub Secrets in your repository:" -ForegroundColor Cyan
Write-Host "   Repository URL: https://github.com/$GitHubRepo/settings/secrets/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "Secret Name: AZURE_CREDENTIALS" -ForegroundColor Yellow
Write-Host "Value:" -ForegroundColor Gray
Write-Host $servicePrincipal -ForegroundColor Gray
Write-Host ""
Write-Host "Secret Name: AZURE_SUBSCRIPTION_ID" -ForegroundColor Yellow
Write-Host "Value: $subscriptionId" -ForegroundColor Gray
Write-Host ""
Write-Host "Secret Name: AZURE_RG" -ForegroundColor Yellow
Write-Host "Value: $ResourceGroupName" -ForegroundColor Gray
Write-Host ""
Write-Host "Secret Name: SQL_ADMIN_LOGIN" -ForegroundColor Yellow
Write-Host "Value: churchadmin" -ForegroundColor Gray
Write-Host ""
Write-Host "Secret Name: SQL_ADMIN_PASSWORD" -ForegroundColor Yellow
Write-Host "Value: [CREATE_A_STRONG_PASSWORD]" -ForegroundColor Red
Write-Host "   Example: ChurchR3g1st3r@2024!" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Green
Write-Host "1. Add the secrets above to your GitHub repository"
Write-Host "2. Push your code to the main branch"
Write-Host "3. GitHub Actions will automatically deploy your app"
Write-Host "4. Your app will be available at: https://$AppName-{build-number}.azurewebsites.net"
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "   Azure Portal: https://portal.azure.com"
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host ""

# Save configuration to file
$config = @{
    resourceGroup = $ResourceGroupName
    location = $Location
    appName = $AppName
    subscriptionId = $subscriptionId
    servicePrincipal = $servicePrincipal | ConvertFrom-Json
}

$config | ConvertTo-Json -Depth 10 | Out-File -FilePath "azure-config.json" -Encoding UTF8
Write-Host "💾 Configuration saved to azure-config.json" -ForegroundColor Blue