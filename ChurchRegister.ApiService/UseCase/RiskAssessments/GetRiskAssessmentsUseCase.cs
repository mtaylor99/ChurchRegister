using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IGetRiskAssessmentsUseCase
{
    Task<List<RiskAssessmentDto>> ExecuteAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null);
}

public class GetRiskAssessmentsUseCase : IGetRiskAssessmentsUseCase
{
    private readonly IRiskAssessmentService _service;

    public GetRiskAssessmentsUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<List<RiskAssessmentDto>> ExecuteAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null)
    {
        return _service.GetRiskAssessmentsAsync(categoryId, status, overdueOnly, title);
    }
}
