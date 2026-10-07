using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberGrid;

public class GetChurchMemberGridUseCase : IGetChurchMemberGridUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<GetChurchMemberGridUseCase> _logger;

    public GetChurchMemberGridUseCase(
        IChurchMemberService churchMemberService,
        ILogger<GetChurchMemberGridUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<PagedResult<ChurchMemberDto>> ExecuteAsync(
        ChurchMemberGridQuery request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting church member grid - Page: {Page}, PageSize: {PageSize}",
            request.Page, request.PageSize);

        var result = await _churchMemberService.GetChurchMemberGridAsync(request, cancellationToken);

        _logger.LogInformation("Retrieved {Count} grid members out of {Total}",
            result.Items.Count(), result.TotalCount);
        return result;
    }
}
