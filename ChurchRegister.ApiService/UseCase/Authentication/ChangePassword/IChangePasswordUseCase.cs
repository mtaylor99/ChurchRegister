using ChurchRegister.ApiService.Models.Authentication;

namespace ChurchRegister.ApiService.UseCase.Authentication.ChangePassword;

public interface IChangePasswordUseCase
{
    Task ExecuteAsync(ChangePasswordRequest request, string userId, CancellationToken cancellationToken = default);
}
