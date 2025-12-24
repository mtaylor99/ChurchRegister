using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FastEndpoints;
using ChurchRegister.ApiService.Models.Administration;

namespace ChurchRegister.ApiService.Endpoints.Administration;

/// <summary>
/// Endpoint for retrieving all system roles for dropdowns and role selection
/// </summary>
public class GetSystemRolesEndpoint : EndpointWithoutRequest<List<SystemRoleDto>>
{
    private readonly RoleManager<IdentityRole> _roleManager;

    public GetSystemRolesEndpoint(RoleManager<IdentityRole> roleManager)
    {
        _roleManager = roleManager;
    }

    public override void Configure()
    {
        Get("/api/administration/roles");
        Policies("Bearer");
        Roles("SystemAdministration");
        Description(x => x
            .WithName("GetSystemRoles")
            .WithSummary("Get all system roles")
            .WithDescription("Retrieves all available system roles for role assignment and dropdown population")
            .WithTags("Administration"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var roles = await _roleManager.Roles.ToListAsync(ct);

            var roleDtos = roles.Select(role => new SystemRoleDto
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                DisplayName = GetDisplayName(role.Name ?? string.Empty),
                Description = GetDescription(role.Name ?? string.Empty),
                Category = GetCategory(role.Name ?? string.Empty),
                IsHighPrivilege = IsHighPrivilegeRole(role.Name ?? string.Empty)
            })
            .OrderBy(r => r.Category)
            .ThenBy(r => r.DisplayName)
            .ToList();

            await SendOkAsync(roleDtos, ct);
        }
        catch (Exception ex)
        {
            ThrowError($"Failed to retrieve system roles: {ex.Message}");
        }
    }

    private static string GetDisplayName(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => "System Administrator",
            "FinancialAdministration" => "Financial Administrator",
            "FinancialViewing" => "Financial Viewer",
            "AttendanceAdministration" => "Attendance Administrator",
            "AttendanceViewing" => "Attendance Viewer",
            "EventAdministration" => "Event Administrator",
            "EventViewing" => "Event Viewer",
            "MemberAdministration" => "Member Administrator",
            "MemberViewing" => "Member Viewer",
            "RiskAssessmentAdministration" => "Risk Assessment Administrator",
            "RiskAssessmentViewing" => "Risk Assessment Viewer",
            "ReportViewing" => "Report Viewer",
            "BasicUser" => "Basic User",
            _ => roleName
        };
    }

    private static string GetDescription(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => "Full system access with user management and configuration rights",
            "FinancialAdministration" => "Manage financial records, transactions, and budgets",
            "FinancialViewing" => "View financial reports and records (read-only)",
            "AttendanceAdministration" => "Manage attendance tracking and records",
            "AttendanceViewing" => "View attendance reports and records (read-only)",
            "EventAdministration" => "Manage church events and scheduling",
            "EventViewing" => "View church events and schedules (read-only)",
            "MemberAdministration" => "Manage church member information and records",
            "MemberViewing" => "View member information and records (read-only)",
            "RiskAssessmentAdministration" => "Manage risk assessments and safety protocols",
            "RiskAssessmentViewing" => "View risk assessments and safety reports (read-only)",
            "ReportViewing" => "Access to various system reports and analytics",
            "BasicUser" => "Basic system access with limited permissions",
            _ => $"Access and permissions for {roleName}"
        };
    }

    private static string GetCategory(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => "Administration",
            "FinancialAdministration" or "FinancialViewing" => "Financial",
            "AttendanceAdministration" or "AttendanceViewing" => "Attendance",
            "EventAdministration" or "EventViewing" => "Events",
            "MemberAdministration" or "MemberViewing" => "Members",
            "RiskAssessmentAdministration" or "RiskAssessmentViewing" => "Risk Assessment",
            "ReportViewing" => "Reports",
            "BasicUser" => "General",
            _ => "Other"
        };
    }

    private static bool IsHighPrivilegeRole(string roleName)
    {
        return roleName switch
        {
            "SystemAdministration" => true,
            "FinancialAdministration" => true,
            "AttendanceAdministration" => true,
            "EventAdministration" => true,
            "MemberAdministration" => true,
            "RiskAssessmentAdministration" => true,
            _ => false
        };
    }
}