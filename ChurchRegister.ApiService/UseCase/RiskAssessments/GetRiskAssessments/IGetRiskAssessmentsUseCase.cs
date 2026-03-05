using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessments;

/// <summary>
/// Use case interface for retrieving a filtered list of risk assessments
/// </summary>
public interface IGetRiskAssessmentsUseCase
{
    /// <summary>
    /// Executes the get risk assessments use case
    /// </summary>
    Task<List<RiskAssessmentDto>> ExecuteAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null, CancellationToken cancellationToken = default);
}
