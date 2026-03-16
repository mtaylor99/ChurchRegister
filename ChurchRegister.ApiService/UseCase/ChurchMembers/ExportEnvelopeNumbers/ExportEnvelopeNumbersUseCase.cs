using System.Drawing;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportEnvelopeNumbers;

/// <summary>
/// Builds the Envelope Number Review Excel workbook for a given year.
/// Columns: First Name | Last Name | Name/Number | Address Line 1 | Address Line 2 | Town | County | Postcode | District | Current Number | New Number
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
            .Include(m => m.District)
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
                FirstName = m.FirstName,
                LastName = m.LastName,
                NameNumber = m.Address?.NameNumber ?? string.Empty,
                AddressLine1 = m.Address?.AddressLineOne ?? string.Empty,
                AddressLine2 = m.Address?.AddressLineTwo ?? string.Empty,
                Town = m.Address?.Town ?? string.Empty,
                County = m.Address?.County ?? string.Empty,
                Postcode = m.Address?.Postcode ?? string.Empty,
                District = m.District?.Name ?? string.Empty,
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
        ws.Cells[1, 1].Value = "First Name";
        ws.Cells[1, 2].Value = "Last Name";
        ws.Cells[1, 3].Value = "Name/Number";
        ws.Cells[1, 4].Value = "Address Line 1";
        ws.Cells[1, 5].Value = "Address Line 2";
        ws.Cells[1, 6].Value = "Town";
        ws.Cells[1, 7].Value = "County";
        ws.Cells[1, 8].Value = "Postcode";
        ws.Cells[1, 9].Value = "District";
        ws.Cells[1, 10].Value = "Current Number";
        ws.Cells[1, 11].Value = "New Number";

        // Style header
        using (var headerRange = ws.Cells[1, 1, 1, 11])
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

            ws.Cells[excelRow, 1].Value = row.FirstName;
            ws.Cells[excelRow, 2].Value = row.LastName;
            ws.Cells[excelRow, 3].Value = row.NameNumber;
            ws.Cells[excelRow, 4].Value = row.AddressLine1;
            ws.Cells[excelRow, 5].Value = row.AddressLine2;
            ws.Cells[excelRow, 6].Value = row.Town;
            ws.Cells[excelRow, 7].Value = row.County;
            ws.Cells[excelRow, 8].Value = row.Postcode;
            ws.Cells[excelRow, 9].Value = row.District;
            ws.Cells[excelRow, 10].Value = row.CurrentNumber;
            ws.Cells[excelRow, 11].Value = row.NewNumber;

            // Alternating row fill
            var fillColour = (i % 2 == 0) ? RowWhite : RowGrey;
            using var rowRange = ws.Cells[excelRow, 1, excelRow, 11];
            rowRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            rowRange.Style.Fill.BackgroundColor.SetColor(fillColour);
            rowRange.Style.Font.Name = "Calibri";
            rowRange.Style.Font.Size = 11;
        }

        // Column widths
        ws.Column(1).Width = 20;  // First Name
        ws.Column(2).Width = 20;  // Last Name
        ws.Column(3).Width = 20;  // Name/Number
        ws.Column(4).Width = 30;  // Address Line 1
        ws.Column(5).Width = 25;  // Address Line 2
        ws.Column(6).Width = 20;  // Town
        ws.Column(7).Width = 20;  // County
        ws.Column(8).Width = 12;  // Postcode
        ws.Column(9).Width = 12;  // District
        ws.Column(10).Width = 18; // Current Number
        ws.Column(11).Width = 18; // New Number

        _logger.LogInformation("Envelope numbers Excel generated with {Count} rows for year {Year}", sorted.Count, year);

        return package.GetAsByteArray();
    }
}
