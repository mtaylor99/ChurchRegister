namespace ChurchRegister.ApiService.Models.Reminders;

public class CreateReminderCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
}
