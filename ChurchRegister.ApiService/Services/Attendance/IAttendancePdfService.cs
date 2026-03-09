namespace ChurchRegister.ApiService.Services.Attendance;

/// <summary>
/// Service for generating PDF reports for attendance
/// </summary>
public interface IAttendancePdfService
{
    /// <summary>
    /// Generate attendance summary report PDF
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GenerateAttendanceReportAsync(CancellationToken cancellationToken = default);
}
