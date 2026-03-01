using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrict;

/// <summary>
/// Use case interface for assigning a district to a church member
/// </summary>
public interface IAssignDistrictUseCase
{
    /// <summary>
    /// Execute the use case to assign or unassign a district
    /// </summary>
    /// <param name="memberId">Church member ID</param>
    /// <param name="request">District assignment request</param>
    /// <param name="modifiedBy">Username of the person making the change</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated church member details</returns>
    Task<ChurchMemberDetailDto> ExecuteAsync(int memberId, AssignDistrictRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
