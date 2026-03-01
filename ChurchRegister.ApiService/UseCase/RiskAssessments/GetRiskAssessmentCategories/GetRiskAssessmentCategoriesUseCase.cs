using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentCategories;

/// <summary>
/// Use case implementation for retrieving all risk assessment categories
/// </summary>
public class GetRiskAssessmentCategoriesUseCase : IGetRiskAssessmentCategoriesUseCase
{
    private readonly IRiskAssessmentCategoryService _riskAssessmentCategoryService;
    private readonly ILogger<GetRiskAssessmentCategoriesUseCase> _logger;

    public GetRiskAssessmentCategoriesUseCase(
        IRiskAssessmentCategoryService riskAssessmentCategoryService,
        ILogger<GetRiskAssessmentCategoriesUseCase> logger)
    {
        _riskAssessmentCategoryService = riskAssessmentCategoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<RiskAssessmentCategoryDto>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting risk assessment categories");

            var result = await _riskAssessmentCategoryService.GetCategoriesAsync();

            _logger.LogInformation("Successfully retrieved {Count} risk assessment categories", result.Count);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving risk assessment categories");
            throw;
        }
    }
}
