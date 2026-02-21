namespace ChurchRegister.ApiService.Services.RiskAssessments;

/// <summary>
/// Service for generating PDF reports for risk assessments
/// </summary>
public interface IRiskAssessmentPdfService
{
    /// <summary>
    /// Generate risk assessments register report PDF
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF document as byte array</returns>
    Task<byte[]> GenerateRiskAssessmentReportAsync(CancellationToken cancellationToken = default);
}
