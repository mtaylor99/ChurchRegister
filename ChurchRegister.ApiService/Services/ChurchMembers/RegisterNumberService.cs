using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.ApiService.Models.ChurchMembers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

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

    /// <summary>
    /// Validate that target year is current year + 1 only
    /// </summary>
    private void ValidateTargetYear(int targetYear)
    {
        var currentYear = DateTime.UtcNow.Year;
        var validYear = currentYear + 1;
        
        if (targetYear != validYear)
        {
            throw new ArgumentException($"Cannot generate for year {targetYear}. Only year {validYear} is valid.", nameof(targetYear));
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
            .Select(r => new
            {
                r.CreatedBy,
                r.CreatedDateTime
            })
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

    public async Task<PreviewRegisterNumbersResponse> PreviewForYearAsync(
        int targetYear, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Previewing register numbers for year {Year}", targetYear);

        // Validate target year
        ValidateTargetYear(targetYear);

        var currentYear = DateTime.UtcNow.Year;

        // Get all active members ordered by MemberSince then LastName
        var activeMembers = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.ChurchMemberStatusId == 1)
            .OrderBy(m => m.MemberSince)
            .ThenBy(m => m.LastName)
            .Select(m => new { m.Id, m.FirstName, m.LastName, m.MemberSince })
            .ToListAsync(cancellationToken);

        // Get current year numbers for all members
        var currentYearNumbers = await _context.ChurchMemberRegisterNumbers
            .AsNoTracking()
            .Where(r => r.Year == currentYear)
            .ToDictionaryAsync(r => r.ChurchMemberId, r => r.Number, cancellationToken);

        var assignments = activeMembers
            .Select((m, index) => new RegisterNumberAssignment
            {
                RegisterNumber = index + 1,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince ?? DateTime.UtcNow,
                CurrentNumber = currentYearNumbers.TryGetValue(m.Id, out var currentNum) && int.TryParse(currentNum, out var num) ? num : null
            })
            .ToList();

        return new PreviewRegisterNumbersResponse
        {
            Year = targetYear,
            TotalActiveMembers = activeMembers.Count,
            PreviewGenerated = DateTime.UtcNow,
            Assignments = assignments
        };
    }

    public async Task<GenerateRegisterNumbersResponse> GenerateForYearAsync(
        int targetYear, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating register numbers for year {Year}", targetYear);

        // Validate target year
        ValidateTargetYear(targetYear);

        // Check if already generated
        if (await HasBeenGeneratedForYearAsync(targetYear, cancellationToken))
        {
            throw new InvalidOperationException($"Register numbers for year {targetYear} have already been generated");
        }

        // Get all active members ordered by MemberSince then LastName
        var activeMembers = await _context.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == 1)
            .OrderBy(m => m.MemberSince)
            .ThenBy(m => m.LastName)
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
            .Select((m, index) => new RegisterNumberAssignment
            {
                RegisterNumber = index + 1,
                MemberId = m.Id,
                MemberName = $"{m.FirstName} {m.LastName}",
                MemberSince = m.MemberSince ?? DateTime.UtcNow
            })
            .ToList();

        return new GenerateRegisterNumbersResponse
        {
            Year = targetYear,
            TotalMembersAssigned = registerNumbers.Count,
            GeneratedDateTime = DateTime.UtcNow,
            GeneratedBy = string.Empty, // Will be set by endpoint from authenticated user
            Preview = preview
        };
    }
}
