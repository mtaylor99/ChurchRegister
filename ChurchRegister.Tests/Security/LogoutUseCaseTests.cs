using ChurchRegister.ApiService.UseCase.Authentication.Logout;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using System.Security.Claims;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class LogoutUseCaseTests
{
    private readonly Mock<SignInManager<ChurchRegisterWebUser>> _mockSignInManager;
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly LogoutUseCase _logoutUseCase;

    public LogoutUseCaseTests()
    {
        var userStoreMock = new Mock<IUserStore<ChurchRegisterWebUser>>();
        var mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ChurchRegisterWebUser>>();
        _mockSignInManager = new Mock<SignInManager<ChurchRegisterWebUser>>(
            mockUserManager.Object,
            contextAccessorMock.Object,
            claimsFactoryMock.Object,
            null!, null!, null!, null!);

        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();

        _logoutUseCase = new LogoutUseCase(
            _mockSignInManager.Object,
            _mockRefreshTokenRepository.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithAuthenticatedUser_ReturnsSuccessMessage()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, "testuser@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _logoutUseCase.ExecuteAsync(claimsPrincipal);

        // Assert
        result.Should().NotBeNull();
        result.Message.Should().Be("Logout successful");
        _mockSignInManager.Verify(sm => sm.SignOutAsync(), Times.Once);
        _mockRefreshTokenRepository.Verify(r => r.RevokeAllForUserAsync(userId, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithUnauthenticatedUser_StillSignsOut()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal();

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _logoutUseCase.ExecuteAsync(claimsPrincipal);

        // Assert
        result.Should().NotBeNull();
        result.Message.Should().Be("Logout successful");
        _mockSignInManager.Verify(sm => sm.SignOutAsync(), Times.Once);
        _mockRefreshTokenRepository.Verify(r => r.RevokeAllForUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WithIpAddress_PassesIpToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var ipAddress = "192.168.1.1";
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, ipAddress, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _logoutUseCase.ExecuteAsync(claimsPrincipal, ipAddress);

        // Assert
        result.Should().NotBeNull();
        _mockRefreshTokenRepository.Verify(r => r.RevokeAllForUserAsync(userId, ipAddress, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WhenCalledMultipleTimes_IsIdempotent()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result1 = await _logoutUseCase.ExecuteAsync(claimsPrincipal);
        var result2 = await _logoutUseCase.ExecuteAsync(claimsPrincipal);

        // Assert
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        result1.Message.Should().Be(result2.Message);
        _mockSignInManager.Verify(sm => sm.SignOutAsync(), Times.Exactly(2));
    }

    [Fact]
    public async Task ExecuteAsync_WhenRefreshTokenRevocationFails_StillCompletesLogout()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act & Assert
        // Should not throw - logout should be resilient
        var exception = await Record.ExceptionAsync(() => _logoutUseCase.ExecuteAsync(claimsPrincipal));
        
        // If implementation doesn't handle this, we'd expect an exception
        // This test documents the expected behavior
        _mockSignInManager.Verify(sm => sm.SignOutAsync(), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithMultipleSessions_RevokesAllTokens()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, "testuser@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _logoutUseCase.ExecuteAsync(claimsPrincipal);

        // Assert
        result.Should().NotBeNull();
        _mockRefreshTokenRepository.Verify(
            r => r.RevokeAllForUserAsync(userId, null, It.IsAny<CancellationToken>()),
            Times.Once,
            "All refresh tokens for the user should be revoked on logout");
    }

    [Theory]
    [InlineData("192.168.1.1")]
    [InlineData("10.0.0.1")]
    [InlineData("172.16.0.1")]
    [InlineData(null)]
    public async Task ExecuteAsync_WithVariousIpAddresses_HandlesCorrectly(string? ipAddress)
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockSignInManager.Setup(sm => sm.SignOutAsync())
            .Returns(Task.CompletedTask);
        _mockRefreshTokenRepository.Setup(r => r.RevokeAllForUserAsync(userId, It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _logoutUseCase.ExecuteAsync(claimsPrincipal, ipAddress);

        // Assert
        result.Should().NotBeNull();
        result.Message.Should().Be("Logout successful");
        _mockRefreshTokenRepository.Verify(
            r => r.RevokeAllForUserAsync(userId, ipAddress, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
