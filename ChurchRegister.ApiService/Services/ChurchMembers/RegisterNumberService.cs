using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Configuration;
using ChurchRegister.ApiService.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

/// <summary>
/// Service for generating annual register numbers for active church members.
/// Baptised Members receive sequential numbers starting at 1 (up to NonBaptisedMemberStartNumber - 1).
/// Non-Baptised Members receive sequential numbers from NonBaptisedMemberStartNumber (up to NonMemberStartNumber - 1).
/// Non-Members receive sequential numbers starting at NonMemberStartNumber.
/// </summary>
public class RegisterNumberService : IRegisterNumberService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<RegisterNumberService> _logger;
    private readonly IOptions<MembershipNumbersConfiguration> _config;

    private const string MemberRoleType = "Member";
    private const string NonMemberRoleType = "Non-Member";
    private const string NonBaptisedMemberRoleType = "Member (Non-Baptised)";

    public RegisterNumberService(
        ChurchRegisterWebContext context,
        ILogger<RegisterNumberService> logger,
        IOptions<MembershipNumbersConfiguration> config)
    {
        _context = context;
        _logger = logger;
        _config = config;
    }

    private int NonBaptisedMemberStartNumber => _config.Value.NonBaptisedMemberStartNumber;
    private int NonMemberStartNumber => _config.Value.NonMemberStartNumber;

    /// <summary>
    /// Validate that target year is current year + 1 only.
    /// </summary>
    private void ValidateTargetYear(int targetYear)
    {
        var currentYear = DateTime.UtcNow.Year;
        var validYear = currentYear + 1;

        if (targetYear != validYear)
        {
            throw new ArgumentException(
                $"Cannot generate for year {targetYear}. Only year {validYear} is valid.",
                nameof(targetYear));
        }
    }

    public async Task<bool> HasBeenGeneratedForYearAsync(int year, CancellationToken cancellationToken = default)
    {
        return await _context.ChurchMemberRegisterNumbers
            .AnyAsync(r => r.Year == year, cancellationToken);
    }

    public async Task<CheckGenerationStatusResponse> GetGenerationStatusAsync(int year, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Checking generation status for year {Year}", year);

        var registrations = await _context.ChurchMemberRegisterNumbers
            .AsNoTracking()
            .Where(r => r.Year == year)
            .Select(r => new { r.CreatedBy, r.CreatedDateTime })
            .ToListAsync(cancellationToken);

        var isGenerated = registrations.Any();

        return new CheckGenerationStatusResponse
        {
            Year = year,
            IsGenerated = isGenerated,
            TotalAssignments = registrations.Count,
            GeneratedBy = isGenerated ? registrations.First().CreatedBy : null,
            GeneratedDateTime = isGenerated ? registrations.First().CreatedDateTime : null
        };
    }

    public async Task<int> GetNextAvailableNumberForRoleAsync(
        int year,
        bool isMember,
        bool isBaptised,
        CancellationToken cancellationToken = default)
    {
        // Load register numbers for the year but only for ACTIVE members (StatusId = 1)
        // This allows deleted member numbers to be reused
        var rawNumbers = await _context.ChurchMemberRegisterNumbers
            .AsNoTracking()
            .Where(r => r.Year == year && r.ChurchMember.ChurchMemberStatusId == 1)
            .Select(r => r.Number)
            .ToListAsync(cancellationToken);

        var parsedNumbers = rawNumbers;

        if (isMember && isBaptised)
        {
            // Baptised Members occupy 1 to (NonBaptisedMemberStartNumber - 1)
            var baptisedMemberNumbers = parsedNumbers.Where(n => n < NonBaptisedMemberStartNumber).ToList();
            return baptisedMemberNumbers.Count != 0 ? baptisedMemberNumbers.Max() + 1 : 1;
        }
        else if (isMember && !isBaptised)
        {
            // Non-Baptised Members occupy NonBaptisedMemberStartNumber to (NonMemberStartNumber - 1)
            var nonBaptisedMemberNumbers = parsedNumbers.Where(n => n >= NonBaptisedMemberStartNumber && n < NonMemberStartNumber).ToList();
            return nonBaptisedMemberNumbers.Count != 0 ? nonBaptisedMemberNumbers.Max() + 1 : NonBaptisedMemberStartNumber;
        }
        else
        {
            // Non-Members occupy NonMemberStartNumber and above
            var nonMemberNumbers = parsedNumbers.Where(n => n >= NonMemberStartNumber).ToList();
            return nonMemberNumbers.Count != 0 ? nonMemberNumbers.Max() + 1 : NonMemberStartNumber;
        }
    }

    public async Task<PreviewRegisterNumbersResponse> PreviewForYearAsync(
        int targetYear,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Previewing register numbers for year {Year}", targetYear);

        // If numbers are already generated for this year, return the persisted assignments
        if (await HasBeenGeneratedForYearAsync(targetYear, cancellationToken))
        {
            return await BuildPreviewFromExistingAsync(targetYear, cancellationToken);
        }

        // Numbers not yet generated — validate year and return proposed assignments
        ValidateTargetYear(targetYear);

        return await BuildProposedPreviewAsync(targetYear, cancellationToken);
    }

    /// <summary>
    /// Build preview from already-persisted register number records.
    /// </summary>
    private async Task<PreviewRegisterNumbersResponse> BuildPreviewFromExistingAsync(
        int year,
        CancellationToken cancellationToken)
    {
        var existing = await _context.ChurchMemberRegisterNumbers
            .AsNoTracking()
            .Where(r => r.Year == year)
            .Include(r => r.ChurchMember)
            .ThenInclude(m => m.Roles)
            .ThenInclude(role => role.ChurchMemberRoleType)
            .OrderBy(r => r.ChurchMember.MemberSince)
            .ThenBy(r => r.Number)
            .ToListAsync(cancellationToken);

        var memberAssignments = new List<RegisterNumberAssignment>();
        var nonBaptisedMemberAssignments = new List<RegisterNumberAssignment>();
        var nonMemberAssignments = new List<RegisterNumberAssignment>();

        foreach (var record in existing)
        {
            var num = record.Number;
            var isMember = record.ChurchMember.Roles
                .Any(r => r.ChurchMemberRoleType.Type == MemberRoleType);

            string memberType;
            if (!isMember)
                memberType = NonMemberRoleType;
            else if (num < NonBaptisedMemberStartNumber)
                memberType = MemberRoleType;
            else
                memberType = NonBaptisedMemberRoleType;

            var assignment = new RegisterNumberAssignment
            {
                RegisterNumber = num,
                MemberId = record.ChurchMemberId,
                MemberName = $"{record.ChurchMember.FirstName} {record.ChurchMember.LastName}",
                MemberSince = record.ChurchMember.MemberSince,
                MemberType = memberType,
                CurrentNumber = num
            };

            if (!isMember)
                nonMemberAssignments.Add(assignment);
            else if (num < NonBaptisedMemberStartNumber)
                memberAssignments.Add(assignment);
            else
                nonBaptisedMemberAssignments.Add(assignment);
        }

        return new PreviewRegisterNumbersResponse
        {
            Year = year,
            TotalMembers = memberAssignments.Count,
            TotalNonBaptisedMembers = nonBaptisedMemberAssignments.Count,
            TotalNonMembers = nonMemberAssignments.Count,
            PreviewGenerated = DateTime.UtcNow,
            Members = memberAssignments,
            NonBaptisedMembers = nonBaptisedMemberAssignments,
            NonMembers = nonMemberAssignments
        };
    }

    /// <summary>
    /// Build a proposed preview for a year that has not yet been generated.
    /// </summary>
    private async Task<PreviewRegisterNumbersResponse> BuildProposedPreviewAsync(
        int targetYear,
        CancellationToken cancellationToken)
    {
        var currentYear = DateTime.UtcNow.Year;

        var activeMembers = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.ChurchMemberStatusId == 1)
            .Include(m => m.RegisterNumbers)
            .Select(m => new
            {
                m.Id,
                m.FirstName,
                m.LastName,
                m.MemberSince,
                m.Baptised,
                IsMember = m.Roles.Any(r => r.ChurchMemberRoleType.Type == MemberRoleType),
                CurrentNumber = m.RegisterNumbers.Where(r => r.Year == currentYear).Select(r => (int?)r.Number).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        // Sort by member since date, then by current number (nulls last)
        var sortedMembers = activeMembers
            .OrderBy(m => m.MemberSince ?? DateTime.MaxValue)
            .ThenBy(m => m.CurrentNumber ?? int.MaxValue)
            .ToList();

        var currentYearNumbers = sortedMembers
            .Where(m => m.CurrentNumber.HasValue)
            .ToDictionary(m => m.Id, m => m.CurrentNumber!.Value);

        var baptisedMembers = sortedMembers.Where(m => m.IsMember && m.Baptised).ToList();
        var nonBaptisedMembers = sortedMembers.Where(m => m.IsMember && !m.Baptised).ToList();
        var nonMembers = sortedMembers.Where(m => !m.IsMember).ToList();

        var memberAssignments = baptisedMembers
            .Select((m, index) => new RegisterNumberAssignment
            {
                RegisterNumber = index + 1,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince,
                MemberType = MemberRoleType,
                CurrentNumber = currentYearNumbers.TryGetValue(m.Id, out var cn) ? cn : null
            })
            .ToList();

        var nonBaptisedMemberAssignments = nonBaptisedMembers
            .Select((m, index) => new RegisterNumberAssignment
            {
                RegisterNumber = NonBaptisedMemberStartNumber + index,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince,
                MemberType = NonBaptisedMemberRoleType,
                CurrentNumber = currentYearNumbers.TryGetValue(m.Id, out var cn2) ? cn2 : null
            })
            .ToList();

        var nonMemberAssignments = nonMembers
            .Select((m, index) => new RegisterNumberAssignment
            {
                RegisterNumber = NonMemberStartNumber + index,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince,
                MemberType = NonMemberRoleType,
                CurrentNumber = currentYearNumbers.TryGetValue(m.Id, out var cn3) ? cn3 : null
            })
            .ToList();

        return new PreviewRegisterNumbersResponse
        {
            Year = targetYear,
            TotalMembers = baptisedMembers.Count,
            TotalNonBaptisedMembers = nonBaptisedMembers.Count,
            TotalNonMembers = nonMembers.Count,
            PreviewGenerated = DateTime.UtcNow,
            Members = memberAssignments,
            NonBaptisedMembers = nonBaptisedMemberAssignments,
            NonMembers = nonMemberAssignments
        };
    }

    public async Task<GenerateRegisterNumbersResponse> GenerateForYearAsync(
        int targetYear,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating register numbers for year {Year}", targetYear);

        ValidateTargetYear(targetYear);

        if (await HasBeenGeneratedForYearAsync(targetYear, cancellationToken))
        {
            throw new ValidationException(
                $"Register numbers for year {targetYear} have already been generated. Contact an administrator to review the existing assignments.");
        }

        // Fetch active members ordered by seniority, with their membership role and baptism status
        var currentYear = DateTime.UtcNow.Year;
        
        var activeMembers = await _context.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1)
            .Include(m => m.RegisterNumbers)
            .Select(m => new
            {
                m.Id,
                m.MemberSince,
                m.LastName,
                m.Baptised,
                IsMember = m.Roles.Any(r => r.ChurchMemberRoleType.Type == MemberRoleType),
                CurrentNumber = m.RegisterNumbers.Where(r => r.Year == currentYear).Select(r => (int?)r.Number).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        // Sort by member since date, then by current number (nulls last)
        var sortedMembers = activeMembers
            .OrderBy(m => m.MemberSince ?? DateTime.MaxValue)
            .ThenBy(m => m.CurrentNumber ?? int.MaxValue)
            .ToList();

        if (sortedMembers.Count == 0)
        {
            _logger.LogWarning("No active members found for register number generation for year {Year}", targetYear);
            throw new ValidationException("No active members found. Ensure there are active members before generating numbers.");
        }

        var baptisedMembers = sortedMembers.Where(m => m.IsMember && m.Baptised).ToList();
        var nonBaptisedMembers = sortedMembers.Where(m => m.IsMember && !m.Baptised).ToList();
        var nonMembers = sortedMembers.Where(m => !m.IsMember).ToList();

        _logger.LogInformation(
            "Generating numbers for {BaptisedCount} Baptised Members, {UnbaptisedCount} Non-Baptised Members, and {NonMemberCount} Non-Members for year {Year}",
            baptisedMembers.Count, nonBaptisedMembers.Count, nonMembers.Count, targetYear);

        // Build record lists for all three sequences
        var memberRecords = baptisedMembers
            .Select((m, index) => new ChurchMemberRegisterNumber
            {
                ChurchMemberId = m.Id,
                Number = index + 1,
                Year = targetYear
            })
            .ToList();

        var nonBaptisedMemberRecords = nonBaptisedMembers
            .Select((m, index) => new ChurchMemberRegisterNumber
            {
                ChurchMemberId = m.Id,
                Number = NonBaptisedMemberStartNumber + index,
                Year = targetYear
            })
            .ToList();

        var nonMemberRecords = nonMembers
            .Select((m, index) => new ChurchMemberRegisterNumber
            {
                ChurchMemberId = m.Id,
                Number = NonMemberStartNumber + index,
                Year = targetYear
            })
            .ToList();

        // Persist all three groups atomically
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _context.ChurchMemberRegisterNumbers.AddRangeAsync(memberRecords, cancellationToken);
            await _context.ChurchMemberRegisterNumbers.AddRangeAsync(nonBaptisedMemberRecords, cancellationToken);
            await _context.ChurchMemberRegisterNumbers.AddRangeAsync(nonMemberRecords, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        _logger.LogInformation(
            "Successfully generated {BaptisedCount} Baptised Member numbers, {UnbaptisedCount} Unbaptised Member numbers, and {NonMemberCount} Non-Member numbers for year {Year}",
            memberRecords.Count, nonBaptisedMemberRecords.Count, nonMemberRecords.Count, targetYear);

        return new GenerateRegisterNumbersResponse
        {
            Year = targetYear,
            TotalMembersAssigned = memberRecords.Count,
            TotalNonBaptisedMembersAssigned = nonBaptisedMemberRecords.Count,
            TotalNonMembersAssigned = nonMemberRecords.Count,
            GeneratedDateTime = DateTime.UtcNow,
            GeneratedBy = string.Empty // Patched by endpoint from authenticated user context
        };
    }
}

