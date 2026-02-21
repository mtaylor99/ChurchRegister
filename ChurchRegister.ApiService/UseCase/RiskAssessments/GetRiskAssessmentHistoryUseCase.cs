using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public class GetRiskAssessmentHistoryUseCase
{
    private readonly IRiskAssessmentService _service;

    public GetRiskAssessmentHistoryUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public async Task<RiskAssessmentHistoryDto?> ExecuteAsync(int id)
    {
        return await _service.GetAssessmentHistoryAsync(id);
    }
}
