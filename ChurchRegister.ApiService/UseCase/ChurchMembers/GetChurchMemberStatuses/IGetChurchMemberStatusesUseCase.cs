using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses;

public interface IGetChurchMemberStatusesUseCase : IUseCase<IEnumerable<ChurchMemberStatusDto>>
{
}
