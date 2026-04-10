using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.UpdateRiskAssessment;

/// <summary>
/// Use case implementation for updating an existing risk assessment
/// </summary>
public class UpdateRiskAssessmentUseCase : IUpdateRiskAssessmentUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<UpdateRiskAssessmentUseCase> _logger;

    public UpdateRiskAssessmentUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<UpdateRiskAssessmentUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentDto> ExecuteAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating risk assessment: {RiskAssessmentId} by {ModifiedBy}", id, modifiedBy);

            var result = await _riskAssessmentService.UpdateRiskAssessmentAsync(id, request, modifiedBy);

            _logger.LogInformation("Successfully updated risk assessment: {RiskAssessmentId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating risk assessment: {RiskAssessmentId}", id);
            throw;
        }
    }
}
