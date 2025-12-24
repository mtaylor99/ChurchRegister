# Production Deployment Checklist

## Overview

This checklist ensures all necessary steps are completed before deploying the Church Register application to production.

**Date:** **\*\***\_\_\_**\*\***  
**Deployment Version:** **\*\***\_\_\_**\*\***  
**Deployed By:** **\*\***\_\_\_**\*\***  
**Approved By:** **\*\***\_\_\_**\*\***

---

## Pre-Deployment Checklist

### 1. Code Quality & Testing

- [ ] All backend unit tests passing (59/59 tests)

  ```bash
  dotnet test --configuration Release
  ```

  **Status:** ✅ Passed - 0 Failed, 59 Passed

- [ ] All frontend unit tests passing

  ```bash
  cd ChurchRegister.React && npm run test
  ```

- [ ] Backend builds without errors in Release mode

  ```bash
  dotnet build --configuration Release
  ```

  **Status:** ✅ Build succeeded (40 warnings in test files - acceptable)

- [ ] Frontend builds without errors for production

  ```bash
  cd ChurchRegister.React && npm run build
  ```

- [ ] Code coverage meets minimum threshold
  - Backend: Run `dotnet test --collect:"XPlat Code Coverage"`
  - Frontend: Run `npm run test:coverage`

### 2. Security Review

- [ ] All endpoints properly authorized (no unauthorized anonymous access)
      **Status:** ✅ Verified - Only login and refresh endpoints allow anonymous

- [ ] JWT token expiration configured correctly

  - Access token: 720 minutes (12 hours) ✅
  - Refresh token: 7 days ✅

- [ ] Refresh token rotation implemented ✅

- [ ] CORS restricted to production domains ✅

  - Development: localhost:3000-3005
  - Production: Configured from CORS:AllowedOrigins

- [ ] Sensitive data not logged ✅

  - No password/token logging verified
  - Logger respects environment (production-safe)

- [ ] XSS protection verified ✅

  - React automatic escaping
  - CSP headers configured
  - No dangerouslySetInnerHTML usage

- [ ] Security scans completed

  ```bash
  dotnet list package --vulnerable
  npm audit
  ```

  **Status:** ✅ No vulnerable packages found

- [ ] Rate limiting implemented on auth endpoints
      **Status:** 📋 Pending - Documented for implementation

### 3. Configuration Management

- [ ] All secrets removed from repository ✅

  - appsettings.json cleaned
  - No hardcoded connection strings
  - No JWT keys in source code

- [ ] Azure Key Vault configured ✅

  - Key Vault created
  - Secrets stored: Jwt--Key, ConnectionStrings--DefaultConnection, AzureEmailService--ConnectionString
  - Access policies configured

- [ ] Environment-specific configuration files created ✅

  - appsettings.Development.json
  - appsettings.Production.json
  - .env.development
  - .env.production

- [ ] Production environment variables documented ✅
  - See: docs/environment-variables.md
  - All required variables listed

### 4. Database

- [ ] Database backup taken before migration

  ```bash
  # Azure SQL: Automatic backups enabled
  az sql db show --name ChurchRegister --resource-group churchregister-rg --server churchregister-sql --query "maxSizeBytes"
  ```

- [ ] Migrations tested on staging environment

  ```bash
  dotnet ef database update --connection "Server=...;Database=ChurchRegister_Staging;..."
  ```

- [ ] Production database connection string in Key Vault

  - Format: `Server=tcp:churchregister-sql.database.windows.net,1433;Database=ChurchRegister;...`

- [ ] Database user permissions reviewed

  - Application account has minimum required privileges
  - Separate migration account for schema changes

- [ ] Database firewall rules configured
  - Azure services allowed
  - Known IP addresses whitelisted

### 5. Azure Resources

- [ ] Resource Group created

  ```bash
  az group create --name churchregister-rg --location eastus
  ```

- [ ] Azure SQL Database provisioned

  - Tier: S0 (10 DTU) or higher
  - Backup retention: 30 days minimum

- [ ] App Service Plan created

  - Tier: P1V2 or higher
  - OS: Linux

- [ ] App Service (API) created and configured

  - Runtime: .NET 10.0
  - Managed Identity enabled
  - Key Vault access granted

- [ ] Static Web App created

  - Tier: Standard
  - Custom domain configured

- [ ] Azure Communication Services configured

  - Email domain verified
  - Connection string in Key Vault

- [ ] Application Insights enabled

  - Instrumentation key configured
  - Logs flowing to workspace

- [ ] Azure Key Vault created
  - Soft delete enabled
  - Managed Identity access configured

### 6. Application Configuration

- [ ] Backend API settings configured in Azure

  ```bash
  az webapp config appsettings set --name churchregister-api --resource-group churchregister-rg --settings \
    KeyVault__Endpoint="https://churchregister-kv.vault.azure.net/" \
    CORS__AllowedOrigins="https://churchregister.com,https://www.churchregister.com"
  ```

- [ ] Frontend environment variables configured

  ```bash
  az staticwebapp appsettings set --name churchregister-webapp --setting-names \
    VITE_API_BASE_URL=https://churchregister-api.azurewebsites.net \
    VITE_ENABLE_ANALYTICS=true \
    VITE_DEBUG_MODE=false
  ```

