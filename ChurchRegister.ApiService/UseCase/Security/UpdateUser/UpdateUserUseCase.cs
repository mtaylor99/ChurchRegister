using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.UpdateUser;

public class UpdateUserUseCase : IUpdateUserUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<UpdateUserUseCase> _logger;

    public UpdateUserUseCase(
        IUserManagementService userManagementService,
        ILogger<UpdateUserUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<UserProfileDto> ExecuteAsync(
        UpdateUserRequest request,
        string modifiedBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating user {UserId}", request.UserId);
        
        ValidateRequest(request, modifiedBy);
        var result = await _userManagementService.UpdateUserAsync(request, modifiedBy, cancellationToken);
        
        _logger.LogInformation("Successfully updated user {UserId}", request.UserId);
        return result;
    }

    private void ValidateRequest(UpdateUserRequest request, string modifiedBy)
    {
        if (string.IsNullOrWhiteSpace(modifiedBy))
            throw new UnauthorizedAccessException("Modifier ID is required");
        if (string.IsNullOrWhiteSpace(request.UserId))
            throw new ArgumentException("User ID is required");
        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required");
        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required");
    }
}
