using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate;

public class UpdateTrainingCertificateUseCase : IUpdateTrainingCertificateUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<UpdateTrainingCertificateUseCase> _logger;

    public UpdateTrainingCertificateUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<UpdateTrainingCertificateUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<TrainingCertificateDto> ExecuteAsync(
        UpdateTrainingCertificateRequest request, 
        string userId, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating training certificate {CertificateId} by user {UserId}", 
            request.Id, userId);
        
        var result = await _trainingCertificateService.UpdateTrainingCertificateAsync(request, userId, cancellationToken);
        
        _logger.LogInformation("Updated training certificate {CertificateId}", result.Id);
        return result;
    }
}
