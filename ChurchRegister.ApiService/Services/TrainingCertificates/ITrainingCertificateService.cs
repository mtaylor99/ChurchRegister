using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;

namespace ChurchRegister.ApiService.Services.TrainingCertificates;

/// <summary>
/// Service interface for training certificate management operations
/// Provides business logic layer for certificate CRUD operations, RAG status calculation, and dashboard alerts
/// </summary>
public interface ITrainingCertificateService
{
    /// <summary>
    /// Get paginated training certificates with search and filtering
    /// </summary>
    Task<PagedResult<TrainingCertificateDto>> GetTrainingCertificatesAsync(TrainingCertificateGridQuery query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get training certificate by ID with full details
    /// </summary>
    Task<TrainingCertificateDto?> GetTrainingCertificateByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new training certificate with audit logging
    /// </summary>
    Task<TrainingCertificateDto> CreateTrainingCertificateAsync(CreateTrainingCertificateRequest request, string createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update training certificate information with audit logging
    /// </summary>
    Task<TrainingCertificateDto> UpdateTrainingCertificateAsync(UpdateTrainingCertificateRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all training certificate types with optional Active status filter
    /// </summary>
    Task<IEnumerable<TrainingCertificateTypeDto>> GetTrainingCertificateTypesAsync(string? statusFilter = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new training certificate type
    /// </summary>
    Task<TrainingCertificateTypeDto> CreateTrainingCertificateTypeAsync(CreateTrainingCertificateTypeRequest request, string createdBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update training certificate type (edit only, no delete)
    /// </summary>
    Task<TrainingCertificateTypeDto> UpdateTrainingCertificateTypeAsync(UpdateTrainingCertificateTypeRequest request, string modifiedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get dashboard training summary with grouped alerts (5+ threshold) and RAG filtering
    /// </summary>
    Task<IEnumerable<TrainingCertificateGroupSummaryDto>> GetDashboardTrainingSummaryAsync(CancellationToken cancellationToken = default);
}
