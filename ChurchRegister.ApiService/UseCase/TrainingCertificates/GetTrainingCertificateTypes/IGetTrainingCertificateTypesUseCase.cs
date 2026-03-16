using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificateTypes;

/// <summary>
/// Use case interface for getting training certificate types
/// </summary>
public interface IGetTrainingCertificateTypesUseCase
{
    Task<IEnumerable<TrainingCertificateTypeDto>> ExecuteAsync(string? statusFilter = null, CancellationToken cancellationToken = default);
}
