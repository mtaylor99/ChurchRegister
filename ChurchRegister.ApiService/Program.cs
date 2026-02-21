using ChurchRegister.ApiService.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interceptors;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FastEndpoints;
using Azure.Identity;
using ChurchRegister.ApiService.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Azure Key Vault configuration for production
if (builder.Environment.IsProduction())
{
    var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];
    if (!string.IsNullOrEmpty(keyVaultEndpoint))
    {
        builder.Configuration.AddAzureKeyVault(
            new Uri(keyVaultEndpoint),
            new DefaultAzureCredential());
    }
}

// Validate required configuration
ValidateConfiguration(builder.Configuration);

// Get connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? builder.Configuration.GetConnectionString("ChurchRegisterDatabaseContextConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'ChurchRegisterDatabaseContextConnection' not found.");

// Register the AuditInterceptor
builder.Services.AddScoped<AuditInterceptor>();

// Add DbContext with Identity
builder.Services.AddDbContext<ChurchRegisterWebContext>((serviceProvider, options) => 
{
    var auditInterceptor = serviceProvider.GetRequiredService<AuditInterceptor>();
    options.UseSqlServer(connectionString)
           .AddInterceptors(auditInterceptor);
});

builder.AddServiceDefaults();
builder.Services.AddProblemDetails();

// Add FastEndpoints
builder.Services.AddFastEndpoints();

// Configure form options for file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Add Antiforgery protection
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false; // Allow JavaScript to read for SPA
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Add CORS for React development and production
builder.Services.AddCors(options =>
{
    // Development CORS policy - allow localhost
    options.AddPolicy("ReactDevelopment", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
    
    // Production CORS policy - restrict to specific domain
    options.AddPolicy("ReactProduction", policy =>
    {
        var allowedOrigins = builder.Configuration["CORS:AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries)
            ?? new[] { "https://your-production-domain.com" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

// Add Identity services with JWT support
builder.Services.AddIdentity<ChurchRegisterWebUser, IdentityRole>(options => 
    {
        options.SignIn.RequireConfirmedAccount = false; // Allow login without email confirmation for API
        
        // Password requirements
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 12; // Increased from 6 to 12
        options.Password.RequireNonAlphanumeric = true; // Changed from false to true
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        
        // Account lockout settings
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<ChurchRegisterWebContext>()
    .AddDefaultTokenProviders();

// Configure Identity to not redirect API calls to login page
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

// Add JWT Bearer authentication for React app
builder.Services.AddAuthentication()
    .AddJwtBearer("Bearer", options =>
    {
        // JWT Configuration
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "ChurchRegister-Super-Secret-Key-For-Development-Only-2024!");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ChurchRegister.ApiService",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ChurchRegister.React",
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 minutes clock skew tolerance
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Bearer", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
    });
    
    // Attendance policies that allow either specific permissions OR SystemAdministration role
    options.AddPolicy("AttendanceViewPolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "Attendance.View") ||
            context.User.IsInRole("SystemAdministration"));
    });
    
    options.AddPolicy("AttendanceRecordPolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "Attendance.Record") ||
            context.User.IsInRole("SystemAdministration"));
    });
    
    options.AddPolicy("AttendanceAnalyticsPolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "Attendance.ViewAnalytics") ||
            context.User.IsInRole("SystemAdministration"));
    });
    
    options.AddPolicy("AttendanceSharePolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "Attendance.ShareAnalytics") ||
            context.User.IsInRole("SystemAdministration"));
    });
    
    // Event management policies that allow either specific permissions OR SystemAdministration role
    options.AddPolicy("EventCreatePolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "EventManagement.Create") ||
            context.User.IsInRole("SystemAdministration"));
    });
    
    options.AddPolicy("EventUpdatePolicy", policy =>
    {
        policy.AddAuthenticationSchemes("Bearer");
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.HasClaim("permission", "EventManagement.Update") ||
            context.User.IsInRole("SystemAdministration"));
    });
});

