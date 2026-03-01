using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Contributions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.Services.Contributions;

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

    public async Task<ValidateRegisterNumberResponse> ValidateRegisterNumberAsync(
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
            return new ValidateRegisterNumberResponse
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
            return new ValidateRegisterNumberResponse
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

        return new ValidateRegisterNumberResponse
        {
            Valid = true,
            RegisterNumber = registerNumber,
            Year = year,
            MemberId = member.Id,
            MemberName = $"{member.FirstName} {member.LastName}",
            IsActive = true
        };
    }

    public async Task<SubmitEnvelopeBatchResponse> SubmitBatchAsync(
        SubmitEnvelopeBatchRequest request,
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
        var validationErrors = new List<BatchValidationError>();

        foreach (var envelope in request.Envelopes)
        {
            var validation = await ValidateRegisterNumberAsync(envelope.RegisterNumber, currentYear, cancellationToken);
            if (!validation.Valid)
            {
                validationErrors.Add(new BatchValidationError
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
            var processedEnvelopes = new List<ProcessedEnvelope>();

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

                processedEnvelopes.Add(new ProcessedEnvelope
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

            return new SubmitEnvelopeBatchResponse
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

    public async Task<GetBatchListResponse> GetBatchListAsync(
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
            .Select(joined => new BatchSummary
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

        return new GetBatchListResponse
        {
            Batches = batches,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<GetBatchDetailsResponse> GetBatchDetailsAsync(
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
            .Select(c => new EnvelopeDetail
            {
                ContributionId = c.Id,
                RegisterNumber = int.Parse(c.TransactionRef.Split('-')[2]), // Extract from ENV-{BatchId}-{RegisterNumber}
                MemberId = c.ChurchMemberId,
                MemberName = $"{c.ChurchMember.FirstName} {c.ChurchMember.LastName}",
                Amount = c.Amount
            })
            .ToList();

        return new GetBatchDetailsResponse
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
