using ChurchRegister.ApiService.Models.Administration;

namespace ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens;

public interface IRevokeUserTokensUseCase
{
    Task<RevokeUserTokensResponse> ExecuteAsync(RevokeUserTokensRequest request, string revokedByIp, CancellationToken cancellationToken = default);
}
