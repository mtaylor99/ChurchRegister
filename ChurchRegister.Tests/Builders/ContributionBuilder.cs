using ChurchRegister.Database.Entities;

namespace ChurchRegister.Tests.Builders;

/// <summary>
/// Fluent builder for creating ChurchMemberContributions test data with sensible defaults.
/// Usage: ContributionBuilder.AContribution().ForMember(1).WithAmount(50.00m).Build()
/// </summary>
public class ContributionBuilder
{
    private int _churchMemberId = 1;
    private decimal _amount = 25.00m;
    private DateTime _date = DateTime.UtcNow;
    private string? _transactionRef = "TXN001";
    private string? _description = "Weekly offering";
    private int _contributionTypeId = 1;
    private int? _hsbcBankCreditTransactionId;
    private int? _envelopeContributionBatchId;
    private bool _deleted = false;

    private ContributionBuilder()
    {
    }

    public static ContributionBuilder AContribution() => new();

    public ContributionBuilder ForMember(int churchMemberId)
    {
        _churchMemberId = churchMemberId;
        return this;
    }

    public ContributionBuilder WithAmount(decimal amount)
    {
        _amount = amount;
        return this;
    }

    public ContributionBuilder OnDate(DateTime date)
    {
        _date = date;
        return this;
    }

    public ContributionBuilder WithTransactionRef(string? transactionRef)
    {
        _transactionRef = transactionRef;
        return this;
    }

    public ContributionBuilder WithDescription(string? description)
    {
        _description = description;
        return this;
    }

    public ContributionBuilder WithContributionTypeId(int contributionTypeId)
    {
        _contributionTypeId = contributionTypeId;
        return this;
    }

    public ContributionBuilder WithHSBCTransactionId(int? hsbcBankCreditTransactionId)
    {
        _hsbcBankCreditTransactionId = hsbcBankCreditTransactionId;
        return this;
    }

    public ContributionBuilder WithEnvelopeBatchId(int? envelopeContributionBatchId)
    {
        _envelopeContributionBatchId = envelopeContributionBatchId;
        return this;
    }

    public ContributionBuilder WithDeleted(bool deleted)
    {
        _deleted = deleted;
        return this;
    }

    // Convenience methods
    public ContributionBuilder OfType(int contributionTypeId)
    {
        _contributionTypeId = contributionTypeId;
        return this;
    }

    public ContributionBuilder Deleted()
    {
        _deleted = true;
        return this;
    }

    public ContributionBuilder Active()
    {
        _deleted = false;
        return this;
    }

    public ContributionBuilder ThisWeek()
    {
        _date = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
        return this;
    }

    public ContributionBuilder LastWeek()
    {
        _date = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek - 7);
        return this;
    }

    public ContributionBuilder ThisMonth()
    {
        _date = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        return this;
    }

    public ContributionBuilder LastMonth()
    {
        var lastMonth = DateTime.UtcNow.AddMonths(-1);
        _date = new DateTime(lastMonth.Year, lastMonth.Month, 1);
        return this;
    }

    public ContributionBuilder ThisYear()
    {
        _date = new DateTime(DateTime.UtcNow.Year, 1, 1);
        return this;
    }

    public ContributionBuilder FromHSBC(int hsbcTransactionId)
    {
        _hsbcBankCreditTransactionId = hsbcTransactionId;
        _description = "HSBC Bank Transfer";
        return this;
    }

    public ContributionBuilder FromEnvelope(int batchId)
    {
        _envelopeContributionBatchId = batchId;
        _description = "Envelope contribution";
        return this;
    }

    public ContributionBuilder SmallAmount()
    {
        _amount = 10.00m;
        return this;
    }

    public ContributionBuilder MediumAmount()
    {
        _amount = 50.00m;
        return this;
    }

    public ContributionBuilder LargeAmount()
    {
        _amount = 250.00m;
        return this;
    }

    public ChurchMemberContributions Build()
    {
        return new ChurchMemberContributions
        {
            ChurchMemberId = _churchMemberId,
            Amount = _amount,
            Date = _date,
            TransactionRef = _transactionRef,
            Description = _description,
            ContributionTypeId = _contributionTypeId,
            HSBCBankCreditTransactionId = _hsbcBankCreditTransactionId,
            EnvelopeContributionBatchId = _envelopeContributionBatchId,
            Deleted = _deleted
        };
    }
}
