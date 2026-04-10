using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Data;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for retrieving church membership statistics
/// </summary>
public class GetMemberStatisticsEndpoint : EndpointWithoutRequest<MemberStatisticsResponse>
{
    private const int ActiveStatusId = 1;
    private readonly ChurchRegisterWebContext _context;

    public GetMemberStatisticsEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Get("/api/church-members/statistics");
        Policies("Bearer");
        Description(x => x
            .WithName("GetMemberStatistics")
            .WithSummary("Get church membership statistics")
            .WithDescription("Returns aggregate statistics for active church members including envelope count, residence count, no-address count, and per-district breakdown.")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        // Fetch all active members with their addresses and districts in a single query
        var activeMembers = await _context.ChurchMembers
            .Include(m => m.Address)
            .Include(m => m.District)
                .ThenInclude(d => d!.Deacon)
            .Where(m => m.ChurchMemberStatusId == ActiveStatusId)
            .ToListAsync(ct);

        // 1. Envelope count
        var envelopeCount = activeMembers.Count(m => m.Envelopes);

        // 2. Residence count — distinct (NameNumber, AddressLineOne, Postcode), case-insensitive
        var residenceCount = activeMembers
            .Where(m => m.AddressId != null && m.Address != null)
            .GroupBy(m => (
                (m.Address!.NameNumber ?? string.Empty).Trim().ToLowerInvariant(),
                (m.Address!.AddressLineOne ?? string.Empty).Trim().ToLowerInvariant(),
                (m.Address!.Postcode ?? string.Empty).Trim().ToLowerInvariant()
            ))
            .Where(g => g.Key.Item1 != string.Empty || g.Key.Item2 != string.Empty || g.Key.Item3 != string.Empty)
            .Count();

        // 3. No-address count
        var noAddressCount = activeMembers.Count(m => m.AddressId == null);

        // 4. District breakdown
        var districtBreakdown = activeMembers
            .GroupBy(m => m.DistrictId)
            .Select(g =>
            {
                var districtName = g.First().District?.Name ?? "Unassigned";
                var memberCount = g.Count();
                var distResidenceCount = g
                    .Where(m => m.AddressId != null && m.Address != null)
                    .GroupBy(m => (
                        (m.Address!.NameNumber ?? string.Empty).Trim().ToLowerInvariant(),
                        (m.Address!.AddressLineOne ?? string.Empty).Trim().ToLowerInvariant(),
                        (m.Address!.Postcode ?? string.Empty).Trim().ToLowerInvariant()
                    ))
                    .Where(ag => ag.Key.Item1 != string.Empty || ag.Key.Item2 != string.Empty || ag.Key.Item3 != string.Empty)
                    .Count();

                var deacon = g.First().District?.Deacon;
                var deaconName = deacon != null
                    ? $"{deacon.FirstName} {deacon.LastName}".Trim()
                    : null;

                return new DistrictStatistic
                {
                    DistrictName = districtName,
                    MemberCount = memberCount,
                    ResidenceCount = distResidenceCount,
                    DeaconName = string.IsNullOrEmpty(deaconName) ? null : deaconName
                };
            })
            .OrderBy(d => d.DistrictName == "Unassigned" ? 1 : 0)
            .ThenBy(d => d.DistrictName)
            .ToList();

        await Send.OkAsync(new MemberStatisticsResponse
        {
            EnvelopeCount = envelopeCount,
            ResidenceCount = residenceCount,
            NoAddressCount = noAddressCount,
            DistrictBreakdown = districtBreakdown
        }, ct);
    }
}
