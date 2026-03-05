namespace ChurchRegister.ApiService.Exceptions;

/// <summary>
/// Exception thrown when business validation fails.
/// Results in HTTP 400 Bad Request response.
/// </summary>
public class ValidationException : Exception
{
    public List<string> Errors { get; }

    public ValidationException()
        : base("One or more validation errors occurred.")
    {
        Errors = new List<string>();
    }

    public ValidationException(string message)
        : base(message)
    {
        Errors = new List<string> { message };
    }

    public ValidationException(IEnumerable<string> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors.ToList();
    }

    public ValidationException(string message, Exception innerException)
        : base(message, innerException)
    {
        Errors = new List<string> { message };
    }
}
