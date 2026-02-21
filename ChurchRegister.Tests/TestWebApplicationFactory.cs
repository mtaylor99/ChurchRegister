using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ChurchRegister.ApiService.Tests;

public class TestWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    private readonly string _databaseName = "TestDatabase_" + Guid.NewGuid();
    private Action<IServiceCollection>? _configureTestServices;

    /// <summary>
    /// Allows custom service configuration for individual tests.
    /// </summary>
    public void ConfigureTestServices(Action<IServiceCollection> configure)
    {
        _configureTestServices = configure;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove all existing database-related service registrations
            var descriptorsToRemove = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<ChurchRegisterWebContext>) ||
                           d.ServiceType == typeof(DbContextOptions) ||
                           d.ServiceType == typeof(ChurchRegisterWebContext))
                .ToList();

            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            // Add in-memory database for testing with a unique database name
            services.AddDbContext<ChurchRegisterWebContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
                options.EnableSensitiveDataLogging();
                // Suppress transaction warnings for in-memory database using event ID
                options.ConfigureWarnings(warnings => 
                    warnings.Ignore(new EventId(20800, "Microsoft.EntityFrameworkCore.Database.Transaction.TransactionIgnoredWarning")));
            });

            // Apply custom service configuration if provided
            _configureTestServices?.Invoke(services);
        });

        // Suppress logging during tests to reduce noise
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddDebug();
            logging.SetMinimumLevel(LogLevel.Warning);
        });

        // Configure test authentication
        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication("Test")
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });
        });
    }

    /// <summary>
    /// Creates an authenticated HttpClient with the specified user and roles.
    /// </summary>
    public HttpClient CreateAuthenticatedClient(string userId, string email, params string[] roles)
    {
        var client = CreateClient();
        var token = GenerateTestToken(userId, email, roles);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        return client;
    }

    /// <summary>
    /// Creates an authenticated HttpClient for an admin user.
    /// </summary>
    public HttpClient CreateAdminClient()
    {
        return CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@example.com", "Admin");
    }

    /// <summary>
    /// Creates an authenticated HttpClient for a regular member user.
    /// </summary>
    public HttpClient CreateMemberClient()
    {
        return CreateAuthenticatedClient(Guid.NewGuid().ToString(), "member@example.com", "Member");
    }

    /// <summary>
    /// Seeds the database with test data.
    /// </summary>
    public async Task SeedDatabaseAsync(Action<ChurchRegisterWebContext> seedAction)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
        seedAction(context);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Executes an operation within a database scope.
    /// </summary>
    public async Task<T> ExecuteInScopeAsync<T>(Func<IServiceProvider, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider);
    }

    /// <summary>
    /// Executes an operation within a database scope.
    /// </summary>
    public async Task ExecuteInScopeAsync(Func<IServiceProvider, Task> action)
    {
        using var scope = Services.CreateScope();
        await action(scope.ServiceProvider);
    }

    /// <summary>
    /// Creates a test user with the specified roles.
    /// </summary>
    public async Task<ChurchRegisterWebUser> CreateTestUserAsync(string email, string password, params string[] roles)
    {
        return await ExecuteInScopeAsync(async serviceProvider =>
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ChurchRegisterWebUser>>();
            
            var user = new ChurchRegisterWebUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create test user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            if (roles.Length > 0)
            {
                await userManager.AddToRolesAsync(user, roles);
            }

            return user;
        });
    }

    /// <summary>
    /// Generates a test JWT token for authentication.
    /// </summary>
    private string GenerateTestToken(string userId, string email, string[] roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("test-secret-key-for-jwt-token-generation-minimum-32-characters"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "test-issuer",
            audience: "test-audience",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            // Clean up the in-memory database
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
            context.Database.EnsureDeleted();
        }

        base.Dispose(disposing);
    }
}

/// <summary>
/// Test authentication handler that bypasses real authentication.
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder) 
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Test authentication is handled by JWT tokens in the Authorization header
        // This handler just allows the request to proceed
        var claims = new[] { new Claim(ClaimTypes.Name, "test-user") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public static class TestHelper
{
    public static async Task<T> ExecuteInDatabaseScope<T>(
        IServiceProvider serviceProvider, 
        Func<ChurchRegisterWebContext, Task<T>> operation)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
        return await operation(context);
    }

    public static async Task ExecuteInDatabaseScope(
        IServiceProvider serviceProvider,
        Func<ChurchRegisterWebContext, Task> operation)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
        await operation(context);
    }

    public static string GenerateTestEmail() => $"test-{Guid.NewGuid()}@example.com";
    
    public static string GenerateTestUserId() => Guid.NewGuid().ToString();
}