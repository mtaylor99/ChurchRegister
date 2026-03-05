using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails;

public interface IGetEnvelopeBatchDetailsUseCase
{
    Task<GetBatchDetailsResponse> ExecuteAsync(int batchId, CancellationToken cancellationToken = default);
}
