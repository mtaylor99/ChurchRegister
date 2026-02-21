using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IGetRiskAssessmentCategoriesUseCase
{
    Task<List<RiskAssessmentCategoryDto>> ExecuteAsync();
}

public class GetRiskAssessmentCategoriesUseCase : IGetRiskAssessmentCategoriesUseCase
{
    private readonly IRiskAssessmentCategoryService _service;

    public GetRiskAssessmentCategoriesUseCase(IRiskAssessmentCategoryService service)
    {
        _service = service;
    }

    public Task<List<RiskAssessmentCategoryDto>> ExecuteAsync()
    {
        return _service.GetCategoriesAsync();
    }
}
