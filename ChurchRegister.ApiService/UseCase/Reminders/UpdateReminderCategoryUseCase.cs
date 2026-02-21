using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IUpdateReminderCategoryUseCase
{
    Task<ReminderCategoryDto> ExecuteAsync(int id, UpdateReminderCategoryRequest request, string username);
}

public class UpdateReminderCategoryUseCase : IUpdateReminderCategoryUseCase
{
    private readonly IReminderCategoryService _service;

    public UpdateReminderCategoryUseCase(IReminderCategoryService service)
    {
        _service = service;
    }

    public Task<ReminderCategoryDto> ExecuteAsync(int id, UpdateReminderCategoryRequest request, string username)
    {
        return _service.UpdateCategoryAsync(id, request, username);
    }
}
