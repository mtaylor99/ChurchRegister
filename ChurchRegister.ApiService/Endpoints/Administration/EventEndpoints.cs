using ChurchRegister.ApiService.Models.Administration;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving all events
/// </summary>
public class GetEventsEndpoint : EndpointWithoutRequest<List<GetEventsResponse>>
{
    private readonly ChurchRegisterWebContext _context;

    public GetEventsEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Get("/api/events");
        Policies("Bearer"); // Require authentication
        Description(x => x
            .WithName("GetEvents")
            .WithSummary("Get all events")
            .WithDescription("Retrieves a list of all events including their status and settings")
            .WithTags("Events", "Administration"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var events = await _context.Events
            .Select(e => new GetEventsResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                IsActive = e.IsActive,
                ShowInAnalysis = e.ShowInAnalysis,
                CreatedAt = e.CreatedDateTime,
                CreatedBy = e.CreatedBy,
                LastModifiedAt = e.ModifiedDateTime,
                LastModifiedBy = e.ModifiedBy
            })
            .ToListAsync(ct);

        await SendAsync(events, cancellation: ct);
    }
}

/// <summary>
/// Endpoint for creating a new event
/// </summary>
public class CreateEventEndpoint : Endpoint<CreateEventRequest>
{
    private readonly ChurchRegisterWebContext _context;

    public CreateEventEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Post("/api/events");
        // Allow either EventManagement.Create permission OR SystemAdministration role
        Policies("EventCreatePolicy");
        Description(x => x
            .WithName("CreateEvent")
            .WithSummary("Create a new event")
            .WithDescription("Creates a new event with specified properties")
            .WithTags("Events", "Administration"));
    }

    public override async Task HandleAsync(CreateEventRequest req, CancellationToken ct)
    {
        var newEvent = new Events
        {
            Name = req.Name,
            Description = req.Description,
            IsActive = req.IsActive,
            ShowInAnalysis = req.ShowInAnalysis,
            CreatedDateTime = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name ?? "system"
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync(ct);

        await SendCreatedAtAsync<GetEventsEndpoint>(
            routeValues: new { id = newEvent.Id },
            responseBody: null,
            generateAbsoluteUrl: true,
            cancellation: ct);
    }
}

/// <summary>
/// Endpoint for updating an existing event
/// </summary>
public class UpdateEventEndpoint : Endpoint<UpdateEventRequest>
{
    private readonly ChurchRegisterWebContext _context;

    public UpdateEventEndpoint(ChurchRegisterWebContext context)
    {
        _context = context;
    }

    public override void Configure()
    {
        Put("/api/events/{Id}");
        // Allow either EventManagement.Update permission OR SystemAdministration role
        Policies("EventUpdatePolicy");
        Description(x => x
            .WithName("UpdateEvent")
            .WithSummary("Update an existing event")
            .WithDescription("Updates an event's properties")
            .WithTags("Events", "Administration"));
    }

    public override async Task HandleAsync(UpdateEventRequest req, CancellationToken ct)
    {
        var existingEvent = await _context.Events.FindAsync(new object[] { req.Id }, ct);
        
        if (existingEvent == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        existingEvent.Name = req.Name;
        existingEvent.Description = req.Description;
        existingEvent.IsActive = req.IsActive;
        existingEvent.ShowInAnalysis = req.ShowInAnalysis;
        existingEvent.ModifiedDateTime = DateTime.UtcNow;
        existingEvent.ModifiedBy = User.Identity?.Name ?? "system";

        await _context.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}