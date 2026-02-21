namespace ChurchRegister.ApiService.Services.Contributions;

public interface IContributionProcessingService
{
    /// <summary>
    /// Process HSBC transactions and create contribution records for matched members
    /// </summary>
    /// <param name="uploadedBy">Username of the user who uploaded the file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processing result with match statistics</returns>
    Task<ContributionProcessingResult> ProcessHsbcTransactionsAsync(
        string uploadedBy,
        CancellationToken cancellationToken = default);
}

public class ContributionProcessingResult
{
    public bool Success { get; set; }
    public int TotalProcessed { get; set; }
    public int MatchedCount { get; set; }
    public int UnmatchedCount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<string> UnmatchedReferences { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
