using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.ApiService.Services;
using ChurchRegister.Database.Constants;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for creating a new church member
/// </summary>
public class CreateChurchMemberEndpoint : Endpoint<CreateChurchMemberRequest, CreateChurchMemberResponse>
{
    private readonly IChurchMemberService _churchMemberService;

    public CreateChurchMemberEndpoint(IChurchMemberService churchMemberService)
    {
        _churchMemberService = churchMemberService;
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
            .WithTags("Church Members"));
    }

    public override async Task HandleAsync(CreateChurchMemberRequest req, CancellationToken ct)
    {
        try
        {
            // Get the current user ID for audit
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId))
            {
                await SendUnauthorizedAsync(ct);
                return;
            }

            var result = await _churchMemberService.CreateChurchMemberAsync(req, userId, ct);
            await SendCreatedAtAsync<GetChurchMemberByIdEndpoint>(
                new { id = result.Id },
                result,
                generateAbsoluteUrl: false,
                cancellation: ct);
        }
        catch (InvalidOperationException ex)
        {
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Error creating church member: {ex.Message}");
        }
    }
}

/// <summary>
/// Endpoint for generating annual register numbers for active church members
/// </summary>
public class GenerateRegisterNumbersEndpoint : Endpoint<GenerateRegisterNumbersRequest, GenerateRegisterNumbersResponse>
{
    private readonly IRegisterNumberService _registerNumberService;
    private readonly ILogger<GenerateRegisterNumbersEndpoint> _logger;

    public GenerateRegisterNumbersEndpoint(
        IRegisterNumberService registerNumberService,
        ILogger<GenerateRegisterNumbersEndpoint> logger)
    {
        _registerNumberService = registerNumberService;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/administration/church-members/generate-register-numbers");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("GenerateRegisterNumbers")
            .WithSummary("Generate annual register numbers for active members")
            .WithDescription("Generates or previews sequential register numbers (1, 2, 3...) for active church members ordered by membership date")
            .WithTags("Administration", "Register Numbers"));
    }

    public override async Task HandleAsync(GenerateRegisterNumbersRequest req, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Generate register numbers endpoint called for year {Year}, confirm={Confirm}", 
                req.TargetYear, req.ConfirmGeneration);

            // Validate target year is current year or future
            var currentYear = DateTime.Now.Year;
            if (req.TargetYear < currentYear)
            {
                AddError($"Target year must be {currentYear} or later");
                await SendErrorsAsync(400, ct);
                return;
            }

            // Check if already generated
            var alreadyGenerated = await _registerNumberService.HasBeenGeneratedForYearAsync(req.TargetYear, ct);
            if (alreadyGenerated)
            {
                AddError($"Register numbers for year {req.TargetYear} have already been generated");
                await SendErrorsAsync(409, ct);
                return;
            }

            // If not confirming, return preview
            if (!req.ConfirmGeneration)
            {
                var preview = await _registerNumberService.PreviewForYearAsync(req.TargetYear, ct);
                await SendOkAsync(new GenerateRegisterNumbersResponse
                {
                    Year = preview.Year,
                    TotalMembersAssigned = preview.TotalActiveMembers,
                    GeneratedDateTime = preview.PreviewGenerated,
                    GeneratedBy = "Preview",
                    Preview = preview.Assignments.Take(10).ToList()
                }, ct);
                return;
            }

            // Generate register numbers
            var result = await _registerNumberService.GenerateForYearAsync(req.TargetYear, ct);
            
            _logger.LogInformation("Successfully generated {Count} register numbers for year {Year}", 
                result.TotalMembersAssigned, result.Year);

            await SendOkAsync(result, ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation generating register numbers");
            AddError(ex.Message);
            await SendErrorsAsync(400, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating register numbers");
            ThrowError($"Error generating register numbers: {ex.Message}");
        }
    }
}

/// <summary>
/// Endpoint for previewing register numbers for a specific year
/// </summary>
public class PreviewRegisterNumbersEndpoint : EndpointWithoutRequest<PreviewRegisterNumbersResponse>
{
    private readonly IRegisterNumberService _registerNumberService;
    private readonly ILogger<PreviewRegisterNumbersEndpoint> _logger;

    public PreviewRegisterNumbersEndpoint(
        IRegisterNumberService registerNumberService,
        ILogger<PreviewRegisterNumbersEndpoint> logger)
    {
        _registerNumberService = registerNumberService;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/administration/church-members/register-numbers/preview/{year}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator);
        Description(x => x
            .WithName("PreviewRegisterNumbers")
            .WithSummary("Preview register number assignments for a year")
            .WithDescription("Returns a preview of what register numbers would be assigned without actually generating them")
            .WithTags("Administration", "Register Numbers"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var year = Route<int>("year");
            
            _logger.LogInformation("Preview register numbers endpoint called for year {Year}", year);

            // Validate year is current year or future
            var currentYear = DateTime.Now.Year;
            if (year < currentYear)
            {
                AddError($"Year must be {currentYear} or later");
                await SendErrorsAsync(400, ct);
                return;
            }

            var result = await _registerNumberService.PreviewForYearAsync(year, ct);
            await SendOkAsync(result, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing register numbers");
            ThrowError($"Error previewing register numbers: {ex.Message}");
        }
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
            .WithTags("Administration", "Church Members"));
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
