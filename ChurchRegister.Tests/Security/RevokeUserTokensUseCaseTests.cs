using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class RevokeUserTokensUseCaseTests
{
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly Mock<UserManager<ChurchRegisterWebUser>> _mockUserManager;
    private readonly Mock<ILogger<RevokeUserTokensUseCase>> _mockLogger;
    private readonly RevokeUserTokensUseCase _useCase;

    public RevokeUserTokensUseCaseTests()
    {
        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();
        _mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            Mock.Of<IUserStore<ChurchRegisterWebUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);
        _mockLogger = new Mock<ILogger<RevokeUserTokensUseCase>>();

        _useCase = new RevokeUserTokensUseCase(
            _mockRefreshTokenRepository.Object,
            _mockUserManager.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidUser_RevokesTokensSuccessfully()
    {
        // Arrange
        var userId = "user-123";
        var request = new RevokeUserTokensRequest
        {
            UserId = userId,
            Reason = "Security concern"
        };
        var user = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "test@test.com",
            UserName = "test@test.com"
        };

        var activeTokens = new List<RefreshToken>
        {
            new RefreshToken { Id = 1, Token = "token1", UserId = userId, ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false },
            new RefreshToken { Id = 2, Token = "token2", UserId = userId, ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false },
            new RefreshToken { Id = 3, Token = "token3", UserId = userId, ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false }
        };

        _mockUserManager.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTokens);
        _mockRefreshTokenRepository.Setup(x => x.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _useCase.ExecuteAsync(request, "192.168.1.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.TokensRevoked.Should().Be(3);
        result.Message.Should().Contain("Successfully revoked 3 token(s)");
        result.Message.Should().Contain("test@test.com");

        _mockRefreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(userId, "192.168.1.1", It.IsAny<CancellationToken>()), Times.Once);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Admin revoked all tokens")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithNonExistentUser_ReturnsFailure()
    {
        // Arrange
        var userId = "non-existent-user";
        var request = new RevokeUserTokensRequest
        {
            UserId = userId,
            Reason = "Test"
        };

        _mockUserManager.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync((ChurchRegisterWebUser?)null);

        // Act
        var result = await _useCase.ExecuteAsync(request, "192.168.1.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("User not found");
        result.TokensRevoked.Should().Be(0);

        _mockRefreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WithNoActiveTokens_ReturnsSuccessWithZeroCount()
    {
        // Arrange
        var userId = "user-456";
        var request = new RevokeUserTokensRequest
        {
            UserId = userId,
            Reason = "Precautionary measure"
        };
        var user = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "user@test.com",
            UserName = "user@test.com"
        };

        _mockUserManager.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken>());
        _mockRefreshTokenRepository.Setup(x => x.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _useCase.ExecuteAsync(request, "192.168.1.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.TokensRevoked.Should().Be(0);
        result.Message.Should().Contain("Successfully revoked 0 token(s)");

        _mockRefreshTokenRepository.Verify(x => x.RevokeAllForUserAsync(userId, "192.168.1.1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithoutReason_UsesDefaultReason()
    {
        // Arrange
        var userId = "user-789";
        var request = new RevokeUserTokensRequest
        {
            UserId = userId,
            Reason = null // No reason provided
        };
        var user = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "admin@test.com",
            UserName = "admin@test.com"
        };

        var activeTokens = new List<RefreshToken>
        {
            new RefreshToken { Id = 1, Token = "token1", UserId = userId, ExpiryDate = DateTime.UtcNow.AddDays(7), IsRevoked = false }
        };

        _mockUserManager.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTokens);
        _mockRefreshTokenRepository.Setup(x => x.RevokeAllForUserAsync(userId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _useCase.ExecuteAsync(request, "10.0.0.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Admin revocation")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WhenRepositoryThrowsException_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = "user-error";
        var request = new RevokeUserTokensRequest
        {
            UserId = userId,
            Reason = "Test"
        };
        var user = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "error@test.com",
            UserName = "error@test.com"
        };

        _mockUserManager.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _mockRefreshTokenRepository.Setup(x => x.GetActiveTokensForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var act = async () => await _useCase.ExecuteAsync(request, "192.168.1.1");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("An error occurred while revoking user tokens");

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error revoking tokens")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
