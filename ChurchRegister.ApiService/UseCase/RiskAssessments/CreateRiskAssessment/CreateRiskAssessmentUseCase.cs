using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;

namespace ChurchRegister.ApiService.UseCase.RiskAssessments.CreateRiskAssessment;

/// <summary>
/// Use case implementation for creating a new risk assessment
/// Handles orchestration of risk assessment creation with logging and error handling
/// </summary>
public class CreateRiskAssessmentUseCase : ICreateRiskAssessmentUseCase
{
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly ILogger<CreateRiskAssessmentUseCase> _logger;

    public CreateRiskAssessmentUseCase(
        IRiskAssessmentService riskAssessmentService,
        ILogger<CreateRiskAssessmentUseCase> logger)
    {
        _riskAssessmentService = riskAssessmentService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RiskAssessmentDto> ExecuteAsync(
        CreateRiskAssessmentRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating risk assessment: {Title} by {CreatedBy}", request.Title, createdBy);

            var result = await _riskAssessmentService.CreateRiskAssessmentAsync(request, createdBy);

            _logger.LogInformation("Successfully created risk assessment with ID: {RiskAssessmentId}", result.Id);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating risk assessment: {Title} by {CreatedBy}", request.Title, createdBy);
            throw;
        }
    }
}
