using FastEndpoints;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// Request model for getting contribution history
/// </summary>
public class GetContributionHistoryRequest
{
    /// <summary>
    /// Church member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Start date for filtering (optional, if not provided returns all records)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// End date for filtering (optional, if not provided returns all records)
    /// </summary>
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// Endpoint for retrieving contribution history for a church member
/// </summary>
public class GetContributionHistoryEndpoint : Endpoint<GetContributionHistoryRequest, List<ContributionHistoryDto>>
{
    private readonly IGetContributionHistoryUseCase _useCase;
    private readonly ILogger<GetContributionHistoryEndpoint> _logger;

    public GetContributionHistoryEndpoint(
        IGetContributionHistoryUseCase useCase,
        ILogger<GetContributionHistoryEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/church-members/{memberId}/contributions");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialViewer,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("GetContributionHistory")
            .WithSummary("Get contribution history for a church member")
            .WithDescription("Retrieves contribution records for a specific church member with optional date range filtering")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(GetContributionHistoryRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _useCase.ExecuteAsync(req.MemberId, req.StartDate, req.EndDate, ct);
            await SendOkAsync(result, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Member not found");
            await SendNotFoundAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching contribution history for member {MemberId}", req.MemberId);
            await SendAsync(new List<ContributionHistoryDto>(), 500, ct);
        }
    }
}
