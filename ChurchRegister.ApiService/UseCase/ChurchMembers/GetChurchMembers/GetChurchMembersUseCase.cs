using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMembers;

public class GetChurchMembersUseCase : IGetChurchMembersUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<GetChurchMembersUseCase> _logger;

    public GetChurchMembersUseCase(
        IChurchMemberService churchMemberService,
        ILogger<GetChurchMembersUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<PagedResult<ChurchMemberDto>> ExecuteAsync(
        ChurchMemberGridQuery request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting church members - Page: {Page}, PageSize: {PageSize}",
            request.Page, request.PageSize);

        var result = await _churchMemberService.GetChurchMembersAsync(request, cancellationToken);

        _logger.LogInformation("Retrieved {Count} church members out of {Total}",
            result.Items.Count(), result.TotalCount);
        return result;
    }
}
