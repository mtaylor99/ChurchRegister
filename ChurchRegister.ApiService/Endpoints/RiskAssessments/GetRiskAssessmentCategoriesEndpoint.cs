using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Endpoint for getting all risk assessment categories
/// </summary>
public class GetRiskAssessmentCategoriesEndpoint : EndpointWithoutRequest<List<RiskAssessmentCategoryDto>>
{
    private readonly IGetRiskAssessmentCategoriesUseCase _useCase;

    public GetRiskAssessmentCategoriesEndpoint(IGetRiskAssessmentCategoriesUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/risk-assessment-categories");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsViewer, SystemRoles.RiskAssessmentsContributor, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("GetRiskAssessmentCategories")
            .WithSummary("Get all risk assessment categories")
            .WithDescription("Retrieves all risk assessment categories ordered by sort order")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync();
        await SendOkAsync(result, ct);
    }
}
