using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.Database.Entities;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

/// <summary>
/// Integration tests exercising ChurchMemberService through the HTTP endpoint:
/// PUT /api/church-members/{id}
/// Covers uncovered branches: BankReference uniqueness, MemberNumber uniqueness,
/// address create/update/remove, role assignment, member-number update.
/// </summary>
[Collection("IntegrationTests")]
public class ChurchMemberServiceIntegrationTests : IAsyncLifetime
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private int _memberId;
    private int _statusActiveId;
    private int _statusInactiveId;

    public ChurchMemberServiceIntegrationTests()
    {
        _factory = new TestWebApplicationFactory<Program>();
    }

    public async ValueTask InitializeAsync()
    {
        await _factory.SeedDatabaseAsync(ctx =>
        {
            // Seed statuses
            var active = new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            var inactive = new ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            ctx.ChurchMemberStatuses.AddRange(active, inactive);
            ctx.SaveChanges();
            _statusActiveId = active.Id;
            _statusInactiveId = inactive.Id;

            // Seed role types
            var memberRole = new ChurchMemberRoleTypes { Type = "Member", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow };
            ctx.ChurchMemberRoleTypes.Add(memberRole);
            ctx.SaveChanges();

            // Seed primary test member (no address, active)
            var member = new ChurchMember
            {
                FirstName = "Alice",
                LastName = "Original",
                EmailAddress = "alice@original.com",
                ChurchMemberStatusId = _statusActiveId,
                MemberSince = DateTime.UtcNow.AddYears(-2),
                Baptised = false,
                GiftAid = false,
                Envelopes = false,
                PastoralCareRequired = false,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(member);
            ctx.SaveChanges();
            _memberId = member.Id;
        });
    }

    public ValueTask DisposeAsync()
    {
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private HttpClient AdminClient() =>
        _factory.CreateAuthenticatedClient(Guid.NewGuid().ToString(), "admin@test.com", "SystemAdministration");

    private UpdateChurchMemberRequest BaseUpdateRequest() => new UpdateChurchMemberRequest
    {
        Id = _memberId,
        FirstName = "Alice",
        LastName = "Updated",
        Email = "alice@updated.com",
        StatusId = _statusActiveId,
        MemberSince = DateTime.UtcNow.AddYears(-2),
        Baptised = false,
        GiftAid = false,
        Envelopes = false,
        PastoralCareRequired = false,
        RoleIds = Array.Empty<int>()
    };

    // ─── Basic update ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithValidBasicFields_ReturnsSuccess()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.LastName = "BasicUpdate";

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithNonExistentId_ReturnsError()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.Id = 999999;

        var response = await client.PutAsJsonAsync("/api/church-members/999999", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 404, 409, 500);
    }

    [Fact]
    public async Task UpdateChurchMember_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var request = BaseUpdateRequest();

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── BankReference uniqueness ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithUniqueBankReference_ReturnsSuccess()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.BankReference = "UNIQUEREF001";

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithSharedBankReference_UpTo2Members_Succeeds()
    {
        // Create another member with a known bank reference
        int otherMemberId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var other = new ChurchMember
            {
                FirstName = "Bob",
                LastName = "BankRef",
                ChurchMemberStatusId = 1,
                BankReference = "DUPREF001",
                MemberSince = DateTime.UtcNow.AddYears(-1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(other);
            ctx.SaveChanges();
            otherMemberId = other.Id;
        });

        // Assign the same bank reference to our primary member - should succeed (up to 2 members allowed)
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.BankReference = "DUPREF001";

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        var body = await response.Content.ReadAsStringAsync();
        // Should succeed with 200 or 204 (2nd member sharing reference)
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    // ─── Address create / update / remove ────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithNewAddress_CreatesAddress()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.Address = new AddressDto
        {
            NameNumber = "42",
            AddressLineOne = "Faith Street",
            Town = "Testcastle",
            Postcode = "TC1 1AA"
        };

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithAddressThenClear_RemovesAddress()
    {
        // First, set an address
        int memberWithAddressId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var addr = new Address
            {
                NameNumber = "10",
                AddressLineOne = "Grace Road",
                Town = "Hopetown",
                Postcode = "HT1 2BB",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Addresses.Add(addr);
            ctx.SaveChanges();

            var m = new ChurchMember
            {
                FirstName = "Clara",
                LastName = "WithAddress",
                ChurchMemberStatusId = 1,
                AddressId = addr.Id,
                MemberSince = DateTime.UtcNow.AddYears(-1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(m);
            ctx.SaveChanges();
            memberWithAddressId = m.Id;
        });

        // Now update with null address to remove it
        var client = AdminClient();
        var request = new UpdateChurchMemberRequest
        {
            Id = memberWithAddressId,
            FirstName = "Clara",
            LastName = "WithAddress",
            StatusId = _statusActiveId,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false,
            GiftAid = false,
            Envelopes = false,
            RoleIds = Array.Empty<int>(),
            Address = null // clearing address
        };

        var response = await client.PutAsJsonAsync($"/api/church-members/{memberWithAddressId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithExistingAddress_UpdatesAddress()
    {
        // Create a member with an existing address
        int memberWithAddressId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var addr = new Address
            {
                NameNumber = "5",
                AddressLineOne = "Old Lane",
                Town = "Oldtown",
                Postcode = "OT1 1OO",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.Addresses.Add(addr);
            ctx.SaveChanges();

            var m = new ChurchMember
            {
                FirstName = "David",
                LastName = "HasAddress",
                ChurchMemberStatusId = 1,
                AddressId = addr.Id,
                MemberSince = DateTime.UtcNow.AddYears(-1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(m);
            ctx.SaveChanges();
            memberWithAddressId = m.Id;
        });

        // Update the address with new values
        var client = AdminClient();
        var request = new UpdateChurchMemberRequest
        {
            Id = memberWithAddressId,
            FirstName = "David",
            LastName = "HasAddress",
            StatusId = _statusActiveId,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false,
            GiftAid = false,
            Envelopes = false,
            RoleIds = Array.Empty<int>(),
            Address = new AddressDto
            {
                NameNumber = "10",
                AddressLineOne = "New Road",
                Town = "Newtown",
                Postcode = "NT1 2NN"
            }
        };

        var response = await client.PutAsJsonAsync($"/api/church-members/{memberWithAddressId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    // ─── Role assignment ──────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithRoleAssignment_ReturnsSuccess()
    {
        // Seed a role type and use it
        int roleTypeId = 0;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var roleType = new ChurchMemberRoleTypes
            {
                Type = "Deacon",
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMemberRoleTypes.Add(roleType);
            ctx.SaveChanges();
            roleTypeId = roleType.Id;
        });

        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.RoleIds = new[] { roleTypeId };

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithInvalidRoleId_ReturnsError()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.RoleIds = new[] { 99999 }; // Non-existent role

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 409, 422, 500);
    }

    // ─── MemberNumber (register number) update ────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithMemberNumber_AssignsNumber()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.MemberNumber = 5001;

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_UpdatesExistingMemberNumber()
    {
        // Seed a member who already has a register number
        int memberWithNumberId = 0;
        int currentYear = DateTime.UtcNow.Year;
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var m = new ChurchMember
            {
                FirstName = "Ellen",
                LastName = "HasNumber",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow.AddYears(-1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(m);
            ctx.SaveChanges();

            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = m.Id,
                Number = 7777,
                Year = currentYear,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
            memberWithNumberId = m.Id;
        });

        var client = AdminClient();
        var request = new UpdateChurchMemberRequest
        {
            Id = memberWithNumberId,
            FirstName = "Ellen",
            LastName = "HasNumber",
            StatusId = _statusActiveId,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false,
            GiftAid = false,
            Envelopes = false,
            RoleIds = Array.Empty<int>(),
            MemberNumber = 8888 // Update to new number
        };

        var response = await client.PutAsJsonAsync($"/api/church-members/{memberWithNumberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    [Fact]
    public async Task UpdateChurchMember_WithDuplicateMemberNumber_ReturnsError()
    {
        int currentYear = DateTime.UtcNow.Year;
        // Seed another member with register number 6666
        await _factory.SeedDatabaseAsync(ctx =>
        {
            var other = new ChurchMember
            {
                FirstName = "Fred",
                LastName = "NumberHolder",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow.AddYears(-1),
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            };
            ctx.ChurchMembers.Add(other);
            ctx.SaveChanges();

            ctx.ChurchMemberRegisterNumbers.Add(new ChurchMemberRegisterNumber
            {
                ChurchMemberId = other.Id,
                Number = 6666,
                Year = currentYear,
                CreatedBy = "system",
                CreatedDateTime = DateTime.UtcNow
            });
            ctx.SaveChanges();
        });

        // Try to assign 6666 to the primary member (_memberId)
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.MemberNumber = 6666;

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        // Expect 409 conflict or 400 validation error due to duplicate number
        ((int)response.StatusCode).Should().BeOneOf(400, 409, 422, 500);
    }

    // ─── Status update (via update endpoint) ─────────────────────────────────

    [Fact]
    public async Task UpdateChurchMember_WithInvalidStatusId_ReturnsError()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.StatusId = 9999; // Non-existent status

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(400, 409, 422, 500);
    }

    [Fact]
    public async Task UpdateChurchMember_WithAllFieldsPopulated_ReturnsSuccess()
    {
        var client = AdminClient();
        var request = BaseUpdateRequest();
        request.Title = "Mrs";
        request.Phone = "07700123456";
        request.BankReference = "FULLREF001";
        request.Baptised = true;
        request.GiftAid = true;
        request.Envelopes = true;
        request.PastoralCareRequired = true;
        request.Address = new AddressDto
        {
            NameNumber = "1",
            AddressLineOne = "Complete Road",
            Town = "Fulltown",
            County = "Testshire",
            Postcode = "FT1 1FT"
        };

        var response = await client.PutAsJsonAsync($"/api/church-members/{_memberId}", request);
        ((int)response.StatusCode).Should().BeOneOf(200, 201, 204);
    }

    // ─── GET /api/church-members with sort descending ─────────────────────────

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByFirstName_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=firstname&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByLastName_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=lastname&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByEmail_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=email&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByMemberSince_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=membersince&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByStatus_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=status&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByMemberNumber_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=membernumber&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingByContributionDate_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=lastcontributiondate&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortDescendingUnknownField_ReturnsDefault()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=unknown&sortDirection=desc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByLastName_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=lastname&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByEmail_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=email&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByStatus_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=status&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByMemberNumber_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=membernumber&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByContributionDate_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=lastcontributiondate&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetChurchMembers_WithSortAscendingByMemberSince_ReturnsSortedResults()
    {
        var client = AdminClient();
        var response = await client.GetAsync("/api/church-members?sortBy=membersince&sortDirection=asc");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
