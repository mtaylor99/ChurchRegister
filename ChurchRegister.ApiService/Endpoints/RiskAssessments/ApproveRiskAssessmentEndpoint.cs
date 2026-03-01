using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.UseCase.RiskAssessments.ApproveRiskAssessment;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for approving a risk assessment including the ID from route
/// </summary>
public class ApproveRiskAssessmentEndpointRequest : ApproveRiskAssessmentRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for approving a risk assessment
/// </summary>
public class ApproveRiskAssessmentEndpoint : Endpoint<ApproveRiskAssessmentEndpointRequest, ApproveRiskAssessmentResponse>
{
    private readonly IApproveRiskAssessmentUseCase _useCase;

    public ApproveRiskAssessmentEndpoint(IApproveRiskAssessmentUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/risk-assessments/{id}/approve");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.Deacon);
        Description(x => x
            .WithName("ApproveRiskAssessment")
            .WithSummary("Approve a risk assessment")
            .WithDescription("Records approvals from selected deacons who approved in a meeting. When minimum approvals are met, automatically activates the assessment.")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(ApproveRiskAssessmentEndpointRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var request = new ApproveRiskAssessmentRequest
        {
            DeaconMemberIds = req.DeaconMemberIds,
            Notes = req.Notes
        };
        var result = await _useCase.ExecuteAsync(req.Id, request, userId);

        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(result, ct);
    }
}
