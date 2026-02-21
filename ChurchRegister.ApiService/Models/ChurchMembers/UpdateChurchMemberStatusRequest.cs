using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Request model for updating a church member's status
/// </summary>
public class UpdateChurchMemberStatusRequest
{
    /// <summary>
    /// New status ID (required)
    /// </summary>
    [Required(ErrorMessage = "Status ID is required")]
    public int StatusId { get; set; }

    /// <summary>
    /// Optional note explaining the status change
    /// </summary>
    [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters")]
    public string? Note { get; set; }
}
