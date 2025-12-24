using ChurchRegister.ApiService.Models.Financial;

namespace ChurchRegister.ApiService.Services;

/// <summary>
/// Service for parsing HSBC bank statement CSV files
/// </summary>
public interface IHsbcCsvParser
{
    /// <summary>
    /// Parse an HSBC CSV file from a stream
    /// </summary>
    /// <param name="csvStream">Stream containing the CSV data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Parse result containing transactions and any errors</returns>
    Task<HsbcParseResult> ParseAsync(Stream csvStream, CancellationToken cancellationToken = default);
}
