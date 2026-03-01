using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessment;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Endpoint for creating a new risk assessment
/// </summary>
public class CreateRiskAssessmentEndpoint : Endpoint<CreateRiskAssessmentRequest, RiskAssessmentDto>
{
    private readonly ICreateRiskAssessmentUseCase _useCase;

    public CreateRiskAssessmentEndpoint(ICreateRiskAssessmentUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/risk-assessments");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("CreateRiskAssessment")
            .WithSummary("Create a new risk assessment")
            .WithDescription("Creates a new risk assessment with status 'Under Review'")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(CreateRiskAssessmentRequest req, CancellationToken ct)
    {
        var createdBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req, createdBy, ct);

        await SendCreatedAtAsync<GetRiskAssessmentByIdEndpoint>(
            new { id = result.Id },
            result,
            cancellation: ct);
    }
}
