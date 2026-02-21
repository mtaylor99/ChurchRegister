using ChurchRegister.ApiService.Models.Districts;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.Districts;

/// <summary>
/// Service implementation for district operations
/// </summary>
public class DistrictService : IDistrictService
{
    private readonly ChurchRegisterWebContext _context;
    private const int ActiveStatusId = 1; // Active church member status

    public DistrictService(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<DistrictDto>> GetAllDistrictsAsync()
    {
        var districts = await _context.Districts
            .Include(d => d.Deacon)
            .Include(d => d.DistrictOfficer)
            .OrderBy(d => d.Name)
            .ToListAsync();

        var districtDtos = new List<DistrictDto>();

        foreach (var district in districts)
        {
            // Calculate member count for active members only
            var memberCount = await _context.ChurchMembers
                .CountAsync(m => m.DistrictId == district.Id && m.ChurchMemberStatusId == ActiveStatusId);

            districtDtos.Add(new DistrictDto
            {
                Id = district.Id,
                Name = district.Name,
                DeaconId = district.DeaconId,
                DeaconName = district.Deacon != null ? $"{district.Deacon.FirstName} {district.Deacon.LastName}" : null,
                DistrictOfficerId = district.DistrictOfficerId,
                DistrictOfficerName = district.DistrictOfficer != null ? $"{district.DistrictOfficer.FirstName} {district.DistrictOfficer.LastName}" : null,
                MemberCount = memberCount
            });
        }

        return districtDtos;
    }

    /// <inheritdoc />
    public async Task<List<ChurchMemberSummaryDto>> GetActiveDeaconsAsync()
    {
        var deacons = await _context.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == ActiveStatusId &&
                       m.Roles.Any(r => r.ChurchMemberRoleType.Type == "Deacon"))
            .OrderBy(m => m.FirstName)
            .ThenBy(m => m.LastName)
            .Select(m => new ChurchMemberSummaryDto
            {
                Id = m.Id,
                FullName = $"{m.FirstName} {m.LastName}"
            })
            .ToListAsync();

        return deacons;
    }

    /// <inheritdoc />
    public async Task<List<ChurchMemberSummaryDto>> GetActiveDistrictOfficersAsync(int? excludeMemberId = null)
    {
        var query = _context.ChurchMembers
            .Where(m => m.ChurchMemberStatusId == ActiveStatusId &&
                       m.Roles.Any(r => r.ChurchMemberRoleType.Type == "District Officer"));

        if (excludeMemberId.HasValue)
        {
            query = query.Where(m => m.Id != excludeMemberId.Value);
        }

        var officers = await query
            .OrderBy(m => m.FirstName)
            .ThenBy(m => m.LastName)
            .Select(m => new ChurchMemberSummaryDto
            {
                Id = m.Id,
                FullName = $"{m.FirstName} {m.LastName}"
            })
            .ToListAsync();

        return officers;
    }

    /// <inheritdoc />
    public async Task<DistrictDto> AssignDeaconAsync(int districtId, int? deaconId)
    {
        var district = await _context.Districts
            .Include(d => d.Deacon)
            .Include(d => d.DistrictOfficer)
            .FirstOrDefaultAsync(d => d.Id == districtId);

        if (district == null)
        {
            throw new KeyNotFoundException($"District with ID {districtId} not found.");
        }

        // If deaconId is provided, validate the member
        if (deaconId.HasValue)
        {
            var deacon = await _context.ChurchMembers
                .Include(m => m.Roles)
                    .ThenInclude(r => r.ChurchMemberRoleType)
                .FirstOrDefaultAsync(m => m.Id == deaconId.Value);

            if (deacon == null)
            {
                throw new ArgumentException($"Church member with ID {deaconId.Value} not found.");
            }

            if (deacon.ChurchMemberStatusId != ActiveStatusId)
            {
                throw new InvalidOperationException("Cannot assign inactive member as deacon.");
            }

            if (!deacon.Roles.Any(r => r.ChurchMemberRoleType.Type == "Deacon"))
            {
                throw new InvalidOperationException("Church member must have the Deacon role to be assigned as a deacon.");
            }
        }
        else
        {
            // Unassigning deacon - check if district officer exists
            if (district.DistrictOfficerId.HasValue)
            {
                throw new InvalidOperationException("Cannot unassign deacon while a district officer is assigned. Please unassign the district officer first.");
            }
        }

        district.DeaconId = deaconId;
        await _context.SaveChangesAsync();

        // Reload to get updated navigation properties
        await _context.Entry(district).Reference(d => d.Deacon).LoadAsync();

        // Calculate member count
        var memberCount = await _context.ChurchMembers
            .CountAsync(m => m.DistrictId == districtId && m.ChurchMemberStatusId == ActiveStatusId);

        return new DistrictDto
        {
            Id = district.Id,
            Name = district.Name,
            DeaconId = district.DeaconId,
            DeaconName = district.Deacon != null ? $"{district.Deacon.FirstName} {district.Deacon.LastName}" : null,
            DistrictOfficerId = district.DistrictOfficerId,
            DistrictOfficerName = district.DistrictOfficer != null ? $"{district.DistrictOfficer.FirstName} {district.DistrictOfficer.LastName}" : null,
            MemberCount = memberCount
        };
    }