// Register Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.Login.ILoginUseCase, 
                           ChurchRegister.ApiService.UseCase.Authentication.Login.LoginUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.Logout.ILogoutUseCase, 
                           ChurchRegister.ApiService.UseCase.Authentication.Logout.LogoutUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser.IGetCurrentUserUseCase, 
                           ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser.GetCurrentUserUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.ChangePassword.IChangePasswordUseCase,
                           ChurchRegister.ApiService.UseCase.Authentication.ChangePassword.ChangePasswordUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.UpdateProfile.IUpdateProfileUseCase,
                           ChurchRegister.ApiService.UseCase.Authentication.UpdateProfile.UpdateProfileUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Authentication.RefreshToken.IRefreshTokenUseCase,
                           ChurchRegister.ApiService.UseCase.Authentication.RefreshToken.RefreshTokenUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens.IRevokeUserTokensUseCase,
                           ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens.RevokeUserTokensUseCase>();

// Security Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.CreateUser.ICreateUserUseCase,
                           ChurchRegister.ApiService.UseCase.Security.CreateUser.CreateUserUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.GetUsers.IGetUsersUseCase,
                           ChurchRegister.ApiService.UseCase.Security.GetUsers.GetUsersUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.UpdateUser.IUpdateUserUseCase,
                           ChurchRegister.ApiService.UseCase.Security.UpdateUser.UpdateUserUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus.IUpdateUserStatusUseCase,
                           ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus.UpdateUserStatusUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.GetSystemRoles.IGetSystemRolesUseCase,
                           ChurchRegister.ApiService.UseCase.Security.GetSystemRoles.GetSystemRolesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Security.ResendInvitation.IResendInvitationUseCase,
                           ChurchRegister.ApiService.UseCase.Security.ResendInvitation.ResendInvitationUseCase>();

// ChurchMembers Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember.ICreateChurchMemberUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember.CreateChurchMemberUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember.IUpdateChurchMemberUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember.UpdateChurchMemberUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus.IUpdateChurchMemberStatusUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus.UpdateChurchMemberStatusUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers.IGetChurchMembersUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers.GetChurchMembersUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById.IGetChurchMemberByIdUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById.GetChurchMemberByIdUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles.IGetChurchMemberRolesUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles.GetChurchMemberRolesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses.IGetChurchMemberStatusesUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses.GetChurchMemberStatusesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.GenerateRegisterNumbers.IGenerateRegisterNumbersUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.GenerateRegisterNumbers.GenerateRegisterNumbersUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers.IPreviewRegisterNumbersUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers.PreviewRegisterNumbersUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.IAssignDistrictUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrictUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport.IExportPastoralCareReportUseCase,
                           ChurchRegister.ApiService.UseCase.ChurchMembers.ExportPastoralCareReport.ExportPastoralCareReportUseCase>();

// DataProtection Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.DataProtection.IGetDataProtectionUseCase,
                           ChurchRegister.ApiService.UseCase.DataProtection.GetDataProtectionUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.DataProtection.IUpdateDataProtectionUseCase,
                           ChurchRegister.ApiService.UseCase.DataProtection.UpdateDataProtectionUseCase>();

// Districts Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Districts.IGetDistrictsUseCase,
                           ChurchRegister.ApiService.UseCase.Districts.GetDistrictsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Districts.IExportDistrictsUseCase,
                           ChurchRegister.ApiService.UseCase.Districts.ExportDistrictsUseCase>();

// Contributions Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement.IUploadHsbcStatementUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement.UploadHsbcStatementUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory.IGetContributionHistoryUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory.GetContributionHistoryUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.SubmitEnvelopeBatch.ISubmitEnvelopeBatchUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.SubmitEnvelopeBatch.SubmitEnvelopeBatchUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList.IGetEnvelopeBatchListUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList.GetEnvelopeBatchListUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails.IGetEnvelopeBatchDetailsUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails.GetEnvelopeBatchDetailsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber.IValidateRegisterNumberUseCase,
                           ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber.ValidateRegisterNumberUseCase>();

