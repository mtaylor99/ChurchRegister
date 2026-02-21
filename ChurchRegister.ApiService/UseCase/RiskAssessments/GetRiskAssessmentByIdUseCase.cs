using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IGetRiskAssessmentByIdUseCase
{
    Task<RiskAssessmentDetailDto?> ExecuteAsync(int id);
}

public class GetRiskAssessmentByIdUseCase : IGetRiskAssessmentByIdUseCase
{
    private readonly IRiskAssessmentService _service;

    public GetRiskAssessmentByIdUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<RiskAssessmentDetailDto?> ExecuteAsync(int id)
    {
        return _service.GetRiskAssessmentByIdAsync(id);
    }
}
