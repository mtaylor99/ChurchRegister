namespace ChurchRegister.ApiService.UseCase.RiskAssessments.DeleteRiskAssessment;

public interface IDeleteRiskAssessmentUseCase
{
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
