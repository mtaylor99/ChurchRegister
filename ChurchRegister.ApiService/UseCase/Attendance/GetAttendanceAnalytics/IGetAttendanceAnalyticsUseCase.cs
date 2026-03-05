using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;

namespace ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics;

public interface IGetAttendanceAnalyticsUseCase : IUseCase<GetAttendanceAnalyticsRequest, AttendanceAnalyticsResponse>
{
}
