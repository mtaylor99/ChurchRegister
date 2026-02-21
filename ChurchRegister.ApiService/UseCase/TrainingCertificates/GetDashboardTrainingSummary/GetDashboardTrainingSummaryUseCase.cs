using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetDashboardTrainingSummary;

public class GetDashboardTrainingSummaryUseCase : IGetDashboardTrainingSummaryUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<GetDashboardTrainingSummaryUseCase> _logger;

    public GetDashboardTrainingSummaryUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<GetDashboardTrainingSummaryUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<IEnumerable<TrainingCertificateGroupSummaryDto>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting dashboard training summary");
        
        var result = await _trainingCertificateService.GetDashboardTrainingSummaryAsync(cancellationToken);
        
        _logger.LogInformation("Retrieved {Count} grouped training alerts for dashboard", result.Count());
        return result;
    }
}
