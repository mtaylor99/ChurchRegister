using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategoryById;

/// <summary>
/// Use case implementation for retrieving a single reminder category by ID
/// </summary>
public class GetReminderCategoryByIdUseCase : IGetReminderCategoryByIdUseCase
{
    private readonly IReminderCategoryService _categoryService;
    private readonly ILogger<GetReminderCategoryByIdUseCase> _logger;

    public GetReminderCategoryByIdUseCase(
        IReminderCategoryService categoryService,
        ILogger<GetReminderCategoryByIdUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderCategoryDto> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting reminder category by ID: {CategoryId}", id);

            var result = await _categoryService.GetCategoryByIdAsync(id);

            _logger.LogInformation("Successfully retrieved reminder category: {CategoryId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reminder category: {CategoryId}", id);
            throw;
        }
    }
}
