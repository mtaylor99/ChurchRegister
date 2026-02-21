using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList;

public class GetEnvelopeBatchListUseCase : IGetEnvelopeBatchListUseCase
{
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<GetEnvelopeBatchListUseCase> _logger;

    public GetEnvelopeBatchListUseCase(
        IEnvelopeContributionService envelopeService,
        ILogger<GetEnvelopeBatchListUseCase> logger)
    {
        _envelopeService = envelopeService;
        _logger = logger;
    }

    public async Task<GetBatchListResponse> ExecuteAsync(
        DateOnly? startDate,
        DateOnly? endDate,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Get batch list: start={Start}, end={End}, page={Page}, size={Size}",
            startDate, endDate, pageNumber, pageSize);

        var result = await _envelopeService.GetBatchListAsync(startDate, endDate, pageNumber, pageSize, cancellationToken);

        _logger.LogInformation("Retrieved {Count} batches out of {Total}",
            result.Batches.Count, result.TotalCount);

        return result;
    }
}
