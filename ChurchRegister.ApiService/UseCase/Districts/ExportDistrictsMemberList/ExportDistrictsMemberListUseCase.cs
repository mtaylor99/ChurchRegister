using Microsoft.EntityFrameworkCore;
using ChurchRegister.Database.Data;
using ChurchRegister.ApiService.Services.Districts;

namespace ChurchRegister.ApiService.UseCase.Districts.ExportDistrictsMemberList;

/// <summary>
/// Use case for generating a per-district member list PDF
/// </summary>
public class ExportDistrictsMemberListUseCase : IExportDistrictsMemberListUseCase
{
    private const int ActiveStatusId = 1;
    private readonly ChurchRegisterWebContext _context;
    private readonly DistrictPdfService _pdfService;
    private readonly ILogger<ExportDistrictsMemberListUseCase> _logger;

    public ExportDistrictsMemberListUseCase(
        ChurchRegisterWebContext context,
        DistrictPdfService pdfService,
        ILogger<ExportDistrictsMemberListUseCase> logger)
    {
        _context = context;
        _pdfService = pdfService;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating district members list PDF");

        // Fetch all districts with their leadership nav props
        var districts = await _context.Districts
            .Include(d => d.Deacon)
            .Include(d => d.DistrictOfficer)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        // Fetch all active members with their addresses
        var activeMembers = await _context.ChurchMembers
            .Include(m => m.Address)
            .Where(m => m.ChurchMemberStatusId == ActiveStatusId)
            .OrderBy(m => m.LastName)
            .ThenBy(m => m.FirstName)
            .ToListAsync(cancellationToken);

        // Group members by DistrictId — handle null DistrictId separately to avoid
        // ArgumentNullException from Dictionary<int?, V> with null key lookups.
        var membersByDistrictId = activeMembers
            .Where(m => m.DistrictId.HasValue)
            .GroupBy(m => m.DistrictId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var unassignedMembers = activeMembers
            .Where(m => !m.DistrictId.HasValue)
            .ToList();

        var sections = new List<DistrictMemberListSection>();

        // One section per district (alphabetical — already ordered above)
        foreach (var district in districts)
        {
            var members = membersByDistrictId.TryGetValue(district.Id, out var dm) ? dm : new();

            sections.Add(new DistrictMemberListSection
            {
                DistrictName = district.Name,
                Description = district.Description,
                DeaconName = FormatName(district.Deacon),
                DistrictOfficerName = FormatName(district.DistrictOfficer),
                IsUnassigned = false,
                ResidenceCount = CountResidences(members),
                Members = members.Select(m => new MemberListRow
                {
                    FullName = FormatMemberName(m),
                    FormattedAddress = FormatAddress(m.Address),
                    PhoneNumber = m.PhoneNumber
                }).ToList()
            });
        }

        // Unassigned members (DistrictId == null)
        if (unassignedMembers.Count > 0)
        {
            sections.Add(new DistrictMemberListSection
            {
                DistrictName = "Unassigned Members",
                IsUnassigned = true,
                ResidenceCount = CountResidences(unassignedMembers),
                Members = unassignedMembers.Select(m => new MemberListRow
                {
                    FullName = FormatMemberName(m),
                    FormattedAddress = FormatAddress(m.Address),
                    PhoneNumber = m.PhoneNumber
                }).ToList()
            });
        }

        _logger.LogInformation("Generating PDF for {Count} district sections", sections.Count);

        var pdfBytes = _pdfService.GenerateDistrictMemberListReport(sections);

        _logger.LogInformation("District members list PDF generated successfully ({Size} bytes)", pdfBytes.Length);

        return pdfBytes;
    }

    private static int CountResidences(List<ChurchRegister.Database.Entities.ChurchMember> members)
    {
        return members
            .Where(m => m.AddressId != null && m.Address != null)
            .GroupBy(m => (
                (m.Address!.NameNumber ?? string.Empty).Trim().ToLowerInvariant(),
                (m.Address!.AddressLineOne ?? string.Empty).Trim().ToLowerInvariant(),
                (m.Address!.Postcode ?? string.Empty).Trim().ToLowerInvariant()
            ))
            .Where(g => g.Key.Item1 != string.Empty || g.Key.Item2 != string.Empty || g.Key.Item3 != string.Empty)
            .Count();
    }

    private static string FormatMemberName(ChurchRegister.Database.Entities.ChurchMember member)
    {
        var parts = new[] { member.Title, member.FirstName, member.LastName }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(" ", parts).Trim();
    }

    private static string? FormatName(ChurchRegister.Database.Entities.ChurchMember? member)
    {
        if (member == null) return null;
        var parts = new[] { member.Title, member.FirstName, member.LastName }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(" ", parts).Trim();
    }

    private static string FormatAddress(ChurchRegister.Database.Entities.Address? address)
    {
        if (address == null) return string.Empty;

        var parts = new[]
        {
            address.NameNumber,
            address.AddressLineOne,
            address.AddressLineTwo,
            address.Town,
            address.County,
            address.Postcode
        }.Where(p => !string.IsNullOrWhiteSpace(p));

        return string.Join(", ", parts);
    }
}

/// <summary>
/// Represents one district's section in the PDF report
/// </summary>
public class DistrictMemberListSection
{
    public string DistrictName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DeaconName { get; set; }
    public string? DistrictOfficerName { get; set; }
    public bool IsUnassigned { get; set; }
    public int ResidenceCount { get; set; }
    public List<MemberListRow> Members { get; set; } = new();
}

/// <summary>
/// Represents one member row in the district members list
/// </summary>
public class MemberListRow
{
    public string FullName { get; set; } = string.Empty;
    public string FormattedAddress { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}
