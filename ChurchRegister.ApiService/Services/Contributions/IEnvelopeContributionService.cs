using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.Services.Contributions;

/// <summary>
/// Service for processing envelope contribution batches
/// </summary>
public interface IEnvelopeContributionService
{
    /// <summary>
    /// Validate a register number for the specified year
    /// </summary>
    Task<ValidateRegisterNumberResponse> ValidateRegisterNumberAsync(int registerNumber, int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Submit a new envelope contribution batch
    /// </summary>
    Task<SubmitEnvelopeBatchResponse> SubmitBatchAsync(SubmitEnvelopeBatchRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get list of envelope contribution batches with pagination
    /// </summary>
    Task<GetBatchListResponse> GetBatchListAsync(DateOnly? startDate, DateOnly? endDate, int pageNumber, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get detailed information for a specific batch
    /// </summary>
    Task<GetBatchDetailsResponse> GetBatchDetailsAsync(int batchId, CancellationToken cancellationToken = default);
}
