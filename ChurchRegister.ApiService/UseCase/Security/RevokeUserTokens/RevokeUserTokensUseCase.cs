using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.Database.Interfaces;
using Microsoft.AspNetCore.Identity;
using ChurchRegister.Database.Data;

namespace ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens;

public class RevokeUserTokensUseCase : IRevokeUserTokensUseCase
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<RevokeUserTokensUseCase> _logger;

    public RevokeUserTokensUseCase(
        IRefreshTokenRepository refreshTokenRepository,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<RevokeUserTokensUseCase> logger)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<RevokeUserTokensResponse> ExecuteAsync(RevokeUserTokensRequest request, string revokedByIp, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verify user exists
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return new RevokeUserTokensResponse
                {
                    Success = false,
                    Message = "User not found",
                    TokensRevoked = 0
                };
            }

            // Get count of active tokens before revocation
            var activeTokens = await _refreshTokenRepository.GetActiveTokensForUserAsync(request.UserId, cancellationToken);
            var tokenCount = activeTokens.Count();

            // Revoke all tokens for the user
            await _refreshTokenRepository.RevokeAllForUserAsync(request.UserId, revokedByIp, cancellationToken);

            var reason = !string.IsNullOrWhiteSpace(request.Reason) ? request.Reason : "Admin revocation";
            _logger.LogWarning(
                "Admin revoked all tokens for user {UserId} ({Email}). Reason: {Reason}. Tokens revoked: {Count}",
                user.Id,
                user.Email,
                reason,
                tokenCount);

            return new RevokeUserTokensResponse
            {
                Success = true,
                Message = $"Successfully revoked {tokenCount} token(s) for user {user.Email}",
                TokensRevoked = tokenCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking tokens for user {UserId}", request.UserId);
            throw new InvalidOperationException("An error occurred while revoking user tokens", ex);
        }
    }
}
