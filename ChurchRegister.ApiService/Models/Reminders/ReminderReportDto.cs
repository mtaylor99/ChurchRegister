namespace ChurchRegister.ApiService.Models.Reminders;

public class ReminderReportDto
{
    public DueReminder[] Reminders { get; set; } = Array.Empty<DueReminder>();
    public int TotalCount { get; set; }
    public DateTime GeneratedDate { get; set; }
    public int DaysAhead { get; set; }
}

public class DueReminder
{
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int DaysUntilDue { get; set; }
    public string AssignedTo { get; set; } = string.Empty;
    public bool? Priority { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
}
