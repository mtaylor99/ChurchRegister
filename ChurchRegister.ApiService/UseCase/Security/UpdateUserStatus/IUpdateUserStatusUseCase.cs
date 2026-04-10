using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus;

public interface IUpdateUserStatusUseCase
{
    Task<UserProfileDto> ExecuteAsync(UpdateUserStatusRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
