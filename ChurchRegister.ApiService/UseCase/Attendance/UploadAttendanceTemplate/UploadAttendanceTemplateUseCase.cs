using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Services.Attendance;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.UseCase.Attendance.UploadAttendanceTemplate;

/// <summary>
/// Use case implementation for processing attendance template uploads.
/// Implements merge logic: create new records, update changed records, skip unchanged records.
/// </summary>
public class UploadAttendanceTemplateUseCase : IUploadAttendanceTemplateUseCase
{
    private readonly ChurchRegisterWebContext _context;
    private readonly IExcelParserService _excelParser;
    private readonly ILogger<UploadAttendanceTemplateUseCase> _logger;

    public UploadAttendanceTemplateUseCase(
        ChurchRegisterWebContext context,
        IExcelParserService excelParser,
        ILogger<UploadAttendanceTemplateUseCase> logger)
    {
        _context = context;
        _excelParser = excelParser;
        _logger = logger;
    }

    public async Task<UploadAttendanceTemplateResponse> ExecuteAsync(
        Stream fileStream,
        string uploadedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting attendance template upload by user {UploadedBy}", uploadedBy);

        var response = new UploadAttendanceTemplateResponse
        {
            Success = false,
            Summary = new UploadSummary(),
            Errors = new List<UploadError>(),
            Warnings = new List<string>()
        };

        try
        {
            // Step 1: Parse the Excel file
            ParsedTemplate parsedTemplate;
            try
            {
                parsedTemplate = await _excelParser.ParseTemplateAsync(fileStream);
                response.Warnings.AddRange(parsedTemplate.Warnings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse Excel template");
                response.Errors.Add(new UploadError
                {
                    Row = 0,
                    Message = $"Failed to parse Excel file: {ex.Message}"
                });
                return response;
            }

            // Step 2: Validate template has data
            if (parsedTemplate.EventColumns.Count == 0)
            {
                response.Errors.Add(new UploadError
                {
                    Row = 2,
                    Message = "No event columns found in template. Expected event names in row 2."
                });
                return response;
            }

            if (parsedTemplate.DataRows.Count == 0)
            {
                response.Errors.Add(new UploadError
                {
                    Row = 3,
                    Message = "No data rows found in template. Expected attendance data starting from row 3."
                });
                return response;
            }

            response.Summary.TotalRows = parsedTemplate.DataRows.Count;

            // Step 3: Match event columns to database events (case-insensitive)
            var eventMapping = await MatchEventsToColumns(
                parsedTemplate.EventColumns.Keys.ToList(),
                response.Warnings,
                cancellationToken);

            if (eventMapping.Count == 0)
            {
                response.Errors.Add(new UploadError
                {
                    Row = 2,
                    Message = "No event columns matched any events in the database. Please check event names in row 2."
                });
                return response;
            }

            // Step 4: Process data rows with merge logic
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                await ProcessDataRows(
                    parsedTemplate,
                    eventMapping,
                    uploadedBy,
                    response,
                    cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                response.Success = true;

                _logger.LogInformation(
                    "Template upload completed: {Created} created, {Updated} updated, {Skipped} skipped, {Failed} failed",
                    response.Summary.RecordsCreated,
                    response.Summary.RecordsUpdated,
                    response.Summary.RecordsSkipped,
                    response.Summary.RecordsFailed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing template data, rolling back transaction");
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during template upload");
            response.Errors.Add(new UploadError
            {
                Row = 0,
                Message = $"Unexpected error: {ex.Message}"
            });
        }

        return response;
    }

    /// <summary>
    /// Matches template event column names to database events (case-insensitive).
    /// </summary>
    private async Task<Dictionary<string, int>> MatchEventsToColumns(
        List<string> columnNames,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        var eventMapping = new Dictionary<string, int>(); // Key: column name (template), Value: EventId (database)

        // Get all events from database
        var allEvents = await _context.Events
            .Where(e => e.IsActive)
            .Select(e => new { e.Id, e.Name })
            .ToListAsync(cancellationToken);

        foreach (var columnName in columnNames)
        {
            // Case-insensitive match
            var matchedEvent = allEvents.FirstOrDefault(e =>
                e.Name.Equals(columnName, StringComparison.OrdinalIgnoreCase));

            if (matchedEvent != null)
            {
                eventMapping[columnName] = matchedEvent.Id;
                _logger.LogDebug("Matched column '{Column}' to event ID {EventId}", columnName, matchedEvent.Id);
            }
            else
            {
                warnings.Add($"Event column '{columnName}' in template does not match any active event in database. Column will be skipped.");
                _logger.LogWarning("No match found for event column: {Column}", columnName);
            }
        }

        return eventMapping;
    }

    /// <summary>
    /// Processes all data rows with merge logic: create/update/skip.
    /// </summary>
    private async Task ProcessDataRows(
        ParsedTemplate template,
        Dictionary<string, int> eventMapping,
        string uploadedBy,
        UploadAttendanceTemplateResponse response,
        CancellationToken cancellationToken)
    {
        // Get all dates from template for efficient querying
        var dates = template.DataRows
            .Where(r => r.Date.HasValue)
            .Select(r => r.Date!.Value.Date)
            .Distinct()
            .ToList();

        var eventIds = eventMapping.Values.ToList();

        // Load all existing records for these events and dates
        var existingRecords = await _context.EventAttendances
            .Where(ea => eventIds.Contains(ea.EventId) && dates.Contains(ea.Date.Date))
            .ToDictionaryAsync(
                ea => (ea.EventId, ea.Date.Date),
                ea => ea,
                cancellationToken);

        var recordsToCreate = new List<EventAttendance>();
        var recordsToUpdate = new List<EventAttendance>();

        foreach (var dataRow in template.DataRows)
        {
            if (!dataRow.Date.HasValue)
            {
                response.Summary.RecordsFailed++;
                response.Errors.Add(new UploadError
                {
                    Row = dataRow.RowNumber,
                    Message = "Invalid or missing date value"
                });
                continue;
            }

            var date = dataRow.Date.Value.Date;

            // Process each event column in this row
            foreach (var (columnName, attendance) in dataRow.AttendanceValues)
            {
                // Skip if column doesn't match any event
                if (!eventMapping.TryGetValue(columnName, out int eventId))
                {
                    continue;
                }

                // Skip if no attendance value provided
                if (!attendance.HasValue)
                {
                    continue;
                }

                // Validate attendance value
                if (attendance.Value < 0)
                {
                    response.Summary.RecordsFailed++;
                    response.Errors.Add(new UploadError
                    {
                        Row = dataRow.RowNumber,
                        Event = columnName,
                        Date = date.ToString("yyyy-MM-dd"),
                        Message = "Attendance value cannot be negative"
                    });
                    continue;
                }

                try
                {
                    var key = (eventId, date);

                    if (existingRecords.TryGetValue(key, out var existingRecord))
                    {
                        // Record exists - check if update needed
                        if (existingRecord.Attendance != attendance.Value)
                        {
                            existingRecord.Attendance = attendance.Value;
                            existingRecord.ModifiedBy = uploadedBy;
                            existingRecord.ModifiedDateTime = DateTime.UtcNow;

                            recordsToUpdate.Add(existingRecord);
                            response.Summary.RecordsUpdated++;

                            _logger.LogDebug(
                                "Updating record: Event {EventId}, Date {Date}, Old: {Old}, New: {New}",
                                eventId, date, existingRecord.Attendance, attendance.Value);
                        }
                        else
                        {
                            // No change detected - skip
                            response.Summary.RecordsSkipped++;
                        }
                    }
                    else
                    {
                        // Record doesn't exist - create new
                        var newRecord = new EventAttendance
                        {
                            EventId = eventId,
                            Date = date,
                            Attendance = attendance.Value,
                            CreatedBy = uploadedBy,
                            CreatedDateTime = DateTime.UtcNow
                        };

                        recordsToCreate.Add(newRecord);
                        response.Summary.RecordsCreated++;

                        _logger.LogDebug(
                            "Creating record: Event {EventId}, Date {Date}, Attendance {Attendance}",
                            eventId, date, attendance.Value);
                    }
                }
                catch (Exception ex)
                {
                    response.Summary.RecordsFailed++;
                    response.Errors.Add(new UploadError
                    {
                        Row = dataRow.RowNumber,
                        Event = columnName,
                        Date = date.ToString("yyyy-MM-dd"),
                        Message = $"Error processing record: {ex.Message}"
                    });

                    _logger.LogError(ex,
                        "Error processing row {Row}, event {Event}, date {Date}",
                        dataRow.RowNumber, columnName, date);
                }
            }
        }

        // Batch insert new records
        if (recordsToCreate.Count > 0)
        {
            await _context.EventAttendances.AddRangeAsync(recordsToCreate, cancellationToken);
            _logger.LogInformation("Batch creating {Count} new records", recordsToCreate.Count);
        }

        // Updates are already tracked by EF, just need to save
        if (recordsToUpdate.Count > 0)
        {
            _logger.LogInformation("Batch updating {Count} existing records", recordsToUpdate.Count);
        }
    }
}