- [ ] HTTPS enforced

  - Backend: HSTS enabled, HTTPS redirect enabled
  - Frontend: Azure Static Web Apps automatic HTTPS

- [ ] Custom domains configured
  - churchregister.com → Static Web App
  - api.churchregister.com → App Service (optional)
  - SSL certificates provisioned

### 7. Monitoring & Logging

- [ ] Application Insights configured

  - Backend: Connection string in appsettings
  - Frontend: Sentry DSN configured (optional)

- [ ] Log levels configured appropriately

  - Default: Information
  - Microsoft.AspNetCore: Warning
  - Microsoft.EntityFrameworkCore: Warning

- [ ] Alerts configured

  - High error rate (>10 failures in 5 minutes)
  - Slow response time (>1000ms average)
  - Database DTU usage (>80%)
  - Application downtime

- [ ] Backup strategy configured
  - Database: Automated daily backups (30 day retention)
  - App Service: Configuration backup to storage account
  - Static Web App: GitHub repository backup

### 8. DNS Configuration

- [ ] DNS records created at registrar

  - Type: CNAME, Name: www, Value: [static-web-app-url].azurestaticapps.net
  - Type: A, Name: @, Value: [provided-by-azure]
  - TTL: 3600

- [ ] DNS propagation verified

  ```bash
  nslookup churchregister.com
  nslookup www.churchregister.com
  ```

- [ ] SSL certificates active and valid
  - Expiration date: **\*\***\_\_\_**\*\***
  - Auto-renewal enabled

### 9. Deployment

- [ ] GitHub Actions workflows configured

  - Backend: .github/workflows/deploy-api.yml
  - Frontend: .github/workflows/azure-static-web-apps-\*.yml

- [ ] Deployment secrets configured in GitHub

  - AZURE_WEBAPP_PUBLISH_PROFILE
  - AZURE_STATIC_WEB_APPS_API_TOKEN

- [ ] Backend deployed successfully

  ```bash
  az webapp deployment list-publishing-profiles --name churchregister-api --resource-group churchregister-rg
  ```

- [ ] Frontend deployed successfully

  ```bash
  az staticwebapp show --name churchregister-webapp --resource-group churchregister-rg --query "defaultHostname"
  ```

- [ ] Database migrations executed on production
  ```bash
  dotnet ef database update --connection "[production-connection-string]"
  ```

### 10. Post-Deployment Verification

- [ ] API health endpoint responding

  ```bash
  curl https://churchregister-api.azurewebsites.net/health
  ```

- [ ] Frontend loads successfully

  ```bash
  curl https://churchregister.com
  ```

- [ ] Login flow working

  - Navigate to https://churchregister.com/login
  - Test with: admin@churchregister.com
  - Verify JWT token issued

- [ ] Database connectivity verified

  - Check Application Insights for database queries
  - Verify no connection errors in logs

- [ ] Email service operational

  - Test email sending from admin panel
  - Verify Azure Communication Services logs

- [ ] All critical features tested

  - [ ] User login/logout
  - [ ] Dashboard loads with data
  - [ ] Church members list loads
  - [ ] Contributions page loads
  - [ ] Attendance tracking works
  - [ ] Admin panel accessible (SystemAdministration role)

- [ ] Performance acceptable

  - Page load time < 3 seconds
  - API response time < 500ms (average)
  - No memory leaks observed

- [ ] No errors in Application Insights

  - Check last 15 minutes of logs
  - Verify no exceptions logged

- [ ] Browser console clean (no JavaScript errors)
  - Test in Chrome, Firefox, Edge
  - Check for console errors or warnings

### 11. Documentation

- [ ] Production deployment documented

  - See: docs/azure-deployment-guide.md ✅
  - Actual deployment steps recorded

- [ ] Environment variables documented

  - See: docs/environment-variables.md ✅

- [ ] Security configuration documented

  - See: docs/security-configuration.md ✅

- [ ] Routing conventions documented

  - See: docs/routing-navigation-conventions.md ✅

- [ ] Rollback procedure documented

  - See: docs/azure-deployment-guide.md (Rollback Procedure section) ✅

- [ ] Support contacts updated
  - Security team email
  - DBA contact
  - Azure support escalation path

### 12. Communication

- [ ] Stakeholders notified of deployment window

  - Deployment start time: **\*\***\_\_\_**\*\***
  - Expected duration: **\*\***\_\_\_**\*\***
  - Maintenance window: **\*\***\_\_\_**\*\***

- [ ] Users notified (if downtime expected)

  - Email sent: **\*\***\_\_\_**\*\***
  - In-app notification displayed: **\*\***\_\_\_**\*\***

- [ ] Support team briefed
  - Known issues communicated
  - Escalation procedures reviewed

---

## Deployment Execution

### Step 1: Pre-Deployment

**Time:** **\*\***\_\_\_**\*\***

- [ ] Create production database backup
- [ ] Tag release in Git: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Enable maintenance mode (if applicable)

### Step 2: Database Migration

