using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Authentication.UpdateProfile;

public interface IUpdateProfileUseCase
{
    Task<ChurchRegisterWebUser> ExecuteAsync(UpdateProfileRequest request, string userId, CancellationToken cancellationToken = default);
}
