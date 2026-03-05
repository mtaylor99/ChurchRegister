using System.Text.RegularExpressions;

namespace ChurchRegister.ApiService.Helpers;

/// <summary>
/// Utility for redacting sensitive data from log messages and structured log parameters.
/// Use this to prevent PII and secrets from appearing in log output.
/// </summary>
public static partial class SensitiveDataRedactor
{
    /// <summary>
    /// Redacts an email address, preserving the first character and domain.
    /// e.g., "john.doe@example.com" → "j***@example.com"
    /// </summary>
    public static string RedactEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return "[empty]";

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0)
            return "***";

        return $"{email[0]}***{email[atIndex..]}";
    }

    /// <summary>
    /// Redacts a token value, showing only the first 4 and last 4 characters.
    /// e.g., "eyJhbGciOi...xyz123" → "eyJh...z123"
    /// </summary>
    public static string RedactToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return "[empty]";

        if (token.Length <= 8)
            return "***";

        return $"{token[..4]}...{token[^4..]}";
    }

    /// <summary>
    /// Redacts a string, showing only the first N characters.
    /// </summary>
    public static string RedactString(string? value, int visibleChars = 2)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "[empty]";

        if (value.Length <= visibleChars)
            return "***";

        return $"{value[..visibleChars]}***";
    }

    /// <summary>
    /// Scans a log message for common sensitive patterns and redacts them.
    /// Handles: JWT tokens, email addresses, passwords, connection strings.
    /// </summary>
    public static string RedactMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return message ?? string.Empty;

        // Redact JWT tokens (eyJ...)
        message = JwtPattern().Replace(message, "eyJ***[REDACTED]");

        // Redact email addresses
        message = EmailPattern().Replace(message, match =>
            RedactEmail(match.Value));

        // Redact password values in key=value patterns
        message = PasswordPattern().Replace(message, "$1=[REDACTED]");

        return message;
    }

    [GeneratedRegex(@"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", RegexOptions.None, matchTimeoutMilliseconds: 1000)]
    private static partial Regex JwtPattern();

    [GeneratedRegex(@"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", RegexOptions.None, matchTimeoutMilliseconds: 1000)]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"(password|pwd|secret|token|key)\s*[=:]\s*\S+", RegexOptions.IgnoreCase, matchTimeoutMilliseconds: 1000)]
    private static partial Regex PasswordPattern();
}
