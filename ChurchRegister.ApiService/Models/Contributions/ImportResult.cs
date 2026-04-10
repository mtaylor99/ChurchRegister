namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Result of importing transactions into the database
/// </summary>
public class ImportResult
{
    /// <summary>
    /// Total number of transactions processed
    /// </summary>
    public int TotalProcessed { get; set; }

    /// <summary>
    /// Number of new transactions imported
    /// </summary>
    public int NewTransactions { get; set; }

    /// <summary>
    /// Number of duplicate transactions skipped
    /// </summary>
    public int DuplicatesSkipped { get; set; }

    /// <summary>
    /// Number of transactions ignored due to no MoneyIn value
    /// </summary>
    public int IgnoredNoMoneyIn { get; set; }

    /// <summary>
    /// Indicates if import was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// List of errors encountered during import
    /// </summary>
    public List<string> Errors { get; set; } = new();
}
