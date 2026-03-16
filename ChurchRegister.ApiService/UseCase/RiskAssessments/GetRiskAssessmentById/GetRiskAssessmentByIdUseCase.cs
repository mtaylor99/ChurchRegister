using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.GetRiskAssessmentById;

/// <summary>
/// Use case implementation for retrieving a single risk assessment by ID
/// </summary>
public class GetRiskAssessmentByIdUseCase : IGetRiskAssessmentByIdUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<GetRiskAssessmentByIdUseCase> _logger;

    public GetRiskAssessmentByIdUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<GetRiskAssessmentByIdUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentDetailDto?> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting risk assessment by ID: {RiskAssessmentId}", id);

            var result = await _riskAssessmentService.GetRiskAssessmentByIdAsync(id);

            if (result == null)
                _logger.LogWarning("Risk assessment not found: {RiskAssessmentId}", id);
            else
                _logger.LogInformation("Successfully retrieved risk assessment: {RiskAssessmentId}", id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving risk assessment: {RiskAssessmentId}", id);
            throw;
        }
    }
}
