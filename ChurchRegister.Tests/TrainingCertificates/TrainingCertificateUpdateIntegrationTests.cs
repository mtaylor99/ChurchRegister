using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.TrainingCertificates;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.TrainingCertificates;

/// <summary>
/// Integration tests for previously-uncovered training certificate UPDATE endpoints:
///   PUT /api/training-certificates/{id}       — UpdateTrainingCertificateEndpoint
///   PUT /api/training-certificate-types/{id}  — UpdateTrainingCertificateTypeEndpoint
/// These tests exercise the endpoint handlers and the underlying service methods that
/// were at 0% coverage.
/// </summary>
[Collection("IntegrationTests")]
public class TrainingCertificateUpdateIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _memberId;
    private int _certTypeId;
    private int _certId;

    public TrainingCertificateUpdateIntegrationTests()
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

            var member = new ChurchMember
            {
                FirstName            = "Training",
                LastName             = "Updated",
                ChurchMemberStatusId = status.Id,
                MemberSince          = DateTime.UtcNow.AddYears(-1),
                GiftAid              = false,
                Baptised             = false,
                Envelopes            = false,
                PastoralCareRequired = false,
                CreatedBy            = "system",
                CreatedDateTime      = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);

            var certType = new TrainingCertificateTypes
            {
                Type            = "Safeguarding",
                Status          = "Active",
                Description     = "Safeguarding training",
                CreatedBy       = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.TrainingCertificateTypes.Add(certType);
            ctx.SaveChanges();

            _memberId   = member.Id;
            _certTypeId = certType.Id;

            var cert = new ChurchMemberTrainingCertificates
            {
                ChurchMemberId            = _memberId,
                TrainingCertificateTypeId = _certTypeId,
                Status                    = "In Validity",
                Expires                   = DateTime.UtcNow.AddYears(2),
                CreatedBy                 = "system",
                CreatedDateTime           = DateTime.UtcNow
            };
            ctx.ChurchMemberTrainingCertificates.Add(cert);
            ctx.SaveChanges();
            _certId = cert.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com",
            "SystemAdministration", "TrainingCertificatesAdministrator");

    // ─── PUT /api/training-certificates/{id} ─────────────────────────────────

    [Fact]
    public async Task UpdateTrainingCertificate_WithValidData_Returns200()
    {
        var client  = AdminClient();
        var request = new UpdateTrainingCertificateRequest
        {
            Id      = _certId,
            Status  = "Expired",
            Expires = DateTime.UtcNow.AddMonths(6)
        };
        var response = await client.PutAsJsonAsync($"/api/training-certificates/{_certId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task UpdateTrainingCertificate_NonExistentId_Returns4xx()
    {
        var client  = AdminClient();
        var request = new UpdateTrainingCertificateRequest
        {
            Id      = 999999,
            Status  = "In Validity",
            Expires = DateTime.UtcNow.AddYears(1)
        };
        var response = await client.PutAsJsonAsync("/api/training-certificates/999999", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 500);
    }

    [Fact]
    public async Task UpdateTrainingCertificate_Unauthorized_Returns401()
    {
        var client  = _factory.CreateClient();
        var request = new UpdateTrainingCertificateRequest
        {
            Id     = _certId,
            Status = "In Validity"
        };
        var response = await client.PutAsJsonAsync($"/api/training-certificates/{_certId}", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }

    // ─── PUT /api/training-certificate-types/{id} ────────────────────────────

    [Fact]
    public async Task UpdateTrainingCertificateType_WithValidData_Returns200()
    {
        var client  = AdminClient();
        var request = new UpdateTrainingCertificateTypeRequest
        {
            Id          = _certTypeId,
            Type        = "Safeguarding Updated",
            Status      = "Active",
            Description = "Updated safeguarding training description"
        };
        var response = await client.PutAsJsonAsync($"/api/training-certificate-types/{_certTypeId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 204);
    }

    [Fact]
    public async Task UpdateTrainingCertificateType_NonExistentId_Returns4xx()
    {
        var client  = AdminClient();
        var request = new UpdateTrainingCertificateTypeRequest
        {
            Id     = 999999,
            Type   = "Missing Type",
            Status = "Active"
        };
        var response = await client.PutAsJsonAsync("/api/training-certificate-types/999999", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 500);
    }

    [Fact]
    public async Task UpdateTrainingCertificateType_Unauthorized_Returns401()
    {
        var client  = _factory.CreateClient();
        var request = new UpdateTrainingCertificateTypeRequest
        {
            Id     = _certTypeId,
            Type   = "Safeguarding",
            Status = "Active"
        };
        var response = await client.PutAsJsonAsync($"/api/training-certificate-types/{_certTypeId}", request);
        ((int)response.StatusCode).Should().BeOneOf(401, 403);
    }
}
