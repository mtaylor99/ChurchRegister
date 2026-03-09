using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentCategories;

/// <summary>
/// Use case interface for retrieving all risk assessment categories
/// </summary>
public interface IGetRiskAssessmentCategoriesUseCase
{
    /// <summary>
    /// Executes the get risk assessment categories use case
    /// </summary>
    Task<List<RiskAssessmentCategoryDto>> ExecuteAsync(CancellationToken cancellationToken = default);
}
