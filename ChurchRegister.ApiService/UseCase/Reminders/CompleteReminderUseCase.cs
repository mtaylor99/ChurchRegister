using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface ICompleteReminderUseCase
{
    Task<CompleteReminderResponse> ExecuteAsync(int id, CompleteReminderRequest request, string username);
}

public class CompleteReminderUseCase : ICompleteReminderUseCase
{
    private readonly IReminderService _service;

    public CompleteReminderUseCase(IReminderService service)
    {
        _service = service;
    }

    public Task<CompleteReminderResponse> ExecuteAsync(int id, CompleteReminderRequest request, string username)
    {
        return _service.CompleteReminderAsync(id, request, username);
    }
}
