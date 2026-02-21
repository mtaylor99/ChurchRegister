using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberRoles;

public class GetChurchMemberRolesUseCase : IGetChurchMemberRolesUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<GetChurchMemberRolesUseCase> _logger;

    public GetChurchMemberRolesUseCase(
        IChurchMemberService churchMemberService,
        ILogger<GetChurchMemberRolesUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<IEnumerable<ChurchMemberRoleDto>> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting church member roles");
        
        var result = await _churchMemberService.GetRolesAsync(cancellationToken);
        
        _logger.LogInformation("Retrieved {Count} church member roles", result.Count());
        return result;
    }
}
