using ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser;
using ChurchRegister.Database.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using System.Security.Claims;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class GetCurrentUserUseCaseTests
{
    private readonly Mock<UserManager<ChurchRegisterWebUser>> _mockUserManager;
    private readonly GetCurrentUserUseCase _getCurrentUserUseCase;

    public GetCurrentUserUseCaseTests()
    {
        var userStoreMock = new Mock<IUserStore<ChurchRegisterWebUser>>();
        _mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _getCurrentUserUseCase = new GetCurrentUserUseCase(_mockUserManager.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidUser_ReturnsUserDto()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "Test User",
            EmailConfirmed = true
        };

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, testUser.Email)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        identity.AddClaim(new Claim(ClaimTypes.Name, testUser.UserName));
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockUserManager.Setup(um => um.GetUserAsync(claimsPrincipal))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "Admin", "User" });
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<Claim>
            {
                new Claim("permission", "users.read"),
                new Claim("permission", "users.write")
            });

        // Act
        var result = await _getCurrentUserUseCase.ExecuteAsync(claimsPrincipal);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
        result.Email.Should().Be(testUser.Email);
        result.DisplayName.Should().Be(testUser.UserName);
        result.Roles.Should().Contain(new[] { "Admin", "User" });
        result.Permissions.Should().Contain(new[] { "users.read", "users.write" });
        result.EmailConfirmed.Should().BeTrue();
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ExecuteAsync_WithNullUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _mockUserManager.Setup(um => um.GetUserAsync(claimsPrincipal))
            .ReturnsAsync((ChurchRegisterWebUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _getCurrentUserUseCase.ExecuteAsync(claimsPrincipal));

        exception.Message.Should().Be("User not found");
    }

    [Fact]
    public async Task ExecuteAsync_WithUnauthenticatedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _getCurrentUserUseCase.ExecuteAsync(claimsPrincipal));

        exception.Message.Should().Be("User is not authenticated");
    }

    [Fact]
    public async Task ExecuteAsync_WithNullClaimsPrincipal_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _getCurrentUserUseCase.ExecuteAsync(null!));

        exception.Message.Should().Be("User is not authenticated");
    }
}
