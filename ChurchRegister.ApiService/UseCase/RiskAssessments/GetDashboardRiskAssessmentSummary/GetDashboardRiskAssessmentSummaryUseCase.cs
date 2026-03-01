using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetDashboardRiskAssessmentSummary;

/// <summary>
/// Use case implementation for retrieving the dashboard risk assessment summary
/// </summary>
public class GetDashboardRiskAssessmentSummaryUseCase : IGetDashboardRiskAssessmentSummaryUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<GetDashboardRiskAssessmentSummaryUseCase> _logger;

    public GetDashboardRiskAssessmentSummaryUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<GetDashboardRiskAssessmentSummaryUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<DashboardRiskAssessmentSummaryDto> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting dashboard risk assessment summary");

            var result = await _riskAssessmentService.GetDashboardSummaryAsync();

            _logger.LogInformation("Successfully retrieved dashboard risk assessment summary");

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard risk assessment summary");
            throw;
        }
    }
}
