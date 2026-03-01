using OfficeOpenXml;

namespace ChurchRegister.ApiService.Services.Attendance;

/// <summary>
/// Excel parser service implementation using EPPlus.
/// </summary>
public class ExcelParserService : IExcelParserService
{
    private readonly ILogger<ExcelParserService> _logger;

    public ExcelParserService(ILogger<ExcelParserService> logger)
    {
        _logger = logger;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ParsedTemplate> ParseTemplateAsync(Stream fileStream)
    {
        var result = new ParsedTemplate();

        try
        {
            using var package = new ExcelPackage(fileStream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();

            if (worksheet == null)
            {
                throw new InvalidOperationException("Excel file contains no worksheets");
            }

            // Parse header row (row 2) to get event names
            result.EventColumns = ParseHeaderRow(worksheet);

            if (result.EventColumns.Count == 0)
            {
                throw new InvalidOperationException("No valid event columns found in template");
            }

            // Parse data rows (starting from row 3)
            ParseDataRows(worksheet, result);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Excel template");
            throw;
        }

        return result;
    }

    /// <summary>
    /// Parses row 2 (event name header row), ignoring row 1 (merged day-of-week cells).
    /// </summary>
    private Dictionary<string, int> ParseHeaderRow(ExcelWorksheet worksheet)
    {
        var eventColumns = new Dictionary<string, int>();
        var rowIndex = 2; // Row 2 contains event names
        var maxColumn = worksheet.Dimension?.End.Column ?? 0;

        // Start from column 2 (column B) - column A is "Date"
        for (int col = 2; col <= maxColumn; col++)
        {
            var cellValue = worksheet.Cells[rowIndex, col].Text?.Trim();

            if (!string.IsNullOrWhiteSpace(cellValue) && cellValue.ToLower() != "date")
            {
                eventColumns[cellValue] = col;
                _logger.LogDebug("Found event column: {EventName} at column {Column}", cellValue, col);
            }
        }

        return eventColumns;
    }

    /// <summary>
    /// Parses data rows starting from row 3.
    /// </summary>
    private void ParseDataRows(ExcelWorksheet worksheet, ParsedTemplate result)
    {
        var startRow = 3; // Data starts at row 3
        var maxRow = worksheet.Dimension?.End.Row ?? 0;

        for (int row = startRow; row <= maxRow; row++)
        {
            var dataRow = ParseDataRow(worksheet, row, result.EventColumns);

            if (dataRow != null)
            {
                result.DataRows.Add(dataRow);
            }
        }
    }

    /// <summary>
    /// Parses a single data row, extracting date and attendance values.
    /// </summary>
    private TemplateDataRow? ParseDataRow(ExcelWorksheet worksheet, int rowIndex, Dictionary<string, int> eventColumns)
    {
        var dataRow = new TemplateDataRow { RowNumber = rowIndex };

        // Parse date from column A
        var dateCell = worksheet.Cells[rowIndex, 1];
        var parsedDate = ParseDateValue(dateCell);

        if (parsedDate == null)
        {
            // Skip rows with no valid date (could be instructions or empty rows)
            return null;
        }

        dataRow.Date = parsedDate;

        // Parse attendance values for each event column
        foreach (var eventColumn in eventColumns)
        {
            var eventName = eventColumn.Key;
            var columnIndex = eventColumn.Value;
            var cell = worksheet.Cells[rowIndex, columnIndex];

            if (int.TryParse(cell.Text, out int attendance) && attendance >= 0)
            {
                dataRow.AttendanceValues[eventName] = attendance;
            }
            // Empty cells are treated as "no data" - not added to dictionary
        }

        return dataRow;
    }

    /// <summary>
    /// Parses date value supporting multiple formats (ISO, Excel serial, locale strings).
    /// </summary>
    private DateTime? ParseDateValue(ExcelRange cell)
    {
        try
        {
            // Try direct DateTime value (Excel date)
            if (cell.Value is DateTime dateTime)
            {
                return dateTime.Date;
            }

            // Try Excel serial date number
            if (cell.Value is double serialDate)
            {
                return DateTime.FromOADate(serialDate).Date;
            }

            // Try parsing text value
            var textValue = cell.Text?.Trim();
            if (string.IsNullOrWhiteSpace(textValue))
            {
                return null;
            }

            if (DateTime.TryParse(textValue, out DateTime parsedDate))
            {
                return parsedDate.Date;
            }

            // Unable to parse
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse date value in cell {Row},{Column}", cell.Start.Row, cell.Start.Column);
            return null;
        }
    }
}
