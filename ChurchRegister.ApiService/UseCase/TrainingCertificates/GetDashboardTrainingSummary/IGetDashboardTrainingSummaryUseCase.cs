using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary;

/// <summary>
/// Use case interface for getting dashboard training summary with grouped alerts
/// </summary>
public interface IGetDashboardTrainingSummaryUseCase
{
    Task<IEnumerable<TrainingCertificateGroupSummaryDto>> ExecuteAsync(CancellationToken cancellationToken = default);
}
