using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.ApproveRiskAssessment;

/// <summary>
/// Use case interface for approving a risk assessment
/// </summary>
public interface IApproveRiskAssessmentUseCase
{
    /// <summary>
    /// Executes the approve risk assessment use case
    /// </summary>
    Task<ApproveRiskAssessmentResponse> ExecuteAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy, CancellationToken cancellationToken = default);
}
