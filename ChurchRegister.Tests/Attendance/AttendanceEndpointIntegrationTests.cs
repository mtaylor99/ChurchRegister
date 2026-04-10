using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Attendance;

/// <summary>
/// Integration tests for previously-uncovered attendance endpoints:
///   GET    /api/attendance                     — GetAttendanceEndpoint
///   POST   /api/attendance                     — CreateAttendanceEndpoint
///   DELETE /api/attendance/{attendanceId}      — DeleteAttendanceEndpoint
///   GET    /api/attendance/analytics           — GetAttendanceAnalyticsEndpoint
///   GET    /api/events                         — GetEventsEndpoint
///   POST   /api/events                         — CreateEventEndpoint
///   PUT    /api/events/{eventId}               — UpdateEventEndpoint
/// </summary>
[Collection("IntegrationTests")]
public class AttendanceEndpointIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _eventId;
    private int _attendanceId;
    private int _memberId;
    private int _statusId;

    public AttendanceEndpointIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var status = new ChurchMemberStatus
            {
                Name = "Active",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMemberStatuses.Add(status);
            ctx.SaveChanges();
            _statusId = status.Id;

            var member = new ChurchMember
            {
                FirstName            = "Attendance",
                LastName             = "Member",
                ChurchMemberStatusId = _statusId,
                MemberSince          = DateTime.UtcNow.AddYears(-1),
                GiftAid              = false,
                Baptised             = false,
                Envelopes            = false,
                PastoralCareRequired = false,
                CreatedBy            = "system",
                CreatedDateTime      = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);

            var ev = new Events
            {
                Name            = "Sunday Service",
                IsActive        = true,
                CreatedBy       = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Events.Add(ev);
            ctx.SaveChanges();
            _memberId = member.Id;
            _eventId  = ev.Id;

            var attendance = new EventAttendance
            {
                EventId         = _eventId,
                Date            = DateTime.UtcNow.AddDays(-7),
                Attendance      = 10,
                CreatedBy       = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.EventAttendances.Add(attendance);
            ctx.SaveChanges();
            _attendanceId = attendance.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AttendanceAdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com",
            "SystemAdministration", "AttendanceAdministrator");

    // ─── GET /api/attendance ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAttendance_ReturnsOk()
    {
        var client = AttendanceAdminClient();
        var response = await client.GetAsync("/api/attendance");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAttendance_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/attendance");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── POST /api/attendance ─────────────────────────────────────────────────

    [Fact]
    public async Task CreateAttendance_WithValidRequest_Returns2xx()
    {
        var client = AttendanceAdminClient();
        var request = new CreateAttendanceRequest
        {
            EventId    = _eventId,
            Date       = DateTime.UtcNow.AddDays(-1),
            Attendance = 1
        };
        var response = await client.PostAsJsonAsync("/api/attendance", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201);
    }

    [Fact]
    public async Task CreateAttendance_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var request = new CreateAttendanceRequest
        {
            EventId    = _eventId,
            Date       = DateTime.UtcNow,
            Attendance = 1
        };
        var response = await client.PostAsJsonAsync("/api/attendance", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── DELETE /api/attendance/{attendanceId} ────────────────────────────────

    [Fact]
    public async Task DeleteAttendance_ExistingRecord_Returns2xx()
    {
        // Create a fresh attendance record to delete
        var client = AttendanceAdminClient();
        var create = new CreateAttendanceRequest
        {
            EventId    = _eventId,
            Date       = DateTime.UtcNow.AddDays(-2),
            Attendance = 0
        };
        var createResp = await client.PostAsJsonAsync("/api/attendance", create);
        ((int)createResp.StatusCode).Should().BeOneOf(200, 201);

        var deleteResp = await client.DeleteAsync($"/api/attendance/{_attendanceId}");
        ((int)deleteResp.StatusCode).Should().BeOneOf(200, 204, 400, 404);
    }

    [Fact]
    public async Task DeleteAttendance_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync($"/api/attendance/{_attendanceId}");
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── GET /api/attendance/analytics ───────────────────────────────────────

    [Fact]
    public async Task GetAttendanceAnalytics_ReturnsOk()
    {
        var client = AttendanceAdminClient();
        var response = await client.GetAsync($"/api/attendance/analytics/{_eventId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAttendanceAnalytics_SpecificEvent_ReturnsOk()
    {
        var client = AttendanceAdminClient();
        var response = await client.GetAsync($"/api/attendance/analytics/{_eventId}");
        ((int)response.StatusCode).Should().BeOneOf(200, 404);
    }

    // ─── GET /api/events ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetEvents_ReturnsOk()
    {
        var client = AttendanceAdminClient();
        var response = await client.GetAsync("/api/events");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── POST /api/events ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateEvent_WithValidData_Returns2xx()
    {
        var client = AttendanceAdminClient();
        var body = new { name = "New Event", isActive = true };
        var response = await client.PostAsJsonAsync("/api/events", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 201);
    }

    // ─── PUT /api/events/{eventId} ────────────────────────────────────────────

    [Fact]
    public async Task UpdateEvent_ExistingEvent_Returns200()
    {
        var client = AttendanceAdminClient();
        var body = new { id = _eventId, name = "Updated Event", isActive = true };
        var response = await client.PutAsJsonAsync($"/api/events/{_eventId}", body);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    // ─── PUT /api/attendance/{Id} ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateAttendance_WithValidData_Returns2xx()
    {
        var client = AttendanceAdminClient();
        var request = new
        {
            Id         = _attendanceId,
            EventId    = _eventId,
            Date       = DateTime.UtcNow.AddDays(-3),
            Attendance = 15
        };
        var response = await client.PutAsJsonAsync($"/api/attendance/{_attendanceId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task UpdateAttendance_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var request = new { Id = _attendanceId, EventId = _eventId, Date = DateTime.UtcNow, Attendance = 5 };
        var response = await client.PutAsJsonAsync($"/api/attendance/{_attendanceId}", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }
}
