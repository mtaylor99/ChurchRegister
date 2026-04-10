using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateById;

/// <summary>
/// Use case interface for getting a training certificate by ID
/// </summary>
public interface IGetTrainingCertificateByIdUseCase
{
    Task<TrainingCertificateDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
