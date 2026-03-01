using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.Services.Reminders;

namespace ChurchRegister.ApiService.UseCase.Reminders.CreateReminderCategory;

/// <summary>
/// Use case implementation for creating a new reminder category
/// </summary>
public class CreateReminderCategoryUseCase : ICreateReminderCategoryUseCase
{
    private readonly IReminderCategoryService _categoryService;
    private readonly ILogger<CreateReminderCategoryUseCase> _logger;

    public CreateReminderCategoryUseCase(
        IReminderCategoryService categoryService,
        ILogger<CreateReminderCategoryUseCase> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReminderCategoryDto> ExecuteAsync(CreateReminderCategoryRequest request, string username, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating reminder category: {CategoryName} by {Username}", request.Name, username);

            var result = await _categoryService.CreateCategoryAsync(request, username);

            _logger.LogInformation("Successfully created reminder category with ID: {CategoryId}", result.Id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating reminder category: {CategoryName}", request.Name);
            throw;
        }
    }
}
