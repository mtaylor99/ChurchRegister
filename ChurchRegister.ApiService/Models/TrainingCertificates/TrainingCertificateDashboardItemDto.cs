namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Dashboard item for training certificate alerts
/// </summary>
public class TrainingCertificateDashboardItemDto
{
    /// <summary>
    /// Training certificate ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Training type
    /// </summary>
    public string TrainingType { get; set; } = string.Empty;

    /// <summary>
    /// Certificate status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Expiry date
    /// </summary>
    public DateTime? Expires { get; set; }

    /// <summary>
    /// Days until expiry (negative if expired)
    /// </summary>
    public int? DaysUntilExpiry { get; set; }
}
