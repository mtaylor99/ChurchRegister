using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.UpdateRiskAssessment;

/// <summary>
/// Use case interface for updating an existing risk assessment
/// </summary>
public interface IUpdateRiskAssessmentUseCase
{
    /// <summary>
    /// Executes the update risk assessment use case
    /// </summary>
    Task<RiskAssessmentDto> ExecuteAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
