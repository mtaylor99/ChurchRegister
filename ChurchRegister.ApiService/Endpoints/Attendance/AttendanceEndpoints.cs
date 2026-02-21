using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.UseCase.Attendance.GetAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.CreateAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.UpdateAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.DeleteAttendance;
using ChurchRegister.ApiService.UseCase.Attendance.GetAttendanceAnalytics;
using ChurchRegister.Database.Constants;
using FastEndpoints;

namespace ChurchRegister.ApiService.Endpoints.Attendance;

/// <summary>
/// Endpoint for retrieving all event attendance records
/// </summary>
public class GetAttendanceEndpoint : EndpointWithoutRequest<List<GetAttendanceResponse>>
{
    private readonly IGetAttendanceUseCase _useCase;

    public GetAttendanceEndpoint(IGetAttendanceUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/attendance");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceViewer, SystemRoles.AttendanceContributor, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("GetAttendance")
            .WithSummary("Get all attendance records")
            .WithDescription("Retrieves all event attendance records sorted by date and event name")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(ct);
        await SendAsync(result, cancellation: ct);
    }
}

/// <summary>
/// Endpoint for creating a new attendance record
/// </summary>
public class CreateAttendanceEndpoint : Endpoint<CreateAttendanceRequest>
{
    private readonly ICreateAttendanceUseCase _useCase;

    public CreateAttendanceEndpoint(ICreateAttendanceUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/attendance");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceContributor, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("CreateAttendance")
            .WithSummary("Create a new attendance record")
            .WithDescription("Records attendance for a specific event and date")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(CreateAttendanceRequest req, CancellationToken ct)
    {
        try
        {
            var createdBy = User.Identity?.Name ?? "system";
            await _useCase.ExecuteAsync(req, createdBy, ct);
            
            await SendCreatedAtAsync<GetAttendanceEndpoint>(
                routeValues: null,
                responseBody: null,
                generateAbsoluteUrl: true,
                cancellation: ct);
        }
        catch (InvalidOperationException ex)
        {
            ThrowError(ex.Message);
        }
        catch (ArgumentException ex)
        {
            ThrowError(ex.Message);
        }
    }
}

/// <summary>
/// Endpoint for updating an existing attendance record
/// </summary>
public class UpdateAttendanceEndpoint : Endpoint<UpdateAttendanceRequest>
{
    private readonly IUpdateAttendanceUseCase _useCase;

    public UpdateAttendanceEndpoint(IUpdateAttendanceUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Put("/api/attendance/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceContributor, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("UpdateAttendance")
            .WithSummary("Update an existing attendance record")
            .WithDescription("Updates the attendance record for a specific event and date")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(UpdateAttendanceRequest req, CancellationToken ct)
    {
        try
        {
            var modifiedBy = User.Identity?.Name ?? "system";
            await _useCase.ExecuteAsync(req, modifiedBy, ct);
            await SendNoContentAsync(ct);
        }
        catch (KeyNotFoundException)
        {
            await SendNotFoundAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            ThrowError(ex.Message);
        }
        catch (ArgumentException ex)
        {
            ThrowError(ex.Message);
        }
    }
}

/// <summary>
/// Endpoint for deleting an attendance record
/// </summary>
public class DeleteAttendanceEndpoint : Endpoint<DeleteAttendanceRequest>
{
    private readonly IDeleteAttendanceUseCase _useCase;

    public DeleteAttendanceEndpoint(IDeleteAttendanceUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Delete("/api/attendance/{Id}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("DeleteAttendance")
            .WithSummary("Delete an attendance record")
            .WithDescription("Removes an attendance record from the system")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(DeleteAttendanceRequest req, CancellationToken ct)
    {
        try
        {
            await _useCase.ExecuteAsync(req.Id, ct);
            await SendNoContentAsync(ct);
        }
        catch (KeyNotFoundException)
        {
            await SendNotFoundAsync(ct);
        }
    }
}

/// <summary>
/// Endpoint for retrieving attendance analytics for a specific event
/// </summary>
public class GetAttendanceAnalyticsEndpoint : Endpoint<GetAttendanceAnalyticsRequest, AttendanceAnalyticsResponse>
{
    private readonly IGetAttendanceAnalyticsUseCase _useCase;

    public GetAttendanceAnalyticsEndpoint(IGetAttendanceAnalyticsUseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Get("/api/attendance/analytics/{EventId}");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.AttendanceViewer, SystemRoles.AttendanceContributor, SystemRoles.AttendanceAdministrator);
        Description(x => x
            .WithName("GetAttendanceAnalytics")
            .WithSummary("Get attendance analytics for an event")
            .WithDescription("Retrieves attendance data and statistics for the past 12 months for a specific event")
            .WithTags("Attendance"));
    }

    public override async Task HandleAsync(GetAttendanceAnalyticsRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _useCase.ExecuteAsync(req, ct);
            await SendOkAsync(result, ct);
        }
        catch (KeyNotFoundException)
        {
            await SendNotFoundAsync(ct);
        }
    }
}

// Additional request models for endpoints
public record DeleteAttendanceRequest
{
    public int Id { get; init; }
}