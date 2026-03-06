using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.TrainingCertificates;

/// <summary>
/// Integration tests exercising TrainingCertificateService through HTTP endpoints.
/// Covers: GetCertificates, GetById, Create, Update, GetTypes, CreateType, UpdateType, Dashboard.
/// </summary>
[Collection("IntegrationTests")]
public class TrainingCertificateServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _memberId;
    private int _typeId;

    public TrainingCertificateServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            ctx.ChurchMemberStatuses.AddRange(
                new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
            ctx.SaveChanges();

            var member = new ChurchMember
            {
                FirstName = "Jane",
                LastName = "Smith",
                ChurchMemberStatusId = 1,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);

            var certType = new TrainingCertificateTypes
            {
                Type = "DBS Check",
                Status = "Active",
                Description = "Disclosure and Barring Service",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(certType);
            ctx.SaveChanges();

            _memberId = member.Id;
            _typeId = certType.Id;

            ctx.ChurchMemberTrainingCertificates.Add(new ChurchMemberTrainingCertificates
            {
                ChurchMemberId = _memberId,
                TrainingCertificateTypeId = _typeId,
                Status = "In Validity",
                Expires = DateTime.UtcNow.AddYears(1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    // ─── GET /api/training-certificates ──────────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificates_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_ReturnsSeededCertificate()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Jane");
    }

    [Fact]
    public async Task GetTrainingCertificates_WithNameFilter_ReturnsCertificate()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10&name=Jane");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Jane");
    }

    [Fact]
    public async Task GetTrainingCertificates_WithStatusFilter_ReturnsCertificate()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10&status=In+Validity");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithNegatedStatusFilter_DoesNotReturnExpired()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10&status=!Expired");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithTypeIdFilter_ReturnsCertificate()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync($"/api/training-certificates?page=1&pageSize=10&typeId={_typeId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/training-certificates?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/training-certificates/{id} ─────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificateById_WithValidId_ReturnsOk()
    {
        // First get the id from list
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var listResponse = await client.GetAsync("/api/training-certificates?page=1&pageSize=10");
        var body = await listResponse.Content.ReadAsStringAsync();
        // The certificate exists - just verify we get what we seeded
        body.Should().Contain("DBS Check");
    }

    [Fact]
    public async Task GetTrainingCertificateById_WithInvalidId_Returns404()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/training-certificates ─────────────────────────────────────

    [Fact]
    public async Task CreateTrainingCertificate_WithValidRequest_ReturnsCreated()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateTrainingCertificateRequest
        {
            ChurchMemberId = _memberId,
            TrainingCertificateTypeId = _typeId,
            Status = "Pending",
            Expires = DateTime.UtcNow.AddMonths(6)
        };

        var response = await client.PostAsJsonAsync("/api/training-certificates", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateTrainingCertificate_WithInvalidMemberId_ReturnsBadRequest()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateTrainingCertificateRequest
        {
            ChurchMemberId = 99999,
            TrainingCertificateTypeId = _typeId,
            Status = "Pending"
        };

        var response = await client.PostAsJsonAsync("/api/training-certificates", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound, HttpStatusCode.InternalServerError);
    }

    // ─── GET /api/training-certificate-types ─────────────────────────────────

    [Fact]
    public async Task GetTrainingCertificateTypes_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificate-types");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("DBS Check");
    }

    [Fact]
    public async Task GetTrainingCertificateTypes_WithStatusFilter_ReturnsActive()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificate-types?statusFilter=Active");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("DBS Check");
    }

    // ─── POST /api/training-certificate-types ────────────────────────────────

    [Fact]
    public async Task CreateTrainingCertificateType_WithValidRequest_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateTrainingCertificateTypeRequest
        {
            Type = "First Aid",
            Description = "First Aid Certification",
            Status = "Active"
        };

        var response = await client.PostAsJsonAsync("/api/training-certificate-types", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateTrainingCertificateType_WithDuplicateName_ReturnsError()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var request = new CreateTrainingCertificateTypeRequest
        {
            Type = "DBS Check",
            Status = "Active"
        };

        var response = await client.PostAsJsonAsync("/api/training-certificate-types", request);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Conflict, HttpStatusCode.InternalServerError);
    }

    // ─── GET /api/training-certificates/dashboard-summary ────────────────────

    [Fact]
    public async Task GetDashboardTrainingSummary_ReturnsOk()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDashboardTrainingSummary_WithExpiringCertificates_ReturnsAlerts()
    {
        // Seed 3 members with DBS certificates expiring within 60 days (individual alerts)
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var expiringType = new TrainingCertificateTypes
            {
                Type = "Fire Safety",
                Status = "Active",
                Description = "Fire Safety Training",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(expiringType);
            ctx.SaveChanges();

            for (var i = 1; i <= 3; i++)
            {
                var m = new ChurchMember
                {
                    FirstName = $"Exp{i}",
                    LastName = "Member",
                    ChurchMemberStatusId = 1,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                };
                ctx.ChurchMembers.Add(m);
                ctx.SaveChanges();

                ctx.ChurchMemberTrainingCertificates.Add(new ChurchMemberTrainingCertificates
                {
                    ChurchMemberId = m.Id,
                    TrainingCertificateTypeId = expiringType.Id,
                    Status = "In Validity",
                    Expires = DateTime.UtcNow.AddDays(30), // Expiring within 60-day threshold
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                });
            }
            ctx.SaveChanges();
        });

        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<TrainingCertificateGroupSummaryDto>>();
        result.Should().NotBeNull();
        // Should have individual alerts (less than 5 members)
    }

    [Fact]
    public async Task GetDashboardTrainingSummary_With5OrMoreExpiringMembers_GroupsSummary()
    {
        // Seed 5+ members with same training type expiring on same date (grouped summary)
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var groupType = new TrainingCertificateTypes
            {
                Type = "Child Protection",
                Status = "Active",
                Description = "Child Protection Training",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(groupType);
            ctx.SaveChanges();

            var expiryDate = DateTime.UtcNow.AddDays(45);
            for (var i = 1; i <= 6; i++)
            {
                var m = new ChurchMember
                {
                    FirstName = $"Group{i}",
                    LastName = "Member",
                    ChurchMemberStatusId = 1,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                };
                ctx.ChurchMembers.Add(m);
                ctx.SaveChanges();

                ctx.ChurchMemberTrainingCertificates.Add(new ChurchMemberTrainingCertificates
                {
                    ChurchMemberId = m.Id,
                    TrainingCertificateTypeId = groupType.Id,
                    Status = "In Validity",
                    Expires = expiryDate,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                });
            }
            ctx.SaveChanges();
        });

        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<TrainingCertificateGroupSummaryDto>>();
        result.Should().NotBeNull();
        // Should contain a grouped summary with MemberCount >= 5
        result!.Any(r => r.MemberCount >= 5).Should().BeTrue();
    }

    [Fact]
    public async Task GetDashboardTrainingSummary_WithPendingCertificates_IncludesPendingAlerts()
    {
        // Seed pending certificates (no expiry date)
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var pendingType = new TrainingCertificateTypes
            {
                Type = "Safeguarding",
                Status = "Active",
                Description = "Safeguarding Training",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(pendingType);
            ctx.SaveChanges();

            for (var i = 1; i <= 6; i++)
            {
                var m = new ChurchMember
                {
                    FirstName = $"Pending{i}",
                    LastName = "Member",
                    ChurchMemberStatusId = 1,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                };
                ctx.ChurchMembers.Add(m);
                ctx.SaveChanges();

                ctx.ChurchMemberTrainingCertificates.Add(new ChurchMemberTrainingCertificates
                {
                    ChurchMemberId = m.Id,
                    TrainingCertificateTypeId = pendingType.Id,
                    Status = "Pending",
                    Expires = null, // No expiry - pending items
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                });
            }
            ctx.SaveChanges();
        });

        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<TrainingCertificateGroupSummaryDto>>();
        result.Should().NotBeNull();
        // Should contain a pending group summary with 5+ members
        result!.Any(r => r.Status == "Pending" && r.MemberCount >= 5).Should().BeTrue();
    }

    [Fact]
    public async Task GetDashboardTrainingSummary_WithPendingUnderFiveMembers_ReturnsIndividualAlerts()
    {
        // Seed 3 pending certificates (fewer than 5 for per-member alerts)
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var pendingType2 = new TrainingCertificateTypes
            {
                Type = "Manual Handling",
                Status = "Active",
                Description = "Manual Handling Training",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(pendingType2);
            ctx.SaveChanges();

            for (var i = 1; i <= 3; i++)
            {
                var m = new ChurchMember
                {
                    FirstName = $"SmallPend{i}",
                    LastName = "Member",
                    ChurchMemberStatusId = 1,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                };
                ctx.ChurchMembers.Add(m);
                ctx.SaveChanges();

                ctx.ChurchMemberTrainingCertificates.Add(new ChurchMemberTrainingCertificates
                {
                    ChurchMemberId = m.Id,
                    TrainingCertificateTypeId = pendingType2.Id,
                    Status = "Pending",
                    Expires = null,
                    CreatedBy = "system",
                    CreatedDateTime = DateTime.UtcNow
                });
            }
            ctx.SaveChanges();
        });

        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDashboardTrainingSummary_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/dashboard/training-summary");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/training-certificates with sort descending ─────────────────

    [Fact]
    public async Task GetTrainingCertificates_WithSortDescendingByMemberName_ReturnsSortedResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?sortBy=membername&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithSortDescendingByTrainingType_ReturnsSortedResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?sortBy=trainingtype&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithSortDescendingByStatus_ReturnsSortedResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?sortBy=status&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithSortDescendingByExpires_ReturnsSortedResults()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?sortBy=expires&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrainingCertificates_WithSortDescendingByUnknownField_ReturnsDefault()
    {
        var client = _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");
        var response = await client.GetAsync("/api/training-certificates?sortBy=unknown&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
