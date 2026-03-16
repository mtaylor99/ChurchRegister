using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Security.GetUsers;

public interface IGetUsersUseCase : IUseCase<UserGridQuery, PagedResult<UserProfileDto>>
{
}
