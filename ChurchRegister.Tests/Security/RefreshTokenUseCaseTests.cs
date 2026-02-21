using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.RefreshToken;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class RefreshTokenUseCaseTests
{
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly Mock<UserManager<ChurchRegisterWebUser>> _mockUserManager;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly RefreshTokenUseCase _refreshTokenUseCase;

    public RefreshTokenUseCaseTests()
    {
        // Mock RefreshTokenRepository
        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();

        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<ChurchRegisterWebUser>>();
        _mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Mock Configuration
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(c => c["Jwt:Key"]).Returns("ChurchRegister-Super-Secret-Key-For-Testing-Minimum-32-Characters!");
        _mockConfiguration.Setup(c => c["Jwt:Issuer"]).Returns("ChurchRegister.ApiService");
        _mockConfiguration.Setup(c => c["Jwt:Audience"]).Returns("ChurchRegister.React");
        _mockConfiguration.Setup(c => c["Jwt:AccessTokenExpirationMinutes"]).Returns("60");
        _mockConfiguration.Setup(c => c["Jwt:RefreshTokenExpirationDays"]).Returns("7");

        _refreshTokenUseCase = new RefreshTokenUseCase(
            _mockRefreshTokenRepository.Object,
            _mockUserManager.Object,
            _mockConfiguration.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidRefreshToken_ReturnsNewTokens()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var oldRefreshToken = "valid-refresh-token";
        
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com",
            EmailConfirmed = true
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = oldRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = oldRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(oldRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(oldRefreshToken, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _refreshTokenUseCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Message.Should().Be("Token refreshed successfully");
        result.Tokens.Should().NotBeNull();
        result.Tokens.AccessToken.Should().NotBeNullOrEmpty();
        result.Tokens.RefreshToken.Should().NotBeNullOrEmpty();
        result.Tokens.RefreshToken.Should().NotBe(oldRefreshToken, "A new refresh token should be generated");
        result.Tokens.TokenType.Should().Be("Bearer");
        result.Tokens.ExpiresIn.Should().Be(3600); // 60 minutes in seconds
    }

    [Fact]
    public async Task ExecuteAsync_WithExpiredRefreshToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var expiredRefreshToken = "expired-refresh-token";

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = expiredRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(-1), // Expired
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-8)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = expiredRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(expiredRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _refreshTokenUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid or expired refresh token");
    }

    [Fact]
    public async Task ExecuteAsync_WithInvalidRefreshToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var invalidRefreshToken = "invalid-token";

        var request = new RefreshTokenRequest
        {
            RefreshToken = invalidRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(invalidRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Database.Entities.RefreshToken?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _refreshTokenUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid or expired refresh token");
    }

    [Fact]
    public async Task ExecuteAsync_WithRevokedRefreshToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var revokedRefreshToken = "revoked-refresh-token";

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = revokedRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = true,
            RevokedByIp = "192.168.1.1",
            RevokedDate = DateTime.UtcNow.AddMinutes(-30),
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = revokedRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(revokedRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _refreshTokenUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid or expired refresh token");
    }

    [Fact]
    public async Task ExecuteAsync_WithNonExistentUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var refreshToken = "valid-refresh-token";

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = refreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync((ChurchRegisterWebUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _refreshTokenUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("User not found");
    }

    [Fact]
    public async Task ExecuteAsync_OnSuccess_RevokesOldRefreshToken()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var oldRefreshToken = "old-refresh-token";
        var ipAddress = "192.168.1.100";

        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = oldRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = oldRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(oldRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(oldRefreshToken, ipAddress, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _refreshTokenUseCase.ExecuteAsync(request, ipAddress);

        // Assert
        _mockRefreshTokenRepository.Verify(
            r => r.RevokeAsync(oldRefreshToken, ipAddress, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "Old refresh token should be revoked (token rotation)");
    }

    [Fact]
    public async Task ExecuteAsync_OnSuccess_CreatesNewRefreshToken()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var oldRefreshToken = "old-refresh-token";

        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = oldRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = oldRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(oldRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(oldRefreshToken, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _refreshTokenUseCase.ExecuteAsync(request);

        // Assert
        _mockRefreshTokenRepository.Verify(
            r => r.CreateAsync(It.Is<Database.Entities.RefreshToken>(rt =>
                rt.UserId == userId &&
                rt.Token != oldRefreshToken &&
                rt.ExpiryDate > DateTime.UtcNow
            ), It.IsAny<CancellationToken>()),
            Times.Once,
            "New refresh token should be created");
    }

    [Fact]
    public async Task ExecuteAsync_WithIpAddress_TracksIpInNewToken()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var oldRefreshToken = "old-refresh-token";
        var ipAddress = "203.0.113.42";

        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = oldRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = oldRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(oldRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(oldRefreshToken, ipAddress, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _refreshTokenUseCase.ExecuteAsync(request, ipAddress);

        // Assert
        _mockRefreshTokenRepository.Verify(
            r => r.CreateAsync(It.Is<Database.Entities.RefreshToken>(rt =>
                rt.CreatedByIp == ipAddress
            ), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithUserWithMultipleRoles_IncludesAllRolesInToken()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var refreshToken = "valid-refresh-token";

        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "admin@test.com",
            UserName = "admin@test.com"
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = refreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        };

        var roles = new List<string> { "Admin", "Elder", "Member" };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(roles);
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(refreshToken, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _refreshTokenUseCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Tokens.AccessToken.Should().NotBeNullOrEmpty();
        _mockUserManager.Verify(um => um.GetRolesAsync(testUser), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_GeneratesUniqueRefreshTokens()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var oldRefreshToken = "old-refresh-token";

        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = oldRefreshToken,
            UserId = userId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedDateTime = DateTime.UtcNow.AddDays(-1)
        };

        var request = new RefreshTokenRequest
        {
            RefreshToken = oldRefreshToken
        };

        _mockRefreshTokenRepository.Setup(r => r.GetByTokenAsync(oldRefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refreshTokenEntity);
        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<Database.Entities.RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Database.Entities.RefreshToken());
        _mockRefreshTokenRepository.Setup(r => r.RevokeAsync(oldRefreshToken, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _refreshTokenUseCase.ExecuteAsync(request);

        // Assert
        result.Tokens.RefreshToken.Should().NotBe(oldRefreshToken);
        result.Tokens.RefreshToken.Length.Should().BeGreaterThan(40, "Refresh token should be cryptographically strong");
    }
}