**Time:** **\*\***\_\_\_**\*\***

- [ ] Run migrations on production database
  ```bash
  dotnet ef database update --connection "[production-connection]"
  ```
- [ ] Verify migration success
- [ ] Check database schema

### Step 3: Backend Deployment

**Time:** **\*\***\_\_\_**\*\***

- [ ] Deploy API to Azure App Service
  - Trigger GitHub Action or manual deployment
- [ ] Wait for deployment completion
- [ ] Verify API health endpoint
- [ ] Check Application Insights for startup errors

### Step 4: Frontend Deployment

**Time:** **\*\***\_\_\_**\*\***

- [ ] Deploy frontend to Static Web App
  - Trigger GitHub Action or manual deployment
- [ ] Wait for deployment completion
- [ ] Verify frontend loads
- [ ] Test critical user flows

### Step 5: Post-Deployment

**Time:** **\*\***\_\_\_**\*\***

- [ ] Run smoke tests (see section 10 above)
- [ ] Monitor Application Insights for 15 minutes
- [ ] Disable maintenance mode
- [ ] Notify stakeholders of successful deployment

---

## Rollback Procedure

**If deployment fails, execute rollback:**

### Database Rollback

```bash
# Restore from automated backup
az sql db restore \
  --resource-group churchregister-rg \
  --server churchregister-sql \
  --name ChurchRegister \
  --dest-name ChurchRegisterRestored \
  --time "2024-12-24T10:00:00Z"
```

### Backend Rollback

```bash
# Revert to previous deployment slot
az webapp deployment slot swap \
  --name churchregister-api \
  --resource-group churchregister-rg \
  --slot staging \
  --target-slot production
```

### Frontend Rollback

- Revert to previous Git commit
- Trigger GitHub Action deployment
- Or use Static Web App deployment history in Azure Portal

---

## Post-Deployment Monitoring

**Monitor for first 24 hours:**

- [ ] Application Insights metrics reviewed every 4 hours
- [ ] Error rate < 1%
- [ ] Average response time < 500ms
- [ ] No critical alerts triggered
- [ ] User feedback positive
- [ ] No security incidents

**Day 1 Checklist:**

- [ ] Morning review (8 AM): **\*\***\_\_\_**\*\***
- [ ] Midday review (12 PM): **\*\***\_\_\_**\*\***
- [ ] Afternoon review (4 PM): **\*\***\_\_\_**\*\***
- [ ] Evening review (8 PM): **\*\***\_\_\_**\*\***

---

## Sign-Off

### Pre-Deployment Approval

**Development Team Lead:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

**QA Lead:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

**Security Officer:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

### Post-Deployment Verification

**Deployment Engineer:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

**Operations Manager:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

**Project Manager:**  
Signature: **\*\***\_\_\_**\*\*** Date: **\*\***\_\_\_**\*\***

---

## Known Issues & Limitations

| Issue                                              | Severity | Workaround                     | Resolution                              |
| -------------------------------------------------- | -------- | ------------------------------ | --------------------------------------- |
| Rate limiting not implemented                      | Medium   | Monitor auth failures manually | TASK-166: Implement AspNetCoreRateLimit |
| 40 nullable warnings in test files                 | Low      | Does not affect production     | Future: Fix nullable annotations        |
| TODO: HttpContext in ContributionProcessingService | Low      | Uses "System" as default       | Future: Extract from claims             |
| TODO: Request cancellation in authService          | Low      | N/A                            | Future: Implement AbortController       |

---

## Emergency Contacts

**On-Call Engineer:** **\*\***\_\_\_**\*\***  
**Phone:** **\*\***\_\_\_**\*\***  
**Email:** **\*\***\_\_\_**\*\***

**Database Administrator:** **\*\***\_\_\_**\*\***  
**Phone:** **\*\***\_\_\_**\*\***  
**Email:** **\*\***\_\_\_**\*\***

**Azure Support:** [Azure Portal] → Support → New support request  
**Subscription ID:** **\*\***\_\_\_**\*\***

**Security Incident:** security@churchregister.com

---

## Appendix

### Useful Commands

**Check deployment status:**

```bash
az webapp show --name churchregister-api --resource-group churchregister-rg --query "state"
```

**Stream application logs:**

```bash
az webapp log tail --name churchregister-api --resource-group churchregister-rg
```

**View recent deployments:**

```bash
az webapp deployment list --name churchregister-api --resource-group churchregister-rg
```

**Check database status:**

```bash
az sql db show --name ChurchRegister --resource-group churchregister-rg --server churchregister-sql
```

### Reference Documents

- [Azure Deployment Guide](./azure-deployment-guide.md)
- [Environment Variables Guide](./environment-variables.md)
- [Security Configuration](./security-configuration.md)
- [Routing Conventions](./routing-navigation-conventions.md)
- [Error Handling Patterns](./error-handling-patterns.md)
- [Local Development Setup](./local-development-setup.md)

---

**Deployment Completed:** **\*\***\_\_\_**\*\***  
**Production URL:** https://churchregister.com  
**API URL:** https://churchregister-api.azurewebsites.net  
**Version:** v1.0.0
