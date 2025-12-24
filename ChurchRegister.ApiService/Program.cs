using ChurchRegister.ServiceDefaults;
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

// Register Repositories
builder.Services.AddScoped<ChurchRegister.Database.Interfaces.IRefreshTokenRepository,
                           ChurchRegister.Database.Data.RefreshTokenRepository>();

// Register Azure Email Service
builder.Services.Configure<ChurchRegister.ApiService.Configuration.AzureEmailServiceConfiguration>(
    builder.Configuration.GetSection(ChurchRegister.ApiService.Configuration.AzureEmailServiceConfiguration.SectionName));
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IAzureEmailService, 
                           ChurchRegister.ApiService.Services.AzureEmailService>();

// Register User Management Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IUserManagementService,
                           ChurchRegister.ApiService.Services.UserManagementService>();

// Register Church Member Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IChurchMemberService,
                           ChurchRegister.ApiService.Services.ChurchMemberService>();

// Register HSBC Import Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IHsbcCsvParser,
                           ChurchRegister.ApiService.Services.HsbcCsvParser>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IHsbcTransactionImportService,
                           ChurchRegister.ApiService.Services.HsbcTransactionImportService>();

// Register Contribution Processing Service
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IContributionProcessingService,
                           ChurchRegister.ApiService.Services.ContributionProcessingService>();

// Register Envelope Contribution Services
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IRegisterNumberService,
                           ChurchRegister.ApiService.Services.RegisterNumberService>();
builder.Services.AddScoped<ChurchRegister.ApiService.Services.IEnvelopeContributionService,
                           ChurchRegister.ApiService.Services.EnvelopeContributionService>();

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