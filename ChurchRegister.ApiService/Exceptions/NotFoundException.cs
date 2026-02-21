namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when a requested resource is not found.
/// Results in HTTP 404 Not Found response.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException()
        : base("The requested resource was not found.")
    {
    }

    public NotFoundException(string message)
        : base(message)
    {
    }

    public NotFoundException(string resourceType, object resourceId)
        : base($"{resourceType} with ID '{resourceId}' was not found.")
    {
    }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
