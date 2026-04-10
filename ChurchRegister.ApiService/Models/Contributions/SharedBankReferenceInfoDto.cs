namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// DTO for shared bank reference information (query result, not stored entity)
/// </summary>
public class SharedBankReferenceInfoDto
{
    /// <summary>
    /// The shared bank reference string
    /// </summary>
    public string Reference { get; set; } = string.Empty;

    /// <summary>
    /// List of members sharing this reference
    /// </summary>
    public List<SharedReferenceMemberDto> Members { get; set; } = new();
}

/// <summary>
/// DTO for member information in a shared reference
/// </summary>
public class SharedReferenceMemberDto
{
    /// <summary>
    /// Church member ID
    /// </summary>
    public int ChurchMemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;
}
