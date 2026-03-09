using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.GetUsers;

public class GetUsersUseCase : IGetUsersUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<GetUsersUseCase> _logger;

    public GetUsersUseCase(
        IUserManagementService userManagementService,
        ILogger<GetUsersUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<PagedResult<UserProfileDto>> ExecuteAsync(
        UserGridQuery request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting users - Page: {Page}, PageSize: {PageSize}",
            request.Page, request.PageSize);

        var result = await _userManagementService.GetUsersAsync(request, cancellationToken);

        _logger.LogInformation("Retrieved {Count} users out of {Total}",
            result.Items.Count(), result.TotalCount);
        return result;
    }
}
