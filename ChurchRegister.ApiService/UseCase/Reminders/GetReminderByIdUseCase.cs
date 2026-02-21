using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IGetReminderByIdUseCase
{
    Task<ReminderDto> ExecuteAsync(int id);
}

public class GetReminderByIdUseCase : IGetReminderByIdUseCase
{
    private readonly IReminderService _service;

    public GetReminderByIdUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<ReminderDto> ExecuteAsync(int id)
    {
        return _service.GetReminderByIdAsync(id);
    }
}
