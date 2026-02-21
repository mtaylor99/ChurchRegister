using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface ICreateReminderUseCase
{
    Task<ReminderDto> ExecuteAsync(CreateReminderRequest request, string username);
}

public class CreateReminderUseCase : ICreateReminderUseCase
{
    private readonly IReminderService _service;

    public CreateReminderUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<ReminderDto> ExecuteAsync(CreateReminderRequest request, string username)
    {
        return _service.CreateReminderAsync(request, username);
    }
}
