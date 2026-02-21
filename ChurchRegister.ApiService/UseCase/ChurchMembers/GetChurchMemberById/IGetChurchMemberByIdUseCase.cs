using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById;

public interface IGetChurchMemberByIdUseCase
{
    Task<ChurchMemberDetailDto?> ExecuteAsync(int memberId, CancellationToken cancellationToken = default);
}
