using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Request model for adding a one-off contribution
/// </summary>
public class AddOneOffContributionRequest
{
    /// <summary>
    /// Church member ID
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Contribution amount
    /// </summary>
    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be between 0.01 and 999999.99")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Contribution date
    /// </summary>
    [Required]
    public DateTime Date { get; set; }

    /// <summary>
    /// Description of the contribution
    /// </summary>
    [Required]
    [MaxLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Response model for adding a one-off contribution
/// </summary>
public class AddOneOffContributionResponse
{
    /// <summary>
    /// ID of the created contribution
    /// </summary>
    public int ContributionId { get; set; }

    /// <summary>
    /// Confirmation message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Member's full name for confirmation
    /// </summary>
    public string MemberName { get; set; } = string.Empty;
}
