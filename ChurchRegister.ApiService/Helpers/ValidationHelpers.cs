using System.Text.RegularExpressions;
using ChurchRegister.ApiService.Exceptions;

namespace ChurchRegister.ApiService.Helpers;

/// <summary>
/// Common validation helpers for input validation across services and endpoints.
/// Provides reusable validation logic with consistent error messages.
/// </summary>
public static class ValidationHelpers
{
    /// <summary>
    /// Validates that a string is not null or whitespace.
    /// </summary>
    /// <param name="value">The value to validate</param>
    /// <param name="fieldName">The name of the field for error messages</param>
    /// <exception cref="ValidationException">Thrown when validation fails</exception>
    public static void RequireNonEmpty(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ValidationException($"{fieldName} is required and cannot be empty.");
        }
    }

    /// <summary>
    /// Validates that a value is not null.
    /// </summary>
    public static void RequireNotNull<T>(T? value, string fieldName) where T : class
    {
        if (value == null)
        {
            throw new ValidationException($"{fieldName} is required and cannot be null.");
        }
    }

    /// <summary>
    /// Validates that a string meets minimum length requirements.
    /// </summary>
    public static void RequireMinLength(string? value, int minLength, string fieldName)
    {
        if (string.IsNullOrEmpty(value) || value.Length < minLength)
        {
            throw new ValidationException($"{fieldName} must be at least {minLength} characters long.");
        }
    }

    /// <summary>
    /// Validates that a string does not exceed maximum length.
    /// </summary>
    public static void RequireMaxLength(string? value, int maxLength, string fieldName)
    {
        if (!string.IsNullOrEmpty(value) && value.Length > maxLength)
        {
            throw new ValidationException($"{fieldName} must not exceed {maxLength} characters.");
        }
    }

    /// <summary>
    /// Validates email address format.
    /// </summary>
    public static void RequireValidEmail(string? email, string fieldName = "Email")
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ValidationException($"{fieldName} is required.");
        }

        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
        if (!emailRegex.IsMatch(email))
        {
            throw new ValidationException($"{fieldName} must be a valid email address.");
        }
    }

    /// <summary>
    /// Validates UK phone number format (allows various formats).
    /// </summary>
    public static void RequireValidUKPhone(string? phone, string fieldName = "Phone Number")
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return; // Optional field
        }

        var phoneRegex = new Regex(@"^(\+44\s?|0)(\d\s?){9,10}$");
        var cleanPhone = phone.Replace(" ", "");
        
        if (!phoneRegex.IsMatch(cleanPhone))
        {
            throw new ValidationException($"{fieldName} must be a valid UK phone number.");
        }
    }

    /// <summary>
    /// Validates that a number is positive (greater than zero).
    /// </summary>
    public static void RequirePositive(decimal value, string fieldName)
    {
        if (value <= 0)
        {
            throw new ValidationException($"{fieldName} must be greater than zero.");
        }
    }

    /// <summary>
    /// Validates that a number is non-negative (zero or greater).
    /// </summary>
    public static void RequireNonNegative(decimal value, string fieldName)
    {
        if (value < 0)
        {
            throw new ValidationException($"{fieldName} must be zero or greater.");
        }
    }

    /// <summary>
    /// Validates that a date is not in the future.
    /// </summary>
    public static void RequireNotFutureDate(DateTime? date, string fieldName)
    {
        if (date.HasValue && date.Value.Date > DateTime.UtcNow.Date)
        {
            throw new ValidationException($"{fieldName} cannot be in the future.");
        }
    }

    /// <summary>
    /// Validates that a date is not in the past.
    /// </summary>
    public static void RequireNotPastDate(DateTime? date, string fieldName)
    {
        if (date.HasValue && date.Value.Date < DateTime.UtcNow.Date)
        {
            throw new ValidationException($"{fieldName} cannot be in the past.");
        }
    }

    /// <summary>
    /// Validates UK postcode format.
    /// </summary>
    public static void RequireValidUKPostcode(string? postcode, string fieldName = "Postcode")
    {
        if (string.IsNullOrWhiteSpace(postcode))
        {
            return; // Optional field
        }

        var postcodeRegex = new Regex(@"^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$", RegexOptions.IgnoreCase);
        
        if (!postcodeRegex.IsMatch(postcode))
        {
            throw new ValidationException($"{fieldName} must be a valid UK postcode.");
        }
    }

    /// <summary>
    /// Validates that a bank reference contains only allowed characters.
    /// </summary>
    public static void RequireValidBankReference(string? reference, string fieldName = "Bank Reference")
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            return; // Optional field
        }

        var referenceRegex = new Regex(@"^[A-Za-z0-9-]+$");
        
        if (!referenceRegex.IsMatch(reference))
        {
            throw new ValidationException($"{fieldName} must contain only letters, numbers, and hyphens.");
        }

        RequireMaxLength(reference, 100, fieldName);
    }

    /// <summary>
    /// Validates that a value is within a specified range.
    /// </summary>
    public static void RequireInRange(int value, int min, int max, string fieldName)
    {
        if (value < min || value > max)
        {
            throw new ValidationException($"{fieldName} must be between {min} and {max}.");
        }
    }

    /// <summary>
    /// Validates that a collection is not null or empty.
    /// </summary>
    public static void RequireNonEmptyCollection<T>(IEnumerable<T>? collection, string fieldName)
    {
        if (collection == null || !collection.Any())
        {
            throw new ValidationException($"{fieldName} must contain at least one item.");
        }
    }

    /// <summary>
    /// Validates that a GUID is not empty.
    /// </summary>
    public static void RequireValidGuid(Guid value, string fieldName)
    {
        if (value == Guid.Empty)
        {
            throw new ValidationException($"{fieldName} must be a valid identifier.");
        }
    }

    /// <summary>
    /// Validates page size for pagination (must be between 1 and max).
    /// </summary>
    public static void RequireValidPageSize(int pageSize, int maxPageSize = 100)
    {
        if (pageSize < 1)
        {
            throw new ValidationException("Page size must be at least 1.");
        }

        if (pageSize > maxPageSize)
        {
            throw new ValidationException($"Page size must not exceed {maxPageSize}.");
        }
    }

    /// <summary>
    /// Validates page number for pagination (must be non-negative).
    /// </summary>
    public static void RequireValidPageNumber(int pageNumber)
    {
        if (pageNumber < 0)
        {
            throw new ValidationException("Page number must be zero or greater.");
        }
    }
}
