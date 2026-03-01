using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.DeleteReminderCategory;

/// <summary>
/// Use case implementation for deleting a reminder category
/// </summary>
public class DeleteReminderCategoryUseCase : IDeleteReminderCategoryUseCase
{
    private readonly IReminderCategoryService _categoryService;
    private readonly ILogger<DeleteReminderCategoryUseCase> _logger;

    public DeleteReminderCategoryUseCase(
        IReminderCategoryService categoryService,
        ILogger<DeleteReminderCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting reminder category: {CategoryId}", id);

            await _categoryService.DeleteCategoryAsync(id);

            _logger.LogInformation("Successfully deleted reminder category: {CategoryId}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting reminder category: {CategoryId}", id);
            throw;
        }
    }
}
