namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Data transfer object for training certificate type
/// </summary>
public class TrainingCertificateTypeDto
{
    /// <summary>
    /// Unique training certificate type identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Training certificate type name
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the training/check type
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Type status (Active, InActive)
    /// </summary>
    public string Status { get; set; } = string.Empty;

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
