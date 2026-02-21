using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;

namespace ChurchRegister.ApiService.UseCase.Contributions.SubmitEnvelopeBatch;

public class SubmitEnvelopeBatchUseCase : ISubmitEnvelopeBatchUseCase
{
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<SubmitEnvelopeBatchUseCase> _logger;

    public SubmitEnvelopeBatchUseCase(
        IEnvelopeContributionService envelopeService,
        ILogger<SubmitEnvelopeBatchUseCase> logger)
    {
        _envelopeService = envelopeService;
        _logger = logger;
    }

    public async Task<SubmitEnvelopeBatchResponse> ExecuteAsync(
        SubmitEnvelopeBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Submit envelope batch for date {Date} with {Count} envelopes",
            request.CollectionDate, request.Envelopes?.Count ?? 0);

        ValidateRequest(request);

        var result = await _envelopeService.SubmitBatchAsync(request, cancellationToken);

        _logger.LogInformation("Successfully submitted batch {BatchId} with {Count} contributions",
            result.BatchId, result.EnvelopeCount);

        return result;
    }

    private void ValidateRequest(SubmitEnvelopeBatchRequest request)
    {
        if (request.CollectionDate > DateOnly.FromDateTime(DateTime.Now))
            throw new ArgumentException("Collection date cannot be in the future");

        if (request.Envelopes == null || request.Envelopes.Count == 0)
            throw new ArgumentException("At least one envelope entry is required");

        var invalidAmounts = request.Envelopes.Where(e => e.Amount <= 0).ToList();
        if (invalidAmounts.Any())
            throw new ArgumentException("All envelope amounts must be greater than zero");
    }
}
