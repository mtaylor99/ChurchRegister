using ChurchRegister.ApiService.Models.Security;

namespace ChurchRegister.ApiService.UseCase.Security.GetSystemRoles;

public interface IGetSystemRolesUseCase : IUseCase<IEnumerable<SystemRoleDto>>
{
}
