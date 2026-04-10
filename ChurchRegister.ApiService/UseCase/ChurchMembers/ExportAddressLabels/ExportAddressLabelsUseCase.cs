using ChurchRegister.ApiService.Services.Labels;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressLabels;

/// <summary>
/// Queries active members, groups by address, computes combined names, and generates an Avery L7163 PDF.
/// </summary>
public class ExportAddressLabelsUseCase : IExportAddressLabelsUseCase
{
    private readonly ChurchRegisterWebContext _db;
    private readonly ILabelPdfService _labelPdfService;
    private readonly ILogger<ExportAddressLabelsUseCase> _logger;

    public ExportAddressLabelsUseCase(
        ChurchRegisterWebContext db,
        ILabelPdfService labelPdfService,
        ILogger<ExportAddressLabelsUseCase> logger)
    {
        _db = db;
        _labelPdfService = labelPdfService;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation("Generating address labels PDF");

        var members = await _db.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1)
            .Include(m => m.Address)
            .Include(m => m.Roles)
                .ThenInclude(r => r.ChurchMemberRoleType)
            .AsNoTracking()
            .ToListAsync(ct);

        // Group by normalised address content so that:
        //   • Members sharing the same physical address (even with separate AddressId values) are combined.
        //   • Members with no address each become their own label.
        var groups = members
            .GroupBy(GetAddressGroupKey)
            .ToList();

        var labelList = new List<(string SortLastName, string SortFirstName, LabelData Data)>();

        foreach (var group in groups)
        {
            var groupMembers = group
                .OrderBy(m => m.FirstName)
                .ToList();

            if (groupMembers.Count == 0) continue;

            var primaryMember = groupMembers
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .First();

            var combinedName = BuildCombinedName(groupMembers);

            // NonMember: ALL members have at least one role AND all roles are "Non-Member"
            var line5IsNonMember = groupMembers.All(m =>
                m.Roles.Any() &&
                m.Roles.All(r => r.ChurchMemberRoleType.Type.Equals("Non-Member", StringComparison.OrdinalIgnoreCase)));

            var address = groupMembers.FirstOrDefault(m => m.Address != null)?.Address;

            labelList.Add((
                primaryMember.LastName,
                primaryMember.FirstName,
                new LabelData
                {
                    Name = combinedName,
                    NameNumber = address?.NameNumber,
                    AddressLineOne = address?.AddressLineOne,
                    AddressLineTwo = address?.AddressLineTwo,
                    Town = address?.Town,
                    Postcode = address?.Postcode,
                    Line5 = line5IsNonMember ? "***" : null,
                    Line5IsNonMember = line5IsNonMember,
                }
            ));
        }

        // Sort groups by primary member's LastName then FirstName
        var sortedLabels = labelList
            .OrderBy(x => x.SortLastName)
            .ThenBy(x => x.SortFirstName)
            .Select(x => x.Data)
            .ToList();

        _logger.LogInformation("Generating address labels PDF with {Count} labels", sortedLabels.Count);

        return _labelPdfService.GenerateLabels(sortedLabels);
    }

    /// <summary>
    /// Returns a grouping key based on normalised address content.
    /// Members with no address get a unique key so they are never merged.
    /// Members sharing the same AddressLineOne + Town + Postcode are merged regardless
    /// of whether they have the same AddressId in the database.
    /// </summary>
    private static string GetAddressGroupKey(ChurchMember m)
    {
        if (m.Address == null)
            return $"noadd:{m.Id}";

        var key = $"{Norm(m.Address.AddressLineOne)}|{Norm(m.Address.Town)}|{Norm(m.Address.Postcode)}";
        return string.IsNullOrWhiteSpace(key.Replace("|", ""))
            ? $"noadd:{m.Id}"
            : $"addr:{key}";
    }

    private static string Norm(string? s) => s?.Trim().ToUpperInvariant() ?? string.Empty;

    /// <summary>
    /// Builds a combined name for a group of members sorted by FirstName alphabetically.
    /// Rules:
    ///   All same surname  → "A, B &amp; C Smith" (or "A &amp; B Smith")
    ///   Mixed surnames     → "A Smith &amp; B Brown" (full names joined with " &amp; ")
    /// </summary>
    private static string BuildCombinedName(IReadOnlyList<ChurchMember> members)
    {
        if (members.Count == 1)
        {
            return $"{members[0].FirstName} {members[0].LastName}";
        }

        var allSameSurname = members.All(m =>
            m.LastName.Equals(members[0].LastName, StringComparison.OrdinalIgnoreCase));

        if (allSameSurname)
        {
            var firstNames = members.Select(m => m.FirstName).ToList();
            var joinedFirstNames = JoinWithAmpersand(firstNames);
            return $"{joinedFirstNames} {members[0].LastName}";
        }
        else
        {
            var fullNames = members.Select(m => $"{m.FirstName} {m.LastName}").ToList();
            return string.Join(" & ", fullNames);
        }
    }

    /// <summary>
    /// Joins a list of strings with commas and a final " &amp; ".
    /// e.g. ["A","B","C"] → "A, B &amp; C"  |  ["A","B"] → "A &amp; B"
    /// </summary>
    private static string JoinWithAmpersand(IReadOnlyList<string> items)
    {
        if (items.Count == 1) return items[0];
        if (items.Count == 2) return $"{items[0]} & {items[1]}";

        var allButLast = string.Join(", ", items.Take(items.Count - 1));
        return $"{allButLast} & {items[^1]}";
    }
}
