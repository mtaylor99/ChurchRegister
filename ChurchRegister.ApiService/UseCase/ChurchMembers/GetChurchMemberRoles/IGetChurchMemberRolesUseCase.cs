using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles;

public interface IGetChurchMemberRolesUseCase : IUseCase<IEnumerable<ChurchMemberRoleDto>>
{
}
