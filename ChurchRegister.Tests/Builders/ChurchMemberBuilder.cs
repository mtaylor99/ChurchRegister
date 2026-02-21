using ChurchRegister.Database.Entities;

namespace ChurchRegister.Tests.Builders;

/// <summary>
/// Fluent builder for creating ChurchMember test data with sensible defaults.
/// Usage: ChurchMemberBuilder.AChurchMember().WithFullName("John", "Doe").Active().Build()
/// </summary>
public class ChurchMemberBuilder
{
    private int _id = 1;
    private string _firstName = "John";
    private string _lastName = "Doe";
    private string? _phoneNumber = "01234567890";
    private string? _emailAddress = "john.doe@example.com";
    private string? _bankReference = "REF001";
    private int? _addressId = 1;
    private int _churchMemberStatusId = 1; // Active by default
    private int? _districtId = 1;
    private bool _baptised = true;
    private DateTime? _memberSince = DateTime.UtcNow.AddYears(-1);
    private bool _giftAid = false;
    private string _createdBy = "test-user";
    private DateTime _createdDateTime = DateTime.UtcNow.AddMonths(-6);
    private string? _modifiedBy;
    private DateTime? _modifiedDateTime;

    private ChurchMemberBuilder()
    {
    }

    public static ChurchMemberBuilder AChurchMember() => new();

    public ChurchMemberBuilder WithId(int id)
    {
        _id = id;
        return this;
    }

    public ChurchMemberBuilder WithFirstName(string firstName)
    {
        _firstName = firstName;
        return this;
    }

    public ChurchMemberBuilder WithLastName(string lastName)
    {
        _lastName = lastName;
        return this;
    }

    public ChurchMemberBuilder WithFullName(string firstName, string lastName)
    {
        _firstName = firstName;
        _lastName = lastName;
        return this;
    }

    public ChurchMemberBuilder WithPhoneNumber(string? phoneNumber)
    {
        _phoneNumber = phoneNumber;
        return this;
    }

    public ChurchMemberBuilder WithEmailAddress(string? emailAddress)
    {
        _emailAddress = emailAddress;
        return this;
    }

    public ChurchMemberBuilder WithBankReference(string? bankReference)
    {
        _bankReference = bankReference;
        return this;
    }

    public ChurchMemberBuilder WithAddressId(int? addressId)
    {
        _addressId = addressId;
        return this;
    }

    public ChurchMemberBuilder WithChurchMemberStatusId(int churchMemberStatusId)
    {
        _churchMemberStatusId = churchMemberStatusId;
        return this;
    }

    public ChurchMemberBuilder WithDistrictId(int? districtId)
    {
        _districtId = districtId;
        return this;
    }

    public ChurchMemberBuilder WithBaptised(bool baptised)
    {
        _baptised = baptised;
        return this;
    }

    public ChurchMemberBuilder WithMemberSince(DateTime? memberSince)
    {
        _memberSince = memberSince;
        return this;
    }

    public ChurchMemberBuilder WithGiftAid(bool giftAid)
    {
        _giftAid = giftAid;
        return this;
    }

    public ChurchMemberBuilder WithAudit(string createdBy, DateTime createdDateTime, string? modifiedBy = null, DateTime? modifiedDateTime = null)
    {
        _createdBy = createdBy;
        _createdDateTime = createdDateTime;
        _modifiedBy = modifiedBy;
        _modifiedDateTime = modifiedDateTime;
        return this;
    }

    // Convenience methods
    public ChurchMemberBuilder Active()
    {
        _churchMemberStatusId = 1;
        return this;
    }

    public ChurchMemberBuilder Inactive()
    {
        _churchMemberStatusId = 2;
        return this;
    }

    public ChurchMemberBuilder WithoutEmail()
    {
        _emailAddress = null;
        return this;
    }

    public ChurchMemberBuilder WithoutPhone()
    {
        _phoneNumber = null;
        return this;
    }

    public ChurchMemberBuilder WithoutBankReference()
    {
        _bankReference = null;
        return this;
    }

    public ChurchMemberBuilder WithGiftAidEnabled()
    {
        _giftAid = true;
        return this;
    }

    public ChurchMemberBuilder AsNewMember()
    {
        _memberSince = DateTime.UtcNow.AddMonths(-1);
        _baptised = false;
        return this;
    }

    public ChurchMemberBuilder AsLongTermMember()
    {
        _memberSince = DateTime.UtcNow.AddYears(-10);
        _baptised = true;
        return this;
    }

    public ChurchMember Build()
    {
        return new ChurchMember
        {
            Id = _id,
            FirstName = _firstName,
            LastName = _lastName,
            PhoneNumber = _phoneNumber,
            EmailAddress = _emailAddress,
            BankReference = _bankReference,
            AddressId = _addressId,
            ChurchMemberStatusId = _churchMemberStatusId,
            DistrictId = _districtId,
            Baptised = _baptised,
            MemberSince = _memberSince,
            GiftAid = _giftAid,
            CreatedBy = _createdBy,
            CreatedDateTime = _createdDateTime,
            ModifiedBy = _modifiedBy,
            ModifiedDateTime = _modifiedDateTime
        };
    }
}
