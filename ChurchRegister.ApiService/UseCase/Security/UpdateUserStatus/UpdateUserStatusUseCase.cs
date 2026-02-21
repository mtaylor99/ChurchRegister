using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.UpdateUserStatus;

public class UpdateUserStatusUseCase : IUpdateUserStatusUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<UpdateUserStatusUseCase> _logger;

    public UpdateUserStatusUseCase(
        IUserManagementService userManagementService,
        ILogger<UpdateUserStatusUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<UserProfileDto> ExecuteAsync(
        UpdateUserStatusRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating user status for {UserId} to {Action}", 
            request.UserId, request.Action);
        
        ValidateRequest(request, modifiedBy);
        var result = await _userManagementService.UpdateUserStatusAsync(request, modifiedBy, cancellationToken);
        
        _logger.LogInformation("Successfully updated status for user {UserId}", request.UserId);
        return result;
    }

    private void ValidateRequest(UpdateUserStatusRequest request, string modifiedBy)
    {
        if (string.IsNullOrWhiteSpace(modifiedBy))
            throw new UnauthorizedAccessException("Modifier ID is required");
        if (string.IsNullOrWhiteSpace(request.UserId))
            throw new ArgumentException("User ID is required");
    }
}
