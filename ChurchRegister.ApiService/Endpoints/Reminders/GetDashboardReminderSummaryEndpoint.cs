using ChurchRegister.ApiService.Models.Reminders;
using ChurchRegister.ApiService.UseCase.Reminders.GetDashboardReminderSummary;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Reminders;

public class GetDashboardReminderSummaryEndpoint : EndpointWithoutRequest<DashboardReminderSummaryDto>
{
    private readonly IGetDashboardReminderSummaryUseCase _useCase;
    private readonly ILogger<GetDashboardReminderSummaryEndpoint> _logger;

    public GetDashboardReminderSummaryEndpoint(IGetDashboardReminderSummaryUseCase useCase, ILogger<GetDashboardReminderSummaryEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/reminders/dashboard-summary");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.RemindersViewer, SystemRoles.RemindersContributor, SystemRoles.RemindersAdministrator);
        Description(b => b
            .WithName("GetDashboardReminderSummary")
            .WithSummary("Get dashboard reminder summary")
            .WithDescription("Returns count of pending reminders due within 30 days for the dashboard widget.")
            .WithTags("Reminders"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        _logger.LogInformation("GetDashboardReminderSummary endpoint called");
        var summary = await _useCase.ExecuteAsync();
        _logger.LogInformation("Returning dashboard summary with UpcomingCount={Count}", summary.UpcomingCount);
        await SendOkAsync(summary, ct);
    }
}
