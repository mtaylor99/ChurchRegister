using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.ChangePassword;
using ChurchRegister.Database.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class ChangePasswordUseCaseTests
{
    private readonly Mock<UserManager<ChurchRegisterWebUser>> _mockUserManager;
    private readonly ChangePasswordUseCase _changePasswordUseCase;

    public ChangePasswordUseCaseTests()
    {
        var userStoreMock = new Mock<IUserStore<ChurchRegisterWebUser>>();
        _mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _changePasswordUseCase = new ChangePasswordUseCase(_mockUserManager.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidCredentials_ChangesPassword()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _changePasswordUseCase.ExecuteAsync(request, userId);

        // Assert
        _mockUserManager.Verify(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithNonExistentUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync((ChurchRegisterWebUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));

        exception.Message.Should().Be("User not found");
        _mockUserManager.Verify(um => um.ChangePasswordAsync(It.IsAny<ChurchRegisterWebUser>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WithIncorrectCurrentPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));

        exception.Message.Should().Be("Current password is incorrect");
        _mockUserManager.Verify(um => um.ChangePasswordAsync(It.IsAny<ChurchRegisterWebUser>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_WithWeakNewPassword_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "weak",
            ConfirmPassword = "weak"
        };

        var identityErrors = new List<IdentityError>
        {
            new IdentityError { Code = "PasswordTooShort", Description = "Passwords must be at least 6 characters" },
            new IdentityError { Code = "PasswordRequiresNonAlphanumeric", Description = "Passwords must have at least one non alphanumeric character" }
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Failed(identityErrors.ToArray()));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));

        exception.Message.Should().Contain("Password change failed");
        exception.Message.Should().Contain("Passwords must be at least 6 characters");
    }

    [Fact]
    public async Task ExecuteAsync_WithPasswordSameAsCurrent_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "Password123!",
            NewPassword = "Password123!",
            ConfirmPassword = "Password123!"
        };

        var identityError = new IdentityError
        {
            Code = "PasswordMismatch",
            Description = "New password cannot be the same as current password"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));

        exception.Message.Should().Contain("Password change failed");
    }

    [Theory]
    [InlineData("", "NewPassword123!", "NewPassword123!")]
    [InlineData("OldPassword123!", "", "")]
    [InlineData(null, "NewPassword123!", "NewPassword123!")]
    [InlineData("OldPassword123!", null, null)]
    public async Task ExecuteAsync_WithNullOrEmptyPasswords_HandlesGracefully(
        string currentPassword,
        string newPassword,
        string confirmPassword)
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword,
            ConfirmPassword = confirmPassword
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, It.IsAny<string>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));
    }

    [Fact]
    public async Task ExecuteAsync_WithValidPasswordChange_VerifiesCurrentPasswordFirst()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _changePasswordUseCase.ExecuteAsync(request, userId);

        // Assert
        _mockUserManager.Verify(um => um.CheckPasswordAsync(testUser, request.CurrentPassword), Times.Once);
        _mockUserManager.Verify(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_OnSuccess_DoesNotThrowException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var exception = await Record.ExceptionAsync(() =>
            _changePasswordUseCase.ExecuteAsync(request, userId));

        // Assert
        exception.Should().BeNull("Password change should succeed without throwing");
    }

    [Fact]
    public async Task ExecuteAsync_WithMultipleValidationErrors_IncludesAllErrorsInException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var testUser = new ChurchRegisterWebUser
        {
            Id = userId,
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "weak",
            ConfirmPassword = "weak"
        };

        var identityErrors = new List<IdentityError>
        {
            new IdentityError { Code = "PasswordTooShort", Description = "Passwords must be at least 8 characters" },
            new IdentityError { Code = "PasswordRequiresDigit", Description = "Passwords must have at least one digit ('0'-'9')" },
            new IdentityError { Code = "PasswordRequiresUpper", Description = "Passwords must have at least one uppercase ('A'-'Z')" }
        };

        _mockUserManager.Setup(um => um.FindByIdAsync(userId))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.CheckPasswordAsync(testUser, request.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.ChangePasswordAsync(testUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Failed(identityErrors.ToArray()));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _changePasswordUseCase.ExecuteAsync(request, userId));

        exception.Message.Should().Contain("Passwords must be at least 8 characters");
        exception.Message.Should().Contain("Passwords must have at least one digit");
        exception.Message.Should().Contain("Passwords must have at least one uppercase");
    }
}
