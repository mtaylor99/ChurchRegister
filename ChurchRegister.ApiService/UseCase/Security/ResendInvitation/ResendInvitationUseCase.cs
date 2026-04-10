using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.ResendInvitation;

public class ResendInvitationUseCase : IResendInvitationUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<ResendInvitationUseCase> _logger;

    public ResendInvitationUseCase(
        IUserManagementService userManagementService,
        ILogger<ResendInvitationUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<bool> ExecuteAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Resending invitation for user {UserId}", userId);

        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("User ID is required");

        var result = await _userManagementService.ResendInvitationAsync(userId, cancellationToken);

        _logger.LogInformation("Invitation resend {Status} for user {UserId}",
            result ? "successful" : "failed", userId);
        return result;
    }
}
