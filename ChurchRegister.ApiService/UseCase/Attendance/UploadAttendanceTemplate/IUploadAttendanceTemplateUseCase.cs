using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.UploadAttendanceTemplate;

/// <summary>
/// Use case for uploading and processing attendance template files.
/// </summary>
public interface IUploadAttendanceTemplateUseCase
{
    /// <summary>
    /// Processes an uploaded Excel template file and creates/updates attendance records.
    /// </summary>
    /// <param name="fileStream">Stream containing the Excel file</param>
    /// <param name="uploadedBy">User ID of the person performing the upload</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Upload result with summary, errors, and warnings</returns>
    Task<UploadAttendanceTemplateResponse> ExecuteAsync(
        Stream fileStream,
        string uploadedBy,
        CancellationToken cancellationToken = default);
}
