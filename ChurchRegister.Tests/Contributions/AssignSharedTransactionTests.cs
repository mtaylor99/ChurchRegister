using System.Net;
using System.Net.Http.Json;
using ChurchRegister.ApiService;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.Tests;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;
using ChurchRegister.Tests.Builders;
using ChurchRegister.Tests.Fixtures;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ChurchRegister.Tests.Contributions;

/// <summary>
/// Integration tests for shared bank reference assignment functionality
/// </summary>
public class AssignSharedTransactionTests : IAsyncLifetime
{
    private TestWebApplicationFactory<Program> _factory = null!;

    public ValueTask InitializeAsync()
    {
        _factory = new TestWebApplicationFactory<Program>();
        return ValueTask.CompletedTask;
    }

    public ValueTask DisposeAsync()
    {
        _factory?.Dispose();
        return ValueTask.CompletedTask;
    }

    [Fact]
    public async Task Post_ValidTwoMembers_Creates2Contributions()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "COUPLE123",
            MoneyIn = 100.00m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };

        var member1 = ChurchMemberBuilder.AChurchMember()
            .WithFullName("John", "Smith")
            .WithoutBankReference()
            .Build();

        var member2 = ChurchMemberBuilder.AChurchMember()
            .WithFullName("Jane", "Smith")
            .WithoutBankReference()
            .Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.AddRange(member1, member2);
        await context.SaveChangesAsync();

        var client = _factory.CreateAuthenticatedClient("test@example.com", "test@example.com", "FinancialAdministrator");

        var request = new AssignTransactionRequest(member1.Id, member2.Id);

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<AssignTransactionResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.IsSharedReference.Should().BeTrue();
        result.ContributionsCreated.Should().Be(2);

        // Verify contributions in database
        var contributions = await context.ChurchMemberContributions
            .Where(c => c.HSBCBankCreditTransactionId == transaction.Id)
            .ToListAsync();

        contributions.Should().HaveCount(2);
        contributions.Should().Contain(c => c.ChurchMemberId == member1.Id && c.Amount == 50.00m && c.TransactionRef == "COUPLE123-M1");
        contributions.Should().Contain(c => c.ChurchMemberId == member2.Id && c.Amount == 50.00m && c.TransactionRef == "COUPLE123-M2");

        // Verify both members have the same bank reference - detach and reload
        context.Entry(member1).State = EntityState.Detached;
        context.Entry(member2).State = EntityState.Detached;
        
        var updatedMember1 = await context.ChurchMembers.FindAsync(member1.Id);
        var updatedMember2 = await context.ChurchMembers.FindAsync(member2.Id);

        updatedMember1!.BankReference.Should().Be("COUPLE123");
        updatedMember2!.BankReference.Should().Be("COUPLE123");
    }

    [Fact]
    public async Task Post_OddAmount_SplitsWithPennyRounding()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "ODDAMOUNT",
            MoneyIn = 50.01m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };

        var member1 = ChurchMemberBuilder.AChurchMember().WithFullName("Alice", "Brown").WithoutBankReference().Build();
        var member2 = ChurchMemberBuilder.AChurchMember().WithFullName("Bob", "Brown").WithoutBankReference().Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.AddRange(member1, member2);
        await context.SaveChangesAsync();

        var client = _factory.CreateAuthenticatedClient("test@example.com", "test@example.com", "FinancialAdministrator");
        var request = new AssignTransactionRequest(member1.Id, member2.Id);

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var contributions = await context.ChurchMemberContributions
            .Where(c => c.HSBCBankCreditTransactionId == transaction.Id)
            .OrderBy(c => c.Amount)
            .ToListAsync();

        contributions.Should().HaveCount(2);
        contributions[0].Amount.Should().Be(25.00m); // First member gets split amount
        contributions[1].Amount.Should().Be(25.01m); // Second member gets remainder (absorbs penny)

        // Verify total equals original
        (contributions[0].Amount + contributions[1].Amount).Should().Be(50.01m);
    }

    [Fact]
    public async Task Post_SameMemberTwice_Returns400()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "TEST123",
            MoneyIn = 100m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        var member = ChurchMemberBuilder.AChurchMember().WithoutBankReference().Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.Add(member);
        await context.SaveChangesAsync();

        var client = _factory.CreateAuthenticatedClient("test@example.com", "test@example.com", "FinancialAdministrator");
        var request = new AssignTransactionRequest(member.Id, member.Id); // Same ID twice

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Post_MemberHasDifferentReference_Returns409()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "NEWREF123",
            MoneyIn = 100m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };

        var member1 = ChurchMemberBuilder.AChurchMember()
            .WithBankReference("OLDREF456") // Already has a different reference
            .Build();

        var member2 = ChurchMemberBuilder.AChurchMember().WithoutBankReference().Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.AddRange(member1, member2);
        await context.SaveChangesAsync();

        var client = _factory.CreateAuthenticatedClient("test@example.com", "test@example.com", "FinancialAdministrator");
        var request = new AssignTransactionRequest(member1.Id, member2.Id);

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Post_SecondaryMemberNotFound_Returns404()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "TEST456",
            MoneyIn = 100m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        var member1 = ChurchMemberBuilder.AChurchMember().WithoutBankReference().Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.Add(member1);
        await context.SaveChangesAsync();

        var client = _factory.CreateAuthenticatedClient("test@example.com", "test@example.com", "FinancialAdministrator");
        var request = new AssignTransactionRequest(member1.Id, 99999); // Non-existent member

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Post_UnauthorizedRole_Returns403()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();

        var transaction = new HSBCBankCreditTransaction
        {
            Reference = "TEST789",
            MoneyIn = 100m,
            Date = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedDateTime = DateTime.UtcNow
        };
        var member1 = ChurchMemberBuilder.AChurchMember().WithoutBankReference().Build();
        var member2 = ChurchMemberBuilder.AChurchMember().WithoutBankReference().Build();

        context.HSBCBankCreditTransactions.Add(transaction);
        context.ChurchMembers.AddRange(member1, member2);
        await context.SaveChangesAsync();

        var client = _factory.CreateClient(); // No authentication

        var request = new AssignTransactionRequest(member1.Id, member2.Id);

        // Act
        var response = await client.PostAsJsonAsync($"/api/financial/hsbc-transactions/{transaction.Id}/assign", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
