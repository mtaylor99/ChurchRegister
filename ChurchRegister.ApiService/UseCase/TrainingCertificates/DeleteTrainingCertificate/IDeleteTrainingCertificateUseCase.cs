namespace ChurchRegister.ApiService.UseCase.TrainingCertificates.DeleteTrainingCertificate;

public interface IDeleteTrainingCertificateUseCase
{
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
