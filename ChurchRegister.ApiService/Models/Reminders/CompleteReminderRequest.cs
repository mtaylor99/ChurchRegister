namespace ChurchRegister.ApiService.Models.Reminders;

public class CompleteReminderRequest
{
    public string CompletionNotes { get; set; } = string.Empty;
    public bool CreateNext { get; set; }
    public string? NextInterval { get; set; }
    public DateTime? CustomDueDate { get; set; }
}
