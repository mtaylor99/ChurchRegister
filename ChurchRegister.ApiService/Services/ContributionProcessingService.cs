using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.Services;

public class ContributionProcessingService : IContributionProcessingService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<ContributionProcessingService> _logger;

    public ContributionProcessingService(
        ChurchRegisterWebContext context,
        ILogger<ContributionProcessingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ContributionProcessingResult> ProcessHsbcTransactionsAsync(
        string uploadedBy,
        CancellationToken cancellationToken = default)
    {
        var result = new ContributionProcessingResult
        {
            Success = false
        };

        try
        {
            _logger.LogInformation("Starting HSBC transaction processing for user: {UploadedBy}", uploadedBy);

            // Get all unprocessed HSBC transactions
            var unprocessedTransactions = await _context.HSBCBankCreditTransactions
                .Where(t => !t.IsProcessed && !t.Deleted)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} unprocessed transactions", unprocessedTransactions.Count);

            if (unprocessedTransactions.Count == 0)
            {
                result.Success = true;
                return result;
            }

            // Get all active church members with bank references
            var activeMembers = await _context.ChurchMembers
                .Where(m => m.BankReference != null && m.BankReference != "")
                .Select(m => new { m.Id, BankReference = m.BankReference!.ToLower().Trim() })
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} members with bank references", activeMembers.Count);

            // Check for existing contributions to prevent duplicates
            var existingTransactionIds = await _context.ChurchMemberContributions
                .Where(c => c.HSBCBankCreditTransactionId != null)
                .Select(c => c.HSBCBankCreditTransactionId!.Value)
                .ToHashSetAsync(cancellationToken);

            var matchedTransactions = new List<HSBCBankCreditTransaction>();
            var contributionsToAdd = new List<ChurchMemberContributions>();
            var unmatchedReferences = new List<string>();
            decimal totalAmount = 0;

            foreach (var transaction in unprocessedTransactions)
            {
                // Skip if already has a contribution record (duplicate prevention)
                if (existingTransactionIds.Contains(transaction.Id))
                {
                    _logger.LogWarning("Transaction {TransactionId} already has a contribution record, skipping", transaction.Id);
                    continue;
                }

                // Normalize the transaction reference for matching
                var normalizedReference = transaction.Reference?.Trim().ToLower();

                if (string.IsNullOrWhiteSpace(normalizedReference))
                {
                    unmatchedReferences.Add("[EMPTY]");
                    continue;
                }

                // Try to match with a church member
                var matchedMember = activeMembers.FirstOrDefault(m => m.BankReference == normalizedReference);

                if (matchedMember != null)
                {
                    // Create contribution record
                    var contribution = new ChurchMemberContributions
                    {
                        ChurchMemberId = matchedMember.Id,
                        Amount = transaction.MoneyIn,
                        Date = transaction.Date,
                        TransactionRef = transaction.Reference!,
                        Description = transaction.Description,
                        ContributionTypeId = 2, // Transfer
                        HSBCBankCreditTransactionId = transaction.Id,
                        CreatedBy = uploadedBy,
                        CreatedDateTime = DateTime.UtcNow
                    };

                    contributionsToAdd.Add(contribution);
                    matchedTransactions.Add(transaction);
                    totalAmount += transaction.MoneyIn;

                    _logger.LogDebug("Matched transaction {TransactionId} with member {MemberId} for amount {Amount}",
                        transaction.Id, matchedMember.Id, transaction.MoneyIn);
                }
                else
                {
                    unmatchedReferences.Add(transaction.Reference!);
                    _logger.LogDebug("No match found for reference: {Reference}", transaction.Reference);
                }
            }

            // Add all contribution records in a single batch
            if (contributionsToAdd.Count > 0)
            {
                await _context.ChurchMemberContributions.AddRangeAsync(contributionsToAdd, cancellationToken);
            }

            // Mark matched transactions as processed
            foreach (var transaction in matchedTransactions)
            {
                transaction.IsProcessed = true;
            }

            // Save all changes in a single transaction
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Processing complete. Matched: {Matched}, Unmatched: {Unmatched}, Total Amount: {Amount}",
                matchedTransactions.Count, unmatchedReferences.Count, totalAmount);

            result.Success = true;
            result.TotalProcessed = unprocessedTransactions.Count;
            result.MatchedCount = matchedTransactions.Count;
            result.UnmatchedCount = unmatchedReferences.Count;
            result.TotalAmount = totalAmount;
            result.UnmatchedReferences = unmatchedReferences.Distinct().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing HSBC transactions");
            result.Success = false;
            result.Errors.Add($"Processing error: {ex.Message}");
        }

        return result;
    }
}

