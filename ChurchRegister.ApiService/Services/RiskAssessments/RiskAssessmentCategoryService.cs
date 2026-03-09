using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.RiskAssessments;

public class RiskAssessmentCategoryService : IRiskAssessmentCategoryService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<RiskAssessmentCategoryService> _logger;

    public RiskAssessmentCategoryService(ChurchRegisterWebContext context, ILogger<RiskAssessmentCategoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<RiskAssessmentCategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.RiskAssessmentCategories
            .OrderBy(c => c.Name)
            .ToListAsync();

        return categories.Select(c => new RiskAssessmentCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            CreatedBy = c.CreatedBy,
            CreatedDateTime = c.CreatedDateTime,
            ModifiedBy = c.ModifiedBy,
            ModifiedDateTime = c.ModifiedDateTime
        }).ToList();
    }

    public async Task<RiskAssessmentCategoryDto?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.RiskAssessmentCategories.FindAsync(id);

        if (category == null)
        {
            return null;
        }

        return new RiskAssessmentCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            CreatedBy = category.CreatedBy,
            CreatedDateTime = category.CreatedDateTime,
            ModifiedBy = category.ModifiedBy,
            ModifiedDateTime = category.ModifiedDateTime
        };
    }

    public async Task<RiskAssessmentCategoryDto> CreateCategoryAsync(CreateCategoryRequest request, string createdBy)
    {
        //Check if category name already exists
        var existingCategory = await _context.RiskAssessmentCategories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == request.Name.ToLower());

        if (existingCategory != null)
        {
            throw new ConflictException($"Category with name '{request.Name}' already exists");
        }

        var category = new RiskAssessmentCategory
        {
            Name = request.Name,
            Description = request.Description,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };

        _context.RiskAssessmentCategories.Add(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created risk assessment category {Name} by {CreatedBy}", category.Name, createdBy);

        return new RiskAssessmentCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            CreatedBy = category.CreatedBy,
            CreatedDateTime = category.CreatedDateTime,
            ModifiedBy = category.ModifiedBy,
            ModifiedDateTime = category.ModifiedDateTime
        };
    }

    public async Task<RiskAssessmentCategoryDto> UpdateCategoryAsync(int id, UpdateCategoryRequest request, string modifiedBy)
    {
        var category = await _context.RiskAssessmentCategories.FindAsync(id);

        if (category == null)
        {
            throw new NotFoundException("Risk Assessment Category", id);
        }

        // Check if new name conflicts with existing category (excluding current one)
        var existingCategory = await _context.RiskAssessmentCategories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == request.Name.ToLower() && c.Id != id);

        if (existingCategory != null)
        {
            throw new ConflictException($"Category with name '{request.Name}' already exists");
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.ModifiedBy = modifiedBy;
        category.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated risk assessment category {Id} by {ModifiedBy}", id, modifiedBy);

        return new RiskAssessmentCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            CreatedBy = category.CreatedBy,
            CreatedDateTime = category.CreatedDateTime,
            ModifiedBy = category.ModifiedBy,
            ModifiedDateTime = category.ModifiedDateTime
        };
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await _context.RiskAssessmentCategories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException("Risk Assessment Category", id);
        }

        // Check if category has associated risk assessments
        var assessmentCount = await _context.RiskAssessments
            .CountAsync(r => r.CategoryId == id);

        if (assessmentCount > 0)
        {
            throw new ValidationException($"Cannot delete category '{category.Name}' because it has {assessmentCount} associated risk assessment(s). Please reassign or delete them first.");
        }

        _context.RiskAssessmentCategories.Remove(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted risk assessment category {Id} ({Name})", id, category.Name);
    }
}
