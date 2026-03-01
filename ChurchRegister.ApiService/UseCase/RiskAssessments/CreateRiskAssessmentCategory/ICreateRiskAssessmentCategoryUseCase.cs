using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessmentCategory;

/// <summary>
/// Use case interface for creating a new risk assessment category
/// </summary>
public interface ICreateRiskAssessmentCategoryUseCase
{
    /// <summary>
    /// Executes the create risk assessment category use case
    /// </summary>
    Task<RiskAssessmentCategoryDto> ExecuteAsync(CreateCategoryRequest request, string createdBy, CancellationToken cancellationToken = default);
}
