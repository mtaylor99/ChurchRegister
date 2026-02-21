using FastEndpoints;
using ChurchRegister.ApiService.Models.RiskAssessments;
using ChurchRegister.ApiService.Services.RiskAssessments;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.RiskAssessments;

/// <summary>
/// Request model for updating a category including the ID from route
/// </summary>
public class UpdateRiskAssessmentCategoryEndpointRequest : UpdateCategoryRequest
{
    public int Id { get; set; }
}

/// <summary>
/// Endpoint for updating a risk assessment category
/// </summary>
public class UpdateRiskAssessmentCategoryEndpoint : Endpoint<UpdateRiskAssessmentCategoryEndpointRequest, RiskAssessmentCategoryDto>
{
    private readonly IRiskAssessmentCategoryService _service;

    public UpdateRiskAssessmentCategoryEndpoint(IRiskAssessmentCategoryService service)
    {
        _service = service;
    }

    public override void Configure()
    {
        Put("/api/risk-assessment-categories/{id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RiskAssessmentsAdmin);
        Description(x => x
            .WithName("UpdateRiskAssessmentCategory")
            .WithSummary("Update a risk assessment category")
            .WithDescription("Updates a risk assessment category's name and description")
            .WithTags("RiskAssessments"));
    }

    public override async Task HandleAsync(UpdateRiskAssessmentCategoryEndpointRequest req, CancellationToken ct)
    {
        var modifiedBy = User.Identity?.Name ?? "System";
        var request = new UpdateCategoryRequest
        {
            Name = req.Name,
            Description = req.Description
        };
        var result = await _service.UpdateCategoryAsync(req.Id, request, modifiedBy);
        
        if (result == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }
        
        await SendOkAsync(result, ct);
    }
}
