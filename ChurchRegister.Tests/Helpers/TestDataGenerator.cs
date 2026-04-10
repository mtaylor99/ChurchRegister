using ChurchRegister.Tests.Builders;
using ChurchRegister.Database.Data;
using ChurchRegister.Database.Entities;

namespace ChurchRegister.Tests.Helpers;

/// <summary>
/// Generates realistic test data using Bogus library patterns.
/// Provides collections and randomized data for comprehensive testing.
/// </summary>
public static class TestDataGenerator
{
    private static readonly Random Random = new();

    /// <summary>
    /// Generates a collection of church members with varied attributes.
    /// </summary>
    public static List<ChurchMember> GenerateChurchMembers(int count = 10)
    {
        var members = new List<ChurchMember>();
        
        for (int i = 1; i <= count; i++)
        {
            var builder = ChurchMemberBuilder.AChurchMember()
                .WithId(i)
                .WithFirstName(GenerateFirstName())
                .WithLastName(GenerateLastName())
                .WithEmailAddress($"member{i}@example.com")
                .WithPhoneNumber(GeneratePhoneNumber())
                .WithBankReference($"REF{i:D3}");

            // Randomize status
            if (Random.Next(0, 10) > 7)
            {
                builder.Inactive();
            }

            // Some members without contact details
            if (Random.Next(0, 10) > 8)
            {
                builder.WithoutEmail();
            }

            // Some with gift aid
            if (Random.Next(0, 10) > 6)
            {
                builder.WithGiftAidEnabled();
            }

            members.Add(builder.Build());
        }

        return members;
    }

    /// <summary>
    /// Generates contributions for specified church members.
    /// </summary>
    public static List<ChurchMemberContributions> GenerateContributions(
        IEnumerable<int> memberIds,
        int contributionsPerMember = 5)
    {
        var contributions = new List<ChurchMemberContributions>();
        
        foreach (var memberId in memberIds)
        {
            for (int i = 0; i < contributionsPerMember; i++)
            {
                var daysAgo = Random.Next(1, 365);
                var amount = Random.Next(10, 200);
                
                var contribution = ContributionBuilder.AContribution()
                    .ForMember(memberId)
                    .WithAmount(amount)
                    .OnDate(DateTime.UtcNow.AddDays(-daysAgo))
                    .WithTransactionRef($"TXN{Guid.NewGuid().ToString().Substring(0, 8)}")
                    .WithContributionTypeId(Random.Next(1, 4))
                    .Build();
                
                contributions.Add(contribution);
            }
        }

        return contributions;
    }

    /// <summary>
    /// Generates attendance records for an event over a date range.
    /// </summary>
    public static List<EventAttendance> GenerateAttendanceRecords(
        int eventId,
        DateTime startDate,
        DateTime endDate,
        int minAttendance = 20,
        int maxAttendance = 80)
    {
        var records = new List<EventAttendance>();
        var currentDate = startDate.Date;

        while (currentDate <= endDate.Date)
        {
            var attendance = Random.Next(minAttendance, maxAttendance + 1);
            
            var record = AttendanceRecordBuilder.AnAttendanceRecord()
                .ForEvent(eventId)
                .OnDate(currentDate)
                .WithAttendance(attendance)
                .Build();
            
            records.Add(record);
            currentDate = currentDate.AddDays(7); // Weekly records
        }

        return records;
    }

    /// <summary>
    /// Generates users with varied roles and statuses.
    /// </summary>
    public static List<(ChurchRegisterWebUser User, List<string> Roles)> GenerateUsers(int count = 5)
    {
        var users = new List<(ChurchRegisterWebUser, List<string>)>();
        var roles = new[] { "Admin", "Member", "Elder", "Deacon" };

        for (int i = 1; i <= count; i++)
        {
            var email = $"user{i}@example.com";
            var userRoles = new List<string> { roles[Random.Next(0, roles.Length)] };

            var builder = UserBuilder.AUser()
                .WithId(Guid.NewGuid().ToString())
                .WithEmail(email)
                .EmailConfirmed();

            // Some users locked
            if (Random.Next(0, 10) > 8)
            {
                builder.Locked();
            }

            users.Add((builder.Build(), userRoles));
        }

        return users;
    }

    // Helper methods for realistic data
    private static string GenerateFirstName()
    {
        var firstNames = new[]
        {
            "John", "Jane", "Michael", "Sarah", "David", "Emma",
            "James", "Mary", "Robert", "Patricia", "William", "Jennifer",
            "Thomas", "Linda", "Charles", "Elizabeth", "Daniel", "Margaret"
        };
        return firstNames[Random.Next(firstNames.Length)];
    }

    private static string GenerateLastName()
    {
        var lastNames = new[]
        {
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
            "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson"
        };
        return lastNames[Random.Next(lastNames.Length)];
    }

    private static string GeneratePhoneNumber()
    {
        return $"0{Random.Next(1, 10)}{Random.Next(100, 999)}{Random.Next(100000, 999999)}";
    }

    /// <summary>
    /// Generates a random date within the last N years.
    /// </summary>
    public static DateTime GenerateRandomDate(int yearsBack = 5)
    {
        var daysBack = Random.Next(0, yearsBack * 365);
        return DateTime.UtcNow.AddDays(-daysBack);
    }

    /// <summary>
    /// Generates a random decimal amount within a range.
    /// </summary>
    public static decimal GenerateRandomAmount(decimal min = 5, decimal max = 500)
    {
        var amount = (decimal)(Random.NextDouble() * (double)(max - min) + (double)min);
        return Math.Round(amount, 2);
    }

    /// <summary>
    /// Generates a random transaction reference.
    /// </summary>
    public static string GenerateTransactionReference()
    {
        return $"TXN{Random.Next(100000, 999999)}";
    }

    /// <summary>
    /// Generates a random bank reference.
    /// </summary>
    public static string GenerateBankReference()
    {
        return $"REF{Random.Next(1000, 9999)}";
    }
}
