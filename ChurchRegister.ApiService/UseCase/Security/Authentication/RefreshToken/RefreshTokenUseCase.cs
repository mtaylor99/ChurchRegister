using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ChurchRegister.ApiService.UseCase.Authentication.RefreshToken;

public class RefreshTokenUseCase : IRefreshTokenUseCase
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly IConfiguration _configuration;

    public RefreshTokenUseCase(
        IRefreshTokenRepository refreshTokenRepository,
        UserManager<ChurchRegisterWebUser> userManager,
        IConfiguration configuration)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<RefreshTokenResponse> ExecuteAsync(RefreshTokenRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        // Validate refresh token
        var refreshToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        // Get user
        var user = await _userManager.FindByIdAsync(refreshToken.UserId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Generate new tokens
        var newAccessToken = await GenerateJwtTokenAsync(user);
        var newRefreshToken = GenerateRefreshToken();

        // Store new refresh token
        var refreshTokenExpirationDays = int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out var days) ? days : 7;
        var refreshTokenEntity = new Database.Entities.RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedByIp = ipAddress,
            CreatedBy = user.Id,
            CreatedDateTime = DateTime.UtcNow
        };

        await _refreshTokenRepository.CreateAsync(refreshTokenEntity, cancellationToken);

        // Revoke old refresh token (token rotation)
        await _refreshTokenRepository.RevokeAsync(
            refreshToken.Token,
            ipAddress,
            newRefreshToken,
            cancellationToken);

        var accessTokenExpirationMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var minutes) ? minutes : 60;

        return new RefreshTokenResponse
        {
            Message = "Token refreshed successfully",
            Tokens = new TokenDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = accessTokenExpirationMinutes * 60, // Convert minutes to seconds
                TokenType = "Bearer",
                ExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpirationMinutes)
            }
        };
    }

    private async Task<string> GenerateJwtTokenAsync(ChurchRegisterWebUser user)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured"));

        // Get user roles
        var userRoles = await _userManager.GetRolesAsync(user);

        var now = DateTime.UtcNow;
        var expirationMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpirationMinutes"], out var minutes) ? minutes : 60;
        var expires = now.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            NotBefore = now,
            IssuedAt = now,
            Issuer = _configuration["Jwt:Issuer"] ?? "ChurchRegister.ApiService",
            Audience = _configuration["Jwt:Audience"] ?? "ChurchRegister.React",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
