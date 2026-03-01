using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.StartReview;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for starting a risk assessment review
/// </summary>
public class StartReviewRequest
{
    /// <summary>
    /// Risk assessment ID
    /// </summary>
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for starting a new review cycle
/// </summary>
public class StartReviewEndpoint : Endpoint<StartReviewRequest, RiskAssessmentDto>
{
    private readonly IStartReviewUseCase _useCase;

    public StartReviewEndpoint(IStartReviewUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/risk-assessments/{id}/start-review");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsAdmin, SystemRoles.Deacon);
        Description(x => x
            .WithName("StartReview")
            .WithSummary("Start a new review cycle")
            .WithDescription("Starts a new review cycle by clearing approvals and setting status to Pending Review")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(StartReviewRequest req, CancellationToken ct)
    {
        var modifiedBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req.Id, modifiedBy);

        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(result, ct);
    }
}
