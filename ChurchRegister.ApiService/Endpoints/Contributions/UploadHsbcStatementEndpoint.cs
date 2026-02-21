using FastEndpoints;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement;
using ChurchRegister.ApiService.UseCase.Contributions.SubmitEnvelopeBatch;
using ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchList;
using ChurchRegister.ApiService.UseCase.Contributions.GetEnvelopeBatchDetails;
using ChurchRegister.ApiService.UseCase.Contributions.ValidateRegisterNumber;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// Endpoint for uploading HSBC bank statement CSV files
/// </summary>
public class UploadHsbcStatementEndpoint : EndpointWithoutRequest<UploadHsbcStatementResponse>
{
    private readonly IUploadHsbcStatementUseCase _useCase;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<UploadHsbcStatementEndpoint> _logger;

    public UploadHsbcStatementEndpoint(
        IUploadHsbcStatementUseCase useCase,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<UploadHsbcStatementEndpoint> logger)
    {
        _useCase = useCase;
        _userManager = userManager;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/financial/hsbc-transactions/upload");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        AllowFileUploads();
        Description(x => x
            .WithName("UploadHsbcStatement")
            .WithSummary("Upload HSBC bank statement CSV file")
            .WithDescription("Parses and imports HSBC bank statement CSV with automatic duplicate detection")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var file = Files.FirstOrDefault();
            
            if (file == null)
            {
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "No file uploaded",
                    Errors = new List<string> { "Please select a CSV file to upload" }
                }, 400, ct);
                return;
            }

            var user = await _userManager.GetUserAsync(User);
            var uploadedBy = user?.UserName ?? "Unknown";

            var result = await _useCase.ExecuteAsync(file, uploadedBy, ct);
            await SendOkAsync(result, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            await SendAsync(new UploadHsbcStatementResponse
            {
                Success = false,
                Message = ex.Message,
                Errors = new List<string> { ex.Message }
            }, 400, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading HSBC statement");
            await SendAsync(new UploadHsbcStatementResponse
            {
                Success = false,
                Message = "An error occurred while processing the file",
                Errors = new List<string> { ex.Message }
            }, 500, ct);
        }
    }
}

/// <summary>
/// Endpoint for submitting envelope contribution batches
/// </summary>
public class SubmitEnvelopeBatchEndpoint : Endpoint<SubmitEnvelopeBatchRequest, SubmitEnvelopeBatchResponse>
{
    private readonly ISubmitEnvelopeBatchUseCase _useCase;
    private readonly ILogger<SubmitEnvelopeBatchEndpoint> _logger;

    public SubmitEnvelopeBatchEndpoint(
        ISubmitEnvelopeBatchUseCase useCase,
        ILogger<SubmitEnvelopeBatchEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/financial/envelope-contributions/batches");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        Description(x => x
            .WithName("SubmitEnvelopeBatch")
            .WithSummary("Submit envelope contribution batch for a Sunday")
            .WithDescription("Records cash contributions collected via numbered envelopes for a specific Sunday")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(SubmitEnvelopeBatchRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _useCase.ExecuteAsync(req, ct);

            await SendCreatedAtAsync<GetEnvelopeBatchDetailsEndpoint>(
                new { batchId = result.BatchId },
                result,
                generateAbsoluteUrl: false,
                cancellation: ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Duplicate batch or invalid operation");
            AddError(ex.Message);
            await SendErrorsAsync(409, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting envelope batch");
            AddError($"Error submitting envelope batch: {ex.Message}");
            await SendErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// Endpoint for getting paginated list of envelope contribution batches
/// </summary>
public class GetEnvelopeBatchListEndpoint : EndpointWithoutRequest<GetBatchListResponse>
{
    private readonly IGetEnvelopeBatchListUseCase _useCase;
    private readonly ILogger<GetEnvelopeBatchListEndpoint> _logger;

    public GetEnvelopeBatchListEndpoint(
        IGetEnvelopeBatchListUseCase useCase,
        ILogger<GetEnvelopeBatchListEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/financial/envelope-contributions/batches");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, 
              SystemRoles.FinancialAdministrator, 
              SystemRoles.FinancialContributor, 
              SystemRoles.FinancialViewer);
        Description(x => x
            .WithName("GetEnvelopeBatchList")
            .WithSummary("Get paginated list of envelope contribution batches")
            .WithDescription("Returns a list of envelope batches with optional date range filtering and pagination")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var startDateStr = Query<string>("startDate", false);
            var endDateStr = Query<string>("endDate", false);
            var pageNumber = Query<int>("pageNumber", false) is > 0 ? Query<int>("pageNumber") : 1;
            var pageSize = Query<int>("pageSize", false) is > 0 and <= 100 ? Query<int>("pageSize") : 20;

            DateOnly? startDate = null;
            DateOnly? endDate = null;

            if (!string.IsNullOrEmpty(startDateStr) && DateOnly.TryParse(startDateStr, out var parsedStart))
                startDate = parsedStart;

            if (!string.IsNullOrEmpty(endDateStr) && DateOnly.TryParse(endDateStr, out var parsedEnd))
                endDate = parsedEnd;

            var result = await _useCase.ExecuteAsync(startDate, endDate, pageNumber, pageSize, ct);
            await SendOkAsync(result, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting batch list");
            AddError($"Error retrieving batch list: {ex.Message}");
            await SendErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// Endpoint for getting details of a specific envelope contribution batch
/// </summary>
public class GetEnvelopeBatchDetailsEndpoint : EndpointWithoutRequest<GetBatchDetailsResponse>
{
    private readonly IGetEnvelopeBatchDetailsUseCase _useCase;
    private readonly ILogger<GetEnvelopeBatchDetailsEndpoint> _logger;

    public GetEnvelopeBatchDetailsEndpoint(
        IGetEnvelopeBatchDetailsUseCase useCase,
        ILogger<GetEnvelopeBatchDetailsEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/financial/envelope-contributions/batches/{batchId}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialAdministrator,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialViewer);
        Description(x => x
            .WithName("GetEnvelopeBatchDetails")
            .WithSummary("Get details of a specific envelope contribution batch")
            .WithDescription("Returns full details including all individual envelope contributions")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var batchId = Route<int>("batchId");
            var result = await _useCase.ExecuteAsync(batchId, ct);
            await SendOkAsync(result, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Batch not found");
            AddError(ex.Message);
            await SendErrorsAsync(404, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting batch details");
            AddError($"Error retrieving batch details: {ex.Message}");
            await SendErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// Endpoint for validating a register number for the current year
/// </summary>
public class ValidateRegisterNumberEndpoint : EndpointWithoutRequest<ValidateRegisterNumberResponse>
{
    private readonly IValidateRegisterNumberUseCase _useCase;
    private readonly ILogger<ValidateRegisterNumberEndpoint> _logger;

    public ValidateRegisterNumberEndpoint(
        IValidateRegisterNumberUseCase useCase,
        ILogger<ValidateRegisterNumberEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/financial/envelope-contributions/validate-register-number/{number}/{year}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration,
              SystemRoles.FinancialAdministrator,
              SystemRoles.FinancialContributor,
              SystemRoles.FinancialViewer);
        Description(x => x
            .WithName("ValidateRegisterNumber")
            .WithSummary("Validate a register number for a specific year")
            .WithDescription("Checks if a register number is valid and returns associated member details")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var number = Route<int>("number");
            var year = Route<int>("year");

            var result = await _useCase.ExecuteAsync(number, year, ct);
            await SendOkAsync(result, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating register number");
            AddError($"Error validating register number: {ex.Message}");
            await SendErrorsAsync(500, ct);
        }
    }
}
