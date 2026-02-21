using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for getting risk assessment history
/// </summary>
public class GetRiskAssessmentHistoryRequest
{
    /// <summary>
    /// Risk assessment ID
    /// </summary>
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving risk assessment version history
/// </summary>
public class GetRiskAssessmentHistoryEndpoint : Endpoint<GetRiskAssessmentHistoryRequest, RiskAssessmentHistoryDto>
{
    private readonly GetRiskAssessmentHistoryUseCase _useCase;

    public GetRiskAssessmentHistoryEndpoint(GetRiskAssessmentHistoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/risk-assessments/{id}/history");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsViewer, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin, SystemRoles.Deacon);
        Description(x => x
            .WithName("GetRiskAssessmentHistory")
            .WithSummary("Get risk assessment version history")
            .WithDescription("Retrieves historical approval cycles for a risk assessment")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(GetRiskAssessmentHistoryRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.Id);
        
        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(result, ct);
    }
}
