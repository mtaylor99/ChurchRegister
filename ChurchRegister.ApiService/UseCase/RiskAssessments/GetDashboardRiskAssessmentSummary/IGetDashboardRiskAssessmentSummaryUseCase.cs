using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetDashboardRiskAssessmentSummary;

/// <summary>
/// Use case interface for retrieving the dashboard risk assessment summary
/// </summary>
public interface IGetDashboardRiskAssessmentSummaryUseCase
{
    /// <summary>
    /// Executes the get dashboard risk assessment summary use case
    /// </summary>
    Task<DashboardRiskAssessmentSummaryDto> ExecuteAsync(CancellationToken cancellationToken = default);
}
