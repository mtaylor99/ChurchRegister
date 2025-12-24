namespace ChurchRegister.ApiService.Models.Administration;

/// <summary>
/// Data transfer object for church member list view
/// </summary>
public class ChurchMemberDto
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
    /// Current year member/envelope number (optional)
    /// </summary>
    public string? MemberNumber { get; set; }

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
    public string[] Roles { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Whether the member has been baptised
    /// </summary>
    public bool Baptised { get; set; }

    /// <summary>
    /// Whether the member participates in GiftAid
    /// </summary>
    public bool GiftAid { get; set; }

    /// <summary>
    /// Total contributions for the current calendar year
    /// </summary>
    public decimal ThisYearsContribution { get; set; }

    /// <summary>
    /// When the member record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the member record was last modified
    /// </summary>
    public DateTime? LastModified { get; set; }
}
