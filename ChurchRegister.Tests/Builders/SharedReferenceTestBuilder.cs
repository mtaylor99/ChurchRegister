using ChurchRegister.Database.Entities;

namespace ChurchRegister.Tests.Builders;

/// <summary>
/// Fluent builder for creating shared reference test data with sensible defaults
/// </summary>
public class SharedReferenceTestBuilder
{
    private string _reference = "COUPLE2024";
    private int _primaryMemberId = 1;
    private int _secondaryMemberId = 2;
    private string _primaryFirstName = "John";
    private string _primaryLastName = "Smith";
    private string _secondaryFirstName = "Jane";
    private string _secondaryLastName = "Smith";

    public static SharedReferenceTestBuilder ASharedReference() => new();

    public SharedReferenceTestBuilder WithReference(string reference)
    {
        _reference = reference;
        return this;
    }

    public SharedReferenceTestBuilder WithPrimaryMember(int id, string firstName, string lastName)
    {
        _primaryMemberId = id;
        _primaryFirstName = firstName;
        _primaryLastName = lastName;
        return this;
    }

    public SharedReferenceTestBuilder WithSecondaryMember(int id, string firstName, string lastName)
    {
        _secondaryMemberId = id;
        _secondaryFirstName = firstName;
        _secondaryLastName = lastName;
        return this;
    }

    public (ChurchMember primary, ChurchMember secondary) BuildMembers()
    {
        var primary = ChurchMemberBuilder.AChurchMember()
            .WithId(_primaryMemberId)
            .WithFullName(_primaryFirstName, _primaryLastName)
            .WithBankReference(_reference)
            .Build();

        var secondary = ChurchMemberBuilder.AChurchMember()
            .WithId(_secondaryMemberId)
            .WithFullName(_secondaryFirstName, _secondaryLastName)
            .WithBankReference(_reference)
            .Build();

        return (primary, secondary);
    }

    public ChurchMember BuildPrimaryMember()
    {
        return ChurchMemberBuilder.AChurchMember()
            .WithId(_primaryMemberId)
            .WithFullName(_primaryFirstName, _primaryLastName)
            .WithBankReference(_reference)
            .Build();
    }

    public ChurchMember BuildSecondaryMember()
    {
        return ChurchMemberBuilder.AChurchMember()
            .WithId(_secondaryMemberId)
            .WithFullName(_secondaryFirstName, _secondaryLastName)
            .WithBankReference(_reference)
            .Build();
    }
}
