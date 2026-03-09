using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Services.DataProtection;

/// <summary>
/// Service implementation for data protection consent management operations
/// </summary>
public class DataProtectionService : IDataProtectionService
{
    private readonly ChurchRegisterWebContext _context;

    public DataProtectionService(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<DataProtectionDto> GetDataProtectionAsync(int churchMemberId)
    {
        var dataProtection = await _context.ChurchMemberDataProtection
            .FirstOrDefaultAsync(dp => dp.ChurchMemberId == churchMemberId);

        if (dataProtection == null)
        {
            throw new NotFoundException($"Data protection record not found for church member ID {churchMemberId}");
        }

        return MapToDto(dataProtection);
    }

    /// <inheritdoc />
    public async Task<DataProtectionDto> UpdateDataProtectionAsync(
        int churchMemberId,
        UpdateDataProtectionRequest request,
        string modifiedBy)
    {
        var dataProtection = await _context.ChurchMemberDataProtection
            .FirstOrDefaultAsync(dp => dp.ChurchMemberId == churchMemberId);

        if (dataProtection == null)
        {
            throw new NotFoundException($"Data protection record not found for church member ID {churchMemberId}");
        }

        // Update all 6 permission fields
        dataProtection.AllowNameInCommunications = request.AllowNameInCommunications;
        dataProtection.AllowHealthStatusInCommunications = request.AllowHealthStatusInCommunications;
        dataProtection.AllowPhotoInCommunications = request.AllowPhotoInCommunications;
        dataProtection.AllowPhotoInSocialMedia = request.AllowPhotoInSocialMedia;
        dataProtection.GroupPhotos = request.GroupPhotos;
        dataProtection.PermissionForMyChildren = request.PermissionForMyChildren;

        // Update audit fields
        dataProtection.ModifiedBy = modifiedBy;
        dataProtection.ModifiedDateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(dataProtection);
    }

    /// <summary>
    /// Calculate the overall consent status based on permission values
    /// </summary>
    /// <param name="dataProtection">Data protection entity</param>
    /// <returns>Status string: 'all_granted', 'all_denied', or 'partial'</returns>
    private static string CalculateStatus(ChurchMemberDataProtection dataProtection)
    {
        var permissions = new[]
        {
            dataProtection.AllowNameInCommunications,
            dataProtection.AllowHealthStatusInCommunications,
            dataProtection.AllowPhotoInCommunications,
            dataProtection.AllowPhotoInSocialMedia,
            dataProtection.GroupPhotos,
            dataProtection.PermissionForMyChildren
        };

        var trueCount = permissions.Count(p => p);

        return trueCount switch
        {
            6 => "all_granted",
            0 => "all_denied",
            _ => "partial"
        };
    }

    /// <summary>
    /// Map entity to DTO
    /// </summary>
    private static DataProtectionDto MapToDto(ChurchMemberDataProtection entity)
    {
        return new DataProtectionDto
        {
            Id = entity.Id,
            ChurchMemberId = entity.ChurchMemberId,
            AllowNameInCommunications = entity.AllowNameInCommunications,
            AllowHealthStatusInCommunications = entity.AllowHealthStatusInCommunications,
            AllowPhotoInCommunications = entity.AllowPhotoInCommunications,
            AllowPhotoInSocialMedia = entity.AllowPhotoInSocialMedia,
            GroupPhotos = entity.GroupPhotos,
            PermissionForMyChildren = entity.PermissionForMyChildren,
            ModifiedBy = entity.ModifiedBy,
            ModifiedDateTime = entity.ModifiedDateTime
        };
    }

    /// <summary>
    /// Map entity to summary DTO with calculated status
    /// </summary>
    public static DataProtectionSummaryDto? MapToSummaryDto(ChurchMemberDataProtection? entity)
    {
        if (entity == null)
        {
            return null;
        }

        return new DataProtectionSummaryDto
        {
            Status = CalculateStatus(entity),
            AllowNameInCommunications = entity.AllowNameInCommunications,
            AllowHealthStatusInCommunications = entity.AllowHealthStatusInCommunications,
            AllowPhotoInCommunications = entity.AllowPhotoInCommunications,
            AllowPhotoInSocialMedia = entity.AllowPhotoInSocialMedia,
            GroupPhotos = entity.GroupPhotos,
            PermissionForMyChildren = entity.PermissionForMyChildren,
            ModifiedBy = entity.ModifiedBy,
            ModifiedDateTime = entity.ModifiedDateTime
        };
    }
}
