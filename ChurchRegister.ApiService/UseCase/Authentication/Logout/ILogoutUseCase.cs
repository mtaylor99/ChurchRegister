using ChurchRegister.ApiService.Models.Authentication;
using System.Security.Claims;

namespace ChurchRegister.ApiService.UseCase.Authentication.Logout;

public interface ILogoutUseCase
{
    Task<LogoutResponse> ExecuteAsync(ClaimsPrincipal user, string? ipAddress = null, CancellationToken cancellationToken = default);
}