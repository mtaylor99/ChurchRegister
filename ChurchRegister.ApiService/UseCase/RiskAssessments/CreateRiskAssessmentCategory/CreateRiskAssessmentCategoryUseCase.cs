using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessmentCategory;

/// <summary>
/// Use case implementation for creating a new risk assessment category
/// </summary>
public class CreateRiskAssessmentCategoryUseCase : ICreateRiskAssessmentCategoryUseCase
{
    private readonly IRiskAssessmentCategoryService _categoryService;
    private readonly ILogger<CreateRiskAssessmentCategoryUseCase> _logger;

    public CreateRiskAssessmentCategoryUseCase(
        IRiskAssessmentCategoryService categoryService,
        ILogger<CreateRiskAssessmentCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentCategoryDto> ExecuteAsync(CreateCategoryRequest request, string createdBy, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating risk assessment category: {CategoryName} by {CreatedBy}", request.Name, createdBy);

            var result = await _categoryService.CreateCategoryAsync(request, createdBy);

            _logger.LogInformation("Successfully created risk assessment category with ID: {CategoryId}", result.Id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating risk assessment category: {CategoryName}", request.Name);
            throw;
        }
    }
}
