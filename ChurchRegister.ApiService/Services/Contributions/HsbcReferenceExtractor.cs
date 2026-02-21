namespace ChurchRegister.ApiService.Services.Contributions;

/// <summary>
/// Static utility for extracting payment references from HSBC transaction descriptions
/// </summary>
public static class HsbcReferenceExtractor
{
    private static readonly string[] TrailingTokens = 
    {
        " VIA ",
        " ONLINE BANKING",
        " MOBILE APP",
        " ON ",
        " AT "
    };

    /// <summary>
    /// Extract payment reference from HSBC transaction description
    /// </summary>
    /// <param name="description">Transaction description from bank statement</param>
    /// <returns>Extracted reference or empty string if not found</returns>
    public static string ExtractReference(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return string.Empty;

        const string marker = " REF ";
        int index = description.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (index < 0)
            return string.Empty;

        string afterRef = description[(index + marker.Length)..].Trim();

        foreach (var token in TrailingTokens)
        {
            int tokenIndex = afterRef.IndexOf(token, StringComparison.OrdinalIgnoreCase);
            if (tokenIndex > 0)
            {
                afterRef = afterRef[..tokenIndex].Trim();
                break;
            }
        }

        // Truncate to max length (100 chars as per database schema)
        if (afterRef.Length > 100)
            afterRef = afterRef[..100];

        return afterRef;
    }
}
