using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList;

public interface IGetEnvelopeBatchListUseCase
{
    Task<GetBatchListResponse> ExecuteAsync(DateOnly? startDate, DateOnly? endDate, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
