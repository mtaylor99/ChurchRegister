using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.UpdateTrainingCertificateType;

/// <summary>
/// Use case interface for updating a training certificate type
/// </summary>
public interface IUpdateTrainingCertificateTypeUseCase
{
    Task<TrainingCertificateTypeDto> ExecuteAsync(UpdateTrainingCertificateTypeRequest request, string userId, CancellationToken cancellationToken = default);
}
