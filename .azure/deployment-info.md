# 🚀 ChurchRegister Azure Deployment

## 📋 Quick Start Checklist

### Prerequisites Setup

- [ ] Create Azure free account
- [ ] Install Azure CLI
- [ ] Fork/clone repository to your GitHub

### Azure Configuration

- [ ] Run `setup-azure.ps1` script
- [ ] Copy service principal JSON output
- [ ] Note your subscription ID

### GitHub Secrets Configuration

Navigate to: `https://github.com/YOUR_USERNAME/ChurchRegister/settings/secrets/actions`

Add these secrets:

- [ ] `AZURE_CREDENTIALS` - Service principal JSON
- [ ] `AZURE_SUBSCRIPTION_ID` - Your Azure subscription ID
- [ ] `AZURE_RG` - Resource group name (e.g., "rg-church-register")
- [ ] `SQL_ADMIN_LOGIN` - SQL admin username (e.g., "churchadmin")
- [ ] `SQL_ADMIN_PASSWORD` - Strong password for SQL server

### Deployment

- [ ] Push code to `main` branch
- [ ] Check GitHub Actions tab for build progress
- [ ] Access deployed app at generated URL

## 🔗 Important URLs

After deployment, you'll have access to:

| Service                  | URL Pattern                                                    | Purpose                 |
| ------------------------ | -------------------------------------------------------------- | ----------------------- |
| **Web App**              | `https://church-register-api-{BUILD_NUMBER}.azurewebsites.net` | Your application        |
| **Azure Portal**         | `https://portal.azure.com`                                     | Manage Azure resources  |
| **Application Insights** | Azure Portal → Application Insights                            | Monitor app performance |
| **SQL Database**         | Azure Portal → SQL databases                                   | Manage database         |

## 💰 Free Tier Limitations

**Azure App Service (F1 Free):**

- ✅ FREE forever
- ⚠️ 60 minutes compute time per day
- ⚠️ 1GB memory, 1GB storage
- ⚠️ No custom domains
- ✅ HTTPS on \*.azurewebsites.net

**Azure SQL Database Serverless:**

- ✅ **FREE** (100,000 vCore seconds/month + 32GB storage)
- ✅ **Auto-pause** when not in use (saves money)
- ✅ **Auto-scale** from 0.5 to 1 vCore based on demand
- ✅ **32GB storage** included
- ✅ **Perfect for church applications** (intermittent usage patterns)

**Application Insights:**

- ✅ FREE (1GB data/month)
- ✅ Full monitoring and analytics

## 🏛️ Why Serverless is Perfect for Churches

**Church Usage Patterns:**

- 📅 **Peak usage**: Sunday mornings, Wednesday evenings
- 😴 **Quiet periods**: Weekdays, late nights, holidays
- 👥 **User count**: Typically 50-500 concurrent users during peak times

**Serverless Benefits:**

- 💤 **Auto-pause**: Database automatically pauses during quiet periods (saves money)
- ⚡ **Auto-resume**: Instantly wakes up when someone accesses the app (1-2 second delay)
- 📈 **Auto-scale**: Scales from 0.5 to 1 vCore based on demand
- 💰 **Pay only for usage**: No charges when database is paused

**Real-world example:**

- Sunday morning: Database scales up for 500 users
- Monday-Friday quiet: Database auto-pauses (no charges)
- Wednesday evening: Auto-resumes for prayer meeting registration

## 🔧 Troubleshooting

### Common Issues:

**Build Fails:**

```bash
# Check build logs in GitHub Actions
# Common fixes:
- Ensure package-lock.json is committed
- Check .NET version matches (8.0.x)
- Verify all dependencies are restored
```

**App Won't Start:**

```bash
# Check logs in Azure Portal
az webapp log tail --name YOUR_APP_NAME --resource-group rg-church-register

# Common fixes:
- Check connection strings
- Verify environment variables
- Check Application Insights configuration
```

**Database Connection Issues:**

```bash
# Verify SQL firewall rules
# Check connection string format
# Ensure Azure services are allowed
```

**React App Not Loading:**

```bash
# Verify build output is in wwwroot
# Check fallback routing is configured
# Ensure static files middleware is enabled
```

## 📈 Scaling Options

If you need more resources (unlikely for most churches):

1. **App Service**: Upgrade to Basic (B1) - ~$13/month (more memory/storage)
2. **SQL Database**: Increase vCore limit or switch to Provisioned - varies by usage
3. **Application Insights**: Pay-as-you-go beyond 1GB - ~$2.30/GB

**Note**: With serverless, most churches will stay within free limits indefinitely!

## 🚨 Production Considerations

Before going live:

- [ ] Use Azure Key Vault for secrets
- [ ] Configure custom domain and SSL
- [ ] Set up backup strategies
- [ ] Configure alerts and monitoring
- [ ] Implement proper authentication/authorization
- [ ] Add data protection and GDPR compliance
- [ ] Set up CI/CD staging environment

## 📞 Support Resources

- **Azure Free Support**: Available in Azure Portal
- **GitHub Actions**: [GitHub Community](https://github.community/)
- **ASP.NET Core**: [Microsoft Docs](https://docs.microsoft.com/aspnet/core/)
- **React**: [React Documentation](https://reactjs.org/docs/)

---

**💡 Tip**: Keep your Azure free credits by monitoring usage in the Azure Portal cost management section!
