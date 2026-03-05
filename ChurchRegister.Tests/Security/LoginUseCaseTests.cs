using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.UseCase.Authentication.Login;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.Database.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.Security;

public class LoginUseCaseTests
{
    private readonly Mock<UserManager<ChurchRegisterWebUser>> _mockUserManager;
    private readonly Mock<SignInManager<ChurchRegisterWebUser>> _mockSignInManager;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly LoginUseCase _loginUseCase;

    public LoginUseCaseTests()
    {
        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<ChurchRegisterWebUser>>();
        _mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Mock SignInManager
        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ChurchRegisterWebUser>>();
        _mockSignInManager = new Mock<SignInManager<ChurchRegisterWebUser>>(
            _mockUserManager.Object,
            contextAccessorMock.Object,
            claimsFactoryMock.Object,
            null!, null!, null!, null!);

        // Mock Configuration
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(c => c["Jwt:Key"]).Returns("ChurchRegister-Super-Secret-Key-For-Testing-Minimum-32-Characters!");
        _mockConfiguration.Setup(c => c["Jwt:Issuer"]).Returns("ChurchRegister.ApiService");
        _mockConfiguration.Setup(c => c["Jwt:Audience"]).Returns("ChurchRegister.React");
        _mockConfiguration.Setup(c => c["Jwt:AccessTokenExpirationMinutes"]).Returns("60");
        _mockConfiguration.Setup(c => c["Jwt:RefreshTokenExpirationDays"]).Returns("7");

        // Mock RefreshTokenRepository
        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();

        _loginUseCase = new LoginUseCase(
            _mockSignInManager.Object,
            _mockUserManager.Object,
            _mockConfiguration.Object,
            _mockRefreshTokenRepository.Object);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com",
            EmailConfirmed = true
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(um => um.ResetAccessFailedCountAsync(testUser))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<System.Security.Claims.Claim>());
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken());

        // Act
        var result = await _loginUseCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Message.Should().Be("Login successful");
        result.User.Should().NotBeNull();
        result.User.Email.Should().Be(testUser.Email);
        result.Tokens.Should().NotBeNull();
        result.Tokens.AccessToken.Should().NotBeNullOrEmpty();
        result.Tokens.RefreshToken.Should().NotBeNullOrEmpty();
        result.Tokens.TokenType.Should().Be("Bearer");
        result.Tokens.ExpiresIn.Should().Be(3600); // 60 minutes in seconds

        _mockUserManager.Verify(um => um.ResetAccessFailedCountAsync(testUser), Times.Once);
        _mockRefreshTokenRepository.Verify(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_WithInvalidEmail_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync((ChurchRegisterWebUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _loginUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task ExecuteAsync_WithInvalidPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "WrongPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Failed);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _loginUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task ExecuteAsync_WithLockedOutUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "TestPassword123!"
        };

        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(30);

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(true);
        _mockUserManager.Setup(um => um.GetLockoutEndDateAsync(testUser))
            .ReturnsAsync(lockoutEnd);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _loginUseCase.ExecuteAsync(request));

        exception.Message.Should().Contain("Account is locked");
        exception.Message.Should().Contain("30 minutes");
    }

    [Fact]
    public async Task ExecuteAsync_WithAccountLockoutOnFailure_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "WrongPassword123!"
        };

        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15);

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.LockedOut);
        _mockUserManager.Setup(um => um.GetLockoutEndDateAsync(testUser))
            .ReturnsAsync(lockoutEnd);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _loginUseCase.ExecuteAsync(request));

        exception.Message.Should().Contain("Account is locked");
        exception.Message.Should().Contain("15 minutes");
    }

    [Fact]
    public async Task ExecuteAsync_WithValidCredentials_GeneratesJwtToken()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com"
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(um => um.ResetAccessFailedCountAsync(testUser))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "Admin", "User" });
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<System.Security.Claims.Claim>());
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken());

        // Act
        var result = await _loginUseCase.ExecuteAsync(request);

        // Assert
        result.Tokens.AccessToken.Should().NotBeNullOrEmpty();
        result.Tokens.AccessToken.Split('.').Should().HaveCount(3); // JWT has 3 parts
    }

    [Fact]
    public async Task ExecuteAsync_WithUnconfirmedEmail_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "unconfirmed@test.com",
            UserName = "unconfirmed@test.com",
            EmailConfirmed = false
        };

        var request = new LoginRequest
        {
            Email = "unconfirmed@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.NotAllowed);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _loginUseCase.ExecuteAsync(request));

        exception.Message.Should().Be("Invalid email or password");
    }

    [Theory]
    [InlineData(null, "Password123!")]
    [InlineData("", "Password123!")]
    [InlineData(" ", "Password123!")]
    [InlineData("test@test.com", null)]
    [InlineData("test@test.com", "")]
    [InlineData("test@test.com", " ")]
    public async Task ExecuteAsync_WithNullOrEmptyCredentials_ThrowsArgumentException(string email, string password)
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = email,
            Password = password
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(
            () => _loginUseCase.ExecuteAsync(request));
    }

    [Fact]
    public async Task ExecuteAsync_WithMultipleRoles_IncludesAllRolesInToken()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "admin@test.com",
            UserName = "admin@test.com",
            EmailConfirmed = true
        };

        var request = new LoginRequest
        {
            Email = "admin@test.com",
            Password = "TestPassword123!"
        };

        var roles = new List<string> { "Admin", "Elder", "Member" };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(um => um.ResetAccessFailedCountAsync(testUser))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(roles);
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<System.Security.Claims.Claim>());
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken());

        // Act
        var result = await _loginUseCase.ExecuteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.User.Should().NotBeNull();
        _mockUserManager.Verify(um => um.GetRolesAsync(testUser), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_OnSuccessfulLogin_ResetsAccessFailedCount()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com",
            EmailConfirmed = true,
            AccessFailedCount = 3
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(um => um.ResetAccessFailedCountAsync(testUser))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<System.Security.Claims.Claim>());
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken());

        // Act
        await _loginUseCase.ExecuteAsync(request);

        // Assert
        _mockUserManager.Verify(um => um.ResetAccessFailedCountAsync(testUser), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_OnSuccessfulLogin_CreatesRefreshToken()
    {
        // Arrange
        var testUser = new ChurchRegisterWebUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "testuser@test.com",
            UserName = "testuser@test.com",
            EmailConfirmed = true
        };

        var request = new LoginRequest
        {
            Email = "testuser@test.com",
            Password = "TestPassword123!"
        };

        _mockUserManager.Setup(um => um.FindByEmailAsync(request.Email))
            .ReturnsAsync(testUser);
        _mockUserManager.Setup(um => um.IsLockedOutAsync(testUser))
            .ReturnsAsync(false);
        _mockSignInManager.Setup(sm => sm.CheckPasswordSignInAsync(testUser, request.Password, true))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(um => um.ResetAccessFailedCountAsync(testUser))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(um => um.GetRolesAsync(testUser))
            .ReturnsAsync(new List<string> { "User" });
        _mockUserManager.Setup(um => um.GetClaimsAsync(testUser))
            .ReturnsAsync(new List<System.Security.Claims.Claim>());
        _mockRefreshTokenRepository.Setup(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken { Token = "refresh-token-value" });

        // Act
        var result = await _loginUseCase.ExecuteAsync(request);

        // Assert
        result.Tokens.RefreshToken.Should().NotBeNullOrEmpty();
        _mockRefreshTokenRepository.Verify(
            r => r.CreateAsync(It.Is<RefreshToken>(rt =>
                rt.UserId == testUser.Id &&
                rt.IsActive &&
                !rt.IsRevoked
            ), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