// Attendance Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.GetAttendance.IGetAttendanceUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.GetAttendance.GetAttendanceUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance.ICreateAttendanceUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance.CreateAttendanceUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance.IUpdateAttendanceUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance.UpdateAttendanceUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance.IDeleteAttendanceUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance.DeleteAttendanceUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics.IGetAttendanceAnalyticsUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics.GetAttendanceAnalyticsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.GetEvents.IGetEventsUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.GetEvents.GetEventsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.CreateEvent.ICreateEventUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.CreateEvent.CreateEventUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent.IUpdateEventUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent.UpdateEventUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.EmailAttendanceAnalytics.IEmailAttendanceAnalyticsUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.EmailAttendanceAnalytics.EmailAttendanceAnalyticsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Attendance.UploadAttendanceTemplate.IUploadAttendanceTemplateUseCase,
                           ChurchRegister.ApiService.UseCase.Attendance.UploadAttendanceTemplate.UploadAttendanceTemplateUseCase>();

// Attendance Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Attendance.IExcelParserService,
                           ChurchRegister.ApiService.Services.Attendance.ExcelParserService>();

// Training Certificates Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates.IGetTrainingCertificatesUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates.GetTrainingCertificatesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById.IGetTrainingCertificateByIdUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById.GetTrainingCertificateByIdUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate.ICreateTrainingCertificateUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate.CreateTrainingCertificateUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate.IUpdateTrainingCertificateUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate.UpdateTrainingCertificateUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes.IGetTrainingCertificateTypesUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes.GetTrainingCertificateTypesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType.ICreateTrainingCertificateTypeUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType.CreateTrainingCertificateTypeUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType.IUpdateTrainingCertificateTypeUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType.UpdateTrainingCertificateTypeUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary.IGetDashboardTrainingSummaryUseCase,
                           ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary.GetDashboardTrainingSummaryUseCase>();

// Reminders Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IGetReminderCategoriesUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategoriesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IGetReminderCategoryByIdUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategoryByIdUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.ICreateReminderCategoryUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.CreateReminderCategoryUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IUpdateReminderCategoryUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.UpdateReminderCategoryUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IDeleteReminderCategoryUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.DeleteReminderCategoryUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IGetRemindersUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.GetRemindersUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IGetReminderByIdUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.GetReminderByIdUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.ICreateReminderUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.CreateReminderUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IUpdateReminderUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.UpdateReminderUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.ICompleteReminderUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.CompleteReminderUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IDeleteReminderUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.DeleteReminderUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Reminders.IGetDashboardReminderSummaryUseCase,
                           ChurchRegister.ApiService.UseCase.Reminders.GetDashboardReminderSummaryUseCase>();

// Dashboard Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics.IGetDashboardStatisticsUseCase,
                           ChurchRegister.ApiService.UseCase.Dashboard.GetDashboardStatistics.GetDashboardStatisticsUseCase>();

// Risk Assessment Use Cases
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IGetRiskAssessmentsUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentsUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IGetRiskAssessmentByIdUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentByIdUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IUpdateRiskAssessmentUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.UpdateRiskAssessmentUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IStartReviewUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.StartReviewUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IApproveRiskAssessmentUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.ApproveRiskAssessmentUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IGetDashboardRiskAssessmentSummaryUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.GetDashboardRiskAssessmentSummaryUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.IGetRiskAssessmentCategoriesUseCase,
                           ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentCategoriesUseCase>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentHistoryUseCase>();

// Register Repositories
builder.Services.AddScoped<ChurchRegister.Database.Interfaces.IRefreshTokenRepository,
                           ChurchRegister.Database.Data.RefreshTokenRepository>();

