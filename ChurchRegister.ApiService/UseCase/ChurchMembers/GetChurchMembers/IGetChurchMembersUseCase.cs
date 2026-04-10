using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers;

public interface IGetChurchMembersUseCase : IUseCase<ChurchMemberGridQuery, PagedResult<ChurchMemberDto>>
{
}
