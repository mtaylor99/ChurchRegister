using ChurchRegister.ApiService.Models.Security;
using System.Security.Claims;

namespace ChurchRegister.ApiService.UseCase.Authentication.GetCurrentUser;

public interface IGetCurrentUserUseCase
{
    Task<UserDto> ExecuteAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
}