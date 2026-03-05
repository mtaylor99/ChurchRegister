using ChurchRegister.ApiService.Middleware;
using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class TokenRevocationMiddlewareTests
{
    private readonly Mock<RequestDelegate> _mockNext;
    private readonly Mock<ILogger<TokenRevocationMiddleware>> _mockLogger;
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly TokenRevocationMiddleware _middleware;

    public TokenRevocationMiddlewareTests()
    {
        _mockNext = new Mock<RequestDelegate>();
        _mockLogger = new Mock<ILogger<TokenRevocationMiddleware>>();
        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();
        
        _middleware = new TokenRevocationMiddleware(_mockNext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task InvokeAsync_WithUnauthenticatedUser_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity()); // Not authenticated

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_WithAuthenticatedUserAndActiveTokens_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-123"),
            new Claim(ClaimTypes.Email, "test@test.com")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

        var activeTokens = new List<RefreshToken>
        {
            new RefreshToken { Id = 1, Token = "refresh-token-1", UserId = "user-123", ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false }
        };

        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync("user-123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTokens);

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync("user-123", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_WithAuthenticatedUserButNoActiveTokens_LogsWarningAndCallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-456"),
            new Claim(ClaimTypes.Email, "revoked@test.com")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync("user-456", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken>()); // No active tokens

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("has no active refresh tokens")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_WithMissingAuthorizationHeader_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-789")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        // No Authorization header set

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_WithInvalidAuthorizationHeaderFormat_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-101")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "InvalidFormat token123"; // Not "Bearer" prefix

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_WithMissingUserIdClaim_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "test@test.com") // No NameIdentifier claim
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_WhenRepositoryThrowsException_LogsErrorAndCallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-error"),
            new Claim(ClaimTypes.Email, "error@test.com")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync("user-error", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection error"));

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error checking token revocation")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_WithValidBearerToken_ExtractsTokenCorrectly()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-200")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        context.Request.Headers.Authorization = "Bearer   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   "; // Extra spaces

        var activeTokens = new List<RefreshToken>
        {
            new RefreshToken { Id = 1, Token = "refresh-token", UserId = "user-200", ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false }
        };

        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync("user-200", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTokens);

        // Act
        await _middleware.InvokeAsync(context, _mockRefreshTokenRepository.Object);

        // Assert
        _mockNext.Verify(x => x(context), Times.Once);
        _mockRefreshTokenRepository.Verify(x => x.GetActiveTokensForUserAsync("user-200", It.IsAny<CancellationToken>()), Times.Once);
    }
}
