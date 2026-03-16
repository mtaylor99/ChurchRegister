using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Interceptors;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Tests.Database;

/// <summary>
/// Unit tests for AuditInterceptor — verifies CreatedBy/ModifiedBy population.
/// </summary>
public class AuditInterceptorTests
{
    private static ChurchRegisterWebContext CreateContextWithInterceptor(string? authenticatedUserId = null)
    {
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();

        if (authenticatedUserId != null)
        {
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, authenticatedUserId) };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);

            var mockHttpContext = new Mock<HttpContext>();
            mockHttpContext.Setup(x => x.User).Returns(principal);

            mockHttpContextAccessor.Setup(x => x.HttpContext).Returns(mockHttpContext.Object);
        }

        var services = new ServiceCollection();
        services.AddSingleton<IHttpContextAccessor>(mockHttpContextAccessor.Object);
        var serviceProvider = services.BuildServiceProvider();

        var interceptor = new AuditInterceptor(serviceProvider);

        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"AuditTest_{Guid.NewGuid()}")
            .AddInterceptors(interceptor)
            .Options;

        return new ChurchRegisterWebContext(options);
    }

    // ─── Added entity — no authenticated user ─────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_AddedEntity_WithNoHttpContext_SetsCreatedByToSystem()
    {
        var context = CreateContextWithInterceptor();

        var status = new ChurchMemberStatus
        {
            Name = "TestStatus",
            CreatedBy = string.Empty,
            CreatedDateTime = default
        };
        context.ChurchMemberStatuses.Add(status);
        await context.SaveChangesAsync();

        status.CreatedBy.Should().Be("system");
        status.CreatedDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ─── Added entity — with authenticated user ───────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_AddedEntity_WithAuthenticatedUser_SetsCreatedByToUserId()
    {
        const string userId = "user-abc-123";
        var context = CreateContextWithInterceptor(userId);

        var status = new ChurchMemberStatus
        {
            Name = "AuthStatus",
            CreatedBy = string.Empty,
            CreatedDateTime = default
        };
        context.ChurchMemberStatuses.Add(status);
        await context.SaveChangesAsync();

        status.CreatedBy.Should().Be(userId);
        status.CreatedDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ─── Modified entity ──────────────────────────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_ModifiedEntity_SetsModifiedFields()
    {
        var context = CreateContextWithInterceptor();

        // Seed
        var status = new ChurchMemberStatus
        {
            Name = "Original",
            CreatedBy = "system",
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };
        context.ChurchMemberStatuses.Add(status);
        await context.SaveChangesAsync();

        // Modify
        status.Name = "Updated";
        await context.SaveChangesAsync();

        status.ModifiedBy.Should().Be("system");
        status.ModifiedDateTime.Should().NotBeNull();
        status.ModifiedDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ─── Synchronous SaveChanges ───────────────────────────────────────────────

    [Fact]
    public void SaveChanges_Synchronous_AddedEntity_SetsCreatedBy()
    {
        var context = CreateContextWithInterceptor();

        var status = new ChurchMemberStatus
        {
            Name = "SyncStatus",
            CreatedBy = string.Empty,
            CreatedDateTime = default
        };
        context.ChurchMemberStatuses.Add(status);
        context.SaveChanges();

        status.CreatedBy.Should().Be("system");
        status.CreatedDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ─── Exception in service provider — falls back to "system" ──────────────

    [Fact]
    public async Task SaveChangesAsync_WhenServiceProviderThrows_FallsBackToSystem()
    {
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockServiceProvider
            .Setup(x => x.GetService(It.IsAny<Type>()))
            .Throws(new Exception("Provider failure"));

        var interceptor = new AuditInterceptor(mockServiceProvider.Object);

        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"AuditFallback_{Guid.NewGuid()}")
            .AddInterceptors(interceptor)
            .Options;

        var context = new ChurchRegisterWebContext(options);

        var status = new ChurchMemberStatus
        {
            Name = "FallbackStatus",
            CreatedBy = string.Empty,
            CreatedDateTime = default
        };
        context.ChurchMemberStatuses.Add(status);
        await context.SaveChangesAsync();

        status.CreatedBy.Should().Be("system");
    }

    // ─── Null context edge case ───────────────────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_AddedEntity_WithNullHttpContext_SetsCreatedByToSystem()
    {
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        mockHttpContextAccessor.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        var services = new ServiceCollection();
        services.AddSingleton<IHttpContextAccessor>(mockHttpContextAccessor.Object);
        var serviceProvider = services.BuildServiceProvider();

        var interceptor = new AuditInterceptor(serviceProvider);
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase($"AuditNull_{Guid.NewGuid()}")
            .AddInterceptors(interceptor)
            .Options;

        var context = new ChurchRegisterWebContext(options);

        var status = new ChurchMemberStatus
        {
            Name = "NullContextStatus",
            CreatedBy = string.Empty,
            CreatedDateTime = default
        };
        context.ChurchMemberStatuses.Add(status);
        await context.SaveChangesAsync();

        status.CreatedBy.Should().Be("system");
    }
}
