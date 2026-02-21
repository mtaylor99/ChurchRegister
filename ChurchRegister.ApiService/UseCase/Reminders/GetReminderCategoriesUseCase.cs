using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IGetReminderCategoriesUseCase
{
    Task<List<ReminderCategoryDto>> ExecuteAsync();
}

public class GetReminderCategoriesUseCase : IGetReminderCategoriesUseCase
{
    private readonly IReminderCategoryService _service;

    public GetReminderCategoriesUseCase(IReminderCategoryService service)
    {
        _service = service;
    }

    public Task<List<ReminderCategoryDto>> ExecuteAsync()
    {
        return _service.GetCategoriesAsync();
    }
}
