using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IGetDashboardRiskAssessmentSummaryUseCase
{
    Task<DashboardRiskAssessmentSummaryDto> ExecuteAsync();
}

public class GetDashboardRiskAssessmentSummaryUseCase : IGetDashboardRiskAssessmentSummaryUseCase
{
    private readonly IRiskAssessmentService _service;

    public GetDashboardRiskAssessmentSummaryUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<DashboardRiskAssessmentSummaryDto> ExecuteAsync()
    {
        return _service.GetDashboardSummaryAsync();
    }
}
