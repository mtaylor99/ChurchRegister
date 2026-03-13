namespace ChurchRegister.ApiService.UseCase.Contributions.DeleteContribution;

public interface IDeleteContributionUseCase
{
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
