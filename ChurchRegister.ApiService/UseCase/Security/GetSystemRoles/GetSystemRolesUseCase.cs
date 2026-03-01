using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.GetSystemRoles;

public class GetSystemRolesUseCase : IGetSystemRolesUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<GetSystemRolesUseCase> _logger;

    public GetSystemRolesUseCase(
        IUserManagementService userManagementService,
        ILogger<GetSystemRolesUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<IEnumerable<SystemRoleDto>> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting system roles");

        var result = await _userManagementService.GetSystemRolesAsync(cancellationToken);

        _logger.LogInformation("Retrieved {Count} system roles", result.Count());
        return result;
    }
}
