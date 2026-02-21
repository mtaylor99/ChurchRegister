namespace ChurchRegister.ApiService.Services.Attendance;

/// <summary>
/// Service for parsing Excel attendance template files.
/// </summary>
public interface IExcelParserService
{
    /// <summary>
    /// Parses an Excel attendance template and extracts attendance data.
    /// </summary>
    /// <param name="fileStream">The Excel file stream to parse.</param>
    /// <returns>Parsed template data including headers and data rows.</returns>
    Task<ParsedTemplate> ParseTemplateAsync(Stream fileStream);
}

/// <summary>
/// Represents the parsed data from an Excel attendance template.
/// </summary>
public class ParsedTemplate
{
    /// <summary>
    /// Event names extracted from row 2 (header row), mapped to their column indices.
    /// </summary>
    public Dictionary<string, int> EventColumns { get; set; } = new();

    /// <summary>
    /// Data rows extracted from the template (row 3 onwards).
    /// </summary>
    public List<TemplateDataRow> DataRows { get; set; } = new();

    /// <summary>
    /// Warning messages generated during parsing (e.g., unrecognized columns).
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Represents a single data row from the template.
/// </summary>
public class TemplateDataRow
{
    /// <summary>
    /// Row number in the Excel file (1-based).
    /// </summary>
    public int RowNumber { get; set; }

    /// <summary>
    /// Date extracted from column A.
    /// </summary>
    public DateTime? Date { get; set; }

    /// <summary>
    /// Attendance values mapped by event name (nullable to support empty cells).
    /// </summary>
    public Dictionary<string, int?> AttendanceValues { get; set; } = new();

    /// <summary>
    /// Error message if row couldn't be parsed.
    /// </summary>
    public string? Error { get; set; }
}
