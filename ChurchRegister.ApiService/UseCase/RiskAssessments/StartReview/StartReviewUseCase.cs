using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.StartReview;

/// <summary>
/// Use case implementation for starting a risk assessment review
/// </summary>
public class StartReviewUseCase : IStartReviewUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<StartReviewUseCase> _logger;

    public StartReviewUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<StartReviewUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentDto> ExecuteAsync(int id, string modifiedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting review for risk assessment: {RiskAssessmentId} by {ModifiedBy}", id, modifiedBy);

            var result = await _riskAssessmentService.StartReviewAsync(id, modifiedBy);

            _logger.LogInformation("Successfully started review for risk assessment: {RiskAssessmentId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting review for risk assessment: {RiskAssessmentId}", id);
            throw;
        }
    }
}
