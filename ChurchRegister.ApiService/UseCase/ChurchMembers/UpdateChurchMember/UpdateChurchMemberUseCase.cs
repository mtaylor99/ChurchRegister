using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMember;

public class UpdateChurchMemberUseCase : IUpdateChurchMemberUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<UpdateChurchMemberUseCase> _logger;

    public UpdateChurchMemberUseCase(
        IChurchMemberService churchMemberService,
        ILogger<UpdateChurchMemberUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<ChurchMemberDetailDto> ExecuteAsync(
        UpdateChurchMemberRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating church member {MemberId}", request.Id);

        ValidateRequest(request, userId);
        var result = await _churchMemberService.UpdateChurchMemberAsync(request, userId, cancellationToken);

        _logger.LogInformation("Successfully updated church member {MemberId}", request.Id);
        return result;
    }

    private void ValidateRequest(UpdateChurchMemberRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User ID is required");
        if (request.Id <= 0)
            throw new ArgumentException("Valid member ID is required");
        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required");
        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required");
    }
}
