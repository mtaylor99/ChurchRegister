using FastEndpoints;
using ChurchRegister.ApiService.Models.Financial;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using Microsoft.AspNetCore.Identity;

namespace ChurchRegister.ApiService.Endpoints.Financial;

/// <summary>
/// Endpoint for uploading HSBC bank statement CSV files
/// </summary>
public class UploadHsbcStatementEndpoint : EndpointWithoutRequest<UploadHsbcStatementResponse>
{
    private readonly IHsbcCsvParser _csvParser;
    private readonly IHsbcTransactionImportService _importService;
    private readonly IContributionProcessingService _contributionProcessingService;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<UploadHsbcStatementEndpoint> _logger;

    public UploadHsbcStatementEndpoint(
        IHsbcCsvParser csvParser,
        IHsbcTransactionImportService importService,
        IContributionProcessingService contributionProcessingService,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<UploadHsbcStatementEndpoint> logger)
    {
        _csvParser = csvParser;
        _importService = importService;
        _contributionProcessingService = contributionProcessingService;
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
            .WithTags("Financial"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Upload HSBC statement endpoint called");
            
            // Get uploaded file
            var file = Files.FirstOrDefault();
            
            if (file == null)
            {
                _logger.LogWarning("No file uploaded");
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "No file uploaded",
                    Errors = new List<string> { "Please select a CSV file to upload" }
                }, 400, ct);
                return;
            }

