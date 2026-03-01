using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.Reminders;

public class ReminderService : IReminderService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<ReminderService> _logger;

    public ReminderService(ChurchRegisterWebContext context, UserManager<ChurchRegisterWebUser> userManager, ILogger<ReminderService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<List<ReminderDto>> GetRemindersAsync(ReminderQueryParameters query)
    {
        var remindersQuery = _context.Reminders
            .Include(r => r.Category)
            .AsQueryable();

        // Apply ShowCompleted filter (default: don't show completed reminders)
        if (!query.ShowCompleted)
        {
            remindersQuery = remindersQuery.Where(r => r.Status != "Completed");
        }

        // Status filter
        if (!string.IsNullOrEmpty(query.Status))
        {
            if (query.Status.Equals("Overdue", StringComparison.OrdinalIgnoreCase))
            {
                // Overdue = Pending AND DueDate < Today
                remindersQuery = remindersQuery.Where(r =>
                    r.Status == "Pending" && r.DueDate < DateTime.Today);
            }
            else
            {
                remindersQuery = remindersQuery.Where(r => r.Status == query.Status);
            }
        }

        // AssignedTo filter
        if (!string.IsNullOrEmpty(query.AssignedToUserId))
        {
            remindersQuery = remindersQuery.Where(r => r.AssignedToUserId == query.AssignedToUserId);
        }

        // Category filter
        if (query.CategoryId.HasValue)
        {
            remindersQuery = remindersQuery.Where(r => r.CategoryId == query.CategoryId.Value);
        }

        // Description search
        if (!string.IsNullOrEmpty(query.Description))
        {
            remindersQuery = remindersQuery.Where(r => r.Description.Contains(query.Description));
        }

        var reminders = await remindersQuery
            .OrderBy(r => r.DueDate)
            .ToListAsync();

        _logger.LogInformation("Query returned {Count} reminders from database", reminders.Count);

        var dtos = new List<ReminderDto>();
        foreach (var reminder in reminders)
        {
            var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
            dtos.Add(MapToDto(reminder, user, reminder.Category));
        }

        _logger.LogInformation("Mapped to {Count} ReminderDto objects", dtos.Count);

        return dtos;
    }

    public async Task<ReminderDto> GetReminderByIdAsync(int id)
    {
        var reminder = await _context.Reminders
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reminder == null)
        {
            throw new NotFoundException("Reminder", id);
        }

        var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
        return MapToDto(reminder, user, reminder.Category);
    }

    public async Task<ReminderDto> CreateReminderAsync(CreateReminderRequest request, string createdBy)
    {
        var reminder = new Reminder
        {
            Description = request.Description,
            DueDate = request.DueDate,
            AssignedToUserId = request.AssignedToUserId,
            CategoryId = request.CategoryId,
            Priority = request.Priority,
            Status = "Pending",
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow,
            ModifiedBy = createdBy,
            ModifiedDateTime = DateTime.UtcNow
        };

        _context.Reminders.Add(reminder);
        await _context.SaveChangesAsync();

        // Reload with category
        await _context.Entry(reminder).Reference(r => r.Category).LoadAsync();

        var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
        return MapToDto(reminder, user, reminder.Category);
    }

    public async Task<ReminderDto> UpdateReminderAsync(int id, UpdateReminderRequest request, string modifiedBy)
    {
        var reminder = await _context.Reminders
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reminder == null)
        {
            throw new NotFoundException("Reminder", id);
        }

        if (reminder.Status == "Completed")
        {
            throw new ValidationException("Cannot edit completed reminders.");
        }

        reminder.Description = request.Description;
        reminder.DueDate = request.DueDate;
        reminder.AssignedToUserId = request.AssignedToUserId;
        reminder.CategoryId = request.CategoryId;
        reminder.Priority = request.Priority;
        reminder.ModifiedBy = modifiedBy;
        reminder.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload category if changed
        await _context.Entry(reminder).Reference(r => r.Category).LoadAsync();

        var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
        return MapToDto(reminder, user, reminder.Category);
    }

    public async Task<CompleteReminderResponse> CompleteReminderAsync(int id, CompleteReminderRequest request, string completedBy)
    {
        var reminder = await _context.Reminders
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reminder == null)
        {
            throw new NotFoundException("Reminder", id);
        }

        if (string.IsNullOrWhiteSpace(request.CompletionNotes))
        {
            throw new ValidationException("Completion notes are required.");
        }

        // Mark current reminder as completed
        reminder.Status = "Completed";
        reminder.CompletionNotes = request.CompletionNotes;
        reminder.CompletedBy = completedBy;
        reminder.CompletedDateTime = DateTime.UtcNow;
        reminder.ModifiedBy = completedBy;
        reminder.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var user = await _userManager.FindByIdAsync(reminder.AssignedToUserId);
        var completedDto = MapToDto(reminder, user, reminder.Category);

        ReminderDto? nextReminderDto = null;

        // Create next reminder if requested
        if (request.CreateNext)
        {
            DateTime newDueDate;

            if (request.NextInterval == "3months")
            {
                newDueDate = reminder.DueDate.AddMonths(3);
            }
            else if (request.NextInterval == "6months")
            {
                newDueDate = reminder.DueDate.AddMonths(6);
            }
            else if (request.NextInterval == "12months")
            {
                newDueDate = reminder.DueDate.AddMonths(12);
            }
            else if (request.NextInterval == "custom" && request.CustomDueDate.HasValue)
            {
                newDueDate = request.CustomDueDate.Value;
            }
            else
            {
                throw new ValidationException("Invalid next interval or custom due date not provided.");
            }

            var nextReminder = new Reminder
            {
                Description = reminder.Description,
                DueDate = newDueDate,
                AssignedToUserId = reminder.AssignedToUserId,
                CategoryId = reminder.CategoryId, // Inherit category
                Priority = reminder.Priority,
                Status = "Pending",
                CreatedBy = completedBy,
                CreatedDateTime = DateTime.UtcNow,
                ModifiedBy = completedBy,
                ModifiedDateTime = DateTime.UtcNow
            };

            _context.Reminders.Add(nextReminder);
            await _context.SaveChangesAsync();

            // Reload with category
            await _context.Entry(nextReminder).Reference(r => r.Category).LoadAsync();

            nextReminderDto = MapToDto(nextReminder, user, nextReminder.Category);
        }

        return new CompleteReminderResponse
        {
            Completed = completedDto,
            NextReminder = nextReminderDto
        };
    }

    public async Task DeleteReminderAsync(int id)
    {
        var reminder = await _context.Reminders
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reminder == null)
        {
            throw new NotFoundException("Reminder", id);
        }

        if (reminder.Status == "Completed")
        {
            throw new ValidationException("Cannot delete completed reminders.");
        }

        _context.Reminders.Remove(reminder);
        await _context.SaveChangesAsync();
    }

    public async Task<DashboardReminderSummaryDto> GetDashboardSummaryAsync()
    {
        var today = DateTime.Today;
        var thirtyDaysFromNow = today.AddDays(30);

        // Count all pending reminders that are either overdue or due within 30 days
        var count = await _context.Reminders
            .Where(r => r.Status == "Pending" && r.DueDate <= thirtyDaysFromNow)
            .CountAsync();

        _logger.LogInformation("Dashboard reminder summary: Found {Count} pending reminders due on or before {EndDate}",
            count, thirtyDaysFromNow.ToString("yyyy-MM-dd"));

        return new DashboardReminderSummaryDto
        {
            UpcomingCount = count
        };
    }

    private string CalculateAlertStatus(DateTime dueDate, string status)
    {
        if (status == "Completed")
        {
            return "none";
        }

        var daysUntil = (dueDate.Date - DateTime.Today).Days;

        if (daysUntil <= 30)
        {
            return "red";
        }
        else if (daysUntil <= 60)
        {
            return "amber";
        }
        else
        {
            return "none";
        }
    }

    private ReminderDto MapToDto(Reminder reminder, ChurchRegisterWebUser? user, ReminderCategory? category)
    {
        var userName = user != null
            ? $"{user.FirstName} {user.LastName}".Trim()
            : "Unknown";

        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = user?.UserName ?? "Unknown";
        }

        return new ReminderDto
        {
            Id = reminder.Id,
            Description = reminder.Description,
            DueDate = reminder.DueDate,
            AssignedToUserId = reminder.AssignedToUserId,
            AssignedToUserName = userName,
            CategoryId = reminder.CategoryId,
            CategoryName = category?.Name,
            CategoryColorHex = category?.ColorHex,
            Priority = reminder.Priority,
            Status = reminder.Status,
            CompletionNotes = reminder.CompletionNotes,
            CompletedBy = reminder.CompletedBy,
            CompletedDateTime = reminder.CompletedDateTime,
            CreatedBy = reminder.CreatedBy,
            CreatedDateTime = reminder.CreatedDateTime,
            ModifiedBy = reminder.ModifiedBy,
            ModifiedDateTime = reminder.ModifiedDateTime,
            AlertStatus = CalculateAlertStatus(reminder.DueDate, reminder.Status),
            DaysUntilDue = (reminder.DueDate.Date - DateTime.Today).Days
        };
    }
}
