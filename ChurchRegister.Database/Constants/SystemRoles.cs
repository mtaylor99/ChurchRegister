namespace ChurchRegister.Database.Constants
{
    /// <summary>
    /// Defines all system roles with proper hierarchy
    /// </summary>
    public static class SystemRoles
    {
        /// <summary>
        /// System administration role - highest level access
        /// </summary>
        public const string SystemAdministration = "SystemAdministration";

        // Financial Management Roles (Hierarchy: Viewer < Contributor < Administrator)
        public const string FinancialViewer = "FinancialViewer";
        public const string FinancialContributor = "FinancialContributor";
        public const string FinancialAdministrator = "FinancialAdministrator";

        // Attendance Management Roles (Hierarchy: Viewer < Contributor < Administrator)
        public const string AttendanceViewer = "AttendanceViewer";
        public const string AttendanceContributor = "AttendanceContributor";
        public const string AttendanceAdministrator = "AttendanceAdministrator";

        // Church Members Management Roles (Hierarchy: Viewer < Contributor < Administrator)
        public const string ChurchMembersViewer = "ChurchMembersViewer";
        public const string ChurchMembersContributor = "ChurchMembersContributor";
        public const string ChurchMembersAdministrator = "ChurchMembersAdministrator";

        // Training Certificates Management Roles (Hierarchy: Viewer < Contributor < Administrator)
        public const string TrainingCertificatesViewer = "TrainingCertificatesViewer";
        public const string TrainingCertificatesContributor = "TrainingCertificatesContributor";
        public const string TrainingCertificatesAdministrator = "TrainingCertificatesAdministrator";

        // Reminders Management Roles (Hierarchy: Viewer < Contributor < Administrator)
        public const string RemindersViewer = "RemindersViewer";
        public const string RemindersContributor = "RemindersContributor";
        public const string RemindersAdministrator = "RemindersAdministrator";

        // Risk Assessments Management Roles (Hierarchy: Viewer < Contributor < Admin)
        public const string RiskAssessmentsViewer = "RiskAssessmentsViewer";
        public const string RiskAssessmentsContributor = "RiskAssessmentsContributor";
        public const string RiskAssessmentsAdmin = "RiskAssessmentsAdmin";

        // Monthly Report Pack Role
        public const string MonthlyReportPack = "MonthlyReportPack";

        // Church Member Roles with special permissions
        public const string Deacon = "Deacon";

        /// <summary>
        /// All system roles in order
        /// </summary>
        public static readonly string[] AllRoles = new[]
        {
            SystemAdministration,
            
            // Financial roles
            FinancialViewer,
            FinancialContributor,
            FinancialAdministrator,
            
            // Attendance roles
            AttendanceViewer,
            AttendanceContributor,
            AttendanceAdministrator,
            
            // Church Members roles
            ChurchMembersViewer,
            ChurchMembersContributor,
            ChurchMembersAdministrator,
            
            // Training Certificates roles
            TrainingCertificatesViewer,
            TrainingCertificatesContributor,
            TrainingCertificatesAdministrator,
            
            // Reminders roles
            RemindersViewer,
            RemindersContributor,
            RemindersAdministrator,
            
            // Risk Assessments roles
            RiskAssessmentsViewer,
            RiskAssessmentsContributor,
            RiskAssessmentsAdmin,
            
            // Monthly Report Pack
            MonthlyReportPack,
            
            // Church Member Roles
            Deacon
        };

        /// <summary>
        /// Gets the roles included in a higher-level role (role hierarchy)
        /// </summary>
        /// <param name="role">The role to get included roles for</param>
        /// <returns>Array of roles included in the specified role</returns>
        public static string[] GetIncludedRoles(string role)
        {
            return role switch
            {
                FinancialAdministrator => new[] { FinancialViewer, FinancialContributor, FinancialAdministrator },
                FinancialContributor => new[] { FinancialViewer, FinancialContributor },
                FinancialViewer => new[] { FinancialViewer },
                
                AttendanceAdministrator => new[] { AttendanceViewer, AttendanceContributor, AttendanceAdministrator },
                AttendanceContributor => new[] { AttendanceViewer, AttendanceContributor },
                AttendanceViewer => new[] { AttendanceViewer },
                
                ChurchMembersAdministrator => new[] { ChurchMembersViewer, ChurchMembersContributor, ChurchMembersAdministrator },
                ChurchMembersContributor => new[] { ChurchMembersViewer, ChurchMembersContributor },
                ChurchMembersViewer => new[] { ChurchMembersViewer },
                
                TrainingCertificatesAdministrator => new[] { TrainingCertificatesViewer, TrainingCertificatesContributor, TrainingCertificatesAdministrator },
                TrainingCertificatesContributor => new[] { TrainingCertificatesViewer, TrainingCertificatesContributor },
                TrainingCertificatesViewer => new[] { TrainingCertificatesViewer },
                
                RemindersAdministrator => new[] { RemindersViewer, RemindersContributor, RemindersAdministrator },
                RemindersContributor => new[] { RemindersViewer, RemindersContributor },
                RemindersViewer => new[] { RemindersViewer },
                
                RiskAssessmentsAdmin => new[] { RiskAssessmentsViewer, RiskAssessmentsContributor, RiskAssessmentsAdmin },
                RiskAssessmentsContributor => new[] { RiskAssessmentsViewer, RiskAssessmentsContributor },
                RiskAssessmentsViewer => new[] { RiskAssessmentsViewer },
                
                Deacon => new[] { Deacon },
                
                SystemAdministration => new[] { SystemAdministration },
                
                _ => new[] { role }
            };
        }
    }
}