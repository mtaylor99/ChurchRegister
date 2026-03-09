namespace ChurchRegister.ApiService.Models.Reminders;

public class ReminderCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public bool IsSystemCategory { get; set; }
    public int SortOrder { get; set; }
    public int ReminderCount { get; set; }

    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedDateTime { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
