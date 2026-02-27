using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.DeleteChurchMember;

public class DeleteChurchMemberUseCase : IDeleteChurchMemberUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<DeleteChurchMemberUseCase> _logger;

    public DeleteChurchMemberUseCase(
        IChurchMemberService churchMemberService,
        ILogger<DeleteChurchMemberUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task ExecuteAsync(
        int memberId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting church member {MemberId}", memberId);
        
        ValidateRequest(memberId);
        await _churchMemberService.DeleteChurchMemberAsync(memberId, cancellationToken);
        
        _logger.LogInformation("Successfully deleted church member {MemberId}", memberId);
    }

    private void ValidateRequest(int memberId)
    {
        if (memberId <= 0)
            throw new ArgumentException("Valid member ID is required");
    }
}
