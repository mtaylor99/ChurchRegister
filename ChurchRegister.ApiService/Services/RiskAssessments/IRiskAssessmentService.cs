using ChurchRegister.ApiService.Models.RiskAssessments;

namespace ChurchRegister.ApiService.Services.RiskAssessments;

public interface IRiskAssessmentService
{
    Task<List<RiskAssessmentDto>> GetRiskAssessmentsAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null);
    Task<RiskAssessmentDetailDto?> GetRiskAssessmentByIdAsync(int id);
    Task<RiskAssessmentDto> CreateRiskAssessmentAsync(CreateRiskAssessmentRequest request, string createdBy);
    Task<RiskAssessmentDto> UpdateRiskAssessmentAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy);
    Task<RiskAssessmentDto> StartReviewAsync(int id, string modifiedBy);
    Task<ApproveRiskAssessmentResponse> ApproveRiskAssessmentAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy);
    Task<DashboardRiskAssessmentSummaryDto> GetDashboardSummaryAsync();
    Task<RiskAssessmentHistoryDto?> GetAssessmentHistoryAsync(int id);
}
