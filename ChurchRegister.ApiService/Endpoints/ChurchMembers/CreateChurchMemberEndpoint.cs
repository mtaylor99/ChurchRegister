using FastEndpoints;
using ChurchRegister.ApiService.Exceptions;
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
            await Send.UnauthorizedAsync(ct);
            return;
        }

        try
        {
            var result = await _useCase.ExecuteAsync(req, userId, ct);
            await Send.CreatedAtAsync<GetChurchMemberByIdEndpoint>(
                new { id = result.Id },
                result,
                generateAbsoluteUrl: false,
                cancellation: ct);
        }
        catch (ConflictException ex)
        {
            // Bank reference capacity reached - return 409 with clear message
            ThrowError(ex.Message, 409);
        }
        catch (ChurchRegister.ApiService.Exceptions.ValidationException ex)
        {
            // Validation error - return 400
            ThrowError(ex.Message, 400);
        }
    }
}

/// <summary>
/// Request for getting the next available member number
/// </summary>
public class NextMemberNumberRequest
{
    /// <summary>
    /// Whether this is a Member (true) or Non-Member (false).
    /// Nullable so FastEndpoints can distinguish "not provided" from an explicit false.
    /// Defaults to true (Member) when not supplied.
    /// </summary>
    public bool? IsMember { get; set; }

    /// <summary>
    /// Whether to use the baptised member sequence (1–249) or non-baptised (250–499).
    /// Only relevant when IsMember is true.
    /// Nullable so FastEndpoints can distinguish "not provided" from an explicit false.
    /// Defaults to true (baptised) when not supplied.
    /// </summary>
    public bool? IsBaptised { get; set; }
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
public class GetNextAvailableMemberNumberEndpoint : Endpoint<NextMemberNumberRequest, NextAvailableMemberNumberResponse>
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

    public override async Task HandleAsync(NextMemberNumberRequest req, CancellationToken ct)
    {
        var currentYear = DateTime.UtcNow.Year;
        // Returns next available number based on member type and baptism status:
        // isMember=true,  isBaptised=true  → range 1 to NonBaptisedMemberStartNumber-1
        // isMember=true,  isBaptised=false → range NonBaptisedMemberStartNumber to NonMemberStartNumber-1
        // isMember=false                   → range NonMemberStartNumber and above
        var nextNumber = await _registerNumberService.GetNextAvailableNumberForRoleAsync(
            currentYear, isMember: req.IsMember ?? true, isBaptised: req.IsBaptised ?? true, ct);

        await Send.OkAsync(new NextAvailableMemberNumberResponse
        {
            NextNumber = nextNumber,
            Year = currentYear
        }, ct);
    }
}
