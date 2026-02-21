using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory;

public interface IGetContributionHistoryUseCase
{
    Task<List<ContributionHistoryDto>> ExecuteAsync(int memberId, DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken = default);
}