// Register Azure Email Service
builder.Services.Configure<ChurchRegister.ApiService.Configuration.AzureEmailServiceConfiguration>(
    builder.Configuration.GetSection(ChurchRegister.ApiService.Configuration.AzureEmailServiceConfiguration.SectionName));
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Security.IAzureEmailService, 
                           ChurchRegister.ApiService.Services.Security.AzureEmailService>();

// Configure RiskAssessment settings
builder.Services.Configure<ChurchRegister.ApiService.Configuration.RiskAssessmentConfiguration>(
    builder.Configuration.GetSection(ChurchRegister.ApiService.Configuration.RiskAssessmentConfiguration.SectionName));

// Register User Management Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Security.IUserManagementService,
                           ChurchRegister.ApiService.Services.Security.UserManagementService>();

// Register Church Member Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.ChurchMembers.IChurchMemberService,
                           ChurchRegister.ApiService.Services.ChurchMembers.ChurchMemberService>();

// Register Data Protection Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.DataProtection.IDataProtectionService,
                           ChurchRegister.ApiService.Services.DataProtection.DataProtectionService>();

// Register District Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Districts.IDistrictService,
                           ChurchRegister.ApiService.Services.Districts.DistrictService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Districts.DistrictPdfService>();

// Register Pastoral Care PDF Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.PastoralCare.IPastoralCarePdfService,
                           ChurchRegister.ApiService.Services.PastoralCare.PastoralCarePdfService>();

// Register HSBC Import Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Contributions.IHsbcCsvParser,
                           ChurchRegister.ApiService.Services.Contributions.HsbcCsvParser>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Contributions.IHsbcTransactionImportService,
                           ChurchRegister.ApiService.Services.Contributions.HsbcTransactionImportService>();

// Register Contribution Processing Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Contributions.IContributionProcessingService,
                           ChurchRegister.ApiService.Services.Contributions.ContributionProcessingService>();

// Register Envelope Contribution Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.ChurchMembers.IRegisterNumberService,
                           ChurchRegister.ApiService.Services.ChurchMembers.RegisterNumberService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Contributions.IEnvelopeContributionService,
                           ChurchRegister.ApiService.Services.Contributions.EnvelopeContributionService>();

// Register Training Certificate Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.TrainingCertificates.ITrainingCertificateService,
                           ChurchRegister.ApiService.Services.TrainingCertificates.TrainingCertificateService>();

// Register Reminder Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Reminders.IReminderCategoryService,
                           ChurchRegister.ApiService.Services.Reminders.ReminderCategoryService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Reminders.IReminderService,
                           ChurchRegister.ApiService.Services.Reminders.ReminderService>();

// Register Risk Assessment Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.RiskAssessments.IRiskAssessmentCategoryService,
                           ChurchRegister.ApiService.Services.RiskAssessments.RiskAssessmentCategoryService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.RiskAssessments.IRiskAssessmentService,
                           ChurchRegister.ApiService.Services.RiskAssessments.RiskAssessmentService>();

// Register Monthly Report Pack Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Training.ITrainingCertificatePdfService,
                           ChurchRegister.ApiService.Services.Training.TrainingCertificatePdfService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Reminders.IRemindersPdfService,
                           ChurchRegister.ApiService.Services.Reminders.RemindersPdfService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Attendance.IAttendancePdfService,
                           ChurchRegister.ApiService.Services.Attendance.AttendancePdfService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.RiskAssessments.IRiskAssessmentPdfService,
                           ChurchRegister.ApiService.Services.RiskAssessments.RiskAssessmentPdfService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.MonthlyReportPack.IMonthlyReportPackService,
                           ChurchRegister.ApiService.Services.MonthlyReportPack.MonthlyReportPackService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Email.IEmailService,
                           ChurchRegister.ApiService.Services.Email.OutlookEmailService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.Email.EmailTemplateBuilder>();
