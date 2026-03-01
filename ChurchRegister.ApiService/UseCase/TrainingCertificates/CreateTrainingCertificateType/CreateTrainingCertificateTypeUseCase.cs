using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType;

public class CreateTrainingCertificateTypeUseCase : ICreateTrainingCertificateTypeUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<CreateTrainingCertificateTypeUseCase> _logger;

    public CreateTrainingCertificateTypeUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<CreateTrainingCertificateTypeUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<TrainingCertificateTypeDto> ExecuteAsync(
        CreateTrainingCertificateTypeRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating training certificate type '{Type}' by user {UserId}",
            request.Type, userId);

        var result = await _trainingCertificateService.CreateTrainingCertificateTypeAsync(request, userId, cancellationToken);

        _logger.LogInformation("Created training certificate type {TypeId}", result.Id);
        return result;
    }
}
