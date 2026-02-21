using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IDeleteReminderUseCase
{
    Task ExecuteAsync(int id);
}

public class DeleteReminderUseCase : IDeleteReminderUseCase
{
    private readonly IReminderService _service;

    public DeleteReminderUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task ExecuteAsync(int id)
    {
        return _service.DeleteReminderAsync(id);
    }
}
