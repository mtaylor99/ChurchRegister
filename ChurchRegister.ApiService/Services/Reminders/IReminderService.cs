using ChurchRegister.ApiService.Models.Reminders;

namespace ChurchRegister.ApiService.Services.Reminders;

public interface IReminderService
{
    Task<List<ReminderDto>> GetRemindersAsync(ReminderQueryParameters query);
    Task<ReminderDto> GetReminderByIdAsync(int id);
    Task<ReminderDto> CreateReminderAsync(CreateReminderRequest request, string createdBy);
    Task<ReminderDto> UpdateReminderAsync(int id, UpdateReminderRequest request, string modifiedBy);
    Task<CompleteReminderResponse> CompleteReminderAsync(int id, CompleteReminderRequest request, string completedBy);
    Task DeleteReminderAsync(int id);
    Task<DashboardReminderSummaryDto> GetDashboardSummaryAsync();
}
