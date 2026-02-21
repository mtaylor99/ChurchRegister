using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments;

public interface IStartReviewUseCase
{
    Task<RiskAssessmentDto> ExecuteAsync(int id, string modifiedBy);
}

public class StartReviewUseCase : IStartReviewUseCase
{
    private readonly IRiskAssessmentService _service;

    public StartReviewUseCase(IRiskAssessmentService service)
    {
        _service = service;
    }

    public Task<RiskAssessmentDto> ExecuteAsync(int id, string modifiedBy)
    {
        return _service.StartReviewAsync(id, modifiedBy);
    }
}
