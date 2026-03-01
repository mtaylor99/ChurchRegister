using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentHistory;

/// <summary>
/// Use case implementation for retrieving risk assessment version history
/// </summary>
public class GetRiskAssessmentHistoryUseCase : IGetRiskAssessmentHistoryUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<GetRiskAssessmentHistoryUseCase> _logger;

    public GetRiskAssessmentHistoryUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<GetRiskAssessmentHistoryUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentHistoryDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting history for risk assessment: {RiskAssessmentId}", id);

            var result = await _riskAssessmentService.GetAssessmentHistoryAsync(id);

            if (result == null)
                _logger.LogWarning("History not found for risk assessment: {RiskAssessmentId}", id);
            else
                _logger.LogInformation("Successfully retrieved history for risk assessment: {RiskAssessmentId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving history for risk assessment: {RiskAssessmentId}", id);
            throw;
        }
    }
}
