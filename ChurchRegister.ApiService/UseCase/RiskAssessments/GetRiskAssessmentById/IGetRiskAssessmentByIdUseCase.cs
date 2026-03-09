using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentById;

/// <summary>
/// Use case interface for retrieving a single risk assessment by ID
/// </summary>
public interface IGetRiskAssessmentByIdUseCase
{
    /// <summary>
    /// Executes the get risk assessment by ID use case
    /// </summary>
    Task<RiskAssessmentDetailDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
