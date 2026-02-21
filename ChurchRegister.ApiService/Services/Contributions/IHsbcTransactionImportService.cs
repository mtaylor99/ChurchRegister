using ChurchRegister.ApiService.Models.Contributions;

namespace ChurchRegister.ApiService.Services.Contributions;

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

