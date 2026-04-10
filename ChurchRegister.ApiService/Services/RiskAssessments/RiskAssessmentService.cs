using ChurchRegister.ApiService.Configuration;
using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ChurchRegister.ApiService.Services.RiskAssessments;

public class RiskAssessmentService : IRiskAssessmentService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly IOptions<RiskAssessmentConfiguration> _configuration;
    private readonly ILogger<RiskAssessmentService> _logger;

    public RiskAssessmentService(
        ChurchRegisterWebContext context,
        UserManager<ChurchRegisterWebUser> userManager,
        IOptions<RiskAssessmentConfiguration> configuration,
        ILogger<RiskAssessmentService> logger)
    {
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<RiskAssessmentDto>> GetRiskAssessmentsAsync(int? categoryId, string? status, bool? overdueOnly, string? title = null)
    {
        var query = _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .AsQueryable();

        // Category filter
        if (categoryId.HasValue)
        {
            query = query.Where(r => r.CategoryId == categoryId.Value);
        }

        // Status filter
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        // Overdue only filter
        if (overdueOnly == true)
        {
            var today = DateTime.UtcNow.Date;
            query = query.Where(r => r.NextReviewDate < today);
        }

        // Title filter (case-insensitive contains)
        if (!string.IsNullOrEmpty(title))
        {
            query = query.Where(r => r.Title.ToLower().Contains(title.ToLower()));
        }

        var assessments = await query
            .OrderBy(r => r.NextReviewDate)
            .ToListAsync();

        _logger.LogInformation("Query returned {Count} risk assessments from database", assessments.Count);

        var dtos = assessments.Select(a => MapToDto(a, a.Approvals.Count)).ToList();

        return dtos;
    }

    public async Task<RiskAssessmentDetailDto?> GetRiskAssessmentByIdAsync(int id)
    {
        var assessment = await _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (assessment == null)
        {
            throw new NotFoundException("Risk Assessment", id);
        }

        var detailDto = new RiskAssessmentDetailDto
        {
            Id = assessment.Id,
            CategoryId = assessment.CategoryId,
            CategoryName = assessment.Category.Name,
            CategoryDescription = assessment.Category.Description,
            Title = assessment.Title,
            Description = assessment.Description,
            ReviewInterval = assessment.ReviewInterval,
            LastReviewDate = assessment.LastReviewDate,
            NextReviewDate = assessment.NextReviewDate,
            Status = assessment.Status,
            Scope = assessment.Scope,
            Notes = assessment.Notes,
            ApprovalCount = assessment.Approvals.Count,
            MinimumApprovalsRequired = _configuration.Value.MinimumApprovalsRequired,
            IsOverdue = assessment.NextReviewDate < DateTime.UtcNow.Date,
            AlertStatus = CalculateAlertStatus(assessment.NextReviewDate, assessment.Status),
            CreatedBy = assessment.CreatedBy,
            CreatedDateTime = assessment.CreatedDateTime,
            ModifiedBy = assessment.ModifiedBy,
            ModifiedDateTime = assessment.ModifiedDateTime,
            Approvals = new List<RiskAssessmentApprovalDto>()
        };

        // Map approvals with member names
        foreach (var approval in assessment.Approvals)
        {
            var member = await _context.ChurchMembers
                .Where(m => m.Id == approval.ApprovedByChurchMemberId)
                .Select(m => new { m.FirstName, m.LastName })
                .FirstOrDefaultAsync();

            detailDto.Approvals.Add(new RiskAssessmentApprovalDto
            {
                Id = approval.Id,
                RiskAssessmentId = approval.RiskAssessmentId,
                ApprovedByChurchMemberId = approval.ApprovedByChurchMemberId,
                ApprovedByMemberName = member != null ? $"{member.FirstName} {member.LastName}" : "Unknown Member",
                ApprovedDate = approval.ApprovedDate,
                Notes = approval.Notes
            });
        }

        return detailDto;
    }

    public async Task<RiskAssessmentDto> CreateRiskAssessmentAsync(CreateRiskAssessmentRequest request, string createdBy)
    {
        // Validate category exists
        var category = await _context.RiskAssessmentCategories.FindAsync(request.CategoryId);
        if (category == null)
        {
            throw new NotFoundException("Risk Assessment Category", request.CategoryId);
        }

        // Validate review interval
        if (request.ReviewInterval != 1 && request.ReviewInterval != 2 &&
            request.ReviewInterval != 3 && request.ReviewInterval != 5)
        {
            throw new ValidationException("Review interval must be 1, 2, 3, or 5 years.");
        }

        // Create the assessment
        var assessment = new RiskAssessment
        {
            CategoryId = request.CategoryId,
            Title = request.Title,
            Description = request.Description,
            ReviewInterval = request.ReviewInterval,
            Scope = request.Scope,
            Notes = request.Notes,
            Status = "Under Review",
            LastReviewDate = null,
            NextReviewDate = DateTime.UtcNow.Date.AddYears(request.ReviewInterval),
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };

        _context.RiskAssessments.Add(assessment);
        await _context.SaveChangesAsync();

        // Reload with category
        await _context.Entry(assessment).Reference(r => r.Category).LoadAsync();

        _logger.LogInformation("Created risk assessment {Id} ({Title}) by {CreatedBy}",
            assessment.Id, assessment.Title, createdBy);

        return MapToDto(assessment, 0);
    }

    public async Task<RiskAssessmentDto> UpdateRiskAssessmentAsync(int id, UpdateRiskAssessmentRequest request, string modifiedBy)
    {
        var assessment = await _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (assessment == null)
        {
            throw new NotFoundException("Risk Assessment", id);
        }

        // Validate review interval
        if (request.ReviewInterval != 1 && request.ReviewInterval != 2 &&
            request.ReviewInterval != 3 && request.ReviewInterval != 5)
        {
            throw new ValidationException("Review interval must be 1, 2, 3, or 5 years.");
        }

        // Update fields
        assessment.Title = request.Title;
        assessment.Description = request.Description;
        assessment.ReviewInterval = request.ReviewInterval;
        assessment.Scope = request.Scope;
        assessment.Notes = request.Notes;
        assessment.ModifiedBy = modifiedBy;
        assessment.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated risk assessment {Id} by {ModifiedBy}", id, modifiedBy);

        return MapToDto(assessment, assessment.Approvals.Count);
    }

    public async Task<RiskAssessmentDto> StartReviewAsync(int id, string modifiedBy)
    {
        var assessment = await _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (assessment == null)
        {
            throw new NotFoundException("Risk Assessment", id);
        }

        // Clear all approvals
        if (assessment.Approvals.Any())
        {
            _context.RiskAssessmentApprovals.RemoveRange(assessment.Approvals);
        }

        // Set status to Under Review
        assessment.Status = "Under Review";
        assessment.ModifiedBy = modifiedBy;
        assessment.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Started review for risk assessment {Id}, cleared {ApprovalCount} approvals",
            id, assessment.Approvals.Count);

        // Reload to get fresh data
        await _context.Entry(assessment).Collection(r => r.Approvals).LoadAsync();

        return MapToDto(assessment, 0);
    }

    public async Task<ApproveRiskAssessmentResponse> ApproveRiskAssessmentAsync(int id, ApproveRiskAssessmentRequest request, string approvedBy)
    {
        var assessment = await _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (assessment == null)
        {
            throw new NotFoundException("Risk Assessment", id);
        }

        // Validate that all deacon member IDs are valid church members
        var invalidMemberIds = new List<int>();
        foreach (var memberId in request.DeaconMemberIds)
        {
            var member = await _context.ChurchMembers
                .AnyAsync(m => m.Id == memberId);
            if (!member)
            {
                invalidMemberIds.Add(memberId);
            }
        }

        if (invalidMemberIds.Any())
        {
            throw new ValidationException($"The following church member IDs are not valid: {string.Join(", ", invalidMemberIds)}");
        }

        // Create approval records for each selected deacon
        var approvalDate = DateTime.UtcNow;
        foreach (var deaconMemberId in request.DeaconMemberIds)
        {
            var approval = new RiskAssessmentApproval
            {
                RiskAssessmentId = id,
                ApprovedByChurchMemberId = deaconMemberId,
                ApprovedDate = approvalDate,
                Notes = request.Notes
            };

            _context.RiskAssessmentApprovals.Add(approval);
        }

        await _context.SaveChangesAsync();

        // Reload approvals to get updated count
        await _context.Entry(assessment).Collection(r => r.Approvals).LoadAsync();

        var totalApprovals = assessment.Approvals.Count;
        var minimumRequired = _configuration.Value.MinimumApprovalsRequired;
        bool assessmentApproved = false;
        DateTime? nextReviewDate = null;

        // Check if minimum approvals met
        if (totalApprovals >= minimumRequired)
        {
            assessment.Status = "Approved";
            assessment.LastReviewDate = DateTime.UtcNow.Date;
            assessment.NextReviewDate = assessment.LastReviewDate.Value.AddYears(assessment.ReviewInterval);
            assessment.ModifiedBy = approvedBy;
            assessment.ModifiedDateTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            assessmentApproved = true;
            nextReviewDate = assessment.NextReviewDate;

            _logger.LogInformation("Risk assessment {Id} approved with {Count} approvals, next review: {NextReview}",
                id, totalApprovals, nextReviewDate);
        }
        else
        {
            _logger.LogInformation("Approval recorded for risk assessment {Id}, {Current} of {Required} approvals received",
                id, totalApprovals, minimumRequired);
        }

        return new ApproveRiskAssessmentResponse
        {
            ApprovalRecorded = true,
            TotalApprovalsReceived = totalApprovals,
            MinimumApprovalsRequired = minimumRequired,
            AssessmentApproved = assessmentApproved,
            NextReviewDate = nextReviewDate
        };
    }

    public async Task<DashboardRiskAssessmentSummaryDto> GetDashboardSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var lookaheadDate = today.AddDays(_configuration.Value.ReviewLookaheadDays);

        var overdueCount = await _context.RiskAssessments
            .Where(r => r.Status == "Approved" && r.NextReviewDate < today)
            .CountAsync();

        var dueSoonCount = await _context.RiskAssessments
            .Where(r => r.Status == "Approved" && r.NextReviewDate >= today && r.NextReviewDate <= lookaheadDate)
            .CountAsync();

        var totalCount = await _context.RiskAssessments.CountAsync();

        return new DashboardRiskAssessmentSummaryDto
        {
            OverdueCount = overdueCount,
            DueSoonCount = dueSoonCount,
            TotalCount = totalCount
        };
    }

    public async Task<RiskAssessmentHistoryDto?> GetAssessmentHistoryAsync(int id)
    {
        var assessment = await _context.RiskAssessments
            .Include(r => r.Category)
            .Include(r => r.Approvals)
            .ThenInclude(a => a.ApprovedByChurchMember)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (assessment == null)
        {
            return null;
        }

        var history = new RiskAssessmentHistoryDto
        {
            Id = assessment.Id,
            Title = assessment.Title,
            CategoryName = assessment.Category.Name,
            ReviewCycles = new List<ReviewCycleDto>()
        };

        // Only show current cycle if there are approvals
        if (assessment.Approvals.Any())
        {
            var currentCycle = new ReviewCycleDto
            {
                ReviewDate = assessment.LastReviewDate,
                Approvals = assessment.Approvals
                    .OrderBy(a => a.ApprovedDate)
                    .Select(a => new RiskAssessmentApprovalDto
                    {
                        Id = a.Id,
                        RiskAssessmentId = a.RiskAssessmentId,
                        ApprovedByChurchMemberId = a.ApprovedByChurchMemberId,
                        ApprovedByMemberName = a.ApprovedByChurchMember != null
                            ? $"{a.ApprovedByChurchMember.FirstName} {a.ApprovedByChurchMember.LastName}"
                            : "Unknown",
                        ApprovedDate = a.ApprovedDate,
                        Notes = a.Notes
                    })
                    .ToList()
            };

            history.ReviewCycles.Add(currentCycle);
        }

        return history;
    }

    private RiskAssessmentDto MapToDto(RiskAssessment assessment, int approvalCount)
    {
        return new RiskAssessmentDto
        {
            Id = assessment.Id,
            CategoryId = assessment.CategoryId,
            CategoryName = assessment.Category.Name,
            CategoryDescription = assessment.Category.Description,
            Title = assessment.Title,
            Description = assessment.Description,
            ReviewInterval = assessment.ReviewInterval,
            LastReviewDate = assessment.LastReviewDate,
            NextReviewDate = assessment.NextReviewDate,
            Status = assessment.Status,
            Scope = assessment.Scope,
            Notes = assessment.Notes,
            ApprovalCount = approvalCount,
            MinimumApprovalsRequired = _configuration.Value.MinimumApprovalsRequired,
            IsOverdue = assessment.NextReviewDate < DateTime.UtcNow.Date,
            AlertStatus = CalculateAlertStatus(assessment.NextReviewDate, assessment.Status),
            CreatedBy = assessment.CreatedBy,
            CreatedDateTime = assessment.CreatedDateTime,
            ModifiedBy = assessment.ModifiedBy,
            ModifiedDateTime = assessment.ModifiedDateTime
        };
    }

    private string CalculateAlertStatus(DateTime nextReviewDate, string status)
    {
        if (status == "Under Review")
        {
            return "amber";
        }

        var today = DateTime.UtcNow.Date;
        var daysUntilDue = (nextReviewDate - today).Days;

        if (daysUntilDue < 0)
        {
            return "red"; // Overdue
        }
        else if (daysUntilDue <= 30)
        {
            return "amber"; // Due within 30 days
        }
        else
        {
            return "green"; // OK
        }
    }
}
