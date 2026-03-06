using ChurchRegister.Database.Constants;
using FluentAssertions;

namespace ChurchRegister.ApiService.Tests.Security;

/// <summary>
/// Unit tests for SystemRoles.GetIncludedRoles hierarchy method.
/// </summary>
public class SystemRolesTests
{
    // ─── Financial roles ──────────────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_FinancialAdministrator_IncludesAllFinancialRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.FinancialAdministrator);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.FinancialViewer,
            SystemRoles.FinancialContributor,
            SystemRoles.FinancialAdministrator
        });
    }

    [Fact]
    public void GetIncludedRoles_FinancialContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.FinancialContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.FinancialViewer,
            SystemRoles.FinancialContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_FinancialViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.FinancialViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.FinancialViewer });
    }

    // ─── Attendance roles ─────────────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_AttendanceAdministrator_IncludesAllAttendanceRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.AttendanceAdministrator);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.AttendanceViewer,
            SystemRoles.AttendanceContributor,
            SystemRoles.AttendanceAdministrator
        });
    }

    [Fact]
    public void GetIncludedRoles_AttendanceContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.AttendanceContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.AttendanceViewer,
            SystemRoles.AttendanceContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_AttendanceViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.AttendanceViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.AttendanceViewer });
    }

    // ─── Church Members roles ─────────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_ChurchMembersAdministrator_IncludesAllChurchMembersRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.ChurchMembersAdministrator);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.ChurchMembersViewer,
            SystemRoles.ChurchMembersContributor,
            SystemRoles.ChurchMembersAdministrator
        });
    }

    [Fact]
    public void GetIncludedRoles_ChurchMembersContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.ChurchMembersContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.ChurchMembersViewer,
            SystemRoles.ChurchMembersContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_ChurchMembersViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.ChurchMembersViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.ChurchMembersViewer });
    }

    // ─── Training Certificates roles ──────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_TrainingCertificatesAdministrator_IncludesAllTrainingRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.TrainingCertificatesAdministrator);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.TrainingCertificatesViewer,
            SystemRoles.TrainingCertificatesContributor,
            SystemRoles.TrainingCertificatesAdministrator
        });
    }

    [Fact]
    public void GetIncludedRoles_TrainingCertificatesContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.TrainingCertificatesContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.TrainingCertificatesViewer,
            SystemRoles.TrainingCertificatesContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_TrainingCertificatesViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.TrainingCertificatesViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.TrainingCertificatesViewer });
    }

    // ─── Reminders roles ──────────────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_RemindersAdministrator_IncludesAllRemindersRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RemindersAdministrator);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.RemindersViewer,
            SystemRoles.RemindersContributor,
            SystemRoles.RemindersAdministrator
        });
    }

    [Fact]
    public void GetIncludedRoles_RemindersContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RemindersContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.RemindersViewer,
            SystemRoles.RemindersContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_RemindersViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RemindersViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.RemindersViewer });
    }

    // ─── Risk Assessments roles ───────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_RiskAssessmentsAdmin_IncludesAllRiskRoles()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RiskAssessmentsAdmin);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.RiskAssessmentsViewer,
            SystemRoles.RiskAssessmentsContributor,
            SystemRoles.RiskAssessmentsAdmin
        });
    }

    [Fact]
    public void GetIncludedRoles_RiskAssessmentsContributor_IncludesViewerAndContributor()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RiskAssessmentsContributor);
        roles.Should().BeEquivalentTo(new[]
        {
            SystemRoles.RiskAssessmentsViewer,
            SystemRoles.RiskAssessmentsContributor
        });
    }

    [Fact]
    public void GetIncludedRoles_RiskAssessmentsViewer_IncludesOnlyViewer()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.RiskAssessmentsViewer);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.RiskAssessmentsViewer });
    }

    // ─── Special roles ────────────────────────────────────────────────────────

    [Fact]
    public void GetIncludedRoles_Deacon_IncludesOnlyDeacon()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.Deacon);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.Deacon });
    }

    [Fact]
    public void GetIncludedRoles_SystemAdministration_IncludesOnlySystemAdmin()
    {
        var roles = SystemRoles.GetIncludedRoles(SystemRoles.SystemAdministration);
        roles.Should().BeEquivalentTo(new[] { SystemRoles.SystemAdministration });
    }

    [Fact]
    public void GetIncludedRoles_UnknownRole_ReturnsRoleItself()
    {
        var roles = SystemRoles.GetIncludedRoles("SomeUnknownRole");
        roles.Should().BeEquivalentTo(new[] { "SomeUnknownRole" });
    }
}
