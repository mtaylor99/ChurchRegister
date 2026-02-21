using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Data transfer object for address information
/// </summary>
public class AddressDto
{
    /// <summary>
    /// Unique address identifier
    /// </summary>
    public int? Id { get; set; }

    /// <summary>
    /// Name or number of the property
    /// </summary>
    [StringLength(50, ErrorMessage = "Name/Number must not exceed 50 characters")]
    public string? NameNumber { get; set; }

    /// <summary>
    /// First line of the address
    /// </summary>
    [StringLength(100, ErrorMessage = "Address line 1 must not exceed 100 characters")]
    public string? AddressLineOne { get; set; }

    /// <summary>
    /// Second line of the address
    /// </summary>
    [StringLength(100, ErrorMessage = "Address line 2 must not exceed 100 characters")]
    public string? AddressLineTwo { get; set; }

    /// <summary>
    /// Town or city
    /// </summary>
    [StringLength(100, ErrorMessage = "Town must not exceed 100 characters")]
    public string? Town { get; set; }

    /// <summary>
    /// County or state
    /// </summary>
    [StringLength(100, ErrorMessage = "County must not exceed 100 characters")]
    public string? County { get; set; }

    /// <summary>
    /// Postal code or ZIP code
    /// </summary>
    [StringLength(20, ErrorMessage = "Postcode must not exceed 20 characters")]
    public string? Postcode { get; set; }
}
