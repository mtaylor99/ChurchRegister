using FastEndpoints;
using ChurchRegister.ApiService.UseCase.Security.ResendInvitation;

namespace ChurchRegister.ApiService.Endpoints.Security;

/// <summary>
/// Response for resend invitation operation
/// </summary>
public class ResendInvitationResponse
{
    public string Message { get; set; } = string.Empty;
    public bool EmailSent { get; set; }
}

/// <summary>
/// Request for resend invitation (uses userId from route)
/// </summary>
public class ResendInvitationRequest
{
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// Endpoint for resending invitation emails to users
/// </summary>
public class ResendInvitationEndpoint : Endpoint<ResendInvitationRequest, ResendInvitationResponse>
{
    private readonly IResendInvitationUseCase _useCase;

    public ResendInvitationEndpoint(IResendInvitationUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/administration/users/{userId}/resend-invitation");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("ResendInvitation")
            .WithSummary("Resend invitation email to a user")
            .WithDescription("Sends a new invitation email with setup link to the specified user")
            .WithTags("Security"));
    }

    public override async Task HandleAsync(ResendInvitationRequest req, CancellationToken ct)
    {
        var emailSent = await _useCase.ExecuteAsync(req.UserId, ct);

        var response = new ResendInvitationResponse
        {
            Message = emailSent
                ? "Invitation email sent successfully"
                : "Invitation processed but email may not have been sent",
            EmailSent = emailSent
        };

        await SendOkAsync(response, ct);
    }
}
