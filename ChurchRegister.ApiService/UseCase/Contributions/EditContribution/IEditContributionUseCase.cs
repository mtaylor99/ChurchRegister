namespace ChurchRegister.ApiService.UseCase.Contributions.EditContribution;

public interface IEditContributionUseCase
{
    Task ExecuteAsync(int id, decimal amount, CancellationToken cancellationToken = default);
}
