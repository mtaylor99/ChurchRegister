using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ChurchRegister.ApiService.Services.Reminders;

public class ReminderCategoryService : IReminderCategoryService
{
    private readonly ChurchRegisterWebContext _context;
    private static readonly Regex ColorHexPattern = new("^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    public ReminderCategoryService(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public async Task<List<ReminderCategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.ReminderCategories
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var result = new List<ReminderCategoryDto>();
        foreach (var category in categories)
        {
            var reminderCount = await _context.Reminders
                .Where(r => r.CategoryId == category.Id)
                .CountAsync();

            result.Add(MapToDto(category, reminderCount));
        }

        return result;
    }

    public async Task<ReminderCategoryDto> GetCategoryByIdAsync(int id)
    {
        var category = await _context.ReminderCategories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException("ReminderCategory", id);
        }

        var reminderCount = await _context.Reminders
            .Where(r => r.CategoryId == id)
            .CountAsync();

        return MapToDto(category, reminderCount);
    }

    public async Task<ReminderCategoryDto> CreateCategoryAsync(CreateReminderCategoryRequest request, string createdBy)
    {
        // Validate name uniqueness (case-insensitive)
        var exists = await _context.ReminderCategories
            .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower());

        if (exists)
        {
            throw new ValidationException($"A category with the name '{request.Name}' already exists.");
        }

        // Validate color hex format if provided
        ValidateColorHex(request.ColorHex);

        // Get max sort order and add 1
        var maxSortOrder = await _context.ReminderCategories
            .MaxAsync(c => (int?)c.SortOrder) ?? 0;

        var category = new ReminderCategory
        {
            Name = request.Name,
            ColorHex = request.ColorHex,
            IsSystemCategory = false,
            SortOrder = maxSortOrder + 1,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow,
            ModifiedBy = createdBy,
            ModifiedDateTime = DateTime.UtcNow
        };

        _context.ReminderCategories.Add(category);
        await _context.SaveChangesAsync();

        return MapToDto(category, 0);
    }

    public async Task<ReminderCategoryDto> UpdateCategoryAsync(int id, UpdateReminderCategoryRequest request, string modifiedBy)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request), "Update request cannot be null");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ValidationException("Category name is required");
        }

        var category = await _context.ReminderCategories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException("ReminderCategory", id);
        }

        // If system category, only allow ColorHex changes
        if (category.IsSystemCategory && category.Name != request.Name)
        {
            throw new ValidationException("System category names cannot be modified.");
        }

        // Validate name uniqueness if changed (case-insensitive)
        if (category.Name.Trim().ToLower() != request.Name.Trim().ToLower())
        {
            var exists = await _context.ReminderCategories
                .AnyAsync(c => c.Id != id && c.Name.Trim().ToLower() == request.Name.Trim().ToLower());

            if (exists)
            {
                throw new ValidationException($"A category with the name '{request.Name}' already exists.");
            }
        }

        // Validate color hex format if provided
        ValidateColorHex(request.ColorHex);

        category.Name = request.Name;
        category.ColorHex = request.ColorHex;
        category.ModifiedBy = modifiedBy;
        category.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var reminderCount = await _context.Reminders
            .Where(r => r.CategoryId == id)
            .CountAsync();

        return MapToDto(category, reminderCount);
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await _context.ReminderCategories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException("ReminderCategory", id);
        }

        if (category.IsSystemCategory)
        {
            throw new ValidationException("Cannot delete system category.");
        }

        var reminderCount = await _context.Reminders
            .Where(r => r.CategoryId == id)
            .CountAsync();

        if (reminderCount > 0)
        {
            throw new ValidationException($"Category in use by {reminderCount} reminders. Cannot delete.");
        }

        _context.ReminderCategories.Remove(category);
        await _context.SaveChangesAsync();
    }

    private void ValidateColorHex(string? colorHex)
    {
        if (colorHex != null && !ColorHexPattern.IsMatch(colorHex))
        {
            throw new ValidationException("ColorHex must be in format #RRGGBB (e.g., #ff6600).");
        }
    }

    private ReminderCategoryDto MapToDto(ReminderCategory category, int reminderCount)
    {
        return new ReminderCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            ColorHex = category.ColorHex,
            IsSystemCategory = category.IsSystemCategory,
            SortOrder = category.SortOrder,
            ReminderCount = reminderCount,
            CreatedBy = category.CreatedBy,
            CreatedDateTime = category.CreatedDateTime,
            ModifiedBy = category.ModifiedBy,
            ModifiedDateTime = category.ModifiedDateTime
        };
    }
}
