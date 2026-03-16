using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

/// <summary>
/// Service for generating and managing church member register numbers.
/// Members receive sequential numbers starting at 1.
/// Non-Members receive sequential numbers starting at the configured NonMemberStartNumber.
/// </summary>
public interface IRegisterNumberService
{
    /// <summary>
    /// Generate register numbers for all active members for the specified year,
    /// split into Member and Non-Member sequences.
    /// </summary>
    Task<GenerateRegisterNumbersResponse> GenerateForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Preview register number assignments without saving, split by membership role.
    /// </summary>
    Task<PreviewRegisterNumbersResponse> PreviewForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if register numbers have already been generated for a given year.
    /// </summary>
    Task<bool> HasBeenGeneratedForYearAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get detailed status of register number generation for a specific year.
    /// </summary>
    Task<CheckGenerationStatusResponse> GetGenerationStatusAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the next available register number for the specified year and membership role.
    /// Baptised Members receive the next number in the range 1–(NonBaptisedMemberStartNumber-1).
    /// Non-Baptised Members receive the next number in the range NonBaptisedMemberStartNumber–(NonMemberStartNumber-1).
    /// Non-Members receive the next number at or above NonMemberStartNumber.
    /// </summary>
    Task<int> GetNextAvailableNumberForRoleAsync(int year, bool isMember, bool isBaptised, CancellationToken cancellationToken = default);
}

