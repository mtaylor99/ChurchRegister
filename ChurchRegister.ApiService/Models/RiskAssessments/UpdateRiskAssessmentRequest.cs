using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.RiskAssessments;

public class UpdateRiskAssessmentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Range(1, 5)]
    public int ReviewInterval { get; set; }
    
    [MaxLength(500)]
    public string? Scope { get; set; }
    
    public string? Notes { get; set; }
}
