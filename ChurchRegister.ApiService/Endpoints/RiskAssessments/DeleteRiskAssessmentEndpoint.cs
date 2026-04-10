using FastEndpoints;
using ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessment;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for deleting a risk assessment
/// </summary>
public record DeleteRiskAssessmentRequest
{
    public int Id { get; init; }
}

/// <summary>
/// Endpoint for deleting a risk assessment
/// </summary>
public class DeleteRiskAssessmentEndpoint : Endpoint<DeleteRiskAssessmentRequest>
{
    private readonly IDeleteRiskAssessmentUseCase _useCase;

    public DeleteRiskAssessmentEndpoint(IDeleteRiskAssessmentUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/risk-assessments/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("DeleteRiskAssessment")
            .WithSummary("Delete a risk assessment")
            .WithDescription("Removes a risk assessment and its approvals from the system")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(DeleteRiskAssessmentRequest req, CancellationToken ct)
    {
        try
        {
            await _useCase.ExecuteAsync(req.Id, ct);
            await Send.NoContentAsync(ct);
        }
        catch (KeyNotFoundException)
        {
            await Send.NotFoundAsync(ct);
        }
    }
}
