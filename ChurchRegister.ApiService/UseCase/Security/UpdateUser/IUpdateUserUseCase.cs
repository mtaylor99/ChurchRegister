using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Security.UpdateUser;

public interface IUpdateUserUseCase
{
    Task<UserProfileDto> ExecuteAsync(UpdateUserRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
