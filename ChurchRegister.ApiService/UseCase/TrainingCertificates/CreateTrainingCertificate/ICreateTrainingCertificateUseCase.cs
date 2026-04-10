using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificate;

/// <summary>
/// Use case interface for creating a new training certificate
/// </summary>
public interface ICreateTrainingCertificateUseCase
{
    Task<TrainingCertificateDto> ExecuteAsync(CreateTrainingCertificateRequest request, string userId, CancellationToken cancellationToken = default);
}
