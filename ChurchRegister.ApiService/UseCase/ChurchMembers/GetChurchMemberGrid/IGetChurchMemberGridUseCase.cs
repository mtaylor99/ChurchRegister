using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberGrid;

public interface IGetChurchMemberGridUseCase : IUseCase<ChurchMemberGridQuery, PagedResult<ChurchMemberDto>>
{
}
