using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.ApiService.Services.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById;

public class GetTrainingCertificateByIdUseCase : IGetTrainingCertificateByIdUseCase
{
    private readonly ITrainingCertificateService _trainingCertificateService;
    private readonly ILogger<GetTrainingCertificateByIdUseCase> _logger;

    public GetTrainingCertificateByIdUseCase(
        ITrainingCertificateService trainingCertificateService,
        ILogger<GetTrainingCertificateByIdUseCase> logger)
    {
        _trainingCertificateService = trainingCertificateService;
        _logger = logger;
    }

    public async Task<TrainingCertificateDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting training certificate by ID: {Id}", id);

        var result = await _trainingCertificateService.GetTrainingCertificateByIdAsync(id, cancellationToken);

        if (result == null)
        {
            _logger.LogWarning("Training certificate with ID {Id} not found", id);
        }

        return result;
    }
}
