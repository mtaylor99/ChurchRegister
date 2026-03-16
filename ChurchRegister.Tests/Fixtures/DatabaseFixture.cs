using ChurchRegister.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.Tests.Fixtures;

/// <summary>
/// Provides a fresh, isolated InMemory database for each test.
/// Handles database lifecycle and seed data setup.
/// </summary>
public class DatabaseFixture : IDisposable
{
    private ChurchRegisterWebContext? _context;
    private bool _disposed;

    public ChurchRegisterWebContext Context
    {
        get
        {
            if (_context == null)
            {
                throw new InvalidOperationException("Database not initialized. Call InitializeAsync first.");
            }
            return _context;
        }
    }

    /// <summary>
    /// Creates and initializes a new InMemory database with a unique name.
    /// </summary>
    public async Task<ChurchRegisterWebContext> InitializeAsync(string? databaseName = null)
    {
        databaseName ??= $"TestDb_{Guid.NewGuid()}";

        var options = new DbContextOptionsBuilder<ChurchRegisterWebContext>()
            .UseInMemoryDatabase(databaseName)
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ChurchRegisterWebContext(options);

        // Ensure database is created
        await _context.Database.EnsureCreatedAsync();

        // Seed reference data
        await SeedReferenceDataAsync();

        return _context;
    }

    /// <summary>
    /// Seeds required reference data for tests.
    /// </summary>
    private async Task SeedReferenceDataAsync()
    {
        if (_context == null) return;

        // Seed ChurchMemberStatuses if not exists
        if (!await _context.ChurchMemberStatuses.AnyAsync())
        {
            _context.ChurchMemberStatuses.AddRange(
                new Database.Entities.ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new Database.Entities.ChurchMemberStatus { Id = 2, Name = "Inactive", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new Database.Entities.ChurchMemberStatus { Id = 3, Name = "Deceased", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
        }

        // Seed ContributionTypes if not exists
        if (!await _context.ContributionTypes.AnyAsync())
        {
            _context.ContributionTypes.AddRange(
                new Database.Entities.ContributionType { Id = 1, Type = "Weekly Offering", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new Database.Entities.ContributionType { Id = 2, Type = "Special Collection", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow },
                new Database.Entities.ContributionType { Id = 3, Type = "Building Fund", CreatedBy = "system", CreatedDateTime = DateTime.UtcNow }
            );
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Clears all data from the database while preserving reference data.
    /// </summary>
    public async Task ClearDatabaseAsync()
    {
        if (_context == null) return;

        // Clear transactional data
        _context.ChurchMemberContributions.RemoveRange(_context.ChurchMemberContributions);
        _context.ChurchMembers.RemoveRange(_context.ChurchMembers);

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Adds entities to the context and saves changes.
    /// </summary>
    public async Task AddAsync<T>(params T[] entities) where T : class
    {
        if (_context == null) return;

        _context.Set<T>().AddRange(entities);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Detaches all tracked entities to avoid conflicts in tests.
    /// </summary>
    public void DetachAllEntities()
    {
        if (_context == null) return;

        var entries = _context.ChangeTracker.Entries()
            .Where(e => e.State != EntityState.Detached)
            .ToList();

        foreach (var entry in entries)
        {
            entry.State = EntityState.Detached;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _context?.Dispose();
            }
            _disposed = true;
        }
    }
}
