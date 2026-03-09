namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when authentication is required but not provided.
/// Results in HTTP 401 Unauthorized response.
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException()
        : base("Authentication is required to access this resource.")
    {
    }

    public UnauthorizedException(string message)
        : base(message)
    {
    }

    public UnauthorizedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
