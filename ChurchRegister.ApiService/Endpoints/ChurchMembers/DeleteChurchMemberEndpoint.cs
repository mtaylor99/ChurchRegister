using FastEndpoints;
using ChurchRegister.ApiService.UseCase.ChurchMembers.DeleteChurchMember;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.ChurchMembers;

/// <summary>
/// Endpoint for deleting a church member (hard delete - for members entered in error)
/// </summary>
public class DeleteChurchMemberEndpoint : EndpointWithoutRequest
{
    private readonly IDeleteChurchMemberUseCase _useCase;

    public DeleteChurchMemberEndpoint(IDeleteChurchMemberUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/church-members/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.ChurchMembersAdministrator);
        Description(x => x
            .WithName("DeleteChurchMember")
            .WithSummary("Delete a church member (permanent deletion)")
            .WithDescription("Permanently deletes a church member and all related data. This is intended for members entered in error.")
            .WithTags("ChurchMembers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        
        await _useCase.ExecuteAsync(id, ct);
        await SendNoContentAsync(ct);
    }
}
