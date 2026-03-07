using ChurchRegister.ApiService.Exceptions;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Exceptions;

/// <summary>
/// Tests for all custom exception types to ensure constructors and properties work correctly.
/// </summary>
public class ExceptionTests
{
    // ─── ValidationException ────────────────────────────────────────────────

    [Fact]
    public void ValidationException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new ValidationException();
        ex.Message.Should().Be("One or more validation errors occurred.");
        ex.Errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidationException_WithMessage_SetsMessageAndErrors()
    {
        var ex = new ValidationException("Field is required.");
        ex.Message.Should().Be("Field is required.");
        ex.Errors.Should().ContainSingle().Which.Should().Be("Field is required.");
    }

    [Fact]
    public void ValidationException_WithEnumerableErrors_SetsAllErrors()
    {
        var errors = new[] { "Error 1", "Error 2", "Error 3" };
        var ex = new ValidationException(errors);
        ex.Message.Should().Be("One or more validation errors occurred.");
        ex.Errors.Should().BeEquivalentTo(errors);
    }

    [Fact]
    public void ValidationException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new ValidationException("Outer message", inner);
        ex.Message.Should().Be("Outer message");
        ex.InnerException.Should().BeSameAs(inner);
        ex.Errors.Should().ContainSingle().Which.Should().Be("Outer message");
    }

    // ─── ConflictException ──────────────────────────────────────────────────

    [Fact]
    public void ConflictException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new ConflictException();
        ex.Message.Should().Be("The request conflicts with the current state of the resource.");
    }

    [Fact]
    public void ConflictException_WithMessage_SetsMessage()
    {
        var ex = new ConflictException("Duplicate entry detected.");
        ex.Message.Should().Be("Duplicate entry detected.");
    }

    [Fact]
    public void ConflictException_WithResourceTypeAndReason_FormatsMessage()
    {
        var ex = new ConflictException("ChurchMember", "BankReference already used");
        ex.Message.Should().Be("ChurchMember already exists: BankReference already used");
    }

    [Fact]
    public void ConflictException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new ConflictException("Conflict!", inner);
        ex.Message.Should().Be("Conflict!");
        ex.InnerException.Should().BeSameAs(inner);
    }

    // ─── NotFoundException ──────────────────────────────────────────────────

    [Fact]
    public void NotFoundException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new NotFoundException();
        ex.Message.Should().Be("The requested resource was not found.");
    }

    [Fact]
    public void NotFoundException_WithMessage_SetsMessage()
    {
        var ex = new NotFoundException("Member not found.");
        ex.Message.Should().Be("Member not found.");
    }

    [Fact]
    public void NotFoundException_WithResourceTypeAndId_FormatsMessage()
    {
        var ex = new NotFoundException("ChurchMember", 42);
        ex.Message.Should().Be("ChurchMember with ID '42' was not found.");
    }

    [Fact]
    public void NotFoundException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new NotFoundException("Not here!", inner);
        ex.Message.Should().Be("Not here!");
        ex.InnerException.Should().BeSameAs(inner);
    }

    // ─── ForbiddenException ─────────────────────────────────────────────────

    [Fact]
    public void ForbiddenException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new ForbiddenException();
        ex.Message.Should().Be("You do not have permission to access this resource.");
    }

    [Fact]
    public void ForbiddenException_WithMessage_SetsMessage()
    {
        var ex = new ForbiddenException("Access denied.");
        ex.Message.Should().Be("Access denied.");
    }

    [Fact]
    public void ForbiddenException_WithActionAndResource_FormatsMessage()
    {
        var ex = new ForbiddenException("delete", "ChurchMember");
        ex.Message.Should().Be("You do not have permission to delete ChurchMember.");
    }

    [Fact]
    public void ForbiddenException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new ForbiddenException("Forbidden!", inner);
        ex.Message.Should().Be("Forbidden!");
        ex.InnerException.Should().BeSameAs(inner);
    }

    // ─── UnauthorizedException ──────────────────────────────────────────────

    [Fact]
    public void UnauthorizedException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new UnauthorizedException();
        ex.Message.Should().Be("Authentication is required to access this resource.");
    }

    [Fact]
    public void UnauthorizedException_WithMessage_SetsMessage()
    {
        var ex = new UnauthorizedException("Login required.");
        ex.Message.Should().Be("Login required.");
    }

    [Fact]
    public void UnauthorizedException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new UnauthorizedException("Unauthorized!", inner);
        ex.Message.Should().Be("Unauthorized!");
        ex.InnerException.Should().BeSameAs(inner);
    }

    // ─── OutlookNotInstalledException ───────────────────────────────────────

    [Fact]
    public void OutlookNotInstalledException_DefaultConstructor_SetsDefaultMessage()
    {
        var ex = new OutlookNotInstalledException();
        ex.Message.Should().Contain("Microsoft Outlook");
    }

    [Fact]
    public void OutlookNotInstalledException_WithMessage_SetsMessage()
    {
        var ex = new OutlookNotInstalledException("Outlook missing.");
        ex.Message.Should().Be("Outlook missing.");
    }

    [Fact]
    public void OutlookNotInstalledException_WithMessageAndInnerException_SetsAll()
    {
        var inner = new Exception("inner");
        var ex = new OutlookNotInstalledException("No Outlook!", inner);
        ex.Message.Should().Be("No Outlook!");
        ex.InnerException.Should().BeSameAs(inner);
    }

    // ─── Base exception hierarchy ────────────────────────────────────────────

    [Fact]
    public void ValidationException_IsException()
    {
        var ex = new ValidationException();
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void ConflictException_IsException()
    {
        var ex = new ConflictException();
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void NotFoundException_IsException()
    {
        var ex = new NotFoundException();
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void ForbiddenException_IsException()
    {
        var ex = new ForbiddenException();
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void UnauthorizedException_IsException()
    {
        var ex = new UnauthorizedException();
        ex.Should().BeAssignableTo<Exception>();
    }
}
