using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;

namespace ChurchRegister.ApiService.UseCase.Administration.RevokeUserTokens;

public interface IRevokeUserTokensUseCase
{
    Task<RevokeUserTokensResponse> ExecuteAsync(RevokeUserTokensRequest request, string revokedByIp, CancellationToken cancellationToken = default);
}
