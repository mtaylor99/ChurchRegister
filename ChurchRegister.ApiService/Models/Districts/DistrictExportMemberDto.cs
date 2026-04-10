namespace ChurchRegister.ApiService.Models.Districts;

/// <summary>
/// Data transfer object for church member information in district export
/// </summary>
public class DistrictExportMemberDto
{
    /// <summary>
    /// Member's full name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Full address formatted on one line
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;
}
