using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes;

public class GetTrainingCertificateTypesUseCase : IGetTrainingCertificateTypesUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<GetTrainingCertificateTypesUseCase> _logger;

    public GetTrainingCertificateTypesUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<GetTrainingCertificateTypesUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<IEnumerable<TrainingCertificateTypeDto>> ExecuteAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting training certificate types with status filter: {StatusFilter}", statusFilter ?? "none");
        
        var result = await _trainingCertificateService.GetTrainingCertificateTypesAsync(statusFilter, cancellationToken);
        
        _logger.LogInformation("Retrieved {Count} training certificate types", result.Count());
        return result;
    }
}
