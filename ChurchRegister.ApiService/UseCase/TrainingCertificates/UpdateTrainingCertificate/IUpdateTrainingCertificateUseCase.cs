using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificate;

/// <summary>
/// Use case interface for updating a training certificate
/// </summary>
public interface IUpdateTrainingCertificateUseCase
{
    Task<TrainingCertificateDto> ExecuteAsync(UpdateTrainingCertificateRequest request, string userId, CancellationToken cancellationToken = default);
}
