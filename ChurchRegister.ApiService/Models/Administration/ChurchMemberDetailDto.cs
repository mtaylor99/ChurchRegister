namespace ChurchRegister.ApiService.Models.Administration;

/// <summary>
/// Data transfer object for detailed church member information
/// </summary>
public class ChurchMemberDetailDto
{
    /// <summary>
    /// Unique church member identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member's first name
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Member's last name
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Full display name (FirstName + LastName)
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";

    /// <summary>
    /// Member's email address (optional)
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Member's bank reference (optional)
    /// </summary>
    public string? BankReference { get; set; }

    /// <summary>
    /// Date when the member joined
    /// </summary>
    public DateTime? MemberSince { get; set; }

    /// <summary>
    /// Current status of the member
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Status ID
    /// </summary>
    public int? StatusId { get; set; }

    /// <summary>
    /// Roles assigned to the member
    /// </summary>
    public ChurchMemberRoleDto[] Roles { get; set; } = Array.Empty<ChurchMemberRoleDto>();

    /// <summary>
    /// Whether the member has been baptised
    /// </summary>
    public bool Baptised { get; set; }

    /// <summary>
    /// Whether the member participates in GiftAid
    /// </summary>
    public bool GiftAid { get; set; }

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    public AddressDto? Address { get; set; }

    /// <summary>
    /// When the member record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the member record was last modified
    /// </summary>
    public DateTime? LastModified { get; set; }

    /// <summary>
    /// Who created the member record
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Who last modified the member record
    /// </summary>
    public string? ModifiedBy { get; set; }
}
