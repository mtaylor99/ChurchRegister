using ChurchRegister.ApiService.Models.Financial;

namespace ChurchRegister.ApiService.Services;

/// <summary>
/// Service for importing HSBC transactions into the database
/// </summary>
public interface IHsbcTransactionImportService
{
    /// <summary>
    /// Import parsed HSBC transactions with duplicate detection
    /// </summary>
    /// <param name="transactions">List of parsed transactions</param>
    /// <param name="uploadedBy">User identifier who uploaded the file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Import result with counts and status</returns>
    Task<ImportResult> ImportTransactionsAsync(
        List<HsbcTransaction> transactions,
        string uploadedBy,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for generating and managing church member register numbers
/// </summary>
public interface IRegisterNumberService
{
    /// <summary>
    /// Generate register numbers for all active members for the specified year
    /// </summary>
    Task<Models.Administration.GenerateRegisterNumbersResponse> GenerateForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Preview register number assignments without saving
    /// </summary>
    Task<Models.Administration.PreviewRegisterNumbersResponse> PreviewForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if register numbers have already been generated for a given year
    /// </summary>
    Task<bool> HasBeenGeneratedForYearAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the next available register number for a specific year
    /// </summary>
    Task<int> GetNextAvailableNumberAsync(int year, CancellationToken cancellationToken = default);
}

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
