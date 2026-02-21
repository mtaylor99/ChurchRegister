namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Summary of contribution processing results
/// </summary>
public class ContributionProcessingSummary
{
    /// <summary>
    /// Number of transactions matched to church members
    /// </summary>
    public int MatchedTransactions { get; set; }

    /// <summary>
    /// Number of transactions that could not be matched to any member
    /// </summary>
    public int UnmatchedTransactions { get; set; }

    /// <summary>
    /// Total amount of money processed from matched transactions
    /// </summary>
    public decimal TotalAmountProcessed { get; set; }

    /// <summary>
    /// List of bank references that could not be matched to any member
    /// </summary>
    public List<string> UnmatchedReferences { get; set; } = new();
}
