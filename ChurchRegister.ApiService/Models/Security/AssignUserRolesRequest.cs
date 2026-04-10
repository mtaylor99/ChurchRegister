using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Security;

/// <summary>
/// Request model for assigning roles to a user
/// </summary>
public class AssignUserRolesRequest
{
    /// <summary>
    /// The unique identifier of the user to assign roles to
    /// </summary>
    [Required]
    public required string UserId { get; set; }

    /// <summary>
    /// Collection of role names to assign to the user
    /// Role hierarchy will be automatically enforced
    /// </summary>
    [Required]
    public required ICollection<string> Roles { get; set; } = new List<string>();
}