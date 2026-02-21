using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IApproveRiskAssessmentUseCase
{
    Task<ApproveRiskAssessmentResponse> ExecuteAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy);
}

public class ApproveRiskAssessmentUseCase : IApproveRiskAssessmentUseCase
{
    private readonly IRiskAssessmentService _service;

    public ApproveRiskAssessmentUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<ApproveRiskAssessmentResponse> ExecuteAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy)
    {
        return _service.ApproveRiskAssessmentAsync(id, request, approvedBy);
    }
}
