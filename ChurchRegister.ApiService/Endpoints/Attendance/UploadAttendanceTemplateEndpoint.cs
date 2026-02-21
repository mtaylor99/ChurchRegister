using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.UseCase.Attendance.UploadAttendanceTemplate;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Attendance;

/// <summary>
/// Endpoint for uploading attendance template files (.xlsx)
/// </summary>
public class UploadAttendanceTemplateEndpoint : Endpoint<UploadAttendanceTemplateRequest, UploadAttendanceTemplateResponse>
{
    private readonly IUploadAttendanceTemplateUseCase _useCase;
    private readonly ILogger<UploadAttendanceTemplateEndpoint> _logger;

    public UploadAttendanceTemplateEndpoint(
        IUploadAttendanceTemplateUseCase useCase,
        ILogger<UploadAttendanceTemplateEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/attendance/upload-template");
        Policies("Bearer"); // Require authentication
        Roles(
            SystemRoles.SystemAdministration,
            SystemRoles.AttendanceAdministrator,
            SystemRoles.AttendanceContributor);
        AllowFileUploads();
        Description(x => x
            .WithName("UploadAttendanceTemplate")
            .WithSummary("Upload attendance template file")
            .WithDescription("Uploads an Excel (.xlsx) template file with attendance data. Supports create/update/skip merge logic.")
            .WithTags("Attendance")
            .Accepts<UploadAttendanceTemplateRequest>("multipart/form-data")
            .Produces<UploadAttendanceTemplateResponse>(200, "application/json")
            .ProducesProblem(400)
            .ProducesProblem(403)
            .ProducesProblem(500));
    }

    public override async Task HandleAsync(UploadAttendanceTemplateRequest req, CancellationToken ct)
    {
        var userId = User.Identity?.Name ?? "system";
        var userName = User.Identity?.Name ?? "Unknown User";

        _logger.LogInformation(
            "Upload template request received from user {User}",
            userName);

        try
        {
            // Validate file is provided
            if (req.File == null || req.File.Length == 0)
            {
                _logger.LogWarning("Upload attempt with no file by user {User}", userName);
                await SendAsync(new UploadAttendanceTemplateResponse
                {
                    Success = false,
                    Errors = new List<UploadError>
                    {
                        new UploadError
                        {
                            Row = 0,
                            Message = "No file was uploaded. Please select a file."
                        }
                    }
                }, statusCode: 400, cancellation: ct);
                return;
            }

            // Validate file size (5MB limit)
            const long maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
            if (req.File.Length > maxFileSize)
            {
                _logger.LogWarning(
                    "Upload attempt with oversized file ({Size} bytes) by user {User}",
                    req.File.Length,
                    userName);
                
                await SendAsync(new UploadAttendanceTemplateResponse
                {
                    Success = false,
                    Errors = new List<UploadError>
                    {
                        new UploadError
                        {
                            Row = 0,
                            Message = $"File size ({req.File.Length / 1024 / 1024:F2} MB) exceeds maximum allowed size of 5 MB."
                        }
                    }
                }, statusCode: 400, cancellation: ct);
                return;
            }

            // Validate file type (must be .xlsx)
            var fileExtension = Path.GetExtension(req.File.FileName).ToLowerInvariant();
            if (fileExtension != ".xlsx")
            {
                _logger.LogWarning(
                    "Upload attempt with invalid file type '{Extension}' by user {User}",
                    fileExtension,
                    userName);
                
                await SendAsync(new UploadAttendanceTemplateResponse
                {
                    Success = false,
                    Errors = new List<UploadError>
                    {
                        new UploadError
                        {
                            Row = 0,
                            Message = $"Invalid file type '{fileExtension}'. Only Excel files (.xlsx) are supported."
                        }
                    }
                }, statusCode: 400, cancellation: ct);
                return;
            }

            // Process the file using the use case
            await using var fileStream = req.File.OpenReadStream();
            var response = await _useCase.ExecuteAsync(fileStream, userId, ct);

            if (response.Success)
            {
                _logger.LogInformation(
                    "Upload successful for user {User}: {Created} created, {Updated} updated, {Skipped} skipped, {Failed} failed",
                    userName,
                    response.Summary.RecordsCreated,
                    response.Summary.RecordsUpdated,
                    response.Summary.RecordsSkipped,
                    response.Summary.RecordsFailed);
                
                await SendOkAsync(response, ct);
            }
            else
            {
                _logger.LogWarning(
                    "Upload completed with errors for user {User}: {ErrorCount} errors",
                    userName,
                    response.Errors.Count);
                
                // Return 200 with success=false if processing completed but had errors
                await SendOkAsync(response, ct);
            }
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation error during upload by user {User}", userName);
            
            await SendAsync(new UploadAttendanceTemplateResponse
            {
                Success = false,
                Errors = new List<UploadError>
                {
                    new UploadError
                    {
                        Row = 0,
                        Message = ex.Message
                    }
                }
            }, statusCode: 400, cancellation: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during upload by user {User}", userName);
            
            await SendAsync(new UploadAttendanceTemplateResponse
            {
                Success = false,
                Errors = new List<UploadError>
                {
                    new UploadError
                    {
                        Row = 0,
                        Message = "An unexpected error occurred while processing the upload. Please try again or contact support if the problem persists."
                    }
                }
            }, statusCode: 500, cancellation: ct);
        }
    }
}
