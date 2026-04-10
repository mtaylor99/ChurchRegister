namespace ChurchRegister.ApiService.Models.Reminders;

public class ReminderDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string AssignedToUserId { get; set; } = string.Empty;
    public string AssignedToUserName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryColorHex { get; set; }
    public bool? Priority { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CompletionNotes { get; set; }
    public string? CompletedBy { get; set; }
    public DateTime? CompletedDateTime { get; set; }

    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }

    // Calculated fields
    public string AlertStatus { get; set; } = "none";
    public int DaysUntilDue { get; set; }
}
