using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberStatuses;

public class GetChurchMemberStatusesUseCase : IGetChurchMemberStatusesUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<GetChurchMemberStatusesUseCase> _logger;

    public GetChurchMemberStatusesUseCase(
        IChurchMemberService churchMemberService,
        ILogger<GetChurchMemberStatusesUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<IEnumerable<ChurchMemberStatusDto>> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting church member statuses");
        
        var result = await _churchMemberService.GetStatusesAsync(cancellationToken);
        
        _logger.LogInformation("Retrieved {Count} church member statuses", result.Count());
        return result;
    }
}
