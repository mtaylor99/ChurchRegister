using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IUpdateReminderUseCase
{
    Task<ReminderDto> ExecuteAsync(int id, UpdateReminderRequest request, string username);
}

public class UpdateReminderUseCase : IUpdateReminderUseCase
{
    private readonly IReminderService _service;

    public UpdateReminderUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<ReminderDto> ExecuteAsync(int id, UpdateReminderRequest request, string username)
    {
        return _service.UpdateReminderAsync(id, request, username);
    }
}
