using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.Attendance;

/// <summary>
/// Request model for uploading attendance template file
/// </summary>
public class UploadAttendanceTemplateRequest
{
    /// <summary>
    /// The Excel (.xlsx) file containing attendance data
    /// </summary>
    [Required(ErrorMessage = "Template file is required")]
    public IFormFile File { get; set; } = null!;
}
