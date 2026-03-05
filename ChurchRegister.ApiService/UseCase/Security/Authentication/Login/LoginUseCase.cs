using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ChurchRegister.ApiService.UseCase.Authentication.Login;

public class LoginUseCase : ILoginUseCase
{
    private readonly SignInManager<ChurchRegisterWebUser> _signInManager;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IRefreshTokenRepository _refreshTokenRepository;

    public LoginUseCase(
        SignInManager<ChurchRegisterWebUser> signInManager,
        UserManager<ChurchRegisterWebUser> userManager,
        IConfiguration configuration,
        IRefreshTokenRepository refreshTokenRepository)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _configuration = configuration;
        _refreshTokenRepository = refreshTokenRepository;
    }

    public async Task<LoginResponse> ExecuteAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Check account status - prevent login for inactive or locked accounts
        if (user.AccountStatus == Database.Enums.UserAccountStatus.Inactive)
        {
            throw new UnauthorizedAccessException(
                "Your account has been deactivated. Please contact the system administrator for assistance.");
        }

        if (user.AccountStatus == Database.Enums.UserAccountStatus.Locked)
        {
            throw new UnauthorizedAccessException(
                "Your account has been locked. Please contact the system administrator for assistance.");
        }

        // Check if user is locked out
        if (await _userManager.IsLockedOutAsync(user))
        {
            var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
            var timeRemaining = lockoutEnd.HasValue
                ? Math.Ceiling((lockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes)
                : 0;
            throw new UnauthorizedAccessException(
                $"Account is locked due to multiple failed login attempts. Please try again in {timeRemaining} minutes.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                var timeRemaining = lockoutEnd.HasValue
                    ? Math.Ceiling((lockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes)
                    : 0;
                throw new UnauthorizedAccessException(
                    $"Account is locked due to multiple failed login attempts. Please try again in {timeRemaining} minutes.");
            }
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Reset failed access count on successful login
        await _userManager.ResetAccessFailedCountAsync(user);

        // Generate JWT token
        var tokenString = await GenerateJwtTokenAsync(user);
        var accessTokenExpirationMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var accessMinutes) ? accessMinutes : 60;
        var expirationTime = DateTime.UtcNow.AddMinutes(accessTokenExpirationMinutes);

        // Generate and store refresh token
        var refreshToken = GenerateRefreshToken();
        var refreshTokenExpirationDays = int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out var days) ? days : 7;
        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedBy = user.Id,
            CreatedDateTime = DateTime.UtcNow
        };
        await _refreshTokenRepository.CreateAsync(refreshTokenEntity, cancellationToken);

        // Debug logging for roles and permissions
        var userRoles = await _userManager.GetRolesAsync(user);
        var userClaims = await _userManager.GetClaimsAsync(user);
        var permissions = userClaims.Where(c => c.Type == "permission").Select(c => c.Value).ToArray();

        Console.WriteLine($"Login successful for user: {user.Email}");
        Console.WriteLine($"Roles: {string.Join(", ", userRoles)}");
        Console.WriteLine($"Permissions: {string.Join(", ", permissions)}");

        return new LoginResponse
        {
            Message = "Login successful",
            User = await MapUserToDtoAsync(user),
            Tokens = new TokenDto
            {
                AccessToken = tokenString,
                RefreshToken = refreshToken,
                ExpiresIn = accessTokenExpirationMinutes * 60, // Convert minutes to seconds
                TokenType = "Bearer",
                ExpiresAt = expirationTime
            }
        };
    }

    private async Task<string> GenerateJwtTokenAsync(ChurchRegisterWebUser user)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "ChurchRegister-Super-Secret-Key-For-Development-Only-2024!");

        // Get user roles for JWT claims
        var userRoles = await _userManager.GetRolesAsync(user);

        // Use consistent UTC time
        var now = DateTime.UtcNow;
        var expirationMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var minutes) ? minutes : 60;
        var expires = now.AddMinutes(expirationMinutes);

        // Create claims including user roles
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add role claims
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            NotBefore = now, // Token valid from now
            IssuedAt = now,  // Token issued at current time
            Issuer = _configuration["Jwt:Issuer"] ?? "ChurchRegister.ApiService",
            Audience = _configuration["Jwt:Audience"] ?? "ChurchRegister.React",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private async Task<UserDto> MapUserToDtoAsync(ChurchRegisterWebUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = await _userManager.GetClaimsAsync(user);
        var permissions = claims.Where(c => c.Type == "permission").Select(c => c.Value).ToArray();

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            DisplayName = user.UserName ?? "",
            FirstName = user.UserName?.Split(' ').FirstOrDefault() ?? "",
            LastName = user.UserName?.Contains(' ') == true ? user.UserName.Split(' ').LastOrDefault() ?? "" : "",
            Roles = roles.ToArray(),
            Permissions = permissions,
            Avatar = !string.IsNullOrWhiteSpace(user.FirstName) && !string.IsNullOrWhiteSpace(user.LastName)
                ? $"{user.FirstName[0]}{user.LastName[0]}".ToUpper()
                : null,
            IsActive = true,
            EmailConfirmed = user.EmailConfirmed,
            LastLogin = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}