using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails;

public class GetEnvelopeBatchDetailsUseCase : IGetEnvelopeBatchDetailsUseCase
{
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<GetEnvelopeBatchDetailsUseCase> _logger;

    public GetEnvelopeBatchDetailsUseCase(
        IEnvelopeContributionService envelopeService,
        ILogger<GetEnvelopeBatchDetailsUseCase> logger)
    {
        _envelopeService = envelopeService;
        _logger = logger;
    }

    public async Task<GetBatchDetailsResponse> ExecuteAsync(
        int batchId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Get batch details for batch {BatchId}", batchId);

        if (batchId <= 0)
            throw new ArgumentException("Valid batch ID is required");

        var result = await _envelopeService.GetBatchDetailsAsync(batchId, cancellationToken);

        _logger.LogInformation("Retrieved details for batch {BatchId}", batchId);

        return result;
    }
}