builder.Services.AddScoped<ChurchRegister.ApiService.UseCase.MonthlyReportPack.GenerateMonthlyReportPack.IGenerateMonthlyReportPackUseCase,
                           ChurchRegister.ApiService.UseCase.MonthlyReportPack.GenerateMonthlyReportPack.GenerateMonthlyReportPackUseCase>();

// Register Background Jobs
builder.Services.AddHostedService<ChurchRegister.ApiService.Services.BackgroundJobs.CheckDueRiskAssessmentReviewsJob>();

var app = builder.Build();

// Use custom global exception handler
app.UseGlobalExceptionHandler();

// HTTPS Enforcement & Security Headers (Production)
if (!app.Environment.IsDevelopment())
{
    // Enforce HTTPS with HSTS
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Security Headers Middleware
app.Use(async (context, next) =>
{
    // Prevent clickjacking attacks
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    
    // Prevent MIME type sniffing
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    
    // Enable XSS protection
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    
    // Control referrer information
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Content Security Policy
    context.Response.Headers.Append("Content-Security-Policy", 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Required for React and Vite HMR in development
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' http://localhost:* https://localhost:*; " + // API calls
        "frame-ancestors 'none'");
    
    // Permissions Policy (formerly Feature Policy)
    context.Response.Headers.Append("Permissions-Policy", 
        "geolocation=(), microphone=(), camera=()");
    
    await next();
});

// Use CORS based on environment
if (app.Environment.IsDevelopment())
{
    app.UseCors("ReactDevelopment");
}
else
{
    app.UseCors("ReactProduction");
}

// Add static file serving for React app in production
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();

// Token revocation validation middleware (after authentication)
app.UseTokenRevocation();

// Configure FastEndpoints
app.UseFastEndpoints(config =>
{
    config.Errors.ResponseBuilder = (failures, ctx, statusCode) =>
    {
        return new
        {
            Message = "One or more validation errors occurred.",
            Errors = failures.Select(f => f.ErrorMessage).ToList()
        };
    };
});

string[] summaries = ["Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

app.MapDefaultEndpoints();

// Fallback route for React SPA (must be last)
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("/index.html");
}

// Apply database migrations automatically (for Docker and Production)
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        try
        {
            logger.LogInformation("Checking for pending database migrations...");
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
            
            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying {Count} pending migrations: {Migrations}", 
                    pendingMigrations.Count(), 
                    string.Join(", ", pendingMigrations));
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully");
            }
            else
            {
                logger.LogInformation("Database is already up to date");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while applying database migrations");
            throw;
        }
    }
}

// Seed the database (skip in testing environment)
if (!app.Environment.IsEnvironment("Testing"))
{
    await DatabaseSeeder.SeedAsync(app.Services);
}

app.Run();

// Configuration validation method
static void ValidateConfiguration(IConfiguration config)
{
    var required = new Dictionary<string, string>
    {
        ["Jwt:Key"] = "JWT signing key",
        ["ConnectionStrings:DefaultConnection"] = "Database connection string"
    };

    foreach (var kvp in required)
    {
        var value = kvp.Key.Contains(':') 
            ? config[kvp.Key] 
            : config.GetSection(kvp.Key.Split(':')[0])[kvp.Key.Split(':')[1]];
            
        if (string.IsNullOrEmpty(value))
        {
            throw new InvalidOperationException(
                $"Required configuration missing: {kvp.Value} ({kvp.Key}). " +
                $"Please set this value in User Secrets (development) or Azure Key Vault (production).");
        }

        // Validate JWT key length (minimum 32 characters for 256-bit security)
        if (kvp.Key == "Jwt:Key")
        {
            if (Encoding.UTF8.GetBytes(value).Length < 32)
            {
                throw new InvalidOperationException(
                    "JWT Key must be at least 32 characters (256-bit) for security. " +
                    $"Current length: {Encoding.UTF8.GetBytes(value).Length} bytes.");
            }
        }
    }
}

// Make Program class accessible for testing
public partial class Program { }