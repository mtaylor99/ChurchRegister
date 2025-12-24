using ChurchRegister.Database.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Security.Claims;

namespace ChurchRegister.Database.Interceptors;

public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IServiceProvider _serviceProvider;

    public AuditInterceptor(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        PopulateAuditFields(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, 
        InterceptionResult<int> result, 
        CancellationToken cancellationToken = default)
    {
        PopulateAuditFields(eventData.Context);
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void PopulateAuditFields(DbContext? context)
    {
        if (context == null) return;

        var currentUserId = GetCurrentUserId();
        var currentDateTime = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = currentUserId;
                    entry.Entity.CreatedDateTime = currentDateTime;
                    break;

                case EntityState.Modified:
                    entry.Entity.ModifiedBy = currentUserId;
                    entry.Entity.ModifiedDateTime = currentDateTime;
                    break;
            }
        }
    }

    private string GetCurrentUserId()
    {
        try
        {
            // Try to get HTTP context accessor from service provider
            var httpContextAccessor = _serviceProvider.GetService(typeof(Microsoft.AspNetCore.Http.IHttpContextAccessor)) 
                as Microsoft.AspNetCore.Http.IHttpContextAccessor;

            var httpContext = httpContextAccessor?.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                return httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
            }
        }
        catch
        {
            // Fallback to "system" if any exception occurs (e.g., during testing or background operations)
        }

        return "system";
    }
}