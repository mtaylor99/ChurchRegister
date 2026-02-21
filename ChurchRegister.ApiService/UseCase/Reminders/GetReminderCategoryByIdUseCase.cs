using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IGetReminderCategoryByIdUseCase
{
    Task<ReminderCategoryDto> ExecuteAsync(int id);
}

public class GetReminderCategoryByIdUseCase : IGetReminderCategoryByIdUseCase
{
    private readonly IReminderCategoryService _service;

    public GetReminderCategoryByIdUseCase(IReminderCategoryService service)
    {
        _service = service;
    }

    public Task<ReminderCategoryDto> ExecuteAsync(int id)
    {
        return _service.GetCategoryByIdAsync(id);
    }
}
