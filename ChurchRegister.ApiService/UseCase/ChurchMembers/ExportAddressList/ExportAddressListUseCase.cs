using System.Drawing;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportAddressList;

/// <summary>
/// Builds an Address List Excel workbook.
/// Columns: Combined Name | Name/Number | Address Line 1 | Address Line 2 | Town | County | Postcode | Non-Member
/// </summary>
public class ExportAddressListUseCase : IExportAddressListUseCase
{
    private readonly ChurchRegisterWebContext _db;
    private readonly ILogger<ExportAddressListUseCase> _logger;

    private static readonly Color HeaderBackground = Color.FromArgb(0x00, 0x33, 0x66);
    private static readonly Color HeaderFont = Color.White;
    private static readonly Color RowWhite = Color.White;
    private static readonly Color RowGrey = Color.FromArgb(0xF2, 0xF2, 0xF2);

    public ExportAddressListUseCase(
        ChurchRegisterWebContext db,
        ILogger<ExportAddressListUseCase> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation("Generating address list Excel");

        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");

        var members = await _db.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1)
            .Include(m => m.Address)
            .Include(m => m.Roles)
                .ThenInclude(r => r.ChurchMemberRoleType)
            .AsNoTracking()
            .ToListAsync(ct);

        var groups = members
            .GroupBy(GetAddressGroupKey)
            .ToList();

        var rows = new List<AddressListRow>();

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

            var isNonMember = groupMembers.All(m =>
                m.Roles.Any() &&
                m.Roles.All(r => r.ChurchMemberRoleType.Type.Equals("Non-Member", StringComparison.OrdinalIgnoreCase)));

            var address = groupMembers.FirstOrDefault(m => m.Address != null)?.Address;

            rows.Add(new AddressListRow
            {
                SortLastName = primaryMember.LastName,
                SortFirstName = primaryMember.FirstName,
                CombinedName = combinedName,
                NameNumber = address?.NameNumber ?? string.Empty,
                AddressLine1 = address?.AddressLineOne ?? string.Empty,
                AddressLine2 = address?.AddressLineTwo ?? string.Empty,
                Town = address?.Town ?? string.Empty,
                County = address?.County ?? string.Empty,
                Postcode = address?.Postcode ?? string.Empty,
                NonMember = isNonMember,
            });
        }

        var sorted = rows
            .OrderBy(r => r.SortLastName)
            .ThenBy(r => r.SortFirstName)
            .ToList();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Address List");

        // Header row
        ws.Cells[1, 1].Value = "Combined Name";
        ws.Cells[1, 2].Value = "Name/Number";
        ws.Cells[1, 3].Value = "Address Line 1";
        ws.Cells[1, 4].Value = "Address Line 2";
        ws.Cells[1, 5].Value = "Town";
        ws.Cells[1, 6].Value = "County";
        ws.Cells[1, 7].Value = "Postcode";
        ws.Cells[1, 8].Value = "Non-Member";

        using (var headerRange = ws.Cells[1, 1, 1, 8])
        {
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(HeaderBackground);
            headerRange.Style.Font.Color.SetColor(HeaderFont);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Font.Name = "Calibri";
            headerRange.Style.Font.Size = 11;
        }

        ws.View.FreezePanes(2, 1);

        for (int i = 0; i < sorted.Count; i++)
        {
            var row = sorted[i];
            var excelRow = i + 2;

            ws.Cells[excelRow, 1].Value = row.CombinedName;
            ws.Cells[excelRow, 2].Value = row.NameNumber;
            ws.Cells[excelRow, 3].Value = row.AddressLine1;
            ws.Cells[excelRow, 4].Value = row.AddressLine2;
            ws.Cells[excelRow, 5].Value = row.Town;
            ws.Cells[excelRow, 6].Value = row.County;
            ws.Cells[excelRow, 7].Value = row.Postcode;
            ws.Cells[excelRow, 8].Value = row.NonMember ? "Yes" : "";

            var fillColour = (i % 2 == 0) ? RowWhite : RowGrey;
            using var rowRange = ws.Cells[excelRow, 1, excelRow, 8];
            rowRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            rowRange.Style.Fill.BackgroundColor.SetColor(fillColour);
            rowRange.Style.Font.Name = "Calibri";
            rowRange.Style.Font.Size = 11;
        }

        ws.Column(1).Width = 30;  // Combined Name
        ws.Column(2).Width = 20;  // Name/Number
        ws.Column(3).Width = 30;  // Address Line 1
        ws.Column(4).Width = 25;  // Address Line 2
        ws.Column(5).Width = 20;  // Town
        ws.Column(6).Width = 20;  // County
        ws.Column(7).Width = 12;  // Postcode
        ws.Column(8).Width = 14;  // Non-Member

        _logger.LogInformation("Address list Excel generated with {Count} rows", sorted.Count);

        return package.GetAsByteArray();
    }

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

    private static string BuildCombinedName(IReadOnlyList<ChurchMember> members)
    {
        if (members.Count == 1)
            return $"{members[0].FirstName} {members[0].LastName}";

        var allSameSurname = members.All(m =>
            m.LastName.Equals(members[0].LastName, StringComparison.OrdinalIgnoreCase));

        if (allSameSurname)
        {
            var firstNames = members.Select(m => m.FirstName).ToList();
            var joinedFirstNames = JoinWithAmpersand(firstNames);
            return $"{joinedFirstNames} {members[0].LastName}";
        }

        var fullNames = members.Select(m => $"{m.FirstName} {m.LastName}").ToList();
        return string.Join(" & ", fullNames);
    }

    private static string JoinWithAmpersand(IReadOnlyList<string> items)
    {
        if (items.Count == 1) return items[0];
        if (items.Count == 2) return $"{items[0]} & {items[1]}";
        var allButLast = string.Join(", ", items.Take(items.Count - 1));
        return $"{allButLast} & {items[^1]}";
    }

    private sealed class AddressListRow
    {
        public string SortLastName { get; init; } = string.Empty;
        public string SortFirstName { get; init; } = string.Empty;
        public string CombinedName { get; init; } = string.Empty;
        public string NameNumber { get; init; } = string.Empty;
        public string AddressLine1 { get; init; } = string.Empty;
        public string AddressLine2 { get; init; } = string.Empty;
        public string Town { get; init; } = string.Empty;
        public string County { get; init; } = string.Empty;
        public string Postcode { get; init; } = string.Empty;
        public bool NonMember { get; init; }
    }
}
