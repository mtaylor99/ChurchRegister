using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessments;

/// <summary>
/// Use case implementation for retrieving a filtered list of risk assessments
/// </summary>
public class GetRiskAssessmentsUseCase : IGetRiskAssessmentsUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<GetRiskAssessmentsUseCase> _logger;

    public GetRiskAssessmentsUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<GetRiskAssessmentsUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<RiskAssessmentDto>> ExecuteAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting risk assessments with filters: CategoryId={CategoryId}, Status={Status}, OverdueOnly={OverdueOnly}, Title={Title}",
                categoryId, status, overdueOnly, title);

            var result = await _riskAssessmentService.GetRiskAssessmentsAsync(categoryId, status, overdueOnly, title);

            _logger.LogInformation("Successfully retrieved {Count} risk assessments", result.Count);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving risk assessments");
            throw;
        }
    }
}
