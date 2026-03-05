namespace ChurchRegister.ApiService.Services.Labels;

/// <summary>
/// Data for a single Avery L7163 label.
/// </summary>
public class LabelData
{
    /// <summary>Line 1 — primary name (rendered bold).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Line 2 — name/number prefix of the address (e.g. "12" or "Flat 3").</summary>
    public string? NameNumber { get; set; }

    /// <summary>Line 3 — first line of the street address.</summary>
    public string? AddressLineOne { get; set; }

    /// <summary>Line 4 — see GUD-006: null/empty → Town only; otherwise AddressLineTwo + " " + Town.</summary>
    public string? AddressLineTwo { get; set; }

    /// <summary>Town element used when building Line 4.</summary>
    public string? Town { get; set; }

    /// <summary>Postcode (Line 5 position when Line5 is null).</summary>
    public string? Postcode { get; set; }

    /// <summary>
    /// Optional fifth line. For envelope labels this is the register number string.
    /// For address labels this is "***NON-MEMBER***" text (controlled via Line5IsNonMember).
    /// When null, no fifth line is rendered.
    /// </summary>
    public string? Line5 { get; set; }

    /// <summary>
    /// When true Line 5 is rendered in red (CC0000) bold. Ignored when Line5 is null.
    /// </summary>
    public bool Line5IsNonMember { get; set; }
}
