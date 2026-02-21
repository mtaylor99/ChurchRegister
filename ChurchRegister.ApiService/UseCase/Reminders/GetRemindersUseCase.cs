using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IGetRemindersUseCase
{
    Task<List<ReminderDto>> ExecuteAsync(ReminderQueryParameters query);
}

public class GetRemindersUseCase : IGetRemindersUseCase
{
    private readonly IReminderService _service;

    public GetRemindersUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<List<ReminderDto>> ExecuteAsync(ReminderQueryParameters query)
    {
        return _service.GetRemindersAsync(query);
    }
}
