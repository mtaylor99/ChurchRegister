using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance;

public interface IDeleteAttendanceUseCase
{
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