/// <summary>
/// Service for generating annual register numbers for active church members
/// </summary>
public class RegisterNumberService : IRegisterNumberService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<RegisterNumberService> _logger;

    public RegisterNumberService(
        ChurchRegisterWebContext context,
        ILogger<RegisterNumberService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> HasBeenGeneratedForYearAsync(int year, CancellationToken cancellationToken = default)
    {
        return await _context.ChurchMemberRegisterNumbers
            .AnyAsync(r => r.Year == year, cancellationToken);
    }

    public async Task<int> GetNextAvailableNumberAsync(int year, CancellationToken cancellationToken = default)
    {
        // Load all numbers for the year, then parse in memory (EF Core can't translate int.Parse to SQL)
        var numbers = await _context.ChurchMemberRegisterNumbers
            .AsNoTracking()
            .Where(r => r.Year == year)
            .Select(r => r.Number)
            .ToListAsync(cancellationToken);

        if (!numbers.Any())
        {
            return 1;
        }

        // Parse numbers in memory and find the maximum
        var maxNumber = numbers
            .Where(n => !string.IsNullOrEmpty(n) && int.TryParse(n, out _))
            .Select(n => int.Parse(n!))
            .DefaultIfEmpty(0)
            .Max();

        return maxNumber + 1;
    }

    public async Task<Models.Administration.PreviewRegisterNumbersResponse> PreviewForYearAsync(
        int targetYear, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Previewing register numbers for year {Year}", targetYear);

        // Get all active members ordered by MemberSince
        var activeMembers = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.ChurchMemberStatusId == 1)
            .OrderBy(m => m.MemberSince)
            .Select(m => new { m.Id, m.FirstName, m.LastName, m.MemberSince })
            .ToListAsync(cancellationToken);

        var assignments = activeMembers
            .Select((m, index) => new Models.Administration.RegisterNumberAssignment
            {
                RegisterNumber = index + 1,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince ?? DateTime.UtcNow
            })
            .ToList();

        return new Models.Administration.PreviewRegisterNumbersResponse
        {
            Year = targetYear,
            TotalActiveMembers = activeMembers.Count,
            PreviewGenerated = DateTime.UtcNow,
            Assignments = assignments
        };
    }

    public async Task<Models.Administration.GenerateRegisterNumbersResponse> GenerateForYearAsync(
        int targetYear, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating register numbers for year {Year}", targetYear);

        // Check if already generated
        if (await HasBeenGeneratedForYearAsync(targetYear, cancellationToken))
        {
            throw new InvalidOperationException($"Register numbers for year {targetYear} have already been generated");
        }

        // Get all active members ordered by MemberSince
        var activeMembers = await _context.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1)
            .OrderBy(m => m.MemberSince)
            .Select(m => new { m.Id, m.FirstName, m.LastName, m.MemberSince })
            .ToListAsync(cancellationToken);

        if (activeMembers.Count == 0)
        {
            _logger.LogWarning("No active members found for register number generation");
            throw new InvalidOperationException("No active members to assign register numbers");
        }

        // Create register number entities
        var registerNumbers = activeMembers
            .Select((m, index) => new ChurchMemberRegisterNumber
            {
                ChurchMemberId = m.Id,
                Number = (index + 1).ToString(),
                Year = targetYear
            })
            .ToList();

        // Save to database
        await _context.ChurchMemberRegisterNumbers.AddRangeAsync(registerNumbers, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully generated {Count} register numbers for year {Year}", 
            registerNumbers.Count, targetYear);

        // Create response with preview of first 10
        var preview = activeMembers
            .Take(10)
            .Select((m, index) => new Models.Administration.RegisterNumberAssignment
            {
                RegisterNumber = index + 1,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince ?? DateTime.UtcNow
            })
            .ToList();

        return new Models.Administration.GenerateRegisterNumbersResponse
        {
            Year = targetYear,
            TotalMembersAssigned = registerNumbers.Count,
            GeneratedDateTime = DateTime.UtcNow,
            GeneratedBy = "System", // TODO: Get from HttpContext
            Preview = preview
        };
    }
}

