using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Interfaces;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace ChurchRegister.ApiService.UseCase.Authentication.Logout;

public class LogoutUseCase : ILogoutUseCase
{
    private readonly SignInManager<ChurchRegisterWebUser> _signInManager;
    private readonly IRefreshTokenRepository _refreshTokenRepository;

    public LogoutUseCase(
        SignInManager<ChurchRegisterWebUser> signInManager,
        IRefreshTokenRepository refreshTokenRepository)
    {
        _signInManager = signInManager;
        _refreshTokenRepository = refreshTokenRepository;
    }

    public async Task<LogoutResponse> ExecuteAsync(ClaimsPrincipal user, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        await _signInManager.SignOutAsync();
        
        // Revoke all refresh tokens for the user
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await _refreshTokenRepository.RevokeAllForUserAsync(userId, ipAddress, cancellationToken);
        }
        
        return new LogoutResponse 
        { 
            Message = "Logout successful" 
        };
    }
}