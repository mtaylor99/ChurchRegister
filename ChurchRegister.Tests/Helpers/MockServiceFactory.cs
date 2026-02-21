using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.ApiService.Services.Contributions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;

namespace ChurchRegister.Tests.Helpers;

/// <summary>
/// Factory for creating commonly used mock services with sensible defaults.
/// Reduces boilerplate in test setup.
/// </summary>
public static class MockServiceFactory
{
    /// <summary>
    /// Creates a mock ILogger<T> with no-op implementation.
    /// </summary>
    public static Mock<ILogger<T>> CreateLogger<T>()
    {
        return new Mock<ILogger<T>>();
    }

    /// <summary>
    /// Creates a mock UserManager with required dependencies.
    /// </summary>
    public static Mock<UserManager<ChurchRegisterWebUser>> CreateUserManager()
    {
        var store = new Mock<IUserStore<ChurchRegisterWebUser>>();
        var passwordHasher = new Mock<IPasswordHasher<ChurchRegisterWebUser>>();
        var userValidators = new List<IUserValidator<ChurchRegisterWebUser>>();
        var passwordValidators = new List<IPasswordValidator<ChurchRegisterWebUser>>();
        var keyNormalizer = new Mock<ILookupNormalizer>();
        var errors = new Mock<IdentityErrorDescriber>();
        var services = new Mock<IServiceProvider>();
        var logger = new Mock<ILogger<UserManager<ChurchRegisterWebUser>>>();

        return new Mock<UserManager<ChurchRegisterWebUser>>(
            store.Object,
            null,
            passwordHasher.Object,
            userValidators,
            passwordValidators,
            keyNormalizer.Object,
            errors.Object,
            services.Object,
            logger.Object);
    }

    /// <summary>
    /// Creates a mock SignInManager with required dependencies.
    /// </summary>
    public static Mock<SignInManager<ChurchRegisterWebUser>> CreateSignInManager(Mock<UserManager<ChurchRegisterWebUser>>? userManager = null)
    {
        userManager ??= CreateUserManager();
        
        var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ChurchRegisterWebUser>>();
        var optionsAccessor = new Mock<Microsoft.Extensions.Options.IOptions<IdentityOptions>>();
        var logger = new Mock<ILogger<SignInManager<ChurchRegisterWebUser>>>();
        var schemes = new Mock<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();
        var confirmation = new Mock<IUserConfirmation<ChurchRegisterWebUser>>();

        return new Mock<SignInManager<ChurchRegisterWebUser>>(
            userManager.Object,
            contextAccessor.Object,
            claimsFactory.Object,
            optionsAccessor.Object,
            logger.Object,
            schemes.Object,
            confirmation.Object);
    }

    /// <summary>
    /// Creates a mock RoleManager with required dependencies.
    /// </summary>
    public static Mock<RoleManager<IdentityRole>> CreateRoleManager()
    {
        var store = new Mock<IRoleStore<IdentityRole>>();
        var roleValidators = new List<IRoleValidator<IdentityRole>>();
        var keyNormalizer = new Mock<ILookupNormalizer>();
        var errors = new Mock<IdentityErrorDescriber>();
        var logger = new Mock<ILogger<RoleManager<IdentityRole>>>();

        return new Mock<RoleManager<IdentityRole>>(
            store.Object,
            roleValidators,
            keyNormalizer.Object,
            errors.Object,
            logger.Object);
    }

    /// <summary>
    /// Creates a mock IRegisterNumberService.
    /// </summary>
    public static Mock<IRegisterNumberService> CreateRegisterNumberService()
    {
        var mock = new Mock<IRegisterNumberService>();
        
        // Setup default behavior: return sequential register numbers
        var nextRegisterNumber = 1000;
        mock.Setup(x => x.GetNextAvailableNumberAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => nextRegisterNumber++);

        return mock;
    }

    /// <summary>
    /// Creates a mock IAzureEmailService.
    /// </summary>
    public static Mock<IAzureEmailService> CreateEmailService()
    {
        var mock = new Mock<IAzureEmailService>();
        
        // Setup default behavior: email sending succeeds
        mock.Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync(true);

        return mock;
    }

    /// <summary>
    /// Creates a mock IContributionProcessingService.
    /// </summary>
    public static Mock<IContributionProcessingService> CreateContributionService()
    {
        return new Mock<IContributionProcessingService>();
    }

    /// <summary>
    /// Creates a mock IHsbcTransactionImportService.
    /// </summary>
    public static Mock<IHsbcTransactionImportService> CreateHsbcTransactionImportService()
    {
        return new Mock<IHsbcTransactionImportService>();
    }

    /// <summary>
    /// Creates a mock IEnvelopeContributionService.
    /// </summary>
    public static Mock<IEnvelopeContributionService> CreateEnvelopeContributionService()
    {
        return new Mock<IEnvelopeContributionService>();
    }

    /// <summary>
    /// Creates a mock IChurchMemberService.
    /// </summary>
    public static Mock<IChurchMemberService> CreateChurchMemberService()
    {
        return new Mock<IChurchMemberService>();
    }

    /// <summary>
    /// Configures a UserManager mock to return a specific user by email.
    /// </summary>
    public static void SetupFindByEmail(
        this Mock<UserManager<ChurchRegisterWebUser>> mockUserManager,
        string email,
        ChurchRegisterWebUser? user)
    {
        mockUserManager
            .Setup(x => x.FindByEmailAsync(email))
            .ReturnsAsync(user);
    }

    /// <summary>
    /// Configures a UserManager mock to return a specific user by ID.
    /// </summary>
    public static void SetupFindById(
        this Mock<UserManager<ChurchRegisterWebUser>> mockUserManager,
        string userId,
        ChurchRegisterWebUser? user)
    {
        mockUserManager
            .Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);
    }

    /// <summary>
    /// Configures a UserManager mock to return specific roles for a user.
    /// </summary>
    public static void SetupGetRoles(
        this Mock<UserManager<ChurchRegisterWebUser>> mockUserManager,
        ChurchRegisterWebUser user,
        params string[] roles)
    {
        mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles.ToList());
    }

    /// <summary>
    /// Configures a UserManager mock for successful password verification.
    /// </summary>
    public static void SetupCheckPassword(
        this Mock<UserManager<ChurchRegisterWebUser>> mockUserManager,
        ChurchRegisterWebUser user,
        string password,
        bool success = true)
    {
        mockUserManager
            .Setup(x => x.CheckPasswordAsync(user, password))
            .ReturnsAsync(success);
    }

    /// <summary>
    /// Configures a SignInManager mock for successful password sign-in.
    /// </summary>
    public static void SetupPasswordSignIn(
        this Mock<SignInManager<ChurchRegisterWebUser>> mockSignInManager,
        string email,
        string password,
        Microsoft.AspNetCore.Identity.SignInResult result)
    {
        mockSignInManager
            .Setup(x => x.PasswordSignInAsync(email, password, It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(result);
    }
}
