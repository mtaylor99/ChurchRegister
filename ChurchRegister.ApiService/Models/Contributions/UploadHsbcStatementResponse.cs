namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Response for HSBC statement upload operation
/// </summary>
public class UploadHsbcStatementResponse
{
    /// <summary>
    /// Indicates if the upload was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detailed summary of the upload operation
    /// </summary>
    public UploadSummary? Summary { get; set; }

    /// <summary>
    /// Summary of contribution processing results
    /// </summary>
    public ContributionProcessingSummary? ProcessingSummary { get; set; }

    /// <summary>
    /// List of errors if any occurred
    /// </summary>
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Request for submitting an envelope contribution batch
/// </summary>
public class SubmitEnvelopeBatchRequest
{
    /// <summary>
    /// Collection date (must be a Sunday)
    /// </summary>
    public DateOnly CollectionDate { get; set; }

    /// <summary>
    /// List of envelope entries for this batch
    /// </summary>
    public List<EnvelopeEntry> Envelopes { get; set; } = new();
}

/// <summary>
/// Single envelope entry with register number and amount
/// </summary>
public class EnvelopeEntry
{
    /// <summary>
    /// Member register number for current year
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Contribution amount
    /// </summary>
    public decimal Amount { get; set; }
}

/// <summary>
/// Response for envelope batch submission
/// </summary>
public class SubmitEnvelopeBatchResponse
{
    /// <summary>
    /// ID of the created batch
    /// </summary>
    public int BatchId { get; set; }

    /// <summary>
    /// Batch date (Sunday)
    /// </summary>
    public DateOnly BatchDate { get; set; }

    /// <summary>
    /// Total amount of all envelopes in batch
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Count of envelopes processed
    /// </summary>
    public int EnvelopeCount { get; set; }

    /// <summary>
    /// List of successfully processed envelopes
    /// </summary>
    public List<ProcessedEnvelope> ProcessedContributions { get; set; } = new();
}

/// <summary>
/// Details of a processed envelope contribution
/// </summary>
public class ProcessedEnvelope
{
    /// <summary>
    /// Register number used
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Member name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Contribution amount
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// ID of created contribution record
    /// </summary>
    public int ContributionId { get; set; }
}

/// <summary>
/// Validation error for envelope entry
/// </summary>
public class BatchValidationError
{
    /// <summary>
    /// Register number that failed validation
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Error message
    /// </summary>
    public string Error { get; set; } = string.Empty;
}

/// <summary>
/// Response for getting list of batches
/// </summary>
public class GetBatchListResponse
{
    /// <summary>
    /// List of batch summaries
    /// </summary>
    public List<BatchSummary> Batches { get; set; } = new();

    /// <summary>
    /// Total count of batches matching filter
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// Page size
    /// </summary>
    public int PageSize { get; set; }
}

/// <summary>
/// Summary information for an envelope contribution batch
/// </summary>
public class BatchSummary
{
    /// <summary>
    /// Batch ID
    /// </summary>
    public int BatchId { get; set; }

    /// <summary>
    /// Collection date (Sunday)
    /// </summary>
    public DateOnly BatchDate { get; set; }

    /// <summary>
    /// Total amount collected
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Number of envelopes in batch
    /// </summary>
    public int EnvelopeCount { get; set; }

    /// <summary>
    /// User who submitted the batch (User ID)
    /// </summary>
    public string SubmittedBy { get; set; } = string.Empty;

    /// <summary>
    /// Name of user who submitted the batch
    /// </summary>
    public string SubmittedByName { get; set; } = string.Empty;

    /// <summary>
    /// DateTime when batch was submitted
    /// </summary>
    public DateTime SubmittedDateTime { get; set; }
}

/// <summary>
/// Detailed batch information including individual envelopes
/// </summary>
public class GetBatchDetailsResponse : BatchSummary
{
    /// <summary>
    /// Batch status (e.g., "Submitted")
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// List of individual envelope details
    /// </summary>
    public List<EnvelopeDetail> Envelopes { get; set; } = new();
}

/// <summary>
/// Details of an individual envelope in a batch
/// </summary>
public class EnvelopeDetail
{
    /// <summary>
    /// Contribution record ID
    /// </summary>
    public int ContributionId { get; set; }

    /// <summary>
    /// Register number used
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Church member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Contribution amount
    /// </summary>
    public decimal Amount { get; set; }
}

/// <summary>
/// Response for validating a register number
/// </summary>
public class ValidateRegisterNumberResponse
{
    /// <summary>
    /// Whether the register number is valid
    /// </summary>
    public bool Valid { get; set; }

    /// <summary>
    /// Register number checked
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Year checked
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Church member ID (if valid)
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// Member's full name (if valid)
    /// </summary>
    public string? MemberName { get; set; }

    /// <summary>
    /// Whether member is currently active (if valid)
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Error message (if invalid)
    /// </summary>
    public string? Error { get; set; }
}
