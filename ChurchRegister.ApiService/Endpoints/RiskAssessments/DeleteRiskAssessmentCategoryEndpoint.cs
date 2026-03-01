using FastEndpoints;
using ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessmentCategory;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for deleting a category
/// </summary>
public class DeleteRiskAssessmentCategoryEndpointRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for deleting a risk assessment category
/// </summary>
public class DeleteRiskAssessmentCategoryEndpoint : Endpoint<DeleteRiskAssessmentCategoryEndpointRequest>
{
    private readonly IDeleteRiskAssessmentCategoryUseCase _useCase;

    public DeleteRiskAssessmentCategoryEndpoint(IDeleteRiskAssessmentCategoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/risk-assessment-categories/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("DeleteRiskAssessmentCategory")
            .WithSummary("Delete a risk assessment category")
            .WithDescription("Deletes a risk assessment category if it has no associated risk assessments")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(DeleteRiskAssessmentCategoryEndpointRequest req, CancellationToken ct)
    {
        await _useCase.ExecuteAsync(req.Id, ct);
        await SendNoContentAsync(ct);
    }
}
