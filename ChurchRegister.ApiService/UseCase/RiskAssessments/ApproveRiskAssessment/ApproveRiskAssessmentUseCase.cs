using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.ApproveRiskAssessment;

/// <summary>
/// Use case implementation for approving a risk assessment
/// </summary>
public class ApproveRiskAssessmentUseCase : IApproveRiskAssessmentUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<ApproveRiskAssessmentUseCase> _logger;

    public ApproveRiskAssessmentUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<ApproveRiskAssessmentUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ApproveRiskAssessmentResponse> ExecuteAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Approving risk assessment: {RiskAssessmentId} by {ApprovedBy}", id, approvedBy);

            var result = await _riskAssessmentService.ApproveRiskAssessmentAsync(id, request, approvedBy);

            _logger.LogInformation("Successfully approved risk assessment: {RiskAssessmentId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving risk assessment: {RiskAssessmentId}", id);
            throw;
        }
    }
}
