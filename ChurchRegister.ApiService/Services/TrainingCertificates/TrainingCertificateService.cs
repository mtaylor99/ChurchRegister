using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.TrainingCertificates;

/// <summary>
/// Comprehensive training certificate management service providing business logic for certificate operations
/// </summary>
public class TrainingCertificateService : ITrainingCertificateService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<TrainingCertificateService> _logger;

    public TrainingCertificateService(
        ChurchRegisterWebContext context,
        ILogger<TrainingCertificateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<TrainingCertificateDto>> GetTrainingCertificatesAsync(
        TrainingCertificateGridQuery query,
        CancellationToken cancellationToken = default)
    {
        // Validate pagination parameters
        Helpers.ValidationHelpers.RequireValidPageNumber(query.Page);
        Helpers.ValidationHelpers.RequireValidPageSize(query.PageSize);

        var certificatesQuery = _context.ChurchMemberTrainingCertificates
            .AsNoTracking()
            .Include(c => c.ChurchMember)
            .Include(c => c.TrainingCertificateType)
            .AsQueryable();

        // Apply name filter (member name)
        if (!string.IsNullOrWhiteSpace(query.Name))
        {
            var searchTerm = query.Name.ToLower();
            certificatesQuery = certificatesQuery.Where(c =>
                c.ChurchMember.FirstName.ToLower().Contains(searchTerm) ||
                c.ChurchMember.LastName.ToLower().Contains(searchTerm));
        }

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            // Support negation syntax (e.g., "!EXPIRED" to exclude expired)
            if (query.Status.StartsWith("!"))
            {
                var excludedStatus = query.Status.Substring(1);
                certificatesQuery = certificatesQuery.Where(c => c.Status != excludedStatus);
            }
            else
            {
                certificatesQuery = certificatesQuery.Where(c => c.Status == query.Status);
            }
        }

        // Apply training type filter
        if (query.TypeId.HasValue)
        {
            certificatesQuery = certificatesQuery.Where(c => c.TrainingCertificateTypeId == query.TypeId.Value);
        }

        // Get total count before pagination
        var totalCount = await certificatesQuery.CountAsync(cancellationToken);

        // Apply sorting
        certificatesQuery = query.SortDirection?.ToLower() == "desc"
            ? ApplySortingDescending(certificatesQuery, query.SortBy)
            : ApplySortingAscending(certificatesQuery, query.SortBy);

        // Apply pagination
        var certificates = await certificatesQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        // Map to DTOs with RAG status calculation
        var certificateDtos = certificates.Select(c => MapToDto(c)).ToList();

        return new PagedResult<TrainingCertificateDto>
        {
            Items = certificateDtos,
            TotalCount = totalCount,
            CurrentPage = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<TrainingCertificateDto?> GetTrainingCertificateByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var certificate = await _context.ChurchMemberTrainingCertificates
            .AsNoTracking()
            .Include(c => c.ChurchMember)
            .Include(c => c.TrainingCertificateType)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return certificate == null ? null : MapToDto(certificate);
    }

    public async Task<TrainingCertificateDto> CreateTrainingCertificateAsync(
        CreateTrainingCertificateRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // Validate member exists
        var memberExists = await _context.ChurchMembers
            .AnyAsync(m => m.Id == request.ChurchMemberId, cancellationToken);

        if (!memberExists)
        {
            throw new ArgumentException($"Church member with ID {request.ChurchMemberId} not found.");
        }

        // Validate training type exists
        var typeExists = await _context.TrainingCertificateTypes
            .AnyAsync(t => t.Id == request.TrainingCertificateTypeId, cancellationToken);

        if (!typeExists)
        {
            throw new ArgumentException($"Training certificate type with ID {request.TrainingCertificateTypeId} not found.");
        }

        var certificate = new ChurchMemberTrainingCertificates
        {
            ChurchMemberId = request.ChurchMemberId,
            TrainingCertificateTypeId = request.TrainingCertificateTypeId,
            Status = request.Status,
            Expires = request.Expires,
            Notes = request.Notes,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };

        _context.ChurchMemberTrainingCertificates.Add(certificate);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created training certificate {CertificateId} for member {MemberId} by {CreatedBy}",
            certificate.Id, certificate.ChurchMemberId, createdBy);

        // Reload with navigation properties
        return (await GetTrainingCertificateByIdAsync(certificate.Id, cancellationToken))!;
    }

    public async Task<TrainingCertificateDto> UpdateTrainingCertificateAsync(
        UpdateTrainingCertificateRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        var certificate = await _context.ChurchMemberTrainingCertificates
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (certificate == null)
        {
            throw new ArgumentException($"Training certificate with ID {request.Id} not found.");
        }

        certificate.Status = request.Status;
        certificate.Expires = request.Expires;
        certificate.Notes = request.Notes;
        certificate.ModifiedBy = modifiedBy;
        certificate.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated training certificate {CertificateId} by {ModifiedBy}",
            certificate.Id, modifiedBy);

        return (await GetTrainingCertificateByIdAsync(certificate.Id, cancellationToken))!;
    }

    public async Task<IEnumerable<TrainingCertificateTypeDto>> GetTrainingCertificateTypesAsync(
        string? statusFilter = null,
        CancellationToken cancellationToken = default)
    {
        var typesQuery = _context.TrainingCertificateTypes.AsNoTracking();

        // Apply status filter if provided
        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            typesQuery = typesQuery.Where(t => t.Status == statusFilter);
        }

        var types = await typesQuery
            .OrderBy(t => t.Type)
            .ToListAsync(cancellationToken);

        return types.Select(t => new TrainingCertificateTypeDto
        {
            Id = t.Id,
            Type = t.Type,
            Description = t.Description,
            Status = t.Status,
            CreatedBy = t.CreatedBy,
            CreatedDateTime = t.CreatedDateTime,
            ModifiedBy = t.ModifiedBy,
            ModifiedDateTime = t.ModifiedDateTime
        });
    }

    public async Task<TrainingCertificateTypeDto> CreateTrainingCertificateTypeAsync(
        CreateTrainingCertificateTypeRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // Check if type already exists
        var existingType = await _context.TrainingCertificateTypes
            .FirstOrDefaultAsync(t => t.Type == request.Type, cancellationToken);

        if (existingType != null)
        {
            throw new ArgumentException($"Training certificate type '{request.Type}' already exists.");
        }

        var type = new TrainingCertificateTypes
        {
            Type = request.Type,
            Description = request.Description,
            Status = request.Status,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };

        _context.TrainingCertificateTypes.Add(type);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created training certificate type {TypeId} '{TypeName}' by {CreatedBy}",
            type.Id, type.Type, createdBy);

        return new TrainingCertificateTypeDto
        {
            Id = type.Id,
            Type = type.Type,
            Description = type.Description,
            Status = type.Status,
            CreatedBy = type.CreatedBy,
            CreatedDateTime = type.CreatedDateTime
        };
    }

    public async Task<TrainingCertificateTypeDto> UpdateTrainingCertificateTypeAsync(
        UpdateTrainingCertificateTypeRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        var type = await _context.TrainingCertificateTypes
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (type == null)
        {
            throw new ArgumentException($"Training certificate type with ID {request.Id} not found.");
        }

        // Check if new type name already exists (excluding current type)
        var duplicateType = await _context.TrainingCertificateTypes
            .FirstOrDefaultAsync(t => t.Type == request.Type && t.Id != request.Id, cancellationToken);

        if (duplicateType != null)
        {
            throw new ArgumentException($"Training certificate type '{request.Type}' already exists.");
        }

        type.Type = request.Type;
        type.Description = request.Description;
        type.Status = request.Status;
        type.ModifiedBy = modifiedBy;
        type.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated training certificate type {TypeId} to '{TypeName}' with status '{Status}' by {ModifiedBy}",
            type.Id, type.Type, type.Status, modifiedBy);

        return new TrainingCertificateTypeDto
        {
            Id = type.Id,
            Type = type.Type,
            Description = type.Description,
            Status = type.Status,
            CreatedBy = type.CreatedBy,
            CreatedDateTime = type.CreatedDateTime,
            ModifiedBy = type.ModifiedBy,
            ModifiedDateTime = type.ModifiedDateTime
        };
    }

    public async Task<IEnumerable<TrainingCertificateGroupSummaryDto>> GetDashboardTrainingSummaryAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var expiringThreshold = today.AddDays(60); // 60-day window

        // Get certificates that are expiring within 60 days or pending
        var alertCertificates = await _context.ChurchMemberTrainingCertificates
            .AsNoTracking()
            .Include(c => c.ChurchMember)
            .Include(c => c.TrainingCertificateType)
            .Where(c =>
                // Amber: Expiring within 60 days
                (c.Expires.HasValue && c.Expires.Value >= today && c.Expires.Value <= expiringThreshold) ||
                // Pending with no expiry date
                (c.Status == "Pending" && !c.Expires.HasValue))
            .ToListAsync(cancellationToken);

        var dashboardAlerts = new List<TrainingCertificateGroupSummaryDto>();

        // Group by training type and expiry date (for expiring items with dates)
        var expiringGroups = alertCertificates
            .Where(c => c.Expires.HasValue)
            .GroupBy(c => new { c.TrainingCertificateType.Type, c.Expires })
            .ToList();

        foreach (var group in expiringGroups)
        {
            var count = group.Count();
            var expiryDate = group.Key.Expires!.Value;
            var dateStr = expiryDate.ToString("dd MMM yyyy");

            if (count >= 5)
            {
                // Grouped summary for 5+ members
                dashboardAlerts.Add(new TrainingCertificateGroupSummaryDto
                {
                    TrainingType = group.Key.Type,
                    MemberCount = count,
                    ExpiryDate = expiryDate,
                    Message = $"{count} members have {group.Key.Type} expiring on {dateStr}"
                });
            }
            else
            {
                // Individual alerts for each member
                foreach (var cert in group)
                {
                    var memberName = $"{cert.ChurchMember.FirstName} {cert.ChurchMember.LastName}";
                    var message = $"{memberName} - {cert.TrainingCertificateType.Type} expires on {dateStr}";

                    dashboardAlerts.Add(new TrainingCertificateGroupSummaryDto
                    {
                        TrainingType = cert.TrainingCertificateType.Type,
                        MemberCount = 1,
                        ExpiryDate = expiryDate,
                        Message = message
                    });
                }
            }
        }

        // Group by training type for pending items without expiry
        var pendingGroups = alertCertificates
            .Where(c => c.Status == "Pending" && !c.Expires.HasValue)
            .GroupBy(c => c.TrainingCertificateType.Type)
            .ToList();

        foreach (var group in pendingGroups)
        {
            var count = group.Count();

            if (count >= 5)
            {
                // Grouped summary for 5+ members
                dashboardAlerts.Add(new TrainingCertificateGroupSummaryDto
                {
                    TrainingType = group.Key,
                    MemberCount = count,
                    Status = "Pending",
                    Message = $"{count} members have pending {group.Key}"
                });
            }
            else
            {
                // Individual alerts for each member
                foreach (var cert in group)
                {
                    var memberName = $"{cert.ChurchMember.FirstName} {cert.ChurchMember.LastName}";
                    dashboardAlerts.Add(new TrainingCertificateGroupSummaryDto
                    {
                        TrainingType = cert.TrainingCertificateType.Type,
                        MemberCount = 1,
                        Status = "Pending",
                        Message = $"{memberName} - {cert.TrainingCertificateType.Type} pending"
                    });
                }
            }
        }

        // Sort by expiry date (soonest expiring first), then by member name
        return dashboardAlerts
            .OrderBy(a => a.ExpiryDate ?? DateTime.MaxValue) // Sort by date (expiring items first, then pending)
            .ThenBy(a => a.Message); // Sort by message (which includes member name for individuals)
    }

    #region Private Helper Methods

    /// <summary>
    /// Map entity to DTO with RAG status calculation
    /// </summary>
    private TrainingCertificateDto MapToDto(ChurchMemberTrainingCertificates certificate)
    {
        var ragStatus = CalculateRagStatus(certificate.Status, certificate.Expires);

        return new TrainingCertificateDto
        {
            Id = certificate.Id,
            ChurchMemberId = certificate.ChurchMemberId,
            MemberName = $"{certificate.ChurchMember.FirstName} {certificate.ChurchMember.LastName}",
            MemberRole = certificate.ChurchMember.Roles?.FirstOrDefault()?.ChurchMemberRoleType?.Type,
            MemberContact = certificate.ChurchMember.EmailAddress ?? certificate.ChurchMember.PhoneNumber,
            TrainingCertificateTypeId = certificate.TrainingCertificateTypeId,
            TrainingType = certificate.TrainingCertificateType.Type,
            Status = certificate.Status,
            Expires = certificate.Expires,
            Notes = certificate.Notes,
            RagStatus = ragStatus,
            CreatedBy = certificate.CreatedBy,
            CreatedDateTime = certificate.CreatedDateTime,
            ModifiedBy = certificate.ModifiedBy,
            ModifiedDateTime = certificate.ModifiedDateTime
        };
    }

    /// <summary>
    /// Calculate RAG status based on status and expiry date
    /// Red = expired (not "Allow to Expire")
    /// Amber = expiring within 60 days
    /// Empty = all other cases
    /// </summary>
    private string CalculateRagStatus(string status, DateTime? expires)
    {
        if (!expires.HasValue)
        {
            return string.Empty; // No expiry date
        }

        var today = DateTime.UtcNow.Date;
        var daysUntilExpiry = (expires.Value.Date - today).Days;

        // Red: Expired but not "Allow to Expire"
        if (daysUntilExpiry < 0 && status != "Allow to Expire")
        {
            return "Red";
        }

        // Amber: Expiring within 60 days
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 60)
        {
            return "Amber";
        }

        return string.Empty; // More than 60 days or "Allow to Expire"
    }

    private IQueryable<ChurchMemberTrainingCertificates> ApplySortingAscending(
        IQueryable<ChurchMemberTrainingCertificates> query,
        string sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "membername" => query.OrderBy(c => c.ChurchMember.LastName).ThenBy(c => c.ChurchMember.FirstName),
            "trainingtype" => query.OrderBy(c => c.TrainingCertificateType.Type),
            "status" => query.OrderBy(c => c.Status),
            "expires" => query.OrderBy(c => c.Expires ?? DateTime.MaxValue),
            _ => query.OrderBy(c => c.Expires ?? DateTime.MaxValue) // Default sort by expiry
        };
    }

    private IQueryable<ChurchMemberTrainingCertificates> ApplySortingDescending(
        IQueryable<ChurchMemberTrainingCertificates> query,
        string sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "membername" => query.OrderByDescending(c => c.ChurchMember.LastName).ThenByDescending(c => c.ChurchMember.FirstName),
            "trainingtype" => query.OrderByDescending(c => c.TrainingCertificateType.Type),
            "status" => query.OrderByDescending(c => c.Status),
            "expires" => query.OrderByDescending(c => c.Expires ?? DateTime.MaxValue),
            _ => query.OrderByDescending(c => c.Expires ?? DateTime.MaxValue)
        };
    }

    #endregion
}
