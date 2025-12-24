using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.Tests;

public class TestWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    private readonly string _databaseName = "TestDatabase_" + Guid.NewGuid();

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
            });
        });

        // Suppress logging during tests to reduce noise
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddDebug();
            logging.SetMinimumLevel(LogLevel.Warning);
        });
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