using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus;

public interface IUpdateChurchMemberStatusUseCase
{
    Task<ChurchMemberDetailDto> ExecuteAsync(int memberId, UpdateChurchMemberStatusRequest request, string userId, CancellationToken cancellationToken = default);
}
