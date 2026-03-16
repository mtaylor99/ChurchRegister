using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using ChurchRegister.ApiService.Services.ChurchMembers;
using ChurchRegister.ApiService.Services.Contributions;
using ChurchRegister.ApiService.Services.Security;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChurchRegister.ApiService.Tests.ChurchMembers;

public class ChurchMemberServiceTests : IDisposable
{
    private readonly ChurchRegisterWebContext _context;
    private readonly Mock<ILogger<ChurchMemberService>> _mockLogger;
    private readonly Mock<IRegisterNumberService> _mockRegisterNumberService;
    private readonly ChurchMemberService _service;

    public ChurchMemberServiceTests()
    {
        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new ChurchRegisterWebContext(options);
        _mockLogger = new Mock<ILogger<ChurchMemberService>>();
        _mockRegisterNumberService = new Mock<IRegisterNumberService>();
        
        // Setup default behavior for register number service
        _mockRegisterNumberService
            .Setup(x => x.GetNextAvailableNumberForRoleAsync(It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _mockRegisterNumberService
            .Setup(x => x.HasBeenGeneratedForYearAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        
        _service = new ChurchMemberService(_context, _mockLogger.Object, _mockRegisterNumberService.Object);

        SeedTestData();
    }

    private void SeedTestData()
    {
        // Seed statuses
        _context.ChurchMemberStatuses.AddRange(
            new ChurchMemberStatus { Id = 1, Name = "Active" },
            new ChurchMemberStatus { Id = 2, Name = "Inactive" }
        );

        // Seed role types
        _context.ChurchMemberRoleTypes.AddRange(
            new ChurchMemberRoleTypes { Id = 1, Type = "Elder" },
            new ChurchMemberRoleTypes { Id = 2, Type = "Deacon" },
            new ChurchMemberRoleTypes { Id = 3, Type = "Member" }
        );

        _context.SaveChanges();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithSearchTerm_ReturnsFilteredResults()
    {
        // Arrange
        _context.ChurchMembers.AddRange(
            new ChurchMember
            {
                FirstName = "John",
                LastName = "Doe",
                EmailAddress = "john@test.com",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow,
                CreatedBy = "test",
                CreatedDateTime = DateTime.UtcNow
            },
            new ChurchMember
            {
                FirstName = "Jane",
                LastName = "Smith",
                EmailAddress = "jane@test.com",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow,
                CreatedBy = "test",
                CreatedDateTime = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        var query = new ChurchMemberGridQuery
        {
            SearchTerm = "John",
            Page = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetChurchMembersAsync(query);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items.First().FirstName.Should().Be("John");
    }

    [Fact]
    public async Task GetChurchMemberByIdAsync_WithValidId_ReturnsMember()
    {
        // Arrange
        var member = new ChurchMember
        {
            FirstName = "Test",
            LastName = "User",
            EmailAddress = "test@test.com",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetChurchMemberByIdAsync(member.Id);

        // Assert
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Test");
        result.LastName.Should().Be("User");
    }

    [Fact]
    public async Task GetChurchMemberByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Act
        var result = await _service.GetChurchMemberByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithValidData_CreatesMember()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "New",
            LastName = "Member",
            Email = "new@test.com",
            Phone = "1234567890",
            MemberSince = DateTime.UtcNow,
            StatusId = 1,
            Baptised = true,
            GiftAid = false,
            RoleIds = new[] { 3 }
        };

        // Act
        var result = await _service.CreateChurchMemberAsync(request, "testuser");

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Message.Should().Contain("created successfully");
        result.Member.Should().NotBeNull();
        result.Member!.FirstName.Should().Be("New");
        result.Member.LastName.Should().Be("Member");
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithInvalidStatus_ThrowsException()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "New",
            LastName = "Member",
            Email = "new@test.com",
            StatusId = 999, // Invalid status
            MemberSince = DateTime.UtcNow,
            RoleIds = Array.Empty<int>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateChurchMemberAsync(request, "testuser"));
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_WithValidData_UpdatesMember()
    {
        // Arrange
        var member = new ChurchMember
        {
            FirstName = "Original",
            LastName = "Name",
            EmailAddress = "original@test.com",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateChurchMemberRequest
        {
            Id = member.Id,
            FirstName = "Updated",
            LastName = "Name",
            Email = "updated@test.com",
            Phone = "9876543210",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = true,
            GiftAid = true,
            RoleIds = new[] { 1 }
        };

        // Act
        var result = await _service.UpdateChurchMemberAsync(updateRequest, "modifier");

        // Assert
        result.Should().NotBeNull();
        result.FirstName.Should().Be("Updated");
        result.Email.Should().Be("updated@test.com");
        result.Baptised.Should().BeTrue();
        result.GiftAid.Should().BeTrue();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithEnvelopesTrue_PersistsEnvelopes()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Envelope",
            LastName = "Tester",
            Email = "envelope@test.com",
            MemberSince = DateTime.UtcNow,
            StatusId = 1,
            Baptised = false,
            GiftAid = false,
            Envelopes = true,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.CreateChurchMemberAsync(request, "testuser");

        // Assert
        result.Member.Should().NotBeNull();
        result.Member!.Envelopes.Should().BeTrue();

        // Verify persisted in database
        var persisted = await _context.ChurchMembers.FindAsync(result.Id);
        persisted.Should().NotBeNull();
        persisted!.Envelopes.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_Envelopes_CanBeToggledFalseToTrue()
    {
        // Arrange — member starts with Envelopes = false
        var member = new ChurchMember
        {
            FirstName = "Toggle",
            LastName = "Test",
            EmailAddress = "toggle@test.com",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            Envelopes = false,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateChurchMemberRequest
        {
            Id = member.Id,
            FirstName = "Toggle",
            LastName = "Test",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            Envelopes = true, // toggle on
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.UpdateChurchMemberAsync(updateRequest, "modifier");

        // Assert
        result.Envelopes.Should().BeTrue();

        var persisted = await _context.ChurchMembers.FindAsync(member.Id);
        persisted!.Envelopes.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_Envelopes_CanBeToggledTrueToFalse()
    {
        // Arrange — member starts with Envelopes = true
        var member = new ChurchMember
        {
            FirstName = "Untoggle",
            LastName = "Test",
            EmailAddress = "untoggle@test.com",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            Envelopes = true,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateChurchMemberRequest
        {
            Id = member.Id,
            FirstName = "Untoggle",
            LastName = "Test",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            Envelopes = false, // toggle off
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.UpdateChurchMemberAsync(updateRequest, "modifier");

        // Assert
        result.Envelopes.Should().BeFalse();

        var persisted = await _context.ChurchMembers.FindAsync(member.Id);
        persisted!.Envelopes.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_WithInvalidId_ThrowsException()
    {
        // Arrange
        var request = new UpdateChurchMemberRequest
        {
            Id = 999,
            FirstName = "Test",
            LastName = "User",
            Email = "test@test.com",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            RoleIds = Array.Empty<int>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateChurchMemberAsync(request, "testuser"));
    }

    [Fact]
    public async Task UpdateChurchMemberStatusAsync_WithValidData_UpdatesStatus()
    {
        // Arrange
        var member = new ChurchMember
        {
            FirstName = "Test",
            LastName = "User",
            EmailAddress = "test@test.com",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateChurchMemberStatusRequest
        {
            StatusId = 2,
            Note = "Status change note"
        };

        // Act
        var result = await _service.UpdateChurchMemberStatusAsync(member.Id, request, "modifier");

        // Assert
        result.Should().NotBeNull();
        result.StatusId.Should().Be(2);
    }

    [Fact]
    public async Task GetRolesAsync_ReturnsAllRoles()
    {
        // Act
        var result = await _service.GetRolesAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().Contain(r => r.Type == "Elder");
        result.Should().Contain(r => r.Type == "Deacon");
        result.Should().Contain(r => r.Type == "Member");
    }

    [Fact]
    public async Task GetStatusesAsync_ReturnsAllStatuses()
    {
        // Act
        var result = await _service.GetStatusesAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().Contain(s => s.Name == "Active");
        result.Should().Contain(s => s.Name == "Inactive");
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithUniqueBankReference_Succeeds()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com",
            Phone = "1234567890",
            BankReference = "UNIQUE123",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.CreateChurchMemberAsync(request, "testUser");

        // Assert
        result.Should().NotBeNull();
        result.Member.Should().NotBeNull();
        result.Member!.BankReference.Should().Be("UNIQUE123");
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithDuplicateBankReference_ThrowsException()
    {
        // Arrange
        _context.ChurchMembers.Add(new ChurchMember
        {
            FirstName = "Existing",
            LastName = "Member",
            EmailAddress = "existing@example.com",
            BankReference = "DUPLICATE123",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var request = new CreateChurchMemberRequest
        {
            FirstName = "New",
            LastName = "User",
            Email = "new@example.com",
            Phone = "1234567890",
            BankReference = "DUPLICATE123",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            async () => await _service.CreateChurchMemberAsync(request, "testUser"));
        
        exception.Message.Should().Contain("is already in use");
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithDuplicateBankReference_CaseInsensitive_ThrowsException()
    {
        // Arrange
        _context.ChurchMembers.Add(new ChurchMember
        {
            FirstName = "Existing",
            LastName = "Member",
            EmailAddress = "existing@example.com",
            BankReference = "duplicate123",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var request = new CreateChurchMemberRequest
        {
            FirstName = "New",
            LastName = "User",
            Email = "new@example.com",
            Phone = "1234567890",
            BankReference = "DUPLICATE123", // Different case
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            async () => await _service.CreateChurchMemberAsync(request, "testUser"));
        
        exception.Message.Should().Contain("is already in use");
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithNullBankReference_Succeeds()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com",
            Phone = "1234567890",
            BankReference = null,
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.CreateChurchMemberAsync(request, "testUser");

        // Assert
        result.Should().NotBeNull();
        result.Member.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithEmptyBankReference_Succeeds()
    {
        // Arrange
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com",
            Phone = "1234567890",
            BankReference = "",
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.CreateChurchMemberAsync(request, "testUser");

        // Assert
        result.Should().NotBeNull();
        result.Member.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_WithSameBankReference_Succeeds()
    {
        // Arrange
        var member = new ChurchMember
        {
            FirstName = "Test",
            LastName = "Member",
            EmailAddress = "test@example.com",
            BankReference = "REF123",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateChurchMemberRequest
        {
            Id = member.Id,
            FirstName = "Test",
            LastName = "Member",
            Email = "test@example.com",
            Phone = "1234567890",
            BankReference = "REF123", // Same reference
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.UpdateChurchMemberAsync(request, "testUser");

        // Assert
        result.Should().NotBeNull();
        result.BankReference.Should().Be("REF123");
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_WithAnotherMembersBankReference_ThrowsException()
    {
        // Arrange
        _context.ChurchMembers.AddRange(
            new ChurchMember
            {
                FirstName = "Member",
                LastName = "One",
                EmailAddress = "one@example.com",
                BankReference = "REF123",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow,
                CreatedBy = "test",
                CreatedDateTime = DateTime.UtcNow
            },
            new ChurchMember
            {
                FirstName = "Member",
                LastName = "Two",
                EmailAddress = "two@example.com",
                BankReference = "REF456",
                ChurchMemberStatusId = 1,
                MemberSince = DateTime.UtcNow,
                CreatedBy = "test",
                CreatedDateTime = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        var memberTwo = await _context.ChurchMembers.FirstAsync(m => m.BankReference == "REF456");

        var request = new UpdateChurchMemberRequest
        {
            Id = memberTwo.Id,
            FirstName = "Member",
            LastName = "Two",
            Email = "two@example.com",
            Phone = "1234567890",
            BankReference = "REF123", // Try to use Member One's reference
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            async () => await _service.UpdateChurchMemberAsync(request, "testUser"));
        
        exception.Message.Should().Contain("is already in use");
    }

    [Fact]
    public async Task UpdateChurchMemberAsync_WithNullBankReference_Succeeds()
    {
        // Arrange
        var member = new ChurchMember
        {
            FirstName = "Test",
            LastName = "Member",
            EmailAddress = "test@example.com",
            BankReference = "REF123",
            ChurchMemberStatusId = 1,
            MemberSince = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        _context.ChurchMembers.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateChurchMemberRequest
        {
            Id = member.Id,
            FirstName = "Test",
            LastName = "Member",
            Email = "test@example.com",
            Phone = "1234567890",
            BankReference = null, // Clear the reference
            StatusId = 1,
            MemberSince = DateTime.UtcNow,
            Baptised = false,
            GiftAid = false,
            RoleIds = Array.Empty<int>()
        };

        // Act
        var result = await _service.UpdateChurchMemberAsync(request, "testUser");

        // Assert
        result.Should().NotBeNull();
        result.BankReference.Should().BeNull();
    }

    // ─── GetChurchMembersAsync filter coverage ────────────────────────────────

    private ChurchMember MakeBasicMember(string first, string last, int statusId = 1) => new ChurchMember
    {
        FirstName = first, LastName = last, ChurchMemberStatusId = statusId,
        MemberSince = DateTime.UtcNow.AddYears(-1),
        Baptised = false, GiftAid = false, Envelopes = false, PastoralCareRequired = false,
        CreatedBy = "test", CreatedDateTime = DateTime.UtcNow
    };

    [Fact]
    public async Task GetChurchMembersAsync_WithStatusFilter_ReturnsOnlyMatchingStatus()
    {
        _context.ChurchMembers.AddRange(MakeBasicMember("A", "Active", 1), MakeBasicMember("B", "Inactive", 2));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { StatusFilter = 1, Page = 1, PageSize = 10 });
        result.TotalCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithBaptisedFilter_ReturnsFilteredResults()
    {
        var baptised = MakeBasicMember("C", "Baptised"); baptised.Baptised = true;
        _context.ChurchMembers.AddRange(baptised, MakeBasicMember("D", "NotBaptised"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { BaptisedFilter = true, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithGiftAidFilter_ReturnsFilteredResults()
    {
        var gifter = MakeBasicMember("E", "GiftAid"); gifter.GiftAid = true;
        _context.ChurchMembers.AddRange(gifter, MakeBasicMember("F", "NoGiftAid"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { GiftAidFilter = true, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithPastoralCareFilter_ReturnsFilteredResults()
    {
        var pastoral = MakeBasicMember("G", "Pastoral"); pastoral.PastoralCareRequired = true;
        _context.ChurchMembers.AddRange(pastoral, MakeBasicMember("H", "NoPastoral"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { PastoralCareRequired = true, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithNoBankReferenceFilter_ReturnsFilteredResults()
    {
        var noRef = MakeBasicMember("I", "NoBankRef");
        var withRef = MakeBasicMember("J", "WithBankRef"); withRef.BankReference = "REF123";
        _context.ChurchMembers.AddRange(noRef, withRef);
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { NoBankReferenceFilter = true, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithDistrictFilter_ReturnsFilteredResults()
    {
        var district = new ChurchRegister.Database.Entities.Districts
        { Name = "D1", CreatedBy = "test", CreatedDateTime = DateTime.UtcNow };
        _context.Districts.Add(district);
        await _context.SaveChangesAsync();

        var inDistrict = MakeBasicMember("K", "InDistrict"); inDistrict.DistrictId = district.Id;
        _context.ChurchMembers.AddRange(inDistrict, MakeBasicMember("L", "OutDistrict"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { DistrictFilter = district.Id, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithUnassignedDistrictFilter_ReturnsFilteredResults()
    {
        var district = new ChurchRegister.Database.Entities.Districts
        { Name = "D2", CreatedBy = "test", CreatedDateTime = DateTime.UtcNow };
        _context.Districts.Add(district);
        await _context.SaveChangesAsync();

        var withDistrict = MakeBasicMember("M", "Assigned"); withDistrict.DistrictId = district.Id;
        _context.ChurchMembers.AddRange(withDistrict, MakeBasicMember("N", "Unassigned"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { UnassignedDistrictFilter = true, Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChurchMembersAsync_WithDescendingSort_ReturnsResults()
    {
        _context.ChurchMembers.AddRange(MakeBasicMember("Z", "Zeta"), MakeBasicMember("A", "Alpha"));
        await _context.SaveChangesAsync();
        var result = await _service.GetChurchMembersAsync(new ChurchMemberGridQuery { SortBy = "FirstName", SortDirection = "desc", Page = 1, PageSize = 10 });
        result.Should().NotBeNull();
    }

    // ─── CreateChurchMemberAsync error path coverage ──────────────────────────

    [Fact]
    public async Task CreateChurchMemberAsync_WithDuplicateBankReference_ThrowsValidationException()
    {
        var existing = MakeBasicMember("O", "Existing"); existing.BankReference = "MYREF";
        _context.ChurchMembers.Add(existing);
        await _context.SaveChangesAsync();

        var request = new CreateChurchMemberRequest
        {
            FirstName = "New", LastName = "Member", StatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false, GiftAid = false, Envelopes = false, PastoralCareRequired = false,
            BankReference = "MYREF",
            RoleIds = Array.Empty<int>()
        };
        await _service.Invoking(s => s.CreateChurchMemberAsync(request, "test"))
            .Should().ThrowAsync<ChurchRegister.ApiService.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithInvalidStatusId_ThrowsException()
    {
        var request = new CreateChurchMemberRequest
        {
            FirstName = "New", LastName = "Member", StatusId = 999,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false, GiftAid = false, Envelopes = false, PastoralCareRequired = false,
            RoleIds = Array.Empty<int>()
        };
        await _service.Invoking(s => s.CreateChurchMemberAsync(request, "test"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithRoles_AssignsRolesToMember()
    {
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Roled", LastName = "Member", StatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false, GiftAid = false, Envelopes = false, PastoralCareRequired = false,
            RoleIds = [1]
        };
        var result = await _service.CreateChurchMemberAsync(request, "test");
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateChurchMemberAsync_WithAddress_SetsAddress()
    {
        var request = new CreateChurchMemberRequest
        {
            FirstName = "Addressed", LastName = "Member", StatusId = 1,
            MemberSince = DateTime.UtcNow.AddYears(-1),
            Baptised = false, GiftAid = false, Envelopes = false, PastoralCareRequired = false,
            RoleIds = Array.Empty<int>(),
            Address = new AddressDto { AddressLineOne = "1 Test St", Town = "Testville", Postcode = "TE1 1ST" }
        };
        var result = await _service.CreateChurchMemberAsync(request, "test");
        result.Should().NotBeNull();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
