using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Contributions.GetContributionHistory;

public class GetContributionHistoryUseCase : IGetContributionHistoryUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetContributionHistoryUseCase> _logger;

    public GetContributionHistoryUseCase(
        ChurchRegisterWebContext context,
        ILogger<GetContributionHistoryUseCase> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<ContributionHistoryDto>> ExecuteAsync(
        int memberId,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Fetching contribution history for member {MemberId} from {StartDate} to {EndDate}",
            memberId, startDate, endDate);

        // Verify member exists
        var memberExists = await _context.ChurchMembers
            .AnyAsync(m => m.Id == memberId, cancellationToken);

        if (!memberExists)
            throw new ArgumentException($"Member with ID {memberId} not found");

        // Build query with optional date filtering
        var query = _context.ChurchMemberContributions
            .Include(c => c.ContributionType)
            .Where(c => c.ChurchMemberId == memberId);

        if (startDate.HasValue)
            query = query.Where(c => c.Date >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(c => c.Date <= endDate.Value);

        // Query contributions
        var contributions = await query
            .OrderByDescending(c => c.Date)
            .Join(
                _context.Users,
                contribution => contribution.CreatedBy,
                user => user.Id,
                (contribution, user) => new ContributionHistoryDto
                {
                    Id = contribution.Id,
                    Date = contribution.Date,
                    Amount = contribution.Amount,
                    ContributionType = contribution.ContributionType != null ? contribution.ContributionType.Type : "Unknown",
                    TransactionRef = contribution.TransactionRef,
                    Description = contribution.Description,
                    CreatedDateTime = contribution.CreatedDateTime,
                    CreatedBy = contribution.CreatedBy,
                    CreatedByName = $"{user.FirstName} {user.LastName}"
                })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Retrieved {Count} contributions for member {MemberId}",
            contributions.Count, memberId);

        return contributions;
    }
}
