namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Grouped summary for training certificate dashboard alerts
/// </summary>
public class TrainingCertificateGroupSummaryDto
{
    /// <summary>
    /// Training type
    /// </summary>
    public string TrainingType { get; set; } = string.Empty;

    /// <summary>
    /// Number of members with this training/check in this group
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Expiry date (null for pending items)
    /// </summary>
    public DateTime? ExpiryDate { get; set; }

    /// <summary>
    /// Status (for grouping pending items)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Summary message
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
