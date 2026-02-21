namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Internal model representing a parsed HSBC transaction from CSV
/// </summary>
public class HsbcTransaction
{
    /// <summary>
    /// Transaction date
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Transaction description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Extracted payment reference
    /// </summary>
    public string Reference { get; set; } = string.Empty;

    /// <summary>
    /// Money In amount (credit)
    /// </summary>
    public decimal MoneyIn { get; set; }
}
