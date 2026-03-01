using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentById;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for getting a risk assessment by ID
/// </summary>
public class GetRiskAssessmentByIdRequest
{
    /// <summary>
    /// Risk assessment ID
    /// </summary>
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for retrieving a risk assessment by ID
/// </summary>
public class GetRiskAssessmentByIdEndpoint : Endpoint<GetRiskAssessmentByIdRequest, RiskAssessmentDetailDto>
{
    private readonly IGetRiskAssessmentByIdUseCase _useCase;

    public GetRiskAssessmentByIdEndpoint(IGetRiskAssessmentByIdUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/risk-assessments/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsViewer, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin, SystemRoles.Deacon);
        Description(x => x
            .WithName("GetRiskAssessmentById")
            .WithSummary("Get a risk assessment by ID")
            .WithDescription("Retrieves detailed information about a specific risk assessment including approvals")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(GetRiskAssessmentByIdRequest req, CancellationToken ct)
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
