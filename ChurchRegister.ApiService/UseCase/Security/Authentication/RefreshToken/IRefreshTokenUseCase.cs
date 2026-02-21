using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Authentication.RefreshToken;

public interface IRefreshTokenUseCase
{
    Task<RefreshTokenResponse> ExecuteAsync(RefreshTokenRequest request, string? ipAddress = null, CancellationToken cancellationToken = default);
}
