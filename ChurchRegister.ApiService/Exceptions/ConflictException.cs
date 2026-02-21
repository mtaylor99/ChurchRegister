namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when a resource conflict occurs (e.g., duplicate entries).
/// Results in HTTP 409 Conflict response.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException()
        : base("The request conflicts with the current state of the resource.")
    {
    }

    public ConflictException(string message)
        : base(message)
    {
    }

    public ConflictException(string resourceType, string conflictReason)
        : base($"{resourceType} already exists: {conflictReason}")
    {
    }

    public ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
