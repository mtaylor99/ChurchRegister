namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Response model for church membership statistics
/// </summary>
public class MemberStatisticsResponse
{
    /// <summary>
    /// Count of active members with Envelopes = true
    /// </summary>
    public int EnvelopeCount { get; set; }

    /// <summary>
    /// Count of distinct (NameNumber, AddressLineOne, Postcode) combinations
    /// across active members with a non-null address (case-insensitive, excludes all-null/empty)
    /// </summary>
    public int ResidenceCount { get; set; }

    /// <summary>
    /// Count of active members with no address (AddressId IS NULL)
    /// </summary>
    public int NoAddressCount { get; set; }

    /// <summary>
    /// Per-district breakdown of residences and member counts
    /// </summary>
    public List<DistrictStatistic> DistrictBreakdown { get; set; } = new();
}

/// <summary>
/// Per-district membership statistic
/// </summary>
public class DistrictStatistic
{
    /// <summary>
    /// District name, or "Unassigned" for members with no district
    /// </summary>
    public string DistrictName { get; set; } = string.Empty;

    /// <summary>
    /// Count of distinct residences within this district
    /// </summary>
    public int ResidenceCount { get; set; }

    /// <summary>
    /// Count of active members within this district
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Full name of the assigned deacon, or null if unassigned
    /// </summary>
    public string? DeaconName { get; set; }
}
