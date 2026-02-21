using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.UpdateChurchMemberStatus;

public class UpdateChurchMemberStatusUseCase : IUpdateChurchMemberStatusUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<UpdateChurchMemberStatusUseCase> _logger;

    public UpdateChurchMemberStatusUseCase(
        IChurchMemberService churchMemberService,
        ILogger<UpdateChurchMemberStatusUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<ChurchMemberDetailDto> ExecuteAsync(
        int memberId,
        UpdateChurchMemberStatusRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating status for church member {MemberId}", memberId);
        
        ValidateRequest(memberId, request, userId);
        var result = await _churchMemberService.UpdateChurchMemberStatusAsync(memberId, request, userId, cancellationToken);
        
        _logger.LogInformation("Successfully updated status for church member {MemberId}", memberId);
        return result;
    }

    private void ValidateRequest(int memberId, UpdateChurchMemberStatusRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User ID is required");
        if (memberId <= 0)
            throw new ArgumentException("Valid member ID is required");
        if (request.StatusId <= 0)
            throw new ArgumentException("Valid status ID is required");
    }
}
