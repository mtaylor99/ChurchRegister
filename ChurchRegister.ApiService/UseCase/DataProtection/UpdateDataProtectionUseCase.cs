using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.Services.DataProtection;

namespace ChurchRegister.ApiService.UseCase.DataProtection;

/// <summary>
/// Use case for updating data protection consent information
/// </summary>
public class UpdateDataProtectionUseCase : IUpdateDataProtectionUseCase
{
    private readonly IDataProtectionService _dataProtectionService;
    private readonly ILogger<UpdateDataProtectionUseCase> _logger;

    public UpdateDataProtectionUseCase(
        IDataProtectionService dataProtectionService,
        ILogger<UpdateDataProtectionUseCase> logger)
    {
        _dataProtectionService = dataProtectionService;
        _logger = logger;
    }

    public async Task<DataProtectionDto?> ExecuteAsync(
        int memberId,
        UpdateDataProtectionRequest request,
        string username,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Updating data protection consent for church member ID: {MemberId} by user: {Username}", 
            memberId, 
            username);
        
        if (memberId <= 0)
            throw new ArgumentException("Valid member ID is required");

        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username is required for audit trail");

        try
        {
            var result = await _dataProtectionService.UpdateDataProtectionAsync(
                memberId, 
                request, 
                username);
            
            _logger.LogInformation(
                "Successfully updated data protection consent for church member {MemberId}. " +
                "Consent changes - Name: {Name}, Health: {Health}, Photo Print: {PhotoPrint}, " +
                "Photo Social Media: {PhotoSocial}, Group Photos: {GroupPhotos}, Children: {Children}",
                memberId,
                request.AllowNameInCommunications,
                request.AllowHealthStatusInCommunications,
                request.AllowPhotoInCommunications,
                request.AllowPhotoInSocialMedia,
                request.GroupPhotos,
                request.PermissionForMyChildren);
            
            return result;
        }
        catch (NotFoundException)
        {
            _logger.LogWarning("Data protection record not found for church member {MemberId}", memberId);
            return null;
        }
    }
}
