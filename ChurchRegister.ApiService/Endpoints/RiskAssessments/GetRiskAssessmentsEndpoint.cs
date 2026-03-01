using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for getting risk assessments with filters
/// </summary>
public class GetRiskAssessmentsRequest
{
    /// <summary>
    /// Filter by category ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// Filter by status (Active/Pending Review/Draft)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Filter to show only overdue assessments
    /// </summary>
    public bool OverdueOnly { get; set; }

    /// <summary>
    /// Filter by title (case-insensitive contains search)
    /// </summary>
    public string? Title { get; set; }
}

/// <summary>
/// Endpoint for retrieving risk assessments with optional filters
/// </summary>
public class GetRiskAssessmentsEndpoint : Endpoint<GetRiskAssessmentsRequest, List<RiskAssessmentDto>>
{
    private readonly IGetRiskAssessmentsUseCase _useCase;

    public GetRiskAssessmentsEndpoint(IGetRiskAssessmentsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/risk-assessments");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsViewer, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin, SystemRoles.Deacon);
        Description(x => x
            .WithName("GetRiskAssessments")
            .WithSummary("Get all risk assessments")
            .WithDescription("Retrieves all risk assessments with optional filtering by category, status, and overdue status")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(GetRiskAssessmentsRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.CategoryId, req.Status, req.OverdueOnly, req.Title);
        await SendOkAsync(result, ct);
    }
}
