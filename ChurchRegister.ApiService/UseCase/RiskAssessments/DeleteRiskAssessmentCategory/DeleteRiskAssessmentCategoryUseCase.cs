using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessmentCategory;

/// <summary>
/// Use case implementation for deleting a risk assessment category
/// </summary>
public class DeleteRiskAssessmentCategoryUseCase : IDeleteRiskAssessmentCategoryUseCase
{
    private readonly IRiskAssessmentCategoryService _categoryService;
    private readonly ILogger<DeleteRiskAssessmentCategoryUseCase> _logger;

    public DeleteRiskAssessmentCategoryUseCase(
        IRiskAssessmentCategoryService categoryService,
        ILogger<DeleteRiskAssessmentCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting risk assessment category: {CategoryId}", id);

            await _categoryService.DeleteCategoryAsync(id);

            _logger.LogInformation("Successfully deleted risk assessment category: {CategoryId}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting risk assessment category: {CategoryId}", id);
            throw;
        }
    }
}
