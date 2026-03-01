using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Services.Contributions;
using Microsoft.AspNetCore.Http;

namespace ChurchRegister.ApiService.UseCase.Contributions.UploadHsbcStatement;

public class UploadHsbcStatementUseCase : IUploadHsbcStatementUseCase
{
    private readonly IHsbcCsvParser _csvParser;
    private readonly IHsbcTransactionImportService _importService;
    private readonly IContributionProcessingService _contributionProcessingService;
    private readonly ILogger<UploadHsbcStatementUseCase> _logger;

    public UploadHsbcStatementUseCase(
        IHsbcCsvParser csvParser,
        IHsbcTransactionImportService importService,
        IContributionProcessingService contributionProcessingService,
        ILogger<UploadHsbcStatementUseCase> logger)
    {
        _csvParser = csvParser;
        _importService = importService;
        _contributionProcessingService = contributionProcessingService;
        _logger = logger;
    }

    public async Task<UploadHsbcStatementResponse> ExecuteAsync(
        IFormFile file,
        string uploadedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing HSBC statement upload: {FileName}", file.FileName);

        // Validate file
        ValidateFile(file);

        // Parse CSV file
        using var stream = file.OpenReadStream();
        var parseResult = await _csvParser.ParseAsync(stream, cancellationToken);

        if (!parseResult.Success)
        {
            return new UploadHsbcStatementResponse
            {
                Success = false,
                Message = "Failed to parse CSV file",
                Errors = parseResult.Errors
            };
        }

        if (parseResult.Transactions == null || parseResult.Transactions.Count == 0)
        {
            return new UploadHsbcStatementResponse
            {
                Success = false,
                Message = "No valid transactions found in file",
                Errors = new List<string> { "The CSV file did not contain any valid HSBC transaction records" }
            };
        }

        // Import transactions
        var importResult = await _importService.ImportTransactionsAsync(parseResult.Transactions, uploadedBy, cancellationToken);

        // Process contributions (match to members)
        var processingResult = await _contributionProcessingService.ProcessHsbcTransactionsAsync(uploadedBy, cancellationToken);

        // Build success message
        var message = BuildSuccessMessage(importResult, processingResult);

        _logger.LogInformation("HSBC statement uploaded: {Message}", message);

        return new UploadHsbcStatementResponse
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
        };
    }

    private void ValidateFile(IFormFile file)
    {
        if (file == null)
            throw new ArgumentException("No file uploaded");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Only CSV files are accepted");

        const long maxFileSize = 10 * 1024 * 1024; // 10 MB
        if (file.Length > maxFileSize)
            throw new ArgumentException("File size must not exceed 10 MB");
    }

    private string BuildSuccessMessage(ImportResult importResult, ContributionProcessingResult processingResult)
    {
        var message = $"{importResult.NewTransactions} new transaction(s) imported successfully";

        if (importResult.DuplicatesSkipped > 0)
            message += $", {importResult.DuplicatesSkipped} duplicate(s) skipped";

        if (importResult.IgnoredNoMoneyIn > 0)
            message += $", {importResult.IgnoredNoMoneyIn} transaction(s) ignored (no credit amount)";

        if (processingResult.Success)
        {
            message += $". {processingResult.MatchedCount} contribution(s) matched to members";
            if (processingResult.UnmatchedCount > 0)
                message += $", {processingResult.UnmatchedCount} unmatched reference(s)";
        }
        else
        {
            message += ". Warning: Contribution processing encountered errors";
            _logger.LogWarning("Contribution processing failed: {Errors}", string.Join(", ", processingResult.Errors));
        }

        return message;
    }
}
