using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates;

public class GetTrainingCertificatesUseCase : IGetTrainingCertificatesUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<GetTrainingCertificatesUseCase> _logger;

    public GetTrainingCertificatesUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<GetTrainingCertificatesUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<PagedResult<TrainingCertificateDto>> ExecuteAsync(
        TrainingCertificateGridQuery request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting training certificates - Page: {Page}, PageSize: {PageSize}, Status: {Status}, TypeId: {TypeId}", 
            request.Page, request.PageSize, request.Status, request.TypeId);
        
        var result = await _trainingCertificateService.GetTrainingCertificatesAsync(request, cancellationToken);
        
        _logger.LogInformation("Retrieved {Count} training certificates out of {Total}", 
            result.Items.Count(), result.TotalCount);
        return result;
    }
}
