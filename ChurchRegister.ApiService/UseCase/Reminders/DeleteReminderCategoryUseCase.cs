using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders;

public interface IDeleteReminderCategoryUseCase
{
    Task ExecuteAsync(int id);
}

public class DeleteReminderCategoryUseCase : IDeleteReminderCategoryUseCase
{
    private readonly IReminderCategoryService _service;

    public DeleteReminderCategoryUseCase(IReminderCategoryService service)
    {
        _service = service;
    }

    public Task ExecuteAsync(int id)
    {
        return _service.DeleteCategoryAsync(id);
    }
}
