using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.ApiService.UseCase.Attendance.GetEvents;
using ChurchRegister.ApiService.UseCase.Attendance.CreateEvent;
using ChurchRegister.ApiService.UseCase.Attendance.UpdateEvent;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Endpoints.Attendance;

/// <summary>
/// Endpoint for retrieving all events
/// </summary>
public class GetEventsEndpoint : EndpointWithoutRequest<List<GetEventsResponse>>
{
    private readonly IGetEventsUseCase _useCase;

    public GetEventsEndpoint(IGetEventsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/events");
        Policies("Bearer"); // Require authentication
        Description(x => x
            .WithName("GetEvents")
            .WithSummary("Get all events")
            .WithDescription("Retrieves a list of all events including their status and settings")
            .WithTags("Events"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(ct);
        await SendAsync(result, cancellation: ct);
    }
}

/// <summary>
/// Endpoint for creating a new event
/// </summary>
public class CreateEventEndpoint : Endpoint<CreateEventRequest>
{
    private readonly ICreateEventUseCase _useCase;

    public CreateEventEndpoint(ICreateEventUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/events");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("CreateEvent")
            .WithSummary("Create a new event")
            .WithDescription("Creates a new event with specified properties")
            .WithTags("Events"));
    }

    public override async Task HandleAsync(CreateEventRequest req, CancellationToken ct)
    {
        try
        {
            var userId = User.Identity?.Name ?? "system";
            var eventId = await _useCase.ExecuteAsync(req, userId, ct);
            await SendCreatedAtAsync<GetEventsEndpoint>(
                routeValues: new { id = eventId },
                responseBody: null,
                generateAbsoluteUrl: true,
                cancellation: ct);
        }
        catch (ArgumentException ex)
        {
            await SendAsync(new { error = ex.Message }, statusCode: 400, cancellation: ct);
        }
    }
}

/// <summary>
/// Endpoint for updating an existing event
/// </summary>
public class UpdateEventEndpoint : Endpoint<UpdateEventRequest>
{
    private readonly IUpdateEventUseCase _useCase;

    public UpdateEventEndpoint(IUpdateEventUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/events/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("UpdateEvent")
            .WithSummary("Update an existing event")
            .WithDescription("Updates an event's properties")
            .WithTags("Events"));
    }

    public override async Task HandleAsync(UpdateEventRequest req, CancellationToken ct)
    {
        try
        {
            var userId = User.Identity?.Name ?? "system";
            await _useCase.ExecuteAsync(req, userId, ct);
            await SendNoContentAsync(ct);
        }
        catch (KeyNotFoundException)
        {
            await SendNotFoundAsync(ct);
        }
        catch (ArgumentException ex)
        {
            await SendAsync(new { error = ex.Message }, statusCode: 400, cancellation: ct);
        }
    }
}