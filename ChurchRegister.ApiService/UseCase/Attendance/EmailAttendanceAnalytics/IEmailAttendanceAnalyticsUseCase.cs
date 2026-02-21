namespace ChurchRegister.ApiService.UseCase.Attendance.EmailAttendanceAnalytics;

public interface IEmailAttendanceAnalyticsUseCase
{
    Task ExecuteAsync(int? eventId, string emailAddress, CancellationToken cancellationToken = default);
}
