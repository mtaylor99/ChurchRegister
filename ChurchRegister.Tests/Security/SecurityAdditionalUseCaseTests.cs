using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.ApiService.UseCase.Security.GetSystemRoles;
using ChurchRegister.ApiService.UseCase.Security.ResendInvitation;
using ChurchRegister.ApiService.UseCase.Security.UpdateUser;
using ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class SecurityAdditionalUseCaseTests
{
    private readonly Mock<IUserManagementService> _mockUserService;

    public SecurityAdditionalUseCaseTests()
    {
        _mockUserService = new Mock<IUserManagementService>();
    }

    // ─── UpdateUserUseCase ───────────────────────────────────────────────────

    [Fact]
    public async Task UpdateUser_WithValidRequest_ReturnsUpdatedProfile()
    {
        // Arrange
        var request = new UpdateUserRequest
        {
            UserId = "user-1",
            FirstName = "Jane",
            LastName = "Doe",
            Roles = new[] { "Member" }
        };

        var expected = new UserProfileDto
        {
            Id = "user-1",
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane@test.com",
            Roles = new[] { "Member" }
        };

        _mockUserService
            .Setup(s => s.UpdateUserAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateUserUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Id.Should().Be("user-1");
        result.FirstName.Should().Be("Jane");
        result.LastName.Should().Be("Doe");
        _mockUserService.Verify(s => s.UpdateUserAsync(request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUser_WithEmptyModifier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new UpdateUserRequest
        {
            UserId = "user-1",
            FirstName = "Jane",
            LastName = "Doe",
            Roles = new[] { "Member" }
        };

        var useCase = new UpdateUserUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, ""))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task UpdateUser_WithMissingUserId_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateUserRequest
        {
            UserId = "",
            FirstName = "Jane",
            LastName = "Doe",
            Roles = new[] { "Member" }
        };

        var useCase = new UpdateUserUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpdateUser_WithMissingFirstName_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateUserRequest
        {
            UserId = "user-1",
            FirstName = "",
            LastName = "Doe",
            Roles = new[] { "Member" }
        };

        var useCase = new UpdateUserUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ─── UpdateUserStatusUseCase ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateUserStatus_WithValidRequest_ReturnsUpdatedProfile()
    {
        // Arrange
        var request = new UpdateUserStatusRequest
        {
            UserId = "user-1",
            Action = UserStatusAction.Deactivate,
            Reason = "No longer active"
        };

        var expected = new UserProfileDto
        {
            Id = "user-1",
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane@test.com"
        };

        _mockUserService
            .Setup(s => s.UpdateUserStatusAsync(request, "admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var useCase = new UpdateUserStatusUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserStatusUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync(request, "admin");

        // Assert
        result.Id.Should().Be("user-1");
        _mockUserService.Verify(s => s.UpdateUserStatusAsync(request, "admin", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUserStatus_WithMissingUserId_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateUserStatusRequest
        {
            UserId = "",
            Action = UserStatusAction.Activate
        };

        var useCase = new UpdateUserStatusUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserStatusUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, "admin"))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpdateUserStatus_WithEmptyModifier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new UpdateUserStatusRequest
        {
            UserId = "user-1",
            Action = UserStatusAction.Lock
        };

        var useCase = new UpdateUserStatusUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<UpdateUserStatusUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(request, ""))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ─── GetSystemRolesUseCase ───────────────────────────────────────────────

    [Fact]
    public async Task GetSystemRoles_ReturnsRolesList()
    {
        // Arrange
        var roles = new List<SystemRoleDto>
        {
            new() { Id = "1", Name = "SystemAdministration", DisplayName = "System Administrator", Category = "Admin", IsHighPrivilege = true },
            new() { Id = "2", Name = "Member", DisplayName = "Member", Category = "General", IsHighPrivilege = false },
            new() { Id = "3", Name = "FinancialAdministrator", DisplayName = "Financial Administrator", Category = "Finance", IsHighPrivilege = true }
        };

        _mockUserService
            .Setup(s => s.GetSystemRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        var useCase = new GetSystemRolesUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<GetSystemRolesUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(r => r.Name == "SystemAdministration");
        result.Should().Contain(r => r.IsHighPrivilege);
        _mockUserService.Verify(s => s.GetSystemRolesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSystemRoles_WhenEmpty_ReturnsEmptyList()
    {
        // Arrange
        _mockUserService
            .Setup(s => s.GetSystemRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Enumerable.Empty<SystemRoleDto>());

        var useCase = new GetSystemRolesUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<GetSystemRolesUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync();

        // Assert
        result.Should().BeEmpty();
    }

    // ─── ResendInvitationUseCase ─────────────────────────────────────────────

    [Fact]
    public async Task ResendInvitation_WithValidUserId_ReturnsTrue()
    {
        // Arrange
        _mockUserService
            .Setup(s => s.ResendInvitationAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var useCase = new ResendInvitationUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<ResendInvitationUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync("user-1");

        // Assert
        result.Should().BeTrue();
        _mockUserService.Verify(s => s.ResendInvitationAsync("user-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ResendInvitation_WithEmptyUserId_ThrowsArgumentException()
    {
        // Arrange
        var useCase = new ResendInvitationUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<ResendInvitationUseCase>>());

        // Act & Assert
        await useCase.Invoking(u => u.ExecuteAsync(""))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ResendInvitation_WhenServiceReturnsFalse_ReturnsFalse()
    {
        // Arrange
        _mockUserService
            .Setup(s => s.ResendInvitationAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var useCase = new ResendInvitationUseCase(
            _mockUserService.Object,
            Mock.Of<ILogger<ResendInvitationUseCase>>());

        // Act
        var result = await useCase.ExecuteAsync("user-1");

        // Assert
        result.Should().BeFalse();
    }
}
