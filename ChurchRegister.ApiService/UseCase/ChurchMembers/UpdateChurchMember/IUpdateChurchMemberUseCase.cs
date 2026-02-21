using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember;

public interface IUpdateChurchMemberUseCase
{
    Task<ChurchMemberDetailDto> ExecuteAsync(UpdateChurchMemberRequest request, string userId, CancellationToken cancellationToken = default);
}
