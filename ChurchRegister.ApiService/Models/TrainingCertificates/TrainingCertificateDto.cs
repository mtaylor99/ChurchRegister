namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Data transfer object for training certificate list view
/// </summary>
public class TrainingCertificateDto
{
    /// <summary>
    /// Unique training certificate identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Church member ID
    /// </summary>
    public int ChurchMemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member's role in the church
    /// </summary>
    public string? MemberRole { get; set; }

    /// <summary>
    /// Member's contact information
    /// </summary>
    public string? MemberContact { get; set; }

    /// <summary>
    /// Training certificate type ID
    /// </summary>
    public int TrainingCertificateTypeId { get; set; }

    /// <summary>
    /// Training certificate type name
    /// </summary>
    public string TrainingType { get; set; } = string.Empty;

    /// <summary>
    /// Certificate status (Pending, In Validity, Expired, Allow to Expire)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Certificate expiry date (nullable)
    /// </summary>
    public DateTime? Expires { get; set; }

    /// <summary>
    /// Optional notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// RAG status for UI highlighting (Red, Amber, or empty)
    /// </summary>
    public string RagStatus { get; set; } = string.Empty;

    /// <summary>
    /// Created by user
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Created date time
    /// </summary>
    public DateTime CreatedDateTime { get; set; }

    /// <summary>
    /// Last modified by user
    /// </summary>
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Last modified date time
    /// </summary>
    public DateTime? ModifiedDateTime { get; set; }
}
