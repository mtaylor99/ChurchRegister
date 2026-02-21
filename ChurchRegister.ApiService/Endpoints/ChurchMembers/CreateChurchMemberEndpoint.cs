using FastEndpoints;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.UseCase.ChurchMembers.CreateChurchMember;
using ChurchRegister.Database.Constants;
using System.Security.Claims;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for creating a new church member
/// </summary>
public class CreateChurchMemberEndpoint : Endpoint<CreateChurchMemberRequest, CreateChurchMemberResponse>
{
    private readonly ICreateChurchMemberUseCase _useCase;

    public CreateChurchMemberEndpoint(ICreateChurchMemberUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/church-members");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersContributor, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("CreateChurchMember")
            .WithSummary("Create a new church member")
            .WithDescription("Creates a new church member with the provided information")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CreateChurchMemberRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var result = await _useCase.ExecuteAsync(req, userId, ct);
        await SendCreatedAtAsync<GetChurchMemberByIdEndpoint>(
            new { id = result.Id },
            result,
            generateAbsoluteUrl: false,
            cancellation: ct);
    }
}

/// <summary>
/// Response for next available member number
/// </summary>
public class NextAvailableMemberNumberResponse
{
    public int NextNumber { get; set; }
    public int Year { get; set; }
}

/// <summary>
/// Endpoint for getting the next available member number for the current year
/// </summary>
public class GetNextAvailableMemberNumberEndpoint : EndpointWithoutRequest<NextAvailableMemberNumberResponse>
{
    private readonly IRegisterNumberService _registerNumberService;

    public GetNextAvailableMemberNumberEndpoint(IRegisterNumberService registerNumberService)
    {
        _registerNumberService = registerNumberService;
    }

    public override void Configure()
    {
        Get("/api/administration/church-members/next-member-number");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, 
              SystemRoles.ChurchMembersAdministrator, 
              SystemRoles.ChurchMembersContributor);
        Description(x => x
            .WithName("GetNextAvailableMemberNumber")
            .WithSummary("Get next available member number")
            .WithDescription("Returns the next available member number for the current year")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentYear = DateTime.UtcNow.Year;
        var nextNumber = await _registerNumberService.GetNextAvailableNumberAsync(currentYear, ct);
        
        await SendOkAsync(new NextAvailableMemberNumberResponse
        {
            NextNumber = nextNumber,
            Year = currentYear
        }, ct);
    }
}
