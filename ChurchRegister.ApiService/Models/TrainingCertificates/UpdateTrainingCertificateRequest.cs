using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Request model for updating a training certificate
/// </summary>
public class UpdateTrainingCertificateRequest
{
    /// <summary>
    /// Training certificate ID
    /// </summary>
    [Required]
    public int Id { get; set; }

    /// <summary>
    /// Certificate status (Pending, In Validity, Expired, Allow to Expire)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Certificate expiry date (optional)
    /// </summary>
    public DateTime? Expires { get; set; }

    /// <summary>
    /// Optional notes
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}
