namespace ChurchRegister.ApiService.Models.Reminders;

public class UpdateReminderRequest
{
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime DueDate { get; set; }
    public int AssignedToChurchMemberId { get; set; }
    public int? CategoryId { get; set; }
    public bool? Priority { get; set; }
}
