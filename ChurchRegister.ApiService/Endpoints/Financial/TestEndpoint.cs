using FastEndpoints;
using ChurchRegister.Database.Constants;

namespace ChurchRegister.ApiService.Endpoints.Financial;

public class TestEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/api/financial/test");
        Policies("Bearer"); // Require authentication for test endpoint
        Description(x => x
            .WithName("TestFinancial")
            .WithSummary("Test financial endpoint")
            .WithDescription("Test endpoint for financial module - authenticated access only")
            .WithTags("Financial", "Testing"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await SendOkAsync(new { message = "Financial endpoints are working!" }, ct);
    }
}