    /// <inheritdoc />
    public async Task<DistrictDto> AssignDistrictOfficerAsync(int districtId, int? districtOfficerId)
    {
        var district = await _context.Districts
            .Include(d => d.Deacon)
            .Include(d => d.DistrictOfficer)
            .FirstOrDefaultAsync(d => d.Id == districtId);

        if (district == null)
        {
            throw new KeyNotFoundException($"District with ID {districtId} not found.");
        }

        // Check if deacon is assigned
        if (!district.DeaconId.HasValue)
        {
            throw new InvalidOperationException("Cannot assign district officer. A deacon must be assigned to this district first.");
        }

        // If districtOfficerId is provided, validate the member
        if (districtOfficerId.HasValue)
        {
            // Cannot be the same as the deacon
            if (districtOfficerId.Value == district.DeaconId.Value)
            {
                throw new InvalidOperationException("The same member cannot be both deacon and district officer for the same district.");
            }

            var officer = await _context.ChurchMembers
                .Include(m => m.Roles)
                    .ThenInclude(r => r.ChurchMemberRoleType)
                .FirstOrDefaultAsync(m => m.Id == districtOfficerId.Value);

            if (officer == null)
            {
                throw new ArgumentException($"Church member with ID {districtOfficerId.Value} not found.");
            }

            if (officer.ChurchMemberStatusId != ActiveStatusId)
            {
                throw new InvalidOperationException("Cannot assign inactive member as district officer.");
            }

            if (!officer.Roles.Any(r => r.ChurchMemberRoleType.Type == "District Officer"))
            {
                throw new InvalidOperationException("Church member must have the District Officer role to be assigned as a district officer.");
            }
        }

        district.DistrictOfficerId = districtOfficerId;
        await _context.SaveChangesAsync();

        // Reload to get updated navigation properties
        await _context.Entry(district).Reference(d => d.DistrictOfficer).LoadAsync();

        // Calculate member count
        var memberCount = await _context.ChurchMembers
            .CountAsync(m => m.DistrictId == districtId && m.ChurchMemberStatusId == ActiveStatusId);

        return new DistrictDto
        {
            Id = district.Id,
            Name = district.Name,
            DeaconId = district.DeaconId,
            DeaconName = district.Deacon != null ? $"{district.Deacon.FirstName} {district.Deacon.LastName}" : null,
            DistrictOfficerId = district.DistrictOfficerId,
            DistrictOfficerName = district.DistrictOfficer != null ? $"{district.DistrictOfficer.FirstName} {district.DistrictOfficer.LastName}" : null,
            MemberCount = memberCount
        };
    }

    /// <inheritdoc />
    public async Task<List<DistrictExportDto>> GetDistrictsForExportAsync()
    {
        // Only get districts with assigned deacon
        var districts = await _context.Districts
            .Include(d => d.Deacon)
            .Include(d => d.DistrictOfficer)
            .Where(d => d.DeaconId != null)
            .OrderBy(d => d.Name)
            .ToListAsync();

        var exportData = new List<DistrictExportDto>();

        foreach (var district in districts)
        {
            // Get active members in this district
            var members = await _context.ChurchMembers
                .Include(m => m.Address)
                .Where(m => m.DistrictId == district.Id && m.ChurchMemberStatusId == ActiveStatusId)
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .ToListAsync();

            var memberDtos = members.Select(m => new DistrictExportMemberDto
            {
                Name = $"{m.FirstName} {m.LastName}",
                Address = FormatAddress(m.Address),
                Phone = m.PhoneNumber ?? string.Empty,
                Email = m.EmailAddress ?? string.Empty
            }).ToList();

            exportData.Add(new DistrictExportDto
            {
                DistrictName = $"District {district.Name}",
                DeaconName = $"{district.Deacon!.FirstName} {district.Deacon.LastName}",
                DistrictOfficerName = district.DistrictOfficer != null 
                    ? $"{district.DistrictOfficer.FirstName} {district.DistrictOfficer.LastName}" 
                    : "Not assigned",
                Members = memberDtos
            });
        }

        return exportData;
    }

    /// <summary>
    /// Format address into a single line
    /// </summary>
    private static string FormatAddress(Database.Entities.Address? address)
    {
        if (address == null)
        {
            return string.Empty;
        }

        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(address.NameNumber))
            parts.Add(address.NameNumber);

        if (!string.IsNullOrWhiteSpace(address.AddressLineOne))
            parts.Add(address.AddressLineOne);

        if (!string.IsNullOrWhiteSpace(address.AddressLineTwo))
            parts.Add(address.AddressLineTwo);

        if (!string.IsNullOrWhiteSpace(address.Town))
            parts.Add(address.Town);

        if (!string.IsNullOrWhiteSpace(address.County))
            parts.Add(address.County);

        if (!string.IsNullOrWhiteSpace(address.Postcode))
            parts.Add(address.Postcode);

        return string.Join(", ", parts);
    }
}

