namespace ChurchRegister.ApiService.Models.Contributions;

/// <summary>
/// Request to assign an unmatched HSBC transaction to church member(s)
/// </summary>
public record AssignTransactionRequest
{
    /// <summary>
    /// Primary church member ID (required)
    /// </summary>
    public int ChurchMemberId { get; init; }

    /// <summary>
    /// Secondary church member ID for shared reference (optional)
    /// When provided, creates a shared bank reference with 50/50 split
    /// </summary>
    public int? SecondaryChurchMemberId { get; init; }

    // Constructor for backward compatibility
    public AssignTransactionRequest(int churchMemberId, int? secondaryChurchMemberId = null)
    {
        ChurchMemberId = churchMemberId;
        SecondaryChurchMemberId = secondaryChurchMemberId;
    }
}
