using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.Models.PastoralCare;
using ChurchRegister.ApiService.Services.DataProtection;
using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

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
            .Include(m => m.Address)
            .Include(m => m.District)
            .Include(m => m.DataProtection)
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

        // Apply pastoral care required filter
        if (query.PastoralCareRequired.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.PastoralCareRequired == query.PastoralCareRequired.Value);
        }

        // Apply district filter
        if (query.DistrictFilter.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.DistrictId == query.DistrictFilter.Value);
        }

        // Apply unassigned district filter
        if (query.UnassignedDistrictFilter == true)
        {
            membersQuery = membersQuery.Where(m => m.DistrictId == null);
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
        var currentYear = query.Year ?? DateTime.UtcNow.Year; // Use provided year or default to current year
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

        // Get last contribution date for each member
        var lastContributionDates = await _context.ChurchMemberContributions
            .Where(c => memberIds.Contains(c.ChurchMemberId) && 
                       c.Date >= yearStart && 
                       c.Date <= yearEnd)
            .GroupBy(c => c.ChurchMemberId)
            .Select(g => new { ChurchMemberId = g.Key, LastDate = g.Max(c => c.Date) })
            .ToListAsync(cancellationToken);

        var lastContributionDict = lastContributionDates.ToDictionary(c => c.ChurchMemberId, c => c.LastDate);

        // Map to DTOs
        var memberDtos = members.Select(m => MapToChurchMemberDto(m, contributionDict, lastContributionDict)).ToList();

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
            .Include(m => m.RegisterNumbers)
            .Include(m => m.District)
            .Include(m => m.DataProtection)
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
                throw new ValidationException($"The bank reference '{request.BankReference}' is already in use. Please enter a unique bank reference.");
        }

        // Validate MemberNumber uniqueness if provided
        if (!string.IsNullOrWhiteSpace(request.MemberNumber))
        {
            var currentYear = DateTime.UtcNow.Year;
            var numberExists = await _context.ChurchMemberRegisterNumbers
                .AnyAsync(r => r.Number == request.MemberNumber && r.Year == currentYear, cancellationToken);

            if (numberExists)
                throw new ValidationException($"Member number '{request.MemberNumber}' is already assigned for {currentYear}. Please choose a different number or leave blank to auto-generate.");
        }

        // Validate status exists
        var statusExists = await _context.ChurchMemberStatuses
            .AnyAsync(s => s.Id == request.StatusId, cancellationToken);

        if (!statusExists)
            throw new InvalidOperationException($"Status with ID {request.StatusId} does not exist");

        // Check if using in-memory database (transactions not supported)
        var isInMemory = _context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";
        var transaction = isInMemory ? null : await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Create member entity
            var member = new ChurchMember
            {
                Title = request.Title,
                FirstName = request.FirstName,
                LastName = request.LastName,
                EmailAddress = request.Email,
                PhoneNumber = request.Phone,
                // Convert empty/whitespace bank reference to null to avoid unique constraint issues
                BankReference = string.IsNullOrWhiteSpace(request.BankReference) ? null : request.BankReference.Trim(),
                MemberSince = request.MemberSince,
                ChurchMemberStatusId = request.StatusId,
                Baptised = request.Baptised,
                GiftAid = request.GiftAid,
                PastoralCareRequired = request.PastoralCareRequired,
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

            // Create data protection record with all permissions false
            var dataProtection = new ChurchMemberDataProtection
            {
                ChurchMemberId = member.Id,
                AllowNameInCommunications = false,
                AllowHealthStatusInCommunications = false,
                AllowPhotoInCommunications = false,
                AllowPhotoInSocialMedia = false,
                GroupPhotos = false,
                PermissionForMyChildren = false,
                CreatedBy = createdBy,
                CreatedDateTime = DateTime.UtcNow
            };

            _context.ChurchMemberDataProtection.Add(dataProtection);
            await _context.SaveChangesAsync(cancellationToken);

            // Link data protection to member
            member.DataProtectionId = dataProtection.Id;
            await _context.SaveChangesAsync(cancellationToken);

            // Commit transaction if not in-memory
            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            // Assign member number for current year if member is Active (StatusId = 1)
            if (member.ChurchMemberStatusId == 1)
            {
                try
                {
                    var currentYear = DateTime.UtcNow.Year;
                    string memberNumber;

                    // Use provided member number or generate next available
                    if (!string.IsNullOrWhiteSpace(request.MemberNumber))
                    {
                        memberNumber = request.MemberNumber.Trim();
                        _logger.LogInformation("Using manually provided member number {Number} for year {Year} for new active member {MemberId}",
                            memberNumber, currentYear, member.Id);
                    }
                    else
                    {
                        var nextNumber = await _registerNumberService.GetNextAvailableNumberAsync(currentYear, cancellationToken);
                        memberNumber = nextNumber.ToString();
                        _logger.LogInformation("Auto-generated member number {Number} for year {Year} for new active member {MemberId}",
                            memberNumber, currentYear, member.Id);
                    }
                    
                    var registerNumber = new ChurchMemberRegisterNumber
                    {
                        ChurchMemberId = member.Id,
                        Number = memberNumber,
                        Year = currentYear,
                        CreatedBy = createdBy,
                        CreatedDateTime = DateTime.UtcNow
                    };
                    
                    _context.ChurchMemberRegisterNumbers.Add(registerNumber);
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    // Log error but don't fail member creation if number assignment fails
                    _logger.LogError(ex, "Failed to assign register number to new member {MemberId}. Member created successfully but without register number.", member.Id);
                }
            }

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
        catch
        {
            // Rollback transaction if not in-memory
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            // Dispose transaction if it exists
            transaction?.Dispose();
        }
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
                throw new ValidationException($"The bank reference '{request.BankReference}' is already in use. Please enter a unique bank reference.");
        }

        // Validate MemberNumber uniqueness if provided
        if (!string.IsNullOrWhiteSpace(request.MemberNumber))
        {
            var currentYear = DateTime.UtcNow.Year;
            var numberExists = await _context.ChurchMemberRegisterNumbers
                .AnyAsync(r => r.ChurchMemberId != request.Id && 
                              r.Number == request.MemberNumber && 
                              r.Year == currentYear, cancellationToken);

            if (numberExists)
                throw new ValidationException($"Member number '{request.MemberNumber}' is already assigned for {currentYear}. Please choose a different number or leave blank to auto-generate.");
        }

        // Validate status exists
        var statusExists = await _context.ChurchMemberStatuses
            .AnyAsync(s => s.Id == request.StatusId, cancellationToken);

        if (!statusExists)
            throw new InvalidOperationException($"Status with ID {request.StatusId} does not exist");

        // Update basic fields
        member.Title = request.Title;
        member.FirstName = request.FirstName;
        member.LastName = request.LastName;
        member.EmailAddress = request.Email;
        member.PhoneNumber = request.Phone;
        // Convert empty/whitespace bank reference to null to avoid unique constraint issues
        member.BankReference = string.IsNullOrWhiteSpace(request.BankReference) ? null : request.BankReference.Trim();
        member.MemberSince = request.MemberSince;
        member.ChurchMemberStatusId = request.StatusId;
        member.Baptised = request.Baptised;
        member.GiftAid = request.GiftAid;
        member.PastoralCareRequired = request.PastoralCareRequired;
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
                    ChurchMemberId = member.Id,
                    ChurchMemberRoleTypeId = roleId,
                    CreatedBy = modifiedBy,
                    CreatedDateTime = DateTime.UtcNow
                });
            }
        }

        // Handle member number update if provided and member is active
        if (member.ChurchMemberStatusId == 1 && !string.IsNullOrWhiteSpace(request.MemberNumber))
        {
            var currentYear = DateTime.UtcNow.Year;
            var existingNumber = await _context.ChurchMemberRegisterNumbers
                .FirstOrDefaultAsync(r => r.ChurchMemberId == member.Id && r.Year == currentYear, cancellationToken);

            if (existingNumber != null)
            {
                // Update existing number
                existingNumber.Number = request.MemberNumber.Trim();
                existingNumber.ModifiedBy = modifiedBy;
                existingNumber.ModifiedDateTime = DateTime.UtcNow;
                _logger.LogInformation("Updated member number to {Number} for year {Year} for member {MemberId}",
                    request.MemberNumber, currentYear, member.Id);
            }
            else
            {
                // Create new number
                var registerNumber = new ChurchMemberRegisterNumber
                {
                    ChurchMemberId = member.Id,
                    Number = request.MemberNumber.Trim(),
                    Year = currentYear,
                    CreatedBy = modifiedBy,
                    CreatedDateTime = DateTime.UtcNow
                };
                _context.ChurchMemberRegisterNumbers.Add(registerNumber);
                _logger.LogInformation("Assigned member number {Number} for year {Year} to member {MemberId}",
                    request.MemberNumber, currentYear, member.Id);
            }
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving church member {MemberId} changes", member.Id);
            throw;
        }

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

    public async Task DeleteChurchMemberAsync(int memberId, CancellationToken cancellationToken = default)
    {
        var member = await _context.ChurchMembers
            .Include(m => m.Roles)
            .Include(m => m.RegisterNumbers)
            .Include(m => m.Address)
            .Include(m => m.DataProtection)
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
            throw new NotFoundException($"Church member with ID {memberId} not found");

        _logger.LogWarning(
            "Deleting church member {MemberId} ({FullName}) - this is a permanent deletion",
            memberId, $"{member.FirstName} {member.LastName}");

        // Remove related entities first
        if (member.Roles.Any())
        {
            _context.ChurchMemberRoles.RemoveRange(member.Roles);
        }

        if (member.RegisterNumbers.Any())
        {
            _context.ChurchMemberRegisterNumbers.RemoveRange(member.RegisterNumbers);
        }

        if (member.Address != null)
        {
            _context.Addresses.Remove(member.Address);
        }


        // Do NOT explicitly remove DataProtection; let cascade delete handle it


        // Break the 1:1 relationship to avoid circular dependency
        if (member.DataProtectionId != null)
        {
            member.DataProtectionId = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Remove the member itself
        _context.ChurchMembers.Remove(member);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully deleted church member {MemberId}", memberId);
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

    private static ChurchMemberDto MapToChurchMemberDto(ChurchMember member, Dictionary<int, decimal> contributionDict, Dictionary<int, DateTime> lastContributionDict)
    {
        contributionDict.TryGetValue(member.Id, out var thisYearsContribution);
        lastContributionDict.TryGetValue(member.Id, out var lastContributionDate);

        // Get current year register number
        var currentYear = DateTime.UtcNow.Year;
        var memberNumber = member.RegisterNumbers
            .Where(rn => rn.Year == currentYear)
            .OrderByDescending(rn => rn.Year)
            .FirstOrDefault()?.Number;

        return new ChurchMemberDto
        {
            Id = member.Id,
            Title = member.Title,
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
            PastoralCareRequired = member.PastoralCareRequired,
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
            ThisYearsContribution = thisYearsContribution,
            LastContributionDate = lastContributionDate != default ? lastContributionDate : null,
            CreatedAt = member.CreatedDateTime,
            LastModified = member.ModifiedDateTime,
            DistrictId = member.DistrictId,
            DistrictName = member.District?.Name,
            DataProtectionId = member.DataProtectionId,
            DataProtection = MapToDataProtectionSummary(member.DataProtection)
        };
    }

    private static ChurchMemberDetailDto MapToChurchMemberDetailDto(ChurchMember member)
    {
        // Get current year member number if exists
        var currentYear = DateTime.UtcNow.Year;
        var memberNumber = member.RegisterNumbers
            .FirstOrDefault(r => r.Year == currentYear)?.Number;

        return new ChurchMemberDetailDto
        {
            Id = member.Id,
            Title = member.Title,
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
                .Select(r => new ChurchMemberRoleDto
                {
                    Id = r.ChurchMemberRoleType.Id,
                    Type = r.ChurchMemberRoleType.Type
                })
                .OrderBy(r => r.Type)
                .ToArray(),
            Baptised = member.Baptised,
            GiftAid = member.GiftAid,
            PastoralCareRequired = member.PastoralCareRequired,
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
            ModifiedBy = member.ModifiedBy,
            DistrictId = member.DistrictId,
            DistrictName = member.District?.Name,
            DataProtectionId = member.DataProtectionId,
            DataProtection = MapToDataProtectionSummary(member.DataProtection)
        };
    }

    private static DataProtectionSummaryDto? MapToDataProtectionSummary(ChurchMemberDataProtection? dataProtection)
    {
        return DataProtectionService.MapToSummaryDto(dataProtection);
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

    public async Task<ChurchMemberDetailDto> AssignDistrictAsync(
        int memberId, 
        AssignDistrictRequest request, 
        string modifiedBy, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Assigning district {DistrictId} to church member {MemberId} by {ModifiedBy}", 
            request.DistrictId, memberId, modifiedBy);

        // Find the member
        var member = await _context.ChurchMembers
            .Include(m => m.ChurchMemberStatus)
            .Include(m => m.Roles)
                .ThenInclude(r => r.ChurchMemberRoleType)
            .Include(m => m.Address)
            .Include(m => m.District)
            .Include(m => m.DataProtection)
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
        {
            throw new KeyNotFoundException($"Church member with ID {memberId} not found");
        }

        // Validate district exists if not null
        if (request.DistrictId.HasValue)
        {
            var districtExists = await _context.Districts
                .AnyAsync(d => d.Id == request.DistrictId.Value, cancellationToken);
            
            if (!districtExists)
            {
                throw new ArgumentException($"District with ID {request.DistrictId.Value} not found");
            }
        }

        // Update the district assignment
        member.DistrictId = request.DistrictId;
        member.ModifiedBy = modifiedBy;
        member.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully assigned district {DistrictId} to church member {MemberId}", 
            request.DistrictId, memberId);

        // Return updated member details
        return MapToChurchMemberDetailDto(member);
    }

    public async Task<PastoralCareReportDto> GetPastoralCareReportDataAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating pastoral care report data");

        // Query members requiring pastoral care with their district information
        var members = await _context.ChurchMembers
            .Include(m => m.District)
                .ThenInclude(d => d!.Deacon)
            .Where(m => m.PastoralCareRequired)
            .OrderBy(m => m.District!.Name)
                .ThenBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
            .Select(m => new
            {
                m.Id,
                m.FirstName,
                m.LastName,
                m.DistrictId,
                DistrictName = m.District != null ? m.District.Name : null,
                DeaconFirstName = m.District != null && m.District.Deacon != null ? m.District.Deacon.FirstName : null,
                DeaconLastName = m.District != null && m.District.Deacon != null ? m.District.Deacon.LastName : null
            })
            .ToListAsync(cancellationToken);

        // Group by district
        var groupedByDistrict = members
            .GroupBy(m => new { m.DistrictId, m.DistrictName, m.DeaconFirstName, m.DeaconLastName })
            .Select(g => new PastoralCareDistrictDto
            {
                DistrictName = g.Key.DistrictName ?? "Unassigned District",
                DeaconName = g.Key.DeaconFirstName != null && g.Key.DeaconLastName != null
                    ? $"{g.Key.DeaconFirstName} {g.Key.DeaconLastName}"
                    : "No Deacon Assigned",
                Members = g.Select(m => new PastoralCareMemberDto
                {
                    Id = m.Id,
                    FirstName = m.FirstName,
                    LastName = m.LastName
                })
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .ToArray()
            })
            .OrderBy(d => d.DistrictName == "Unassigned District" ? 1 : 0) // Unassigned last
            .ThenBy(d => d.DistrictName)
            .ToArray();

        var report = new PastoralCareReportDto
        {
            Districts = groupedByDistrict,
            TotalMembers = members.Count,
            GeneratedDate = DateTime.UtcNow
        };

        _logger.LogInformation("Pastoral care report generated with {DistrictCount} districts and {MemberCount} members", 
            groupedByDistrict.Length, members.Count);

        return report;
    }

    #endregion
}
