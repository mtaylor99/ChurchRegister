using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.CreateTrainingCertificateType;

/// <summary>
/// Use case interface for creating a new training certificate type
/// </summary>
public interface ICreateTrainingCertificateTypeUseCase
{
    Task<TrainingCertificateTypeDto> ExecuteAsync(CreateTrainingCertificateTypeRequest request, string userId, CancellationToken cancellationToken = default);
}
