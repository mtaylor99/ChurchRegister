using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.Services.Reminders;

public interface IReminderCategoryService
{
    Task<List<ReminderCategoryDto>> GetCategoriesAsync();
    Task<ReminderCategoryDto> GetCategoryByIdAsync(int id);
    Task<ReminderCategoryDto> CreateCategoryAsync(CreateReminderCategoryRequest request, string createdBy);
    Task<ReminderCategoryDto> UpdateCategoryAsync(int id, UpdateReminderCategoryRequest request, string modifiedBy);
    Task DeleteCategoryAsync(int id);
}
