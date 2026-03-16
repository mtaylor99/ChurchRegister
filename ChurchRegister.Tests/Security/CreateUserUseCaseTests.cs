using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.ApiService.UseCase.Security.CreateUser;
using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class CreateUserUseCaseTests
{
    private readonly Mock<IUserManagementService> _mockUserManagementService;
    private readonly Mock<ILogger<CreateUserUseCase>> _mockLogger;
    private readonly CreateUserUseCase _useCase;

    public CreateUserUseCaseTests()
    {
        _mockUserManagementService = new Mock<IUserManagementService>();
        _mockLogger = new Mock<ILogger<CreateUserUseCase>>();
        _useCase = new CreateUserUseCase(_mockUserManagementService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidRequest_CreatesUserSuccessfully()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "newuser@church.com",
            FirstName = "John",
            LastName = "Smith",
            Roles = new[] { "Member" },
            SendInvitationEmail = true
        };
        var createdBy = "admin-123";

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-new-123",
            Message = "User invited successfully",
            EmailVerificationSent = true,
            User = new UserProfileDto
            {
                Id = "user-new-123",
                Email = "newuser@church.com",
                FirstName = "John",
                LastName = "Smith",
                Roles = new[] { "Member" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _useCase.ExecuteAsync(request, createdBy);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be("user-new-123");
        result.Message.Should().Be("User invited successfully");
        result.EmailVerificationSent.Should().BeTrue();
        result.User.Should().NotBeNull();
        result.User!.Email.Should().Be("newuser@church.com");
        result.User.Roles.Should().Contain("Member");

        _mockUserManagementService.Verify(
            s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithMultipleRoles_AssignsAllRoles()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "elder@church.com",
            FirstName = "James",
            LastName = "Wilson",
            Roles = new[] { "Elder", "Member" },
            SendInvitationEmail = false
        };
        var createdBy = "admin-456";

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-elder-123",
            Message = "User created successfully",
            EmailVerificationSent = false,
            User = new UserProfileDto
            {
                Id = "user-elder-123",
                Email = "elder@church.com",
                FirstName = "James",
                LastName = "Wilson",
                Roles = new[] { "Elder", "Member" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _useCase.ExecuteAsync(request, createdBy);

        // Assert
        result.User.Should().NotBeNull();
        result.User!.Roles.Should().HaveCount(2);
        result.User.Roles.Should().Contain(new[] { "Elder", "Member" });
        result.EmailVerificationSent.Should().BeFalse();
    }

    [Fact]
    public async Task ExecuteAsync_WithoutSendingEmail_DoesNotSendInvitation()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "member@church.com",
            FirstName = "Mary",
            LastName = "Johnson",
            Roles = new[] { "Member" },
            SendInvitationEmail = false
        };
        var createdBy = "admin-789";

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-member-123",
            Message = "User created successfully",
            EmailVerificationSent = false,
            User = new UserProfileDto
            {
                Id = "user-member-123",
                Email = "member@church.com",
                FirstName = "Mary",
                LastName = "Johnson",
                Roles = new[] { "Member" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _useCase.ExecuteAsync(request, createdBy);

        // Assert
        result.Message.Should().Be("User created successfully");
        result.EmailVerificationSent.Should().BeFalse();
    }

    [Fact]
    public async Task ExecuteAsync_WhenEmailAlreadyExists_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "existing@church.com",
            FirstName = "Duplicate",
            LastName = "User",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Failed to create user: User with email 'existing@church.com' already exists"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("existing@church.com");
        exception.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task ExecuteAsync_WithNullOrEmptyEmail_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "",
            FirstName = "Test",
            LastName = "User",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("Email is required");
    }

    [Fact]
    public async Task ExecuteAsync_WithNullOrEmptyFirstName_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@church.com",
            FirstName = "   ",
            LastName = "User",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("First name is required");
    }

    [Fact]
    public async Task ExecuteAsync_WithNullOrEmptyLastName_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@church.com",
            FirstName = "Test",
            LastName = "",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("Last name is required");
    }

    [Fact]
    public async Task ExecuteAsync_WithNullOrEmptyCreatedBy_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@church.com",
            FirstName = "Test",
            LastName = "User",
            Roles = new[] { "Member" }
        };
        var createdBy = "";

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("Creator ID is required");
    }

    [Fact]
    public async Task ExecuteAsync_WithOptionalFields_CreatesUserWithAllFields()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "fulldetails@church.com",
            FirstName = "Robert",
            LastName = "Brown",
            JobTitle = "Church Administrator",
            PhoneNumber = "+44 20 7946 0958",
            Roles = new[] { "Admin" },
            SendInvitationEmail = true
        };
        var createdBy = "superadmin-123";

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-full-123",
            Message = "User invited successfully",
            EmailVerificationSent = true,
            User = new UserProfileDto
            {
                Id = "user-full-123",
                Email = "fulldetails@church.com",
                FirstName = "Robert",
                LastName = "Brown",
                JobTitle = "Church Administrator",
                PhoneNumber = "+44 20 7946 0958",
                Roles = new[] { "Admin" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _useCase.ExecuteAsync(request, createdBy);

        // Assert
        result.User.Should().NotBeNull();
        result.User!.JobTitle.Should().Be("Church Administrator");
        result.User.PhoneNumber.Should().Be("+44 20 7946 0958");
    }

    [Fact]
    public async Task ExecuteAsync_LogsInformationMessages()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "logging@church.com",
            FirstName = "Log",
            LastName = "Test",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-log-123",
            Message = "User created successfully",
            EmailVerificationSent = false,
            User = new UserProfileDto
            {
                Id = "user-log-123",
                Email = "logging@church.com",
                FirstName = "Log",
                LastName = "Test",
                Roles = new[] { "Member" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        await _useCase.ExecuteAsync(request, createdBy);

        // Assert - Verify logging occurred
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating user") && v.ToString()!.Contains("logging@church.com")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Successfully created user") && v.ToString()!.Contains("user-log-123")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WhenServiceThrowsException_ExceptionBubbles()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "error@church.com",
            FirstName = "Error",
            LastName = "Test",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection error"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Be("Database connection error");
    }

    [Fact]
    public async Task ExecuteAsync_WithInvalidRoles_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "invalidroles@church.com",
            FirstName = "Invalid",
            LastName = "Roles",
            Roles = new[] { "NonExistentRole" }
        };
        var createdBy = "admin-123";

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Failed to create user: Role 'NonExistentRole' does not exist"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _useCase.ExecuteAsync(request, createdBy));

        exception.Message.Should().Contain("NonExistentRole");
        exception.Message.Should().Contain("does not exist");
    }

    [Fact]
    public async Task ExecuteAsync_PassesCancellationTokenToService()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "cancellation@church.com",
            FirstName = "Cancel",
            LastName = "Test",
            Roles = new[] { "Member" }
        };
        var createdBy = "admin-123";
        var cancellationToken = new CancellationToken();

        var expectedResponse = new CreateUserResponse
        {
            UserId = "user-cancel-123",
            Message = "User created successfully",
            EmailVerificationSent = false,
            User = new UserProfileDto
            {
                Id = "user-cancel-123",
                Email = "cancellation@church.com",
                FirstName = "Cancel",
                LastName = "Test",
                Roles = new[] { "Member" },
                Status = UserAccountStatus.Invited
            }
        };

        _mockUserManagementService
            .Setup(s => s.CreateUserAsync(request, createdBy, cancellationToken))
            .ReturnsAsync(expectedResponse);

        // Act
        await _useCase.ExecuteAsync(request, createdBy, cancellationToken);

        // Assert
        _mockUserManagementService.Verify(
            s => s.CreateUserAsync(request, createdBy, cancellationToken),
            Times.Once);
    }
}
