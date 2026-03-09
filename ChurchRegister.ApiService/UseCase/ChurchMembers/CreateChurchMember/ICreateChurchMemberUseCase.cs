using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember;

/// <summary>
/// Use case interface for creating a new church member
/// </summary>
public interface ICreateChurchMemberUseCase
{
    Task<CreateChurchMemberResponse> ExecuteAsync(CreateChurchMemberRequest request, string userId, CancellationToken cancellationToken = default);
}
