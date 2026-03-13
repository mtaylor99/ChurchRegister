namespace ChurchRegister.ApiService.UseCase.Attendance.DeleteEvent;

public interface IDeleteEventUseCase
{
    Task ExecuteAsync(int id, CancellationToken cancellationToken = default);
}