            // Validate file extension
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "Invalid file format",
                    Errors = new List<string> { "Only CSV files are accepted" }
                }, 400, ct);
                return;
            }

            // Validate file size (10 MB max)
            const long maxFileSize = 10 * 1024 * 1024; // 10 MB
            if (file.Length > maxFileSize)
            {
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "File too large",
                    Errors = new List<string> { "File size must not exceed 10 MB" }
                }, 400, ct);
                return;
            }

            // Get current user
            var user = await _userManager.GetUserAsync(User);
            var uploadedBy = user?.UserName ?? "Unknown";

            // Parse CSV file
            HsbcParseResult parseResult;
            using (var stream = file.OpenReadStream())
            {
                parseResult = await _csvParser.ParseAsync(stream, ct);
            }

            if (!parseResult.Success)
            {
                _logger.LogWarning("Failed to parse CSV file: {Errors}", string.Join(", ", parseResult.Errors));
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "Failed to parse CSV file",
                    Errors = parseResult.Errors
                }, 400, ct);
                return;
            }

            // Import transactions
            var importResult = await _importService.ImportTransactionsAsync(
                parseResult.Transactions,
                uploadedBy,
                ct);

            if (!importResult.Success)
            {
                _logger.LogError("Failed to import transactions: {Errors}", string.Join(", ", importResult.Errors));
                await SendAsync(new UploadHsbcStatementResponse
                {
                    Success = false,
                    Message = "Failed to import transactions",
                    Errors = importResult.Errors
                }, 500, ct);
                return;
            }

            // Process contributions from imported transactions
            var processingResult = await _contributionProcessingService.ProcessHsbcTransactionsAsync(uploadedBy, ct);

            // Build success message
            var message = $"{importResult.NewTransactions} new transaction(s) imported successfully";
            if (importResult.DuplicatesSkipped > 0)
            {
                message += $", {importResult.DuplicatesSkipped} duplicate(s) skipped";
            }
            if (importResult.IgnoredNoMoneyIn > 0)
            {
                message += $", {importResult.IgnoredNoMoneyIn} transaction(s) ignored (no credit amount)";
            }

            // Add contribution processing details to message
            if (processingResult.Success)
            {
                message += $". {processingResult.MatchedCount} contribution(s) matched to members";
                if (processingResult.UnmatchedCount > 0)
                {
                    message += $", {processingResult.UnmatchedCount} unmatched reference(s)";
                }
            }
            else
            {
                message += ". Warning: Contribution processing encountered errors";
                _logger.LogWarning("Contribution processing failed: {Errors}", string.Join(", ", processingResult.Errors));
            }

            _logger.LogInformation("HSBC statement uploaded: {Message}", message);

            await SendOkAsync(new UploadHsbcStatementResponse
            {
                Success = true,
                Message = message,
                Summary = new UploadSummary
                {
                    TotalProcessed = importResult.TotalProcessed,
                    NewTransactions = importResult.NewTransactions,
                    DuplicatesSkipped = importResult.DuplicatesSkipped,
                    IgnoredNoMoneyIn = importResult.IgnoredNoMoneyIn
                },
                ProcessingSummary = processingResult.Success ? new ContributionProcessingSummary
                {
                    MatchedTransactions = processingResult.MatchedCount,
                    UnmatchedTransactions = processingResult.UnmatchedCount,
                    TotalAmountProcessed = processingResult.TotalAmount,
                    UnmatchedReferences = processingResult.UnmatchedReferences
                } : null
            }, ct);
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
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<SubmitEnvelopeBatchEndpoint> _logger;

    public SubmitEnvelopeBatchEndpoint(
        IEnvelopeContributionService envelopeService,
        ILogger<SubmitEnvelopeBatchEndpoint> logger)
    {
        _envelopeService = envelopeService;
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
            .WithTags("Financial", "Envelope Contributions"));
    }

    public override async Task HandleAsync(SubmitEnvelopeBatchRequest req, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Submit envelope batch endpoint called for date {Date} with {Count} envelopes",
                req.CollectionDate, req.Envelopes?.Count ?? 0);

            // Validate collection date is not in future
            if (req.CollectionDate > DateOnly.FromDateTime(DateTime.Now))
            {
                AddError("Collection date cannot be in the future");
                await SendErrorsAsync(400, ct);
                return;
            }

            // Validate envelopes list is not empty
            if (req.Envelopes == null || req.Envelopes.Count == 0)
            {
                AddError("At least one envelope entry is required");
                await SendErrorsAsync(400, ct);
                return;
            }

            // Validate all amounts are positive
            var invalidAmounts = req.Envelopes.Where(e => e.Amount <= 0).ToList();
            if (invalidAmounts.Any())
            {
                AddError("All envelope amounts must be greater than zero");
                await SendErrorsAsync(400, ct);
                return;
            }

            // Submit batch
            var result = await _envelopeService.SubmitBatchAsync(req, ct);

            _logger.LogInformation("Successfully submitted batch {BatchId} with {Count} contributions",
                result.BatchId, result.EnvelopeCount);

            await SendCreatedAtAsync<GetEnvelopeBatchDetailsEndpoint>(
                new { batchId = result.BatchId },
                result,
                generateAbsoluteUrl: false,
                cancellation: ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error submitting envelope batch");
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
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<GetEnvelopeBatchListEndpoint> _logger;

    public GetEnvelopeBatchListEndpoint(
        IEnvelopeContributionService envelopeService,
        ILogger<GetEnvelopeBatchListEndpoint> logger)
    {
        _envelopeService = envelopeService;
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
            .WithTags("Financial", "Envelope Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            // Get query parameters
            var startDateStr = Query<string>("startDate", false);
            var endDateStr = Query<string>("endDate", false);
            var pageNumber = Query<int>("pageNumber", false) is > 0 ? Query<int>("pageNumber") : 1;
            var pageSize = Query<int>("pageSize", false) is > 0 and <= 100 ? Query<int>("pageSize") : 20;

            DateOnly? startDate = null;
            DateOnly? endDate = null;

            if (!string.IsNullOrEmpty(startDateStr) && DateOnly.TryParse(startDateStr, out var parsedStart))
            {
                startDate = parsedStart;
            }

            if (!string.IsNullOrEmpty(endDateStr) && DateOnly.TryParse(endDateStr, out var parsedEnd))
            {
                endDate = parsedEnd;
            }

            _logger.LogInformation("Get batch list endpoint called: start={Start}, end={End}, page={Page}, size={Size}",
                startDate, endDate, pageNumber, pageSize);

            var result = await _envelopeService.GetBatchListAsync(startDate, endDate, pageNumber, pageSize, ct);
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
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<GetEnvelopeBatchDetailsEndpoint> _logger;

    public GetEnvelopeBatchDetailsEndpoint(
        IEnvelopeContributionService envelopeService,
        ILogger<GetEnvelopeBatchDetailsEndpoint> logger)
    {
        _envelopeService = envelopeService;
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
            .WithTags("Financial", "Envelope Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var batchId = Route<int>("batchId");

            _logger.LogInformation("Get batch details endpoint called for batch {BatchId}", batchId);

            var result = await _envelopeService.GetBatchDetailsAsync(batchId, ct);
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
    private readonly IEnvelopeContributionService _envelopeService;
    private readonly ILogger<ValidateRegisterNumberEndpoint> _logger;

    public ValidateRegisterNumberEndpoint(
        IEnvelopeContributionService envelopeService,
        ILogger<ValidateRegisterNumberEndpoint> logger)
    {
        _envelopeService = envelopeService;
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
            .WithTags("Financial", "Envelope Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var number = Route<int>("number");
            var year = Route<int>("year");

            _logger.LogInformation("Validate register number endpoint called: number={Number}, year={Year}", number, year);

            var result = await _envelopeService.ValidateRegisterNumberAsync(number, year, ct);
            
            // Return 200 for both valid and invalid - client checks result.Valid
            await SendOkAsync(result, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating register number");
            AddError($"Error validating register number: {ex.Message}");
            await SendErrorsAsync(500, ct);
        }
    }
}
