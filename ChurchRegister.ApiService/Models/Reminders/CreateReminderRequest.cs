namespace ChurchRegister.ApiService.Models.Reminders;

public class CreateReminderRequest
{
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string AssignedToUserId { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public bool? Priority { get; set; }
}
