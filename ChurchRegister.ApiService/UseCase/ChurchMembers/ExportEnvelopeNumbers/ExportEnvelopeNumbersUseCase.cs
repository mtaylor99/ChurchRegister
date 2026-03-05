using System.Drawing;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeNumbers;

/// <summary>
/// Builds the Envelope Number Review Excel workbook for a given year.
/// Columns: Last Name | First Name | Address | Current Number | New Number
/// </summary>
public class ExportEnvelopeNumbersUseCase : IExportEnvelopeNumbersUseCase
{
    private readonly ChurchRegisterWebContext _db;
    private readonly ILogger<ExportEnvelopeNumbersUseCase> _logger;

    // Excel Standard Style colours
    private static readonly Color HeaderBackground = Color.FromArgb(0x00, 0x33, 0x66);
    private static readonly Color HeaderFont = Color.White;
    private static readonly Color RowWhite = Color.White;
    private static readonly Color RowGrey = Color.FromArgb(0xF2, 0xF2, 0xF2);

    public ExportEnvelopeNumbersUseCase(
        ChurchRegisterWebContext db,
        ILogger<ExportEnvelopeNumbersUseCase> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(int year, CancellationToken ct)
    {
        _logger.LogInformation("Generating envelope numbers review Excel for year {Year}", year);

        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");

        var currentYear = year - 1;

        // Active envelope recipients — Envelopes flag is true
        var members = await _db.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1 && m.Envelopes)
            .Include(m => m.Address)
            .Include(m => m.RegisterNumbers)
            .AsNoTracking()
            .ToListAsync(ct);

        // Project to row data
        var rows = members.Select(m =>
        {
            var newReg = m.RegisterNumbers
                .FirstOrDefault(r => r.Year == year);
            var currentReg = m.RegisterNumbers
                .FirstOrDefault(r => r.Year == currentYear);

            var newNumber = newReg?.Number.ToString();
            var currentNumber = currentReg?.Number.ToString();

            int? newNumericSort = newReg?.Number;
            int? currentNumericSort = currentReg?.Number;

            return new
            {
                LastName = m.LastName,
                FirstName = m.FirstName,
                Address = FormatAddress(m.Address),
                CurrentNumber = currentNumber,
                NewNumber = newNumber,
                HasNewNumber = newNumber != null,
                NewNumericSort = newNumericSort,
                CurrentNumericSort = currentNumericSort,
            };
        }).ToList();

        // Sort: members with new number ascending, then members without new number ordered by current number ascending
        var sorted = rows
            .Where(r => r.HasNewNumber)
            .OrderBy(r => r.NewNumericSort)
            .Concat(rows
                .Where(r => !r.HasNewNumber)
                .OrderBy(r => r.CurrentNumericSort)
                .ThenBy(r => r.LastName)
                .ThenBy(r => r.FirstName))
            .ToList();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add(year.ToString());

        // Header row
        ws.Cells[1, 1].Value = "Last Name";
        ws.Cells[1, 2].Value = "First Name";
        ws.Cells[1, 3].Value = "Address";
        ws.Cells[1, 4].Value = "Current Number";
        ws.Cells[1, 5].Value = "New Number";

        // Style header
        using (var headerRange = ws.Cells[1, 1, 1, 5])
        {
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(HeaderBackground);
            headerRange.Style.Font.Color.SetColor(HeaderFont);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Font.Name = "Calibri";
            headerRange.Style.Font.Size = 11;
        }

        // Freeze row 1
        ws.View.FreezePanes(2, 1);

        // Data rows
        for (int i = 0; i < sorted.Count; i++)
        {
            var row = sorted[i];
            var excelRow = i + 2; // row 1 is header

            ws.Cells[excelRow, 1].Value = row.LastName;
            ws.Cells[excelRow, 2].Value = row.FirstName;
            ws.Cells[excelRow, 3].Value = row.Address;
            ws.Cells[excelRow, 4].Value = row.CurrentNumber;
            ws.Cells[excelRow, 5].Value = row.NewNumber;

            // Alternating row fill
            var fillColour = (i % 2 == 0) ? RowWhite : RowGrey;
            using var rowRange = ws.Cells[excelRow, 1, excelRow, 5];
            rowRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            rowRange.Style.Fill.BackgroundColor.SetColor(fillColour);
            rowRange.Style.Font.Name = "Calibri";
            rowRange.Style.Font.Size = 11;
        }

        // Column widths
        ws.Column(1).Width = 25;
        ws.Column(2).Width = 20;
        ws.Column(3).Width = 45;
        ws.Column(4).Width = 18;
        ws.Column(5).Width = 18;

        _logger.LogInformation("Envelope numbers Excel generated with {Count} rows for year {Year}", sorted.Count, year);

        return package.GetAsByteArray();
    }

    private static string FormatAddress(ChurchRegister.Database.Entities.Address? address)
    {
        if (address == null) return string.Empty;

        var parts = new[] { address.NameNumber, address.AddressLineOne, address.Town, address.Postcode }
            .Where(s => !string.IsNullOrWhiteSpace(s));

        return string.Join(", ", parts);
    }
}
