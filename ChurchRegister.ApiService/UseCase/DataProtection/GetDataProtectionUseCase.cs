using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.DataProtection;
using ChurchRegister.ApiService.Services.DataProtection;

namespace ChurchRegister.ApiService.UseCase.DataProtection;

/// <summary>
/// Use case for retrieving data protection consent information
/// </summary>
public class GetDataProtectionUseCase : IGetDataProtectionUseCase
{
    private readonly IDataProtectionService _dataProtectionService;
    private readonly ILogger<GetDataProtectionUseCase> _logger;

    public GetDataProtectionUseCase(
        IDataProtectionService dataProtectionService,
        ILogger<GetDataProtectionUseCase> logger)
    {
        _dataProtectionService = dataProtectionService;
        _logger = logger;
    }

    public async Task<DataProtectionDto?> ExecuteAsync(
        int memberId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting data protection consent for church member ID: {MemberId}", memberId);
        
        if (memberId <= 0)
            throw new ArgumentException("Valid member ID is required");

        try
        {
            var result = await _dataProtectionService.GetDataProtectionAsync(memberId);
            
            _logger.LogInformation("Successfully retrieved data protection consent for church member {MemberId}", memberId);
            
            return result;
        }
        catch (NotFoundException)
        {
            _logger.LogWarning("Data protection record not found for church member {MemberId}", memberId);
            return null;
        }
    }
}
