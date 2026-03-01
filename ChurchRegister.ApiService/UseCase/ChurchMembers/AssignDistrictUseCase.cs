using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.AssignDistrict;

/// <summary>
/// Use case for assigning a district to a church member
/// </summary>
public class AssignDistrictUseCase : IAssignDistrictUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<AssignDistrictUseCase> _logger;

    public AssignDistrictUseCase(
        IChurchMemberService churchMemberService,
        ILogger<AssignDistrictUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<ChurchMemberDetailDto> ExecuteAsync(
        int memberId,
        AssignDistrictRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Assigning district {DistrictId} to church member {MemberId} by {ModifiedBy}",
            request.DistrictId,
            memberId,
            modifiedBy);

        try
        {
            var result = await _churchMemberService.AssignDistrictAsync(
                memberId,
                request,
                modifiedBy,
                cancellationToken);

            _logger.LogInformation(
                "Successfully assigned district {DistrictId} to church member {MemberId}",
                request.DistrictId,
                memberId);

            return result;
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Church member {MemberId} not found", memberId);
            throw;
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid district ID {DistrictId}", request.DistrictId);
            throw;
        }
    }
}
