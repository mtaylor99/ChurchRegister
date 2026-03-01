using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessmentCategory;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Endpoint for creating a new risk assessment category
/// </summary>
public class CreateRiskAssessmentCategoryEndpoint : Endpoint<CreateCategoryRequest, RiskAssessmentCategoryDto>
{
    private readonly ICreateRiskAssessmentCategoryUseCase _useCase;

    public CreateRiskAssessmentCategoryEndpoint(ICreateRiskAssessmentCategoryUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/risk-assessment-categories");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("CreateRiskAssessmentCategory")
            .WithSummary("Create a new risk assessment category")
            .WithDescription("Creates a new risk assessment category with name and description")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(CreateCategoryRequest req, CancellationToken ct)
    {
        var createdBy = User.Identity?.Name ?? "System";
        var result = await _useCase.ExecuteAsync(req, createdBy, ct);

        await SendCreatedAtAsync<GetRiskAssessmentCategoriesEndpoint>(null, result, cancellation: ct);
    }
}