/// <summary>
/// Service for processing envelope contribution batches
/// </summary>
public class EnvelopeContributionService : IEnvelopeContributionService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<EnvelopeContributionService> _logger;

    public EnvelopeContributionService(
        ChurchRegisterWebContext context,
        ILogger<EnvelopeContributionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Models.Financial.ValidateRegisterNumberResponse> ValidateRegisterNumberAsync(
        int registerNumber, 
        int year, 
        CancellationToken cancellationToken = default)
    {
        var registerEntry = await _context.ChurchMemberRegisterNumbers
            .Where(r => r.Number == registerNumber.ToString() && r.Year == year)
            .Include(r => r.ChurchMember)
            .FirstOrDefaultAsync(cancellationToken);

        if (registerEntry == null)
        {
            return new Models.Financial.ValidateRegisterNumberResponse
            {
                Valid = false,
                RegisterNumber = registerNumber,
                Year = year,
                Error = "Register number not found for current year"
            };
        }

        var member = registerEntry.ChurchMember;
        var isActive = member.ChurchMemberStatusId == 1;

        if (!isActive)
        {
            return new Models.Financial.ValidateRegisterNumberResponse
            {
                Valid = false,
                RegisterNumber = registerNumber,
                Year = year,
                MemberId = member.Id,
                MemberName = $"{member.FirstName} {member.LastName}",
                IsActive = false,
                Error = "Member is not active"
            };
        }

        return new Models.Financial.ValidateRegisterNumberResponse
        {
            Valid = true,
            RegisterNumber = registerNumber,
            Year = year,
            MemberId = member.Id,
            MemberName = $"{member.FirstName} {member.LastName}",
            IsActive = true
        };
    }

    public async Task<Models.Financial.SubmitEnvelopeBatchResponse> SubmitBatchAsync(
        Models.Financial.SubmitEnvelopeBatchRequest request, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Submitting envelope batch for date {Date} with {Count} envelopes", 
            request.CollectionDate, request.Envelopes.Count);

        // Validate collection date is Sunday
        if (request.CollectionDate.DayOfWeek != DayOfWeek.Sunday)
        {
            throw new ArgumentException("Collection date must be a Sunday");
        }

        // Check for duplicate batch
        var existingBatch = await _context.EnvelopeContributionBatches
            .AnyAsync(b => b.BatchDate == request.CollectionDate, cancellationToken);

        if (existingBatch)
        {
            throw new InvalidOperationException(
                $"Contributions for Sunday, {request.CollectionDate:MMMM dd, yyyy} have already been submitted");
        }

        // Validate all register numbers
        var currentYear = DateTime.Now.Year;
        var validationErrors = new List<Models.Financial.BatchValidationError>();

        foreach (var envelope in request.Envelopes)
        {
            var validation = await ValidateRegisterNumberAsync(envelope.RegisterNumber, currentYear, cancellationToken);
            if (!validation.Valid)
            {
                validationErrors.Add(new Models.Financial.BatchValidationError
                {
                    RegisterNumber = envelope.RegisterNumber,
                    Error = validation.Error ?? "Unknown error"
                });
            }
        }

        if (validationErrors.Any())
        {
            throw new ArgumentException($"Validation errors: {string.Join(", ", validationErrors.Select(e => $"#{e.RegisterNumber}: {e.Error}"))}");
        }

        // Begin transaction
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Create batch
            var batch = new EnvelopeContributionBatch
            {
                BatchDate = request.CollectionDate,
                TotalAmount = request.Envelopes.Sum(e => e.Amount),
                EnvelopeCount = request.Envelopes.Count,
                Status = "Submitted"
            };

            _context.EnvelopeContributionBatches.Add(batch);
            await _context.SaveChangesAsync(cancellationToken);

            // Create contributions
            var contributions = new List<ChurchMemberContributions>();
            var processedEnvelopes = new List<Models.Financial.ProcessedEnvelope>();

            foreach (var envelope in request.Envelopes)
            {
                // Get member ID from register number
                var registerEntry = await _context.ChurchMemberRegisterNumbers
                    .Where(r => r.Number == envelope.RegisterNumber.ToString() && r.Year == currentYear)
                    .Include(r => r.ChurchMember)
                    .FirstAsync(cancellationToken);

                var contribution = new ChurchMemberContributions
                {
                    ChurchMemberId = registerEntry.ChurchMemberId,
                    Amount = envelope.Amount,
                    Date = request.CollectionDate.ToDateTime(TimeOnly.MinValue),
                    TransactionRef = $"ENV-{batch.Id}-{envelope.RegisterNumber}",
                    Description = $"Envelope contribution - Sunday {request.CollectionDate:dd/MM/yyyy}",
                    ContributionTypeId = 1, // Cash
                    EnvelopeContributionBatchId = batch.Id
                };

                contributions.Add(contribution);

                processedEnvelopes.Add(new Models.Financial.ProcessedEnvelope
                {
                    RegisterNumber = envelope.RegisterNumber,
                    MemberName = $"{registerEntry.ChurchMember.FirstName} {registerEntry.ChurchMember.LastName}",
                    Amount = envelope.Amount,
                    ContributionId = 0 // Will be set after save
                });
            }

            await _context.ChurchMemberContributions.AddRangeAsync(contributions, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Update contribution IDs in response
            for (int i = 0; i < contributions.Count; i++)
            {
                processedEnvelopes[i].ContributionId = contributions[i].Id;
            }

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Successfully submitted batch {BatchId} with {Count} contributions", 
                batch.Id, contributions.Count);

            return new Models.Financial.SubmitEnvelopeBatchResponse
            {
                BatchId = batch.Id,
                BatchDate = batch.BatchDate,
                TotalAmount = batch.TotalAmount,
                EnvelopeCount = batch.EnvelopeCount,
                ProcessedContributions = processedEnvelopes
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error submitting envelope batch");
            throw;
        }
    }

    public async Task<Models.Financial.GetBatchListResponse> GetBatchListAsync(
        DateOnly? startDate, 
        DateOnly? endDate, 
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        // Validate pagination parameters
        Helpers.ValidationHelpers.RequireValidPageNumber(pageNumber);
        Helpers.ValidationHelpers.RequireValidPageSize(pageSize);
        
        var query = _context.EnvelopeContributionBatches.AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(b => b.BatchDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(b => b.BatchDate <= endDate.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var batches = await query
            .OrderByDescending(b => b.BatchDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Join(
                _context.Users,
                batch => batch.CreatedBy,
                user => user.Id,
                (batch, user) => new { Batch = batch, User = user })
            .Select(joined => new Models.Financial.BatchSummary
            {
                BatchId = joined.Batch.Id,
                BatchDate = joined.Batch.BatchDate,
                TotalAmount = joined.Batch.TotalAmount,
                EnvelopeCount = joined.Batch.EnvelopeCount,
                SubmittedBy = joined.Batch.CreatedBy,
                SubmittedByName = joined.User.FirstName + " " + joined.User.LastName,
                SubmittedDateTime = joined.Batch.CreatedDateTime
            })
            .ToListAsync(cancellationToken);

        return new Models.Financial.GetBatchListResponse
        {
            Batches = batches,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<Models.Financial.GetBatchDetailsResponse> GetBatchDetailsAsync(
        int batchId, 
        CancellationToken cancellationToken = default)
    {
        var batch = await _context.EnvelopeContributionBatches
            .Include(b => b.ChurchMemberContributions)
                .ThenInclude(c => c.ChurchMember)
            .FirstOrDefaultAsync(b => b.Id == batchId, cancellationToken);

        if (batch == null)
        {
            throw new ArgumentException($"Batch {batchId} not found");
        }

        // Get the user who created the batch
        var user = await _context.Users.FindAsync(new object[] { batch.CreatedBy }, cancellationToken);
        var submittedByName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown User";

        var envelopes = batch.ChurchMemberContributions
            .Select(c => new Models.Financial.EnvelopeDetail
            {
                ContributionId = c.Id,
                RegisterNumber = int.Parse(c.TransactionRef.Split('-')[2]), // Extract from ENV-{BatchId}-{RegisterNumber}
                MemberId = c.ChurchMemberId,
                MemberName = $"{c.ChurchMember.FirstName} {c.ChurchMember.LastName}",
                Amount = c.Amount
            })
            .ToList();

        return new Models.Financial.GetBatchDetailsResponse
        {
            BatchId = batch.Id,
            BatchDate = batch.BatchDate,
            TotalAmount = batch.TotalAmount,
            EnvelopeCount = batch.EnvelopeCount,
            SubmittedBy = batch.CreatedBy,
            SubmittedByName = submittedByName,
            SubmittedDateTime = batch.CreatedDateTime,
            Status = batch.Status,
            Envelopes = envelopes
        };
    }
}
