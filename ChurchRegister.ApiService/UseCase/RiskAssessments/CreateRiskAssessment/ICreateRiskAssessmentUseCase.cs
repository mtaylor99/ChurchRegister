using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessment;

/// <summary>
/// Use case interface for creating a new risk assessment
/// </summary>
public interface ICreateRiskAssessmentUseCase
{
    /// <summary>
    /// Executes the create risk assessment use case
    /// </summary>
    /// <param name="request">The risk assessment creation request</param>
    /// <param name="createdBy">The username of the user creating the assessment</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created risk assessment</returns>
    Task<RiskAssessmentDto> ExecuteAsync(CreateRiskAssessmentRequest request, string createdBy, CancellationToken cancellationToken = default);
}
