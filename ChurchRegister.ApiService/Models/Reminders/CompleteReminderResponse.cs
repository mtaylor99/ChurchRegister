namespace ChurchRegister.ApiService.Models.Reminders;

public class CompleteReminderResponse
{
    public ReminderDto Completed { get; set; } = null!;
    public ReminderDto? NextReminder { get; set; }
}
