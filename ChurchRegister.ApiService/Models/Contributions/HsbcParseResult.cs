namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Result of parsing an HSBC CSV file
/// </summary>
public class HsbcParseResult
{
    /// <summary>
    /// List of successfully parsed transactions
    /// </summary>
    public List<HsbcTransaction> Transactions { get; set; } = new();

    /// <summary>
    /// Total number of rows in the CSV file (excluding header)
    /// </summary>
    public int TotalRows { get; set; }

    /// <summary>
    /// List of parsing errors encountered
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Indicates if parsing was successful
    /// </summary>
    public bool Success => !Errors.Any();
}
