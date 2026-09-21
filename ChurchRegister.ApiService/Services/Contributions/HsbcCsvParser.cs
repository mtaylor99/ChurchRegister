using ChurchRegister.ApiService.Models.Contributions;
using System.Globalization;
using System.Text;

namespace ChurchRegister.ApiService.Services.Contributions;

/// <summary>
/// Implementation of HSBC CSV parser for v2 format with automatic column detection
/// </summary>
/// <remarks>
/// Parses HSBC bank statement CSV files in v2 format exported from HSBC Online Banking.
/// Expected columns: Date, Type, Description, Paid Out, Paid In, Balance.
/// Only imports CR (Credit) transactions; BP (Bank Payment) and DD (Direct Debit) are excluded.
/// References are taken directly from the Description field without extraction.
/// </remarks>
public class HsbcCsvParser : IHsbcCsvParser
{
    public async Task<HsbcParseResult> ParseAsync(Stream csvStream, CancellationToken cancellationToken = default)
    {
        var result = new HsbcParseResult();

        try
        {
            using var reader = new StreamReader(csvStream);
            var csvContent = await reader.ReadToEndAsync(cancellationToken);

            var lines = csvContent.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim('\r'))
                .ToList();

            if (lines.Count < 2)
            {
                result.Errors.Add("CSV file must contain at least a header row and one data row");
                return result;
            }

            // Parse header
            var header = SplitCsvLine(lines[0]);
            var colIndex = header
                .Select((name, index) => new { name = name.Trim().ToLower(), index })
                .ToDictionary(x => x.name, x => x.index);

            // Verify required columns exist
            if (!HasRequiredColumns(colIndex, out var missingColumns))
            {
                result.Errors.Add($"Missing required columns: {string.Join(", ", missingColumns)}");
                return result;
            }

            result.TotalRows = lines.Count - 1;

            // Parse data rows
            for (int i = 1; i < lines.Count; i++)
            {
                try
                {
                    var cols = SplitCsvLine(lines[i]);
                    if (cols.Length == 0)
                        continue;

                    // v2 format: Filter by transaction type - only import CR (credit) transactions
                    var transactionType = Get(cols, colIndex, "type");
                    if (!string.Equals(transactionType, "CR", StringComparison.OrdinalIgnoreCase))
                        continue; // Skip BP (Bank Payment) and DD (Direct Debit) transactions

                    var tx = new HsbcTransaction
                    {
                        Date = ParseDate(cols, colIndex, "date"),
                        Description = Get(cols, colIndex, "description"),
                        MoneyIn = ParseDecimal(cols, colIndex, "paid in") ?? 0
                    };

                    // v2 format: Use description directly as reference (no extraction needed)
                    tx.Reference = tx.Description.Trim();

                    // Only add if it's a credit transaction with positive amount
                    if (tx.MoneyIn > 0)
                    {
                        result.Transactions.Add(tx);
                    }
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Error parsing row {i + 1}: {ex.Message}");
                    // Continue processing other rows
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Error reading CSV file: {ex.Message}");
            return result;
        }
    }

    private static bool HasRequiredColumns(Dictionary<string, int> colIndex, out List<string> missingColumns)
    {
        missingColumns = new List<string>();

        // v2 format: Date, Type, Description, Paid Out, Paid In, Balance
        if (!colIndex.ContainsKey("date"))
            missingColumns.Add("Date");

        if (!colIndex.ContainsKey("type"))
            missingColumns.Add("Type");

        if (!colIndex.ContainsKey("description"))
            missingColumns.Add("Description");

        if (!colIndex.ContainsKey("paid in"))
            missingColumns.Add("Paid In");

        return !missingColumns.Any();
    }

    private static string Get(string[] cols, Dictionary<string, int> map, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (map.TryGetValue(key, out int idx) && idx < cols.Length)
                return cols[idx].Trim();
        }
        return string.Empty;
    }

    private static DateTime ParseDate(string[] cols, Dictionary<string, int> map, string key)
    {
        if (map.TryGetValue(key, out int idx) && idx < cols.Length)
        {
            var dateStr = cols[idx].Trim();
            // Support both v1 format (DD/MM/YYYY) and v2 format (DD-MMM-YY)
            if (DateTime.TryParse(dateStr, CultureInfo.GetCultureInfo("en-GB"), DateTimeStyles.None, out var dt))
                return dt;
        }

        return DateTime.MinValue;
    }

    private static decimal? ParseDecimal(string[] cols, Dictionary<string, int> map, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (map.TryGetValue(key, out int idx) && idx < cols.Length)
            {
                var valueStr = cols[idx].Trim();
                if (!string.IsNullOrWhiteSpace(valueStr) &&
                    decimal.TryParse(valueStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var val))
                {
                    return val;
                }
            }
        }
        return null;
    }

    private static string[] SplitCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new StringBuilder();

        foreach (char c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
                continue;
            }

            if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result.ToArray();
    }
}
