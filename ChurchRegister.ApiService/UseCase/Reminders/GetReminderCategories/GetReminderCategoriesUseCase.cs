using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.GetReminderCategories;

/// <summary>
/// Use case implementation for retrieving all reminder categories
/// </summary>
public class GetReminderCategoriesUseCase : IGetReminderCategoriesUseCase
{
    private readonly IReminderCategoryService _categoryService;
    private readonly ILogger<GetReminderCategoriesUseCase> _logger;

    public GetReminderCategoriesUseCase(
        IReminderCategoryService categoryService,
        ILogger<GetReminderCategoriesUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<ReminderCategoryDto>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting reminder categories");

            var result = await _categoryService.GetCategoriesAsync();

            _logger.LogInformation("Successfully retrieved {Count} reminder categories", result.Count);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reminder categories");
            throw;
        }
    }
}
