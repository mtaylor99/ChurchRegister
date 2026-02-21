using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate;

public class CreateTrainingCertificateUseCase : ICreateTrainingCertificateUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<CreateTrainingCertificateUseCase> _logger;

    public CreateTrainingCertificateUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<CreateTrainingCertificateUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<TrainingCertificateDto> ExecuteAsync(
        CreateTrainingCertificateRequest request, 
        string userId, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating training certificate for member {MemberId}, type {TypeId} by user {UserId}", 
            request.ChurchMemberId, request.TrainingCertificateTypeId, userId);
        
        var result = await _trainingCertificateService.CreateTrainingCertificateAsync(request, userId, cancellationToken);
        
        _logger.LogInformation("Created training certificate {CertificateId}", result.Id);
        return result;
    }
}
