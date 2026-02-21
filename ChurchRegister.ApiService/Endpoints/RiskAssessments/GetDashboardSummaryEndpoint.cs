using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Endpoint for getting dashboard risk assessment summary
/// </summary>
public class GetDashboardSummaryEndpoint : EndpointWithoutRequest<DashboardRiskAssessmentSummaryDto>
{
    private readonly IGetDashboardRiskAssessmentSummaryUseCase _useCase;

    public GetDashboardSummaryEndpoint(IGetDashboardRiskAssessmentSummaryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/risk-assessments/dashboard-summary");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsViewer, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin, SystemRoles.Deacon);
        Description(x => x
            .WithName("GetDashboardSummary")
            .WithSummary("Get risk assessment dashboard summary")
            .WithDescription("Retrieves summary statistics for risk assessments dashboard widget")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync();
        await SendOkAsync(result, ct);
    }
}
