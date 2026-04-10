namespace ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessmentCategory;

/// <summary>
/// Use case interface for deleting a risk assessment category
/// </summary>
public interface IDeleteRiskAssessmentCategoryUseCase
{
    /// <summary>
    /// Executes the delete risk assessment category use case
    /// </summary>
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
