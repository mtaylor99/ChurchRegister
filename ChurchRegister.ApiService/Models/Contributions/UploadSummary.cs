namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Summary of upload results
/// </summary>
public class UploadSummary
{
    /// <summary>
    /// Total number of transactions processed from CSV
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
    /// Number of transactions ignored (no MoneyIn value)
    /// </summary>
    public int IgnoredNoMoneyIn { get; set; }
}
