using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.GetTrainingCertificates;

public interface IGetTrainingCertificatesUseCase : IUseCase<TrainingCertificateGridQuery, PagedResult<TrainingCertificateDto>>
{
}
