using ChurchRegister.ApiService.Models.ChurchMembers;

namespace ChurchRegister.ApiService.Services.ChurchMembers;

/// <summary>
/// Service for generating and managing church member register numbers
/// </summary>
public interface IRegisterNumberService
{
    /// <summary>
    /// Generate register numbers for all active members for the specified year
    /// </summary>
    Task<GenerateRegisterNumbersResponse> GenerateForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Preview register number assignments without saving
    /// </summary>
    Task<PreviewRegisterNumbersResponse> PreviewForYearAsync(int targetYear, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if register numbers have already been generated for a given year
    /// </summary>
    Task<bool> HasBeenGeneratedForYearAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get detailed status of register number generation for a specific year
    /// </summary>
    Task<CheckGenerationStatusResponse> GetGenerationStatusAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the next available register number for a specific year
    /// </summary>
    Task<int> GetNextAvailableNumberAsync(int year, CancellationToken cancellationToken = default);
}
