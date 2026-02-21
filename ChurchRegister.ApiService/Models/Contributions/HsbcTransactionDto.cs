namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Data transfer object for HSBC bank credit transaction
/// </summary>
public class HsbcTransactionDto
{
    /// <summary>
    /// Unique transaction identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Transaction date
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Transaction description from bank statement
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Extracted payment reference
    /// </summary>
    public string Reference { get; set; } = string.Empty;

    /// <summary>
    /// Money received (credit amount)
    /// </summary>
    public decimal MoneyIn { get; set; }

    /// <summary>
    /// User who uploaded this transaction
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// When the transaction was uploaded
    /// </summary>
    public DateTime CreatedDateTime { get; set; }
}
