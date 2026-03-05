using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.UpdateRiskAssessmentCategory;

/// <summary>
/// Use case interface for updating an existing risk assessment category
/// </summary>
public interface IUpdateRiskAssessmentCategoryUseCase
{
    /// <summary>
    /// Executes the update risk assessment category use case
    /// </summary>
    Task<RiskAssessmentCategoryDto?> ExecuteAsync(int id, UpdateCategoryRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
