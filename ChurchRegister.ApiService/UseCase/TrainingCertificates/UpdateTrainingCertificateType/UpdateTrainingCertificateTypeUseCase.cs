using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType;

public class UpdateTrainingCertificateTypeUseCase : IUpdateTrainingCertificateTypeUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<UpdateTrainingCertificateTypeUseCase> _logger;

    public UpdateTrainingCertificateTypeUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<UpdateTrainingCertificateTypeUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<TrainingCertificateTypeDto> ExecuteAsync(
        UpdateTrainingCertificateTypeRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating training certificate type {TypeId} by user {UserId}",
            request.Id, userId);

        var result = await _trainingCertificateService.UpdateTrainingCertificateTypeAsync(request, userId, cancellationToken);

        _logger.LogInformation("Updated training certificate type {TypeId} to '{Type}' with status '{Status}'",
            result.Id, result.Type, result.Status);
        return result;
    }
}
