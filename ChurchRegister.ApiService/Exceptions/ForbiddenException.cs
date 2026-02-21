namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when a user lacks permission to access a resource.
/// Results in HTTP 403 Forbidden response.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException()
        : base("You do not have permission to access this resource.")
    {
    }

    public ForbiddenException(string message)
        : base(message)
    {
    }

    public ForbiddenException(string action, string resource)
        : base($"You do not have permission to {action} {resource}.")
    {
    }

    public ForbiddenException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
