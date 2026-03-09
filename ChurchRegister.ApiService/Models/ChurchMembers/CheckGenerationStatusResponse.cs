namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Response for checking register number generation status for a specific year
/// </summary>
public class CheckGenerationStatusResponse
{
    /// <summary>
    /// The year being checked
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Indicates whether register numbers have been generated for this year
    /// </summary>
    public bool IsGenerated { get; set; }

    /// <summary>
    /// Total number of register number assignments for this year
    /// </summary>
    public int TotalAssignments { get; set; }

    /// <summary>
    /// User who generated the register numbers (if generated)
    /// </summary>
    public string? GeneratedBy { get; set; }

    /// <summary>
    /// Date and time when register numbers were generated (if generated)
    /// </summary>
    public DateTime? GeneratedDateTime { get; set; }
}
