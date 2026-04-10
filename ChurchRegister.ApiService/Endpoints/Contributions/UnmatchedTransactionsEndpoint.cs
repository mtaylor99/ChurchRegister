using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.Contributions;
using ChurchRegister.ApiService.UseCase.Contributions.AssignTransaction;
using ChurchRegister.ApiService.UseCase.Contributions.ExcludeReference;
using ChurchRegister.ApiService.UseCase.Contributions.GetUnmatchedTransactions;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Data;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.ApiService.Endpoints.Contributions;

/// <summary>
/// GET /api/financial/hsbc-transactions/unmatched
/// Returns all unprocessed HSBC transactions that are not in the excluded-references list.
/// </summary>
public class GetUnmatchedTransactionsEndpoint : EndpointWithoutRequest<GetUnmatchedTransactionsResponse>
{
    private readonly IGetUnmatchedTransactionsUseCase _useCase;
    private readonly ILogger<GetUnmatchedTransactionsEndpoint> _logger;

    public GetUnmatchedTransactionsEndpoint(
        IGetUnmatchedTransactionsUseCase useCase,
        ILogger<GetUnmatchedTransactionsEndpoint> logger)
    {
        _useCase = useCase;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/financial/hsbc-transactions/unmatched");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        Description(x => x
            .WithName("GetUnmatchedTransactions")
            .WithSummary("Get all unmatched HSBC transactions")
            .WithDescription("Returns HSBC transactions that have not been matched to a church member and are not excluded")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var result = await _useCase.ExecuteAsync(ct);
            await Send.OkAsync(result, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving unmatched transactions");
            AddError($"Error retrieving unmatched transactions: {ex.Message}");
            await Send.ErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// POST /api/financial/hsbc-transactions/{id}/assign
/// Assigns an unmatched HSBC transaction to a church member (atomically updates BankReference,
/// inserts a contribution, marks transaction as processed, then re-runs processing).
/// Returns 404 if not found, 409 if the reference already belongs to another member.
/// </summary>
public class AssignTransactionEndpoint : Endpoint<AssignTransactionRequest, AssignTransactionResponse>
{
    private readonly IAssignTransactionUseCase _useCase;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<AssignTransactionEndpoint> _logger;

    public AssignTransactionEndpoint(
        IAssignTransactionUseCase useCase,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<AssignTransactionEndpoint> logger)
    {
        _useCase = useCase;
        _userManager = userManager;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/financial/hsbc-transactions/{id}/assign");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        Description(x => x
            .WithName("AssignTransaction")
            .WithSummary("Assign unmatched HSBC transaction to a church member")
            .WithDescription("Atomically assigns the transaction, updates BankReference, creates contribution record, and triggers re-processing")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(AssignTransactionRequest req, CancellationToken ct)
    {
        try
        {
            var id = Route<int>("id");
            var user = await _userManager.GetUserAsync(User);
            var assignedBy = user?.UserName ?? "Unknown";

            var result = await _useCase.ExecuteAsync(id, req, assignedBy, ct);
            await Send.OkAsync(result, ct);
        }
        catch (ChurchRegister.ApiService.Exceptions.ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            AddError(ex.Message);
            await Send.ErrorsAsync(400, ct);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Transaction or member not found");
            AddError(ex.Message);
            await Send.ErrorsAsync(404, ct);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Bank reference conflict");
            AddError(ex.Message);
            await Send.ErrorsAsync(409, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning transaction");
            AddError($"Error assigning transaction: {ex.Message}");
            await Send.ErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// POST /api/financial/hsbc-transactions/{id}/exclude
/// Idempotently excludes the reference of a given transaction from future processing.
/// Returns 404 if the transaction is not found.
/// </summary>
public class ExcludeReferenceEndpoint : EndpointWithoutRequest<ExcludeReferenceResponse>
{
    private readonly IExcludeReferenceUseCase _useCase;
    private readonly UserManager<ChurchRegisterWebUser> _userManager;
    private readonly ILogger<ExcludeReferenceEndpoint> _logger;

    public ExcludeReferenceEndpoint(
        IExcludeReferenceUseCase useCase,
        UserManager<ChurchRegisterWebUser> userManager,
        ILogger<ExcludeReferenceEndpoint> logger)
    {
        _useCase = useCase;
        _userManager = userManager;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api/financial/hsbc-transactions/{id}/exclude");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        Description(x => x
            .WithName("ExcludeReference")
            .WithSummary("Exclude an HSBC transaction reference from processing")
            .WithDescription("Idempotently adds the transaction's reference to the exclusion list; future processing runs will skip it")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var id = Route<int>("id");
            var user = await _userManager.GetUserAsync(User);
            var excludedBy = user?.UserName ?? "Unknown";

            var result = await _useCase.ExecuteAsync(id, excludedBy, ct);
            await Send.OkAsync(result, ct);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Transaction not found");
            AddError(ex.Message);
            await Send.ErrorsAsync(404, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error excluding reference");
            AddError($"Error excluding reference: {ex.Message}");
            await Send.ErrorsAsync(500, ct);
        }
    }
}

/// <summary>
/// GET /api/financial/hsbc-transactions/excluded-references
/// Returns all excluded references ordered by most recently created first.
/// </summary>
public class GetExcludedReferencesEndpoint : EndpointWithoutRequest<GetExcludedReferencesResponse>
{
    private readonly ChurchRegisterWebContext _context;
    private readonly ILogger<GetExcludedReferencesEndpoint> _logger;

    public GetExcludedReferencesEndpoint(
        ChurchRegisterWebContext context,
        ILogger<GetExcludedReferencesEndpoint> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/api/financial/hsbc-transactions/excluded-references");
        Policies("Bearer");
        Roles(SystemRoles.SystemAdministration, SystemRoles.FinancialAdministrator, SystemRoles.FinancialContributor);
        Description(x => x
            .WithName("GetExcludedReferences")
            .WithSummary("Get all excluded HSBC transaction references")
            .WithDescription("Returns all references that are excluded from HSBC transaction processing, ordered by most recently excluded first")
            .WithTags("Contributions"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var items = await _context.HSBCExcludedReferences
                .OrderByDescending(e => e.CreatedDateTime)
                .Select(e => new ExcludedReferenceDto(e.Id, e.Reference, e.CreatedBy, e.CreatedDateTime))
                .ToListAsync(ct);

            await Send.OkAsync(new GetExcludedReferencesResponse(items), ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving excluded references");
            AddError($"Error retrieving excluded references: {ex.Message}");
            await Send.ErrorsAsync(500, ct);
        }
    }
}
