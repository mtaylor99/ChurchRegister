using FastEndpoints;
using ChurchRegister.ApiService.Models.Financial;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Endpoints.Financial;

/// <summary>
/// Request model for getting contribution history
/// </summary>
public class GetContributionHistoryRequest
{
    /// <summary>
    /// Church member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Start date for filtering (optional, defaults to Jan 1 of current year)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// End date for filtering (optional, defaults to Dec 31 of current year)
    /// </summary>
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// Endpoint for retrieving contribution history for a church member
/// </summary>
public class GetContributionHistoryEndpoint : Endpoint<GetContributionHistoryRequest, List<ContributionHistoryDto>>
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetContributionHistoryEndpoint> _logger;

    public GetContributionHistoryEndpoint(
        ChurchRegisterWebContext context,
        ILogger<GetContributionHistoryEndpoint> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/church-members/{memberId}/contributions");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, 
              SystemRoles.FinancialViewer, 
              SystemRoles.FinancialContributor, 
              SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("GetContributionHistory")
            .WithSummary("Get contribution history for a church member")
            .WithDescription("Retrieves contribution records for a specific church member with optional date range filtering")
            .WithTags("Financial", "Church Members"));
    }

    public override async Task HandleAsync(GetContributionHistoryRequest req, CancellationToken ct)
    {
        try
        {
            // Verify member exists
            var memberExists = await _context.ChurchMembers
                .AnyAsync(m => m.Id == req.MemberId, ct);

            if (!memberExists)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            // Set default date range if not provided (current calendar year)
            var currentYear = DateTime.UtcNow.Year;
            var startDate = req.StartDate ?? new DateTime(currentYear, 1, 1);
            var endDate = req.EndDate ?? new DateTime(currentYear, 12, 31, 23, 59, 59);

            _logger.LogInformation(
                "Fetching contribution history for member {MemberId} from {StartDate} to {EndDate}",
                req.MemberId, startDate, endDate);

            // Query contributions
            var contributions = await _context.ChurchMemberContributions
                .Include(c => c.ContributionType)
                .Where(c => c.ChurchMemberId == req.MemberId &&
                           c.Date >= startDate &&
                           c.Date <= endDate)
                .OrderByDescending(c => c.Date)
                .Join(
                    _context.Users,
                    contribution => contribution.CreatedBy,
                    user => user.Id,
                    (contribution, user) => new { Contribution = contribution, User = user })
                .Select(joined => new ContributionHistoryDto
                {
                    Id = joined.Contribution.Id,
                    Date = joined.Contribution.Date,
                    Amount = joined.Contribution.Amount,
                    ContributionType = joined.Contribution.ContributionType.Type,
                    TransactionRef = joined.Contribution.TransactionRef,
                    Description = joined.Contribution.Description,
                    CreatedDateTime = joined.Contribution.CreatedDateTime,
                    CreatedBy = joined.Contribution.CreatedBy,
                    CreatedByName = joined.User.FirstName + " " + joined.User.LastName
                })
                .ToListAsync(ct);

            _logger.LogInformation(
                "Found {Count} contributions for member {MemberId}",
                contributions.Count, req.MemberId);

            await SendOkAsync(contributions, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching contribution history for member {MemberId}", req.MemberId);
            await SendAsync(new List<ContributionHistoryDto>(), 500, ct);
        }
    }
}
