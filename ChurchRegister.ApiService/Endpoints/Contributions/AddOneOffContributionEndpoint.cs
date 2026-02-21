using FastEndpoints;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// Endpoint for adding a one-off manual contribution
/// </summary>
public class AddOneOffContributionEndpoint : Endpoint<AddOneOffContributionRequest, AddOneOffContributionResponse>
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<AddOneOffContributionEndpoint> _logger;

    public AddOneOffContributionEndpoint(
        ChurchRegisterWebContext context,
        ILogger<AddOneOffContributionEndpoint> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/contributions/one-off");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("AddOneOffContribution")
            .WithSummary("Add a one-off manual contribution")
            .WithDescription("Creates a manual contribution record for a church member")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(AddOneOffContributionRequest req, CancellationToken ct)
    {
        try
        {
            // Get current user ID
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User not authenticated");

            // Verify member exists
            var member = await _context.ChurchMembers
                .FirstOrDefaultAsync(m => m.Id == req.MemberId, ct);

            if (member == null)
            {
                _logger.LogWarning("Member with ID {MemberId} not found", req.MemberId);
                await SendNotFoundAsync(ct);
                return;
            }

            // Get "Cash" contribution type (or create if doesn't exist)
            var contributionType = await _context.ContributionTypes
                .FirstOrDefaultAsync(ct => ct.Type == "Cash", ct);

            if (contributionType == null)
            {
                contributionType = new ContributionType
                {
                    Type = "Cash",
                    CreatedBy = userId,
                    CreatedDateTime = DateTime.UtcNow
                };
                _context.ContributionTypes.Add(contributionType);
                await _context.SaveChangesAsync(ct);
            }

            // Create the contribution
            var contribution = new ChurchMemberContributions
            {
                ChurchMemberId = req.MemberId,
                Amount = req.Amount,
                Date = req.Date,
                Description = req.Description,
                TransactionRef = $"MANUAL-{DateTime.UtcNow:yyyyMMddHHmmss}",
                ContributionTypeId = contributionType.Id,
                Deleted = false,
                ManualContribution = true,
                CreatedBy = userId,
                CreatedDateTime = DateTime.UtcNow
            };

            _context.ChurchMemberContributions.Add(contribution);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "One-off contribution of {Amount:C} added for member {MemberId} by user {UserId}",
                req.Amount, req.MemberId, userId);

            var response = new AddOneOffContributionResponse
            {
                ContributionId = contribution.Id,
                MemberName = $"{member.FirstName} {member.LastName}",
                Message = $"Contribution of £{req.Amount:F2} added successfully"
            };

            await SendOkAsync(response, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding one-off contribution for member {MemberId}", req.MemberId);
            await SendAsync(new AddOneOffContributionResponse
            {
                Message = "An error occurred while adding the contribution"
            }, 500, ct);
        }
    }
}
