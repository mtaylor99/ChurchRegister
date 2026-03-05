using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember;

/// <summary>
/// Use case implementation for creating a new church member
/// Handles validation and orchestration of member creation
/// </summary>
public class CreateChurchMemberUseCase : ICreateChurchMemberUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<CreateChurchMemberUseCase> _logger;

    public CreateChurchMemberUseCase(
        IChurchMemberService churchMemberService,
        ILogger<CreateChurchMemberUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<CreateChurchMemberResponse> ExecuteAsync(
        CreateChurchMemberRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating church member: {FirstName} {LastName}",
                request.FirstName, request.LastName);

            // Validate input
            ValidateRequest(request, userId);

            // Execute business logic through service
            var result = await _churchMemberService.CreateChurchMemberAsync(request, userId, cancellationToken);

            _logger.LogInformation("Successfully created church member with ID: {MemberId}", result.Id);

            return result;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating church member");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating church member");
            throw;
        }
    }

    private void ValidateRequest(CreateChurchMemberRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("User ID is required");
        }

        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            throw new ArgumentException("First name is required");
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new ArgumentException("Last name is required");
        }

        if (request.StatusId <= 0)
        {
            throw new ArgumentException("Valid status ID is required");
        }
    }
}
