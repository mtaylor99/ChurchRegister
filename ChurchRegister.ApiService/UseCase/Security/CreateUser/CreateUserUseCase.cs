using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Services.Security;

namespace ChurchRegister.ApiService.UseCase.Security.CreateUser;

public class CreateUserUseCase : ICreateUserUseCase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<CreateUserUseCase> _logger;

    public CreateUserUseCase(
        IUserManagementService userManagementService,
        ILogger<CreateUserUseCase> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    public async Task<CreateUserResponse> ExecuteAsync(
        CreateUserRequest request,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating user: {Email}", request.Email);
        
        ValidateRequest(request, createdBy);
        var result = await _userManagementService.CreateUserAsync(request, createdBy, cancellationToken);
        
        _logger.LogInformation("Successfully created user with ID: {UserId}", result.UserId);
        return result;
    }

    private void ValidateRequest(CreateUserRequest request, string createdBy)
    {
        if (string.IsNullOrWhiteSpace(createdBy))
            throw new UnauthorizedAccessException("Creator ID is required");
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required");
        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required");
        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required");
    }
}
