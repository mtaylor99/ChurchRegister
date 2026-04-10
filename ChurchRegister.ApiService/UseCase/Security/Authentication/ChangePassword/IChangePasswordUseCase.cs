using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Authentication.ChangePassword;

public interface IChangePasswordUseCase
{
    Task ExecuteAsync(ChangePasswordRequest request, string userId, CancellationToken cancellationToken = default);
}
