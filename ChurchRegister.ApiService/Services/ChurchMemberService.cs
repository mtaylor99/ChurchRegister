using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services;

/// <summary>
/// Comprehensive church member management service providing business logic for member operations
/// </summary>
public class ChurchMemberService : IChurchMemberService
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<ChurchMemberService> _logger;
    private readonly IRegisterNumberService _registerNumberService;

    public ChurchMemberService(
        ChurchRegisterWebContext context,
        ILogger<ChurchMemberService> logger,
        IRegisterNumberService registerNumberService)
    {
        _context = context;
        _logger = logger;
        _registerNumberService = registerNumberService;
    }

    public async Task<PagedResult<ChurchMemberDto>> GetChurchMembersAsync(ChurchMemberGridQuery query, CancellationToken cancellationToken = default)
    {
        // Validate pagination parameters (validation also exists at model level via [Range] attribute)
        Helpers.ValidationHelpers.RequireValidPageNumber(query.Page);
        Helpers.ValidationHelpers.RequireValidPageSize(query.PageSize);
        
        var membersQuery = _context.ChurchMembers
            .AsNoTracking()
            .Include(m => m.ChurchMemberStatus)
            .Include(m => m.Roles)
                .ThenInclude(r => r.ChurchMemberRoleType)
            .Include(m => m.RegisterNumbers)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchTerm = query.SearchTerm.ToLower();
            membersQuery = membersQuery.Where(m =>
                m.FirstName.ToLower().Contains(searchTerm) ||
                m.LastName.ToLower().Contains(searchTerm) ||
                (m.EmailAddress != null && m.EmailAddress.ToLower().Contains(searchTerm)) ||
                (m.PhoneNumber != null && m.PhoneNumber.ToLower().Contains(searchTerm)));
        }

        // Apply status filter
        if (query.StatusFilter.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.ChurchMemberStatusId == query.StatusFilter.Value);
        }

        // Apply role filter
        if (query.RoleFilter.HasValue)
        {
            membersQuery = membersQuery.Where(m =>
                m.Roles.Any(r => r.ChurchMemberRoleTypeId == query.RoleFilter.Value));
        }

        // Apply baptised filter
        if (query.BaptisedFilter.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.Baptised == query.BaptisedFilter.Value);
        }

        // Apply GiftAid filter
        if (query.GiftAidFilter.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.GiftAid == query.GiftAidFilter.Value);
        }

        // Get total count before pagination
        var totalCount = await membersQuery.CountAsync(cancellationToken);

        // Apply sorting
        membersQuery = query.SortDirection?.ToLower() == "desc"
            ? ApplySortingDescending(membersQuery, query.SortBy)
            : ApplySortingAscending(membersQuery, query.SortBy);

        // Apply pagination
        var members = await membersQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        // Calculate this year's contributions for the paginated members
        var memberIds = members.Select(m => m.Id).ToList();
        var currentYear = DateTime.UtcNow.Year;
        var yearStart = new DateTime(currentYear, 1, 1);
        var yearEnd = new DateTime(currentYear, 12, 31, 23, 59, 59);

        var contributionSums = await _context.ChurchMemberContributions
            .Where(c => memberIds.Contains(c.ChurchMemberId) && 
                       c.Date >= yearStart && 
                       c.Date <= yearEnd)
            .GroupBy(c => c.ChurchMemberId)
            .Select(g => new { ChurchMemberId = g.Key, TotalAmount = g.Sum(c => c.Amount) })
            .ToListAsync(cancellationToken);

        var contributionDict = contributionSums.ToDictionary(c => c.ChurchMemberId, c => c.TotalAmount);

        // Map to DTOs
        var memberDtos = members.Select(m => MapToChurchMemberDto(m, contributionDict)).ToList();

        return new PagedResult<ChurchMemberDto>
        {
            Items = memberDtos,
            TotalCount = totalCount,
            PageSize = query.PageSize,
            CurrentPage = query.Page
        };
    }

    public async Task<ChurchMemberDetailDto?> GetChurchMemberByIdAsync(int memberId, CancellationToken cancellationToken = default)
    {
        var member = await _context.ChurchMembers
            .Include(m => m.Address)
            .Include(m => m.ChurchMemberStatus)
            .Include(m => m.Roles)
                .ThenInclude(r => r.ChurchMemberRoleType)
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
            return null;

        return MapToChurchMemberDetailDto(member);
    }

    public async Task<CreateChurchMemberResponse> CreateChurchMemberAsync(CreateChurchMemberRequest request, string createdBy, CancellationToken cancellationToken = default)
    {
        // Validate BankReference uniqueness if provided
        if (!string.IsNullOrWhiteSpace(request.BankReference))
        {
            var duplicateBankReference = await _context.ChurchMembers
                .AnyAsync(m => m.BankReference != null && 
                              m.BankReference.ToLower().Trim() == request.BankReference.ToLower().Trim(),
                        cancellationToken);

            if (duplicateBankReference)
                throw new InvalidOperationException($"Bank reference '{request.BankReference}' is already in use by another active member");
        }

        // Validate status exists
        var statusExists = await _context.ChurchMemberStatuses
            .AnyAsync(s => s.Id == request.StatusId, cancellationToken);

        if (!statusExists)
            throw new InvalidOperationException($"Status with ID {request.StatusId} does not exist");

        // Create member entity
        var member = new ChurchMember
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailAddress = request.Email,
            PhoneNumber = request.Phone,
            BankReference = request.BankReference,
            MemberSince = request.MemberSince,
            ChurchMemberStatusId = request.StatusId,
            Baptised = request.Baptised,
            GiftAid = request.GiftAid,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };

        // Handle address if provided
        if (request.Address != null && !IsAddressEmpty(request.Address))
        {
            var address = new Address
            {
                NameNumber = request.Address.NameNumber,
                AddressLineOne = request.Address.AddressLineOne,
                AddressLineTwo = request.Address.AddressLineTwo,
                Town = request.Address.Town,
                County = request.Address.County,
                Postcode = request.Address.Postcode,
                CreatedBy = createdBy,
                CreatedDateTime = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            member.Address = address;
        }

        // Add member to context
        _context.ChurchMembers.Add(member);

        // Assign roles
        if (request.RoleIds.Length > 0)
        {
            foreach (var roleId in request.RoleIds)
            {
                var roleExists = await _context.ChurchMemberRoleTypes
                    .AnyAsync(r => r.Id == roleId, cancellationToken);

                if (!roleExists)
                    throw new InvalidOperationException($"Role with ID {roleId} does not exist");

                member.Roles.Add(new ChurchMemberRoles
                {
                    ChurchMemberRoleTypeId = roleId,
                    CreatedBy = createdBy,
                    CreatedDateTime = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Automatically assign member number for current year
        var currentYear = DateTime.UtcNow.Year;
        var nextNumber = await _registerNumberService.GetNextAvailableNumberAsync(currentYear, cancellationToken);
        
        var registerNumber = new ChurchMemberRegisterNumber
        {
            ChurchMemberId = member.Id,
            Number = nextNumber.ToString(),
            Year = currentYear,
            CreatedBy = createdBy,
            CreatedDateTime = DateTime.UtcNow
        };
        
        _context.ChurchMemberRegisterNumbers.Add(registerNumber);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with full details
        var createdMember = await GetChurchMemberByIdAsync(member.Id, cancellationToken);

        _logger.LogInformation("Church member {MemberId} created by {CreatedBy}", member.Id, createdBy);

        return new CreateChurchMemberResponse
        {
            Id = member.Id,
            Message = $"Church member '{member.FirstName} {member.LastName}' created successfully",
            Member = createdMember
        };
    }

    public async Task<ChurchMemberDetailDto> UpdateChurchMemberAsync(UpdateChurchMemberRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        var member = await _context.ChurchMembers
            .Include(m => m.Address)
            .Include(m => m.Roles)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (member == null)
            throw new InvalidOperationException($"Church member with ID {request.Id} not found");

        // Validate BankReference uniqueness if provided
        if (!string.IsNullOrWhiteSpace(request.BankReference))
        {
            var duplicateBankReference = await _context.ChurchMembers
                .AnyAsync(m => m.Id != request.Id && 
                              m.BankReference != null && 
                              m.BankReference.ToLower().Trim() == request.BankReference.ToLower().Trim(),
                        cancellationToken);

            if (duplicateBankReference)
                throw new InvalidOperationException($"Bank reference '{request.BankReference}' is already in use by another active member");
        }

        // Validate status exists
        var statusExists = await _context.ChurchMemberStatuses
            .AnyAsync(s => s.Id == request.StatusId, cancellationToken);

        if (!statusExists)
            throw new InvalidOperationException($"Status with ID {request.StatusId} does not exist");

        // Update basic fields
        member.FirstName = request.FirstName;
        member.LastName = request.LastName;
        member.EmailAddress = request.Email;
        member.PhoneNumber = request.Phone;
        member.BankReference = request.BankReference;
        member.MemberSince = request.MemberSince;
        member.ChurchMemberStatusId = request.StatusId;
        member.Baptised = request.Baptised;
        member.GiftAid = request.GiftAid;
        member.ModifiedBy = modifiedBy;
        member.ModifiedDateTime = DateTime.UtcNow;

        // Update address
        if (request.Address != null && !IsAddressEmpty(request.Address))
        {
            if (member.Address != null)
            {
                // Update existing address
                member.Address.NameNumber = request.Address.NameNumber;
                member.Address.AddressLineOne = request.Address.AddressLineOne;
                member.Address.AddressLineTwo = request.Address.AddressLineTwo;
                member.Address.Town = request.Address.Town;
                member.Address.County = request.Address.County;
                member.Address.Postcode = request.Address.Postcode;
                member.Address.ModifiedBy = modifiedBy;
                member.Address.ModifiedDateTime = DateTime.UtcNow;
            }
            else
            {
                // Create new address
                var address = new Address
                {
                    NameNumber = request.Address.NameNumber,
                    AddressLineOne = request.Address.AddressLineOne,
                    AddressLineTwo = request.Address.AddressLineTwo,
                    Town = request.Address.Town,
                    County = request.Address.County,
                    Postcode = request.Address.Postcode,
                    CreatedBy = modifiedBy,
                    CreatedDateTime = DateTime.UtcNow
                };

                _context.Addresses.Add(address);
                member.Address = address;
            }
        }
        else if (member.Address != null)
        {
            // Remove address if cleared
            member.AddressId = null;
            member.Address = null;
        }

        // Update roles - remove old, add new
        var existingRoles = member.Roles.ToList();
        foreach (var role in existingRoles)
        {
            _context.ChurchMemberRoles.Remove(role);
        }

        if (request.RoleIds.Length > 0)
        {
            foreach (var roleId in request.RoleIds)
            {
                var roleExists = await _context.ChurchMemberRoleTypes
                    .AnyAsync(r => r.Id == roleId, cancellationToken);

                if (!roleExists)
                    throw new InvalidOperationException($"Role with ID {roleId} does not exist");

                member.Roles.Add(new ChurchMemberRoles
                {
                    ChurchMemberRoleTypeId = roleId,
                    CreatedBy = modifiedBy,
                    CreatedDateTime = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Reload with full details
        var updatedMember = await GetChurchMemberByIdAsync(member.Id, cancellationToken);

        _logger.LogInformation("Church member {MemberId} updated by {ModifiedBy}", member.Id, modifiedBy);

        return updatedMember!;
    }

    public async Task<ChurchMemberDetailDto> UpdateChurchMemberStatusAsync(int memberId, UpdateChurchMemberStatusRequest request, string modifiedBy, CancellationToken cancellationToken = default)
    {
        var member = await _context.ChurchMembers
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
            throw new InvalidOperationException($"Church member with ID {memberId} not found");

        // Validate status exists
        var statusExists = await _context.ChurchMemberStatuses
            .AnyAsync(s => s.Id == request.StatusId, cancellationToken);

        if (!statusExists)
            throw new InvalidOperationException($"Status with ID {request.StatusId} does not exist");

        member.ChurchMemberStatusId = request.StatusId;
        member.ModifiedBy = modifiedBy;
        member.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Log the status change with note if provided
        _logger.LogInformation(
            "Church member {MemberId} status updated to {StatusId} by {ModifiedBy}. Note: {Note}",
            memberId, request.StatusId, modifiedBy, request.Note ?? "None");

        // Reload with full details
        var updatedMember = await GetChurchMemberByIdAsync(memberId, cancellationToken);

        return updatedMember!;
    }

    public async Task<IEnumerable<ChurchMemberRoleDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _context.ChurchMemberRoleTypes
            .AsNoTracking()
            .OrderBy(r => r.Type)
            .ToListAsync(cancellationToken);

        return roles.Select(r => new ChurchMemberRoleDto
        {
            Id = r.Id,
            Type = r.Type
        });
    }

    public async Task<IEnumerable<ChurchMemberStatusDto>> GetStatusesAsync(CancellationToken cancellationToken = default)
    {
        var statuses = await _context.ChurchMemberStatuses
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return statuses.Select(s => new ChurchMemberStatusDto
        {
            Id = s.Id,
            Name = s.Name
        });
    }

    #region Private Helper Methods

    private static ChurchMemberDto MapToChurchMemberDto(ChurchMember member, Dictionary<int, decimal> contributionDict)
    {
        contributionDict.TryGetValue(member.Id, out var thisYearsContribution);

        // Get current year register number
        var currentYear = DateTime.UtcNow.Year;
        var memberNumber = member.RegisterNumbers
            .FirstOrDefault(rn => rn.Year == currentYear)?.Number;

        return new ChurchMemberDto
        {
            Id = member.Id,
            FirstName = member.FirstName,
            LastName = member.LastName,
            Email = member.EmailAddress,
            Phone = member.PhoneNumber,
            BankReference = member.BankReference,
            MemberNumber = memberNumber,
            MemberSince = member.MemberSince,
            Status = member.ChurchMemberStatus?.Name ?? "Unknown",
            StatusId = member.ChurchMemberStatusId,
            Roles = member.Roles
                .Select(r => r.ChurchMemberRoleType.Type)
                .OrderBy(r => r)
                .ToArray(),
            Baptised = member.Baptised,
            GiftAid = member.GiftAid,
            ThisYearsContribution = thisYearsContribution,
            CreatedAt = member.CreatedDateTime,
            LastModified = member.ModifiedDateTime
        };
    }

    private static ChurchMemberDetailDto MapToChurchMemberDetailDto(ChurchMember member)
    {
        return new ChurchMemberDetailDto
        {
            Id = member.Id,
            FirstName = member.FirstName,
            LastName = member.LastName,
            Email = member.EmailAddress,
            Phone = member.PhoneNumber,
            BankReference = member.BankReference,
            MemberSince = member.MemberSince,
            Status = member.ChurchMemberStatus?.Name ?? "Unknown",
            StatusId = member.ChurchMemberStatusId,
            Roles = member.Roles
                .Select(r => new ChurchMemberRoleDto
                {
                    Id = r.ChurchMemberRoleType.Id,
                    Type = r.ChurchMemberRoleType.Type
                })
                .OrderBy(r => r.Type)
                .ToArray(),
            Baptised = member.Baptised,
            GiftAid = member.GiftAid,
            Address = member.Address != null ? new AddressDto
            {
                Id = member.Address.Id,
                NameNumber = member.Address.NameNumber,
                AddressLineOne = member.Address.AddressLineOne,
                AddressLineTwo = member.Address.AddressLineTwo,
                Town = member.Address.Town,
                County = member.Address.County,
                Postcode = member.Address.Postcode
            } : null,
            CreatedAt = member.CreatedDateTime,
            LastModified = member.ModifiedDateTime,
            CreatedBy = member.CreatedBy,
            ModifiedBy = member.ModifiedBy
        };
    }

    private static bool IsAddressEmpty(AddressDto? address)
    {
        return address == null ||
               (string.IsNullOrWhiteSpace(address.NameNumber) &&
                string.IsNullOrWhiteSpace(address.AddressLineOne) &&
                string.IsNullOrWhiteSpace(address.AddressLineTwo) &&
                string.IsNullOrWhiteSpace(address.Town) &&
                string.IsNullOrWhiteSpace(address.County) &&
                string.IsNullOrWhiteSpace(address.Postcode));
    }

    public async Task<DashboardStatisticsResponse> GetDashboardStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);
        var sixtyDaysAgo = now.AddDays(-60);
        var twentyEightDaysAgo = now.AddDays(-28); // Last 4 weeks
        var fiftySevenDaysAgo = now.AddDays(-57); // Previous 4 weeks (for comparison)

        // Get total active members (assuming status ID 1 is "Active")
        var totalMembers = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.ChurchMemberStatusId == 1)
            .CountAsync(cancellationToken);

        // Get new members in last 30 days
        var newMembersThisMonth = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= thirtyDaysAgo && m.MemberSince <= now)
            .CountAsync(cancellationToken);

        // Get new members in last 7 days
        var newMembersThisWeek = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= sevenDaysAgo && m.MemberSince <= now)
            .CountAsync(cancellationToken);

        // Calculate growth percentage (comparing last 30 days to previous 30 days)
        var newMembersPreviousMonth = await _context.ChurchMembers
            .AsNoTracking()
            .Where(m => m.MemberSince >= sixtyDaysAgo && m.MemberSince < thirtyDaysAgo)
            .CountAsync(cancellationToken);

        decimal growthPercentage = 0;
        if (newMembersPreviousMonth > 0)
        {
            growthPercentage = ((decimal)(newMembersThisMonth - newMembersPreviousMonth) / newMembersPreviousMonth) * 100;
        }
        else if (newMembersThisMonth > 0)
        {
            growthPercentage = 100; // 100% growth if there were no members last month but there are this month
        }

        // Calculate attendance statistics for each service type
        // Sunday Morning Service (Event ID = 1)
        var (sundayMorningAvg, sundayMorningChange) = await CalculateAttendanceStats(1, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        // Sunday Evening Service (Event ID = 2)
        var (sundayEveningAvg, sundayEveningChange) = await CalculateAttendanceStats(2, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        // Bible Study (Event ID = 4)
        var (bibleStudyAvg, bibleStudyChange) = await CalculateAttendanceStats(4, twentyEightDaysAgo, fiftySevenDaysAgo, now, cancellationToken);

        return new DashboardStatisticsResponse
        {
            TotalMembers = totalMembers,
            NewMembersThisMonth = newMembersThisMonth,
            NewMembersThisWeek = newMembersThisWeek,
            MemberGrowthPercentage = Math.Round(growthPercentage, 1),
            SundayMorningAverage = sundayMorningAvg,
            SundayMorningChangePercentage = sundayMorningChange,
            SundayEveningAverage = sundayEveningAvg,
            SundayEveningChangePercentage = sundayEveningChange,
            BibleStudyAverage = bibleStudyAvg,
            BibleStudyChangePercentage = bibleStudyChange
        };
    }

    private async Task<(decimal average, decimal changePercentage)> CalculateAttendanceStats(
        int eventId, 
        DateTime last4WeeksStart, 
        DateTime previous4WeeksStart, 
        DateTime now,
        CancellationToken cancellationToken)
    {
        // Get attendance for last 4 weeks
        var recentAttendance = await _context.EventAttendances
            .Where(a => a.EventId == eventId && a.Date >= last4WeeksStart && a.Date <= now)
            .Select(a => a.Attendance)
            .ToListAsync(cancellationToken);

        // Get attendance for previous 4 weeks (for comparison)
        var previousAttendance = await _context.EventAttendances
            .Where(a => a.EventId == eventId && a.Date >= previous4WeeksStart && a.Date < last4WeeksStart)
            .Select(a => a.Attendance)
            .ToListAsync(cancellationToken);

        decimal recentAvg = recentAttendance.Any() ? (decimal)recentAttendance.Average() : 0;
        decimal previousAvg = previousAttendance.Any() ? (decimal)previousAttendance.Average() : 0;

        decimal changePercentage = 0;
        if (previousAvg > 0)
        {
            changePercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
        }
        else if (recentAvg > 0)
        {
            changePercentage = 100; // 100% increase if there was no previous attendance
        }

        return (Math.Round(recentAvg, 1), Math.Round(changePercentage, 1));
    }

    private static IQueryable<ChurchMember> ApplySortingAscending(IQueryable<ChurchMember> query, string sortBy)
    {
        return sortBy.ToLower() switch
        {
            "firstname" => query.OrderBy(m => m.FirstName),
            "lastname" => query.OrderBy(m => m.LastName),
            "email" => query.OrderBy(m => m.EmailAddress),
            "membersince" => query.OrderBy(m => m.MemberSince),
            "status" => query.OrderBy(m => m.ChurchMemberStatus!.Name),
            _ => query.OrderBy(m => m.FirstName)
        };
    }

    private static IQueryable<ChurchMember> ApplySortingDescending(IQueryable<ChurchMember> query, string sortBy)
    {
        return sortBy.ToLower() switch
        {
            "firstname" => query.OrderByDescending(m => m.FirstName),
            "lastname" => query.OrderByDescending(m => m.LastName),
            "email" => query.OrderByDescending(m => m.EmailAddress),
            "membersince" => query.OrderByDescending(m => m.MemberSince),
            "status" => query.OrderByDescending(m => m.ChurchMemberStatus!.Name),
            _ => query.OrderByDescending(m => m.FirstName)
        };
    }

    #endregion
}
