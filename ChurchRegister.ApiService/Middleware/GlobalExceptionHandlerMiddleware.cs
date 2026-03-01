using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Security;
using System.Net;
using System.Text.Json;

namespace ChurchRegister.ApiService.Middleware;

/// <summary>
/// Global exception handling middleware that catches unhandled exceptions
/// and returns consistent error responses with appropriate HTTP status codes.
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.TraceIdentifier;
        var (statusCode, errorResponse) = MapExceptionToResponse(exception, correlationId);

        // Log exception with appropriate level
        LogException(exception, correlationId, context.Request.Path);

        // Set response
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, options));
    }

    private (HttpStatusCode statusCode, ErrorResponse response) MapExceptionToResponse(
        Exception exception,
        string correlationId)
    {
        return exception switch
        {
            NotFoundException notFound => (
                HttpStatusCode.NotFound,
                new ErrorResponse
                {
                    Message = notFound.Message,
                    Errors = new List<string>(),
                    CorrelationId = correlationId
                }),

            ValidationException validation => (
                HttpStatusCode.BadRequest,
                new ErrorResponse
                {
                    Message = validation.Message,
                    Errors = validation.Errors,
                    CorrelationId = correlationId
                }),

            ConflictException conflict => (
                HttpStatusCode.Conflict,
                new ErrorResponse
                {
                    Message = conflict.Message,
                    Errors = new List<string>(),
                    CorrelationId = correlationId
                }),

            UnauthorizedException unauthorized => (
                HttpStatusCode.Unauthorized,
                new ErrorResponse
                {
                    Message = unauthorized.Message,
                    Errors = new List<string>(),
                    CorrelationId = correlationId
                }),

            ForbiddenException forbidden => (
                HttpStatusCode.Forbidden,
                new ErrorResponse
                {
                    Message = forbidden.Message,
                    Errors = new List<string>(),
                    CorrelationId = correlationId
                }),

            _ => (
                HttpStatusCode.InternalServerError,
                new ErrorResponse
                {
                    Message = _environment.IsDevelopment()
                        ? exception.Message
                        : "An internal server error occurred. Please try again later.",
                    Errors = _environment.IsDevelopment() && exception.StackTrace != null
                        ? new List<string> { exception.StackTrace }
                        : new List<string>(),
                    CorrelationId = correlationId
                })
        };
    }

    private void LogException(Exception exception, string correlationId, PathString path)
    {
        var logMessage = "Unhandled exception occurred. CorrelationId: {CorrelationId}, Path: {Path}, Exception: {ExceptionType}";

        switch (exception)
        {
            case NotFoundException:
            case ConflictException:
                // These are expected business exceptions - log as information
                _logger.LogInformation(exception, logMessage, correlationId, path, exception.GetType().Name);
                break;

            case ValidationException:
            case UnauthorizedException:
            case ForbiddenException:
                // These indicate client errors - log as warning
                _logger.LogWarning(exception, logMessage, correlationId, path, exception.GetType().Name);
                break;

            default:
                // Unexpected exceptions - log as error
                _logger.LogError(exception, logMessage, correlationId, path, exception.GetType().Name);
                break;
        }
    }
}

/// <summary>
/// Extension methods for registering the global exception handler middleware.
/// </summary>
public static class GlobalExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    }
}
