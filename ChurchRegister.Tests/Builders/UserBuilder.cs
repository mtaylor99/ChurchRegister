using ChurchRegister.Database.Data;
using System.Security.Claims;

namespace ChurchRegister.Tests.Builders;

/// <summary>
/// Fluent builder for creating ChurchRegisterWebUser test data with sensible defaults.
/// Usage: UserBuilder.AUser().WithEmail("user@example.com").WithRole("Admin").Build()
/// </summary>
public class UserBuilder
{
    private string _id = Guid.NewGuid().ToString();
    private string _userName = "testuser@example.com";
    private string _email = "testuser@example.com";
    private bool _emailConfirmed = true;
    private string? _phoneNumber = "01234567890";
    private bool _phoneNumberConfirmed = false;
    private bool _lockoutEnabled = false;
    private DateTimeOffset? _lockoutEnd;
    private int _accessFailedCount = 0;
    private readonly List<string> _roles = new();
    private readonly List<Claim> _claims = new();

    private UserBuilder()
    {
    }

    public static UserBuilder AUser() => new();

    public UserBuilder WithId(string id)
    {
        _id = id;
        return this;
    }

    public UserBuilder WithUserName(string userName)
    {
        _userName = userName;
        return this;
    }

    public UserBuilder WithEmail(string email)
    {
        _email = email;
        _userName = email; // Convention: username matches email
        return this;
    }

    public UserBuilder WithEmailConfirmed(bool confirmed)
    {
        _emailConfirmed = confirmed;
        return this;
    }

    public UserBuilder WithPhoneNumber(string? phoneNumber)
    {
        _phoneNumber = phoneNumber;
        return this;
    }

    public UserBuilder WithPhoneNumberConfirmed(bool confirmed)
    {
        _phoneNumberConfirmed = confirmed;
        return this;
    }

    public UserBuilder WithLockoutEnabled(bool enabled)
    {
        _lockoutEnabled = enabled;
        return this;
    }

    public UserBuilder WithLockoutEnd(DateTimeOffset? lockoutEnd)
    {
        _lockoutEnd = lockoutEnd;
        return this;
    }

    public UserBuilder WithAccessFailedCount(int count)
    {
        _accessFailedCount = count;
        return this;
    }

    public UserBuilder WithRole(string role)
    {
        _roles.Add(role);
        return this;
    }

    public UserBuilder WithRoles(params string[] roles)
    {
        _roles.AddRange(roles);
        return this;
    }

    public UserBuilder WithClaim(string type, string value)
    {
        _claims.Add(new Claim(type, value));
        return this;
    }

    public UserBuilder WithPermission(string permission)
    {
        _claims.Add(new Claim("permission", permission));
        return this;
    }

    // Convenience methods
    public UserBuilder EmailConfirmed()
    {
        _emailConfirmed = true;
        return this;
    }

    public UserBuilder EmailNotConfirmed()
    {
        _emailConfirmed = false;
        return this;
    }

    public UserBuilder Locked()
    {
        _lockoutEnabled = true;
        _lockoutEnd = DateTimeOffset.UtcNow.AddDays(7);
        return this;
    }

    public UserBuilder LockedUntil(DateTimeOffset lockoutEnd)
    {
        _lockoutEnabled = true;
        _lockoutEnd = lockoutEnd;
        return this;
    }

    public UserBuilder Active()
    {
        _lockoutEnabled = false;
        _lockoutEnd = null;
        return this;
    }

    public UserBuilder AsAdmin()
    {
        _roles.Add("Admin");
        return this;
    }

    public UserBuilder AsMember()
    {
        _roles.Add("Member");
        return this;
    }

    public UserBuilder AsElder()
    {
        _roles.Add("Elder");
        return this;
    }

    public UserBuilder AsDeacon()
    {
        _roles.Add("Deacon");
        return this;
    }

    public ChurchRegisterWebUser Build()
    {
        return new ChurchRegisterWebUser
        {
            Id = _id,
            UserName = _userName,
            Email = _email,
            EmailConfirmed = _emailConfirmed,
            PhoneNumber = _phoneNumber,
            PhoneNumberConfirmed = _phoneNumberConfirmed,
            LockoutEnabled = _lockoutEnabled,
            LockoutEnd = _lockoutEnd,
            AccessFailedCount = _accessFailedCount
        };
    }

    public (ChurchRegisterWebUser User, List<string> Roles, List<Claim> Claims) BuildWithRolesAndClaims()
    {
        return (Build(), _roles, _claims);
    }

    public List<string> GetRoles() => _roles;

    public List<Claim> GetClaims() => _claims;
}
