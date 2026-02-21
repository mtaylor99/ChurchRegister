using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface ICreateReminderCategoryUseCase
{
    Task<ReminderCategoryDto> ExecuteAsync(CreateReminderCategoryRequest request, string username);
}

public class CreateReminderCategoryUseCase : ICreateReminderCategoryUseCase
{
    private readonly IReminderCategoryService _service;

    public CreateReminderCategoryUseCase(IReminderCategoryService service)
    {
        _service = service;
    }

    public Task<ReminderCategoryDto> ExecuteAsync(CreateReminderCategoryRequest request, string username)
    {
        return _service.CreateCategoryAsync(request, username);
    }
}
