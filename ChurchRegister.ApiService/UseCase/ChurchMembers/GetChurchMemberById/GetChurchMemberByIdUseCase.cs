using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;

namespace ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMemberById;

public class GetChurchMemberByIdUseCase : IGetChurchMemberByIdUseCase
{
    private readonly IChurchMemberService _churchMemberService;
    private readonly ILogger<GetChurchMemberByIdUseCase> _logger;

    public GetChurchMemberByIdUseCase(
        IChurchMemberService churchMemberService,
        ILogger<GetChurchMemberByIdUseCase> logger)
    {
        _churchMemberService = churchMemberService;
        _logger = logger;
    }

    public async Task<ChurchMemberDetailDto?> ExecuteAsync(
        int memberId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting church member by ID: {MemberId}", memberId);

        if (memberId <= 0)
            throw new ArgumentException("Valid member ID is required");

        var result = await _churchMemberService.GetChurchMemberByIdAsync(memberId, cancellationToken);

        if (result == null)
            _logger.LogWarning("Church member {MemberId} not found", memberId);
        else
            _logger.LogInformation("Successfully retrieved church member {MemberId}", memberId);

        return result;
    }
}
