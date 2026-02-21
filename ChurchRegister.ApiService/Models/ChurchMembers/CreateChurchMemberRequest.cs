using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Request model for creating a new church member
/// </summary>
public class CreateChurchMemberRequest
{
    /// <summary>
    /// Member's title (optional - e.g., Mr, Mrs, Miss, Dr, Rev)
    /// </summary>
    [StringLength(20, ErrorMessage = "Title cannot exceed 20 characters")]
    public string? Title { get; set; }

    /// <summary>
    /// Member's first name (required)
    /// </summary>
    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-']+$", ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Member's last name (required)
    /// </summary>
    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-']+$", ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address (optional)
    /// </summary>
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
    public string? Email { get; set; }

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? Phone { get; set; }

    /// <summary>
    /// Member's bank reference (optional)
    /// </summary>
    [StringLength(100, ErrorMessage = "Bank reference cannot exceed 100 characters")]
    public string? BankReference { get; set; }

    /// <summary>
    /// Date when the member joined (required)
    /// </summary>
    [Required(ErrorMessage = "Member since date is required")]
    public DateTime MemberSince { get; set; }

    /// <summary>
    /// Member's status ID (required)
    /// </summary>
    [Required(ErrorMessage = "Status is required")]
    public int StatusId { get; set; }

    /// <summary>
    /// Whether the member has been baptised
    /// </summary>
    public bool Baptised { get; set; }

    /// <summary>
    /// Whether the member participates in GiftAid
    /// </summary>
    public bool GiftAid { get; set; }

    /// <summary>
    /// Whether the member requires pastoral care
    /// </summary>
    public bool PastoralCareRequired { get; set; } = false;

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    public AddressDto? Address { get; set; }

    /// <summary>
    /// Role IDs to assign to the member
    /// </summary>
    public int[] RoleIds { get; set; } = Array.Empty<int>();

    /// <summary>
    /// Validate that MemberSince is not in the future
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MemberSince > DateTime.UtcNow)
        {
            yield return new ValidationResult(
                "Member since date cannot be in the future",
                new[] { nameof(MemberSince) });
        }
    }
}
