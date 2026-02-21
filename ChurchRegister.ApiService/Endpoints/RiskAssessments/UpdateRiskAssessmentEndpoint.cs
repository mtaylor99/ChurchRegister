using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for updating a risk assessment including the ID from route
/// </summary>
 public class UpdateRiskAssessmentEndpointRequest : UpdateRiskAssessmentRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for updating a risk assessment
/// </summary>
public class UpdateRiskAssessmentEndpoint : Endpoint<UpdateRiskAssessmentEndpointRequest, RiskAssessmentDto>
{
    private readonly IUpdateRiskAssessmentUseCase _useCase;

    public UpdateRiskAssessmentEndpoint(IUpdateRiskAssessmentUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/risk-assessments/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("UpdateRiskAssessment")
            .WithSummary("Update a risk assessment")
            .WithDescription("Updates a risk assessment with new details. Changes to status, interval, or critical fields clear approvals.")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(UpdateRiskAssessmentEndpointRequest req, CancellationToken ct)
    {
        var modifiedBy = User.Identity?.Name ?? "System";
        var request = new UpdateRiskAssessmentRequest
        {
            Title = req.Title,
            Description = req.Description,
            ReviewInterval = req.ReviewInterval,
            Scope = req.Scope,
            Notes = req.Notes
        };
        var result = await _useCase.ExecuteAsync(req.Id, request, modifiedBy);
        
        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }
        
        await SendOkAsync(result, ct);
    }
}
