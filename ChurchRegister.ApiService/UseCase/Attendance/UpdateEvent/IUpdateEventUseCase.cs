using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent;

public interface IUpdateEventUseCase
{
    Task ExecuteAsync(UpdateEventRequest request, string modifiedBy, CancellationToken cancellationToken = default);
}
