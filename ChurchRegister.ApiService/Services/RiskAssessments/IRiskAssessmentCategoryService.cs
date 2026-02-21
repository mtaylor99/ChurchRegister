using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.Services.RiskAssessments;

public interface IRiskAssessmentCategoryService
{
    Task<List<RiskAssessmentCategoryDto>> GetCategoriesAsync();
    Task<RiskAssessmentCategoryDto?> GetCategoryByIdAsync(int id);
    Task<RiskAssessmentCategoryDto> CreateCategoryAsync(CreateCategoryRequest request, string createdBy);
    Task<RiskAssessmentCategoryDto> UpdateCategoryAsync(int id, UpdateCategoryRequest request, string modifiedBy);
    Task DeleteCategoryAsync(int id);
}
