using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Request model for creating a training certificate type
/// </summary>
public class CreateTrainingCertificateTypeRequest
{
    /// <summary>
    /// Training certificate type name
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the training/check type
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Type status (Active, InActive)
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Status { get; set; } = "Active";
}
