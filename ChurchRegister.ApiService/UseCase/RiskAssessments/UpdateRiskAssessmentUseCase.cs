using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IUpdateRiskAssessmentUseCase
{
    Task<RiskAssessmentDto> ExecuteAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy);
}

public class UpdateRiskAssessmentUseCase : IUpdateRiskAssessmentUseCase
{
    private readonly IRiskAssessmentService _service;

    public UpdateRiskAssessmentUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<RiskAssessmentDto> ExecuteAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy)
    {
        return _service.UpdateRiskAssessmentAsync(id, request, modifiedBy);
    }
}
