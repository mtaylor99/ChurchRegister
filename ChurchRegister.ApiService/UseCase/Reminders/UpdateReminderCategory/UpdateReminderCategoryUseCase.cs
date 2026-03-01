using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.UpdateReminderCategory;

/// <summary>
/// Use case implementation for updating an existing reminder category
/// </summary>
public class UpdateReminderCategoryUseCase : IUpdateReminderCategoryUseCase
{
    private readonly IReminderCategoryService _categoryService;
    private readonly ILogger<UpdateReminderCategoryUseCase> _logger;

    public UpdateReminderCategoryUseCase(
        IReminderCategoryService categoryService,
        ILogger<UpdateReminderCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderCategoryDto> ExecuteAsync(int id, UpdateReminderCategoryRequest request, string username, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating reminder category: {CategoryId} by {Username}", id, username);

            var result = await _categoryService.UpdateCategoryAsync(id, request, username);

            _logger.LogInformation("Successfully updated reminder category: {CategoryId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating reminder category: {CategoryId}", id);
            throw;
        }
    }
}
