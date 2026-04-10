using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.StartReview;

/// <summary>
/// Use case interface for starting a risk assessment review
/// </summary>
public interface IStartReviewUseCase
{
    /// <summary>
    /// Executes the start review use case
    /// </summary>
    Task<RiskAssessmentDto> ExecuteAsync(int id, string modifiedBy, CancellationToken cancellationToken = default);
}
