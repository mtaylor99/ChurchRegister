using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.UpdateRiskAssessmentCategory;

/// <summary>
/// Use case implementation for updating an existing risk assessment category
/// </summary>
public class UpdateRiskAssessmentCategoryUseCase : IUpdateRiskAssessmentCategoryUseCase
{
    private readonly IRiskAssessmentCategoryService _categoryService;
    private readonly ILogger<UpdateRiskAssessmentCategoryUseCase> _logger;

    public UpdateRiskAssessmentCategoryUseCase(
        IRiskAssessmentCategoryService categoryService,
        ILogger<UpdateRiskAssessmentCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentCategoryDto?> ExecuteAsync(int id, UpdateCategoryRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating risk assessment category: {CategoryId} by {ModifiedBy}", id, modifiedBy);

            var result = await _categoryService.UpdateCategoryAsync(id, request, modifiedBy);

            _logger.LogInformation("Successfully updated risk assessment category: {CategoryId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating risk assessment category: {CategoryId}", id);
            throw;
        }
    }
}
