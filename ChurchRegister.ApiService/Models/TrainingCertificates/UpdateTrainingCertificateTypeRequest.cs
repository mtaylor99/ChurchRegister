using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.TrainingCertificates;

/// <summary>
/// Request model for updating a training certificate type
/// </summary>
public class UpdateTrainingCertificateTypeRequest
{
    /// <summary>
    /// Training certificate type ID
    /// </summary>
    [Required]
    public int Id { get; set; }

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
    public string Status { get; set; } = string.Empty;
}
