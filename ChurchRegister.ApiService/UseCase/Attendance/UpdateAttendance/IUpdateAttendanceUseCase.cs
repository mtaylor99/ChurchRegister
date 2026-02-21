using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance;

public interface IUpdateAttendanceUseCase
{
    Task ExecuteAsync(UpdateAttendanceRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
