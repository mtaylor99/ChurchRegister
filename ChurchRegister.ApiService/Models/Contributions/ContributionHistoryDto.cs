namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Data transfer object for church member contribution history
/// </summary>
public class ContributionHistoryDto
{
    /// <summary>
    /// Contribution record identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Date of the contribution
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Amount contributed
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Type of contribution (e.g., Cash, Transfer)
    /// </summary>
    public string ContributionType { get; set; } = string.Empty;

    /// <summary>
    /// Transaction reference (e.g., bank reference)
    /// </summary>
    public string? TransactionRef { get; set; }

    /// <summary>
    /// Optional description or notes
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// When the record was created
    /// </summary>
    public DateTime CreatedDateTime { get; set; }

    /// <summary>
    /// Who created the record (User ID)
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Name of user who created the record
    /// </summary>
    public string CreatedByName { get; set; } = string.Empty;
}
