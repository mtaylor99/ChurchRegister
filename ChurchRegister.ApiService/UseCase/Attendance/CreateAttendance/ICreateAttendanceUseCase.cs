using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance;

public interface ICreateAttendanceUseCase
{
    Task ExecuteAsync(CreateAttendanceRequest request, string createdBy, CancellationToken cancellationToken = default);
}
