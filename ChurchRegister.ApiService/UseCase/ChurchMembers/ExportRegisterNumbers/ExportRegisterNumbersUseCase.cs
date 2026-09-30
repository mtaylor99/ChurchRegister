using System.Drawing;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.PreviewRegisterNumbers;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.ExportRegisterNumbers;

/// <summary>
/// Builds a single-worksheet Excel workbook with the Baptised, Non-Baptised and Non-Member
/// register number grids side by side, matching the preview dialog.
/// </summary>
public class ExportRegisterNumbersUseCase : IExportRegisterNumbersUseCase
{
    private const string SheetName = "Register Numbers";
    private const int ColumnsPerBlock = 4;
    private const int TitleRow = 1;
    private const int HeaderRow = 2;
    private const int FirstDataRow = 3;

    private static readonly Color HeaderBackground = Color.FromArgb(0x00, 0x33, 0x66);
    private static readonly Color TitleBackground = Color.FromArgb(0xD9, 0xE2, 0xF3);
    private static readonly Color RowGrey = Color.FromArgb(0xF2, 0xF2, 0xF2);

    private readonly IPreviewRegisterNumbersUseCase _previewUseCase;
    private readonly ILogger<ExportRegisterNumbersUseCase> _logger;

    public ExportRegisterNumbersUseCase(
        IPreviewRegisterNumbersUseCase previewUseCase,
        ILogger<ExportRegisterNumbersUseCase> logger)
    {
        _previewUseCase = previewUseCase;
        _logger = logger;
    }

    public async Task<byte[]> ExecuteAsync(int year, CancellationToken ct)
    {
        _logger.LogInformation("Generating register numbers Excel for year {Year}", year);

        ExcelPackage.License.SetNonCommercialPersonal("ChurchRegister");

        var preview = await _previewUseCase.ExecuteAsync(year, ct);

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add(SheetName);

        WriteBlock(ws, 1, "Members (Baptised)", preview.Members);
        WriteBlock(ws, 1 + ColumnsPerBlock + 1, "Members (Non-Baptised)", preview.NonBaptisedMembers);
        WriteBlock(ws, 1 + 2 * (ColumnsPerBlock + 1), "Non-Members", preview.NonMembers);

        ws.View.FreezePanes(FirstDataRow, 1);

        _logger.LogInformation(
            "Register numbers Excel generated: {Members} Baptised, {NonBaptised} Non-Baptised, {NonMembers} Non-Members",
            preview.Members.Count, preview.NonBaptisedMembers.Count, preview.NonMembers.Count);

        return package.GetAsByteArray();
    }

    private static void WriteBlock(
        ExcelWorksheet ws,
        int startColumn,
        string title,
        IReadOnlyList<RegisterNumberAssignment> rows)
    {
        var endColumn = startColumn + ColumnsPerBlock - 1;

        using (var titleRange = ws.Cells[TitleRow, startColumn, TitleRow, endColumn])
        {
            titleRange.Merge = true;
            titleRange.Value = $"{title} ({rows.Count})";
            titleRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            titleRange.Style.Fill.BackgroundColor.SetColor(TitleBackground);
            titleRange.Style.Font.Bold = true;
            titleRange.Style.Font.Size = 12;
        }

        ws.Cells[HeaderRow, startColumn].Value = "Name";
        ws.Cells[HeaderRow, startColumn + 1].Value = "Since";
        ws.Cells[HeaderRow, startColumn + 2].Value = "Current";
        ws.Cells[HeaderRow, startColumn + 3].Value = "New";

        using (var headerRange = ws.Cells[HeaderRow, startColumn, HeaderRow, endColumn])
        {
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(HeaderBackground);
            headerRange.Style.Font.Color.SetColor(Color.White);
            headerRange.Style.Font.Bold = true;
        }

        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var excelRow = FirstDataRow + i;

            ws.Cells[excelRow, startColumn].Value = row.MemberName;

            var sinceCell = ws.Cells[excelRow, startColumn + 1];
            if (row.MemberSince.HasValue)
            {
                sinceCell.Value = row.MemberSince.Value;
                sinceCell.Style.Numberformat.Format = "dd/MM/yyyy";
            }
            else
            {
                sinceCell.Value = "Missing";
                sinceCell.Style.Font.Color.SetColor(Color.Red);
            }

            var currentCell = ws.Cells[excelRow, startColumn + 2];
            if (row.CurrentNumber is { } current && current != 0)
                currentCell.Value = current;
            else
                currentCell.Value = "—";

            ws.Cells[excelRow, startColumn + 3].Value = row.RegisterNumber;

            if (i % 2 == 1)
            {
                using var rowRange = ws.Cells[excelRow, startColumn, excelRow, endColumn];
                rowRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
                rowRange.Style.Fill.BackgroundColor.SetColor(RowGrey);
            }
        }

        using (var numberRange = ws.Cells[FirstDataRow, startColumn + 2, FirstDataRow + Math.Max(rows.Count, 1) - 1, endColumn])
        {
            numberRange.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        ws.Column(startColumn).Width = 28;
        ws.Column(startColumn + 1).Width = 12;
        ws.Column(startColumn + 2).Width = 10;
        ws.Column(startColumn + 3).Width = 8;

        // Spacer column between blocks
        ws.Column(endColumn + 1).Width = 3;
    }
}
