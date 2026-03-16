using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentHistory;

/// <summary>
/// Use case interface for retrieving risk assessment version history
/// </summary>
public interface IGetRiskAssessmentHistoryUseCase
{
    /// <summary>
    /// Executes the get risk assessment history use case
    /// </summary>
    Task<RiskAssessmentHistoryDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
