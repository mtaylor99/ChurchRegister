namespace ChurchRegister.ApiService.Models.Reminders;

public class ReminderQueryParameters
{
    public string? Status { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    public bool ShowCompleted { get; set; } = false;
}
