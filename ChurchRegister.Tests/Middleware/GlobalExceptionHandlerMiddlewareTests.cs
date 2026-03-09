using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;

namespace ChurchRegister.ApiService.Tests.Middleware;

/// <summary>
/// Unit tests for GlobalExceptionHandlerMiddleware.
/// Verifies that each exception type maps to the correct HTTP status code.
/// </summary>
public class GlobalExceptionHandlerMiddlewareTests
{
    private readonly Mock<ILogger<GlobalExceptionHandlerMiddleware>> _mockLogger;
    private readonly Mock<IHostEnvironment> _mockEnvironment;

    public GlobalExceptionHandlerMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<GlobalExceptionHandlerMiddleware>>();
        _mockEnvironment = new Mock<IHostEnvironment>();
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
    }

    private (GlobalExceptionHandlerMiddleware middleware, DefaultHttpContext context) BuildMiddleware(Exception exToThrow)
    {
        RequestDelegate next = _ => throw exToThrow;
        var middleware = new GlobalExceptionHandlerMiddleware(next, _mockLogger.Object, _mockEnvironment.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return (middleware, context);
    }

    private async Task<(int statusCode, string body)> InvokeAndRead(Exception ex)
    {
        var (middleware, context) = BuildMiddleware(ex);
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body, Encoding.UTF8).ReadToEndAsync();
        return (context.Response.StatusCode, body);
    }

    [Fact]
    public async Task InvokeAsync_NotFoundException_Returns404()
    {
        var (statusCode, body) = await InvokeAndRead(new NotFoundException("Member not found."));
        statusCode.Should().Be(404);
        body.Should().Contain("Member not found.");
    }

    [Fact]
    public async Task InvokeAsync_ValidationException_Returns400()
    {
        var (statusCode, body) = await InvokeAndRead(new ValidationException("Field is required."));
        statusCode.Should().Be(400);
        body.Should().Contain("Field is required.");
    }

    [Fact]
    public async Task InvokeAsync_ValidationExceptionWithErrors_Returns400WithErrors()
    {
        var errors = new[] { "Error A", "Error B" };
        var (statusCode, body) = await InvokeAndRead(new ValidationException(errors));
        statusCode.Should().Be(400);
        body.Should().Contain("Error A");
        body.Should().Contain("Error B");
    }

    [Fact]
    public async Task InvokeAsync_ConflictException_Returns409()
    {
        var (statusCode, body) = await InvokeAndRead(new ConflictException("Duplicate entry."));
        statusCode.Should().Be(409);
        body.Should().Contain("Duplicate entry.");
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedException_Returns401()
    {
        var (statusCode, body) = await InvokeAndRead(new UnauthorizedException("Not authenticated."));
        statusCode.Should().Be(401);
        body.Should().Contain("Not authenticated.");
    }

    [Fact]
    public async Task InvokeAsync_ForbiddenException_Returns403()
    {
        var (statusCode, body) = await InvokeAndRead(new ForbiddenException("No permission."));
        statusCode.Should().Be(403);
        body.Should().Contain("No permission.");
    }

    [Fact]
    public async Task InvokeAsync_GenericException_Returns500()
    {
        var (statusCode, body) = await InvokeAndRead(new InvalidOperationException("Something went wrong."));
        statusCode.Should().Be(500);
        body.Should().Contain("An internal server error occurred");
    }

    [Fact]
    public async Task InvokeAsync_GenericException_InDevelopment_ReturnsExceptionMessage()
    {
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
        var (statusCode, body) = await InvokeAndRead(new InvalidOperationException("Dev detail message."));
        statusCode.Should().Be(500);
        body.Should().Contain("Dev detail message.");
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        var nextCalled = false;
        RequestDelegate next = _ => { nextCalled = true; return Task.CompletedTask; };
        var middleware = new GlobalExceptionHandlerMiddleware(next, _mockLogger.Object, _mockEnvironment.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task InvokeAsync_ResponseContainsCorrelationId()
    {
        var (statusCode, body) = await InvokeAndRead(new NotFoundException("Gone."));
        body.Should().Contain("correlationId");
    }

    [Fact]
    public async Task InvokeAsync_ResponseContentTypeIsJson()
    {
        var (middleware, context) = BuildMiddleware(new NotFoundException("Gone."));
        await middleware.InvokeAsync(context);
        context.Response.ContentType.Should().Be("application/json");
    }
}
