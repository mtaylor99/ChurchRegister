using ChurchRegister.ApiService.Models.Attendance;

namespace ChurchRegister.ApiService.UseCase.Attendance.CreateEvent;

public interface ICreateEventUseCase
{
    Task<int> ExecuteAsync(CreateEventRequest request, string createdBy, CancellationToken cancellationToken = default);
}
