using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ChurchRegister.Database.Entities;

namespace ChurchRegister.Database.Data
{
    public class ChurchRegisterWebContext(DbContextOptions<ChurchRegisterWebContext> options) : IdentityDbContext<ChurchRegisterWebUser>(options)
    {
        // Church Member DbSets
        public DbSet<ChurchMember> ChurchMembers { get; set; }
        public DbSet<ChurchMemberStatus> ChurchMemberStatuses { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Districts> Districts { get; set; }
        public DbSet<ChurchMemberRegisterNumber> ChurchMemberRegisterNumbers { get; set; }
        public DbSet<ChurchMemberContributions> ChurchMemberContributions { get; set; }
        public DbSet<ContributionType> ContributionTypes { get; set; }
        public DbSet<ChurchMemberRoles> ChurchMemberRoles { get; set; }
        public DbSet<ChurchMemberRoleTypes> ChurchMemberRoleTypes { get; set; }
        public DbSet<ChurchMemberDataProtection> ChurchMemberDataProtection { get; set; }
        public DbSet<ChurchMemberTrainingCertificates> ChurchMemberTrainingCertificates { get; set; }
        public DbSet<TrainingCertificateTypes> TrainingCertificateTypes { get; set; }
        public DbSet<Events> Events { get; set; }
        public DbSet<EventAttendance> EventAttendances { get; set; }

        // Authentication & Security DbSets
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        
        // Financial DbSets
        public DbSet<HSBCBankCreditTransaction> HSBCBankCreditTransactions { get; set; }
        public DbSet<EnvelopeContributionBatch> EnvelopeContributionBatches { get; set; }
        
        // Reminders DbSets
        public DbSet<Reminder> Reminders { get; set; }
        public DbSet<ReminderCategory> ReminderCategories { get; set; }
        
        // Risk Assessments DbSets
        public DbSet<RiskAssessmentCategory> RiskAssessmentCategories { get; set; }
        public DbSet<RiskAssessment> RiskAssessments { get; set; }
        public DbSet<RiskAssessmentApproval> RiskAssessmentApprovals { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Call base configuration for Identity
            base.OnModelCreating(modelBuilder);

            // Configure entity relationships and constraints
            ConfigureChurchMember(modelBuilder);
            ConfigureContributions(modelBuilder);
            ConfigureEnvelopeContributionBatch(modelBuilder);
            ConfigureRelationships(modelBuilder);
            ConfigureHSBCBankCreditTransaction(modelBuilder);
            ConfigureReminders(modelBuilder);
            ConfigureRiskAssessments(modelBuilder);
            ConfigureSeedData(modelBuilder);
        }

        private void ConfigureChurchMember(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChurchMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).HasMaxLength(20);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.EmailAddress).HasMaxLength(100);
                entity.Property(e => e.BankReference).HasMaxLength(100);
                entity.Property(e => e.PastoralCareRequired).IsRequired().HasDefaultValue(false);
                
                // Unique index for BankReference (excluding NULL values)
                entity.HasIndex(e => e.BankReference)
                    .HasDatabaseName("IX_ChurchMembers_BankReference_Unique")
                    .IsUnique()
                    .HasFilter("[BankReference] IS NOT NULL");
                
                // Foreign key relationships
                entity.HasOne(d => d.Address)
                    .WithMany(p => p.ChurchMembers)
                    .HasForeignKey(d => d.AddressId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.ChurchMemberStatus)
                    .WithMany(p => p.ChurchMembers)
                    .HasForeignKey(d => d.ChurchMemberStatusId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.District)
                    .WithMany(p => p.ChurchMembers)
                    .HasForeignKey(d => d.DistrictId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureContributions(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChurchMemberContributions>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.TransactionRef).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                
                // Configure table with check constraint
                entity.ToTable(t => t.HasCheckConstraint("CK_ChurchMemberContributions_Amount", "Amount >= 0"));

                // Indexes
                entity.HasIndex(e => e.ChurchMemberId).HasDatabaseName("IX_ChurchMemberContributions_ChurchMemberId");
                entity.HasIndex(e => e.Date).HasDatabaseName("IX_ChurchMemberContributions_Date");
                entity.HasIndex(e => e.HSBCBankCreditTransactionId).HasDatabaseName("IX_ChurchMemberContributions_HSBCTransactionId");
                
                // Unique index for HSBCBankCreditTransactionId where not null
                entity.HasIndex(e => e.HSBCBankCreditTransactionId)
                    .HasDatabaseName("IX_ChurchMemberContributions_HSBCTransactionId_Unique")
                    .IsUnique()
                    .HasFilter("[HSBCBankCreditTransactionId] IS NOT NULL");

                entity.HasOne(d => d.ChurchMember)
                    .WithMany(p => p.Contributions)
                    .HasForeignKey(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ContributionType)
                    .WithMany(p => p.ChurchMemberContributions)
                    .HasForeignKey(d => d.ContributionTypeId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.HSBCBankCreditTransaction)
                    .WithMany(p => p.Contributions)
                    .HasForeignKey(d => d.HSBCBankCreditTransactionId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(d => d.EnvelopeContributionBatch)
                    .WithMany(p => p.ChurchMemberContributions)
                    .HasForeignKey(d => d.EnvelopeContributionBatchId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigureEnvelopeContributionBatch(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EnvelopeContributionBatch>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BatchDate).IsRequired();
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.EnvelopeCount).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Submitted");
                
                // Unique constraint on BatchDate
                entity.HasIndex(e => e.BatchDate)
                    .HasDatabaseName("IX_EnvelopeContributionBatch_BatchDate_Unique")
                    .IsUnique();
                
                // Configure table with check constraints
                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_EnvelopeContributionBatch_TotalAmount", "TotalAmount >= 0");
                    t.HasCheckConstraint("CK_EnvelopeContributionBatch_EnvelopeCount", "EnvelopeCount > 0");
                });
            });
        }

        private void ConfigureHSBCBankCreditTransaction(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<HSBCBankCreditTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Reference).HasMaxLength(100);
                entity.Property(e => e.MoneyIn).HasColumnType("decimal(10,2)");
                entity.Property(e => e.IsProcessed).IsRequired().HasDefaultValue(false);
                
                // Indexes for contribution processing
                entity.HasIndex(e => e.IsProcessed).HasDatabaseName("IX_HSBCBankCreditTransactions_IsProcessed");
                entity.HasIndex(e => e.Reference).HasDatabaseName("IX_HSBCBankCreditTransactions_Reference");
            });
        }

        private void ConfigureReminders(ModelBuilder modelBuilder)
        {
            // Configure ReminderCategory
            modelBuilder.Entity<ReminderCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ColorHex).HasMaxLength(7);
                entity.Property(e => e.IsSystemCategory).IsRequired();
                entity.Property(e => e.SortOrder).IsRequired();
                
                // Unique index on Name (case-insensitive)
                entity.HasIndex(e => e.Name)
                    .IsUnique()
                    .HasDatabaseName("IX_ReminderCategories_Name_Unique");
                
                // Index on SortOrder for ordering
                entity.HasIndex(e => e.SortOrder)
                    .HasDatabaseName("IX_ReminderCategories_SortOrder");
            });
            
            // Configure Reminder
            modelBuilder.Entity<Reminder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.DueDate).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                
                // Check constraint for Status
                entity.ToTable(t => t.HasCheckConstraint(
                    "CK_Reminders_Status", 
                    "[Status] IN ('Pending', 'Completed')"));
                
                // Indexes for query performance
                entity.HasIndex(e => e.DueDate)
                    .HasDatabaseName("IX_Reminders_DueDate");
                    
                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_Reminders_Status");
                    
                entity.HasIndex(e => e.AssignedToUserId)
                    .HasDatabaseName("IX_Reminders_AssignedToUserId");
                    
                // Composite index for dashboard queries
                entity.HasIndex(e => new { e.Status, e.DueDate })
                    .HasDatabaseName("IX_Reminders_Status_DueDate");
                
                // Foreign key to AspNetUsers (nullable, no referential action to prevent user deletion issues)
                entity.HasOne<ChurchRegisterWebUser>()
                    .WithMany()
                    .HasForeignKey(r => r.AssignedToUserId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .IsRequired(false);
                    
                // Foreign key to ReminderCategory with SET NULL on delete
                entity.HasOne(r => r.Category)
                    .WithMany()
                    .HasForeignKey(r => r.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureRiskAssessments(ModelBuilder modelBuilder)
        {
            // Configure RiskAssessmentCategory
            modelBuilder.Entity<RiskAssessmentCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                
                // Unique index on Name (case-insensitive)
                entity.HasIndex(e => e.Name)
                    .IsUnique()
                    .HasDatabaseName("IX_RiskAssessmentCategories_Name_Unique");
            });
            
            // Configure RiskAssessment
            modelBuilder.Entity<RiskAssessment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.ReviewInterval).IsRequired();
                entity.Property(e => e.NextReviewDate).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Scope).HasMaxLength(500);
                
                // Check constraint for Status
                entity.ToTable(t => t.HasCheckConstraint(
                    "CK_RiskAssessments_Status", 
                    "[Status] IN ('Under Review', 'Approved')"));
                    
                // Check constraint for ReviewInterval
                entity.ToTable(t => t.HasCheckConstraint(
                    "CK_RiskAssessments_ReviewInterval", 
                    "[ReviewInterval] IN (1, 2, 3, 5)"));
                
                // Indexes for query performance
                entity.HasIndex(e => e.NextReviewDate)
                    .HasDatabaseName("IX_RiskAssessments_NextReviewDate");
                    
                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_RiskAssessments_Status");
                    
                entity.HasIndex(e => e.CategoryId)
                    .HasDatabaseName("IX_RiskAssessments_CategoryId");
                    
                // Composite index for dashboard queries
                entity.HasIndex(e => new { e.Status, e.NextReviewDate })
                    .HasDatabaseName("IX_RiskAssessments_Status_NextReviewDate");
                
                // Foreign key to RiskAssessmentCategory with NO ACTION
                entity.HasOne(r => r.Category)
                    .WithMany()
                    .HasForeignKey(r => r.CategoryId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
            
            // Configure RiskAssessmentApproval
            modelBuilder.Entity<RiskAssessmentApproval>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ApprovedByChurchMemberId).IsRequired();
                entity.Property(e => e.ApprovedDate).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(500);
                
                // Composite unique index to prevent duplicate approvals by same church member
                entity.HasIndex(e => new { e.RiskAssessmentId, e.ApprovedByChurchMemberId })
                    .IsUnique()
                    .HasDatabaseName("IX_RiskAssessmentApprovals_RiskAssessmentId_ApprovedByChurchMemberId_Unique");
                
                // Foreign key to RiskAssessment with CASCADE delete
                entity.HasOne(a => a.RiskAssessment)
                    .WithMany(r => r.Approvals)
                    .HasForeignKey(a => a.RiskAssessmentId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                // Foreign key to ChurchMembers with NO ACTION
                entity.HasOne(a => a.ApprovedByChurchMember)
                    .WithMany()
                    .HasForeignKey(a => a.ApprovedByChurchMemberId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }

        private void ConfigureRelationships(ModelBuilder modelBuilder)
        {
            // ChurchMemberRegisterNumber
            modelBuilder.Entity<ChurchMemberRegisterNumber>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Number).HasMaxLength(10);
                entity.Property(e => e.Year).IsRequired();
                
                // Indexes for performance (frequently queried by Year)
                entity.HasIndex(e => e.Year)
                    .HasDatabaseName("IX_ChurchMemberRegisterNumbers_Year");
                
                // Composite index for Year + Number lookups
                entity.HasIndex(e => new { e.Year, e.Number })
                    .HasDatabaseName("IX_ChurchMemberRegisterNumbers_Year_Number");
                
                // Index on ChurchMemberId for lookups
                entity.HasIndex(e => e.ChurchMemberId)
                    .HasDatabaseName("IX_ChurchMemberRegisterNumbers_ChurchMemberId");
                
                entity.HasOne(d => d.ChurchMember)
                    .WithMany(p => p.RegisterNumbers)
                    .HasForeignKey(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ChurchMemberRoles
            modelBuilder.Entity<ChurchMemberRoles>(entity =>
            {
                entity.HasOne(d => d.ChurchMember)
                    .WithMany(p => p.Roles)
                    .HasForeignKey(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.ChurchMemberRoleType)
                    .WithMany(p => p.ChurchMemberRoles)
                    .HasForeignKey(d => d.ChurchMemberRoleTypeId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ChurchMemberDataProtection
            modelBuilder.Entity<ChurchMemberDataProtection>(entity =>
            {
                // Configure all permission columns as NOT NULL with default false
                entity.Property(e => e.AllowNameInCommunications).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.AllowHealthStatusInCommunications).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.AllowPhotoInCommunications).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.AllowPhotoInSocialMedia).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.GroupPhotos).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.PermissionForMyChildren).IsRequired().HasDefaultValue(false);
                
                // Create unique index on ChurchMemberId (1:1 relationship)
                entity.HasIndex(e => e.ChurchMemberId)
                    .IsUnique();
                
                // Configure 1:1 relationship - when member is deleted, cascade delete data protection
                entity.HasOne<ChurchMember>()
                    .WithOne()
                    .HasForeignKey<ChurchMemberDataProtection>(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Configure 1:1 relationship from ChurchMember side - avoid cascade path cycles
            modelBuilder.Entity<ChurchMember>(entity =>
            {
                entity.HasOne(m => m.DataProtection)
                    .WithOne()
                    .HasForeignKey<ChurchMember>(m => m.DataProtectionId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // ChurchMemberTrainingCertificates
            modelBuilder.Entity<ChurchMemberTrainingCertificates>(entity =>
            {
                entity.HasOne(d => d.ChurchMember)
                    .WithMany(p => p.TrainingCertificates)
                    .HasForeignKey(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.TrainingCertificateType)
                    .WithMany(p => p.ChurchMemberTrainingCertificates)
                    .HasForeignKey(d => d.TrainingCertificateTypeId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Events
            modelBuilder.Entity<Events>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.ShowInAnalysis).HasDefaultValue(true);
                entity.Property(e => e.DayOfWeek).IsRequired(false);
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedDateTime).IsRequired();
            });

            // EventAttendance
            modelBuilder.Entity<EventAttendance>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventId).IsRequired();
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.Attendance).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedDateTime).IsRequired();
                
                entity.HasOne(d => d.Event)
                    .WithMany(p => p.EventAttendances)
                    .HasForeignKey(d => d.EventId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Add unique constraint to prevent duplicate entries for same event/date
                entity.HasIndex(e => new { e.EventId, e.Date })
                    .IsUnique()
                    .HasDatabaseName("IX_EventAttendance_EventId_Date");
            });
            
            // Districts - Configure FK relationships for Deacon and District Officer
            modelBuilder.Entity<Districts>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(10);
                
                // Indexes for performance
                entity.HasIndex(e => e.DeaconId)
                    .HasDatabaseName("IX_Districts_DeaconId");
                    
                entity.HasIndex(e => e.DistrictOfficerId)
                    .HasDatabaseName("IX_Districts_DistrictOfficerId");
                
                // Configure FK relationship to Deacon (ChurchMember)
                entity.HasOne(d => d.Deacon)
                    .WithMany()
                    .HasForeignKey(d => d.DeaconId)
                    .OnDelete(DeleteBehavior.NoAction);
                
                // Configure FK relationship to District Officer (ChurchMember)
                entity.HasOne(d => d.DistrictOfficer)
                    .WithMany()
                    .HasForeignKey(d => d.DistrictOfficerId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }

        private void ConfigureSeedData(ModelBuilder modelBuilder)
        {
            // Use static datetime for seed data to avoid model changes between builds
            var seedDateTime = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            
            // Seed ChurchMemberStatus
            modelBuilder.Entity<ChurchMemberStatus>().HasData(
                new ChurchMemberStatus { Id = 1, Name = "Active", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberStatus { Id = 2, Name = "Expired", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberStatus { Id = 3, Name = "In Glory", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberStatus { Id = 4, Name = "InActive", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed ContributionType
            modelBuilder.Entity<ContributionType>().HasData(
                new ContributionType { Id = 1, Type = "Cash", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ContributionType { Id = 2, Type = "Transfer", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed ChurchMemberRoleTypes
            modelBuilder.Entity<ChurchMemberRoleTypes>().HasData(
                new ChurchMemberRoleTypes { Id = 1, Type = "Non-Member", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 2, Type = "Member", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 3, Type = "Deacon", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 4, Type = "Auditor", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 5, Type = "Secretary", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 6, Type = "Treasurer", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 7, Type = "Minister", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 8, Type = "Junior Church Leader", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ChurchMemberRoleTypes { Id = 9, Type = "District Officer", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed Districts
            modelBuilder.Entity<Districts>().HasData(
                new Districts { Id = 1, Name = "A", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 2, Name = "B", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 3, Name = "C", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 4, Name = "D", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 5, Name = "E", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 6, Name = "F", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 7, Name = "G", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 8, Name = "H", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 9, Name = "I", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 10, Name = "J", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 11, Name = "K", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 12, Name = "L", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed TrainingCertificateTypes
            modelBuilder.Entity<TrainingCertificateTypes>().HasData(
                new TrainingCertificateTypes { Id = 1, Type = "DBS", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new TrainingCertificateTypes { Id = 2, Type = "Safeguarding Level 2", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new TrainingCertificateTypes { Id = 3, Type = "Safeguarding Level 3", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new TrainingCertificateTypes { Id = 4, Type = "Food Hygiene", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new TrainingCertificateTypes { Id = 5, Type = "First Aid", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new TrainingCertificateTypes { Id = 6, Type = "Fire Marshal", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed Events with DayOfWeek associations
            // Note: DayOfWeek values: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
            modelBuilder.Entity<Events>().HasData(
                new Events { Id = 1, Name = "Sunday Morning Online", Description = "Online streaming of Sunday morning service", IsActive = true, ShowInAnalysis = true, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 2, Name = "Sunday Morning Service", Description = "Weekly Sunday morning worship service", IsActive = true, ShowInAnalysis = true, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 3, Name = "Junior Church", Description = "Children's service during main worship", IsActive = true, ShowInAnalysis = true, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 4, Name = "Coffee Corner", Description = "Sunday fellowship gathering", IsActive = true, ShowInAnalysis = true, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 5, Name = "Sunday Evening Service", Description = "Weekly Sunday evening worship service", IsActive = true, ShowInAnalysis = true, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 6, Name = "Sunday Evening Call", Description = "Evening prayer call service", IsActive = true, ShowInAnalysis = false, DayOfWeek = 0, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 7, Name = "Just A Thought", Description = "Midweek inspirational service", IsActive = true, ShowInAnalysis = true, DayOfWeek = 1, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 8, Name = "Men's Fellowship", Description = "Monthly men's fellowship meeting", IsActive = true, ShowInAnalysis = true, DayOfWeek = 1, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 9, Name = "Tuesday Morning Service", Description = "Tuesday morning prayer and worship", IsActive = true, ShowInAnalysis = true, DayOfWeek = 2, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 10, Name = "Bible Study", Description = "Midweek Bible study and prayer meeting", IsActive = true, ShowInAnalysis = true, DayOfWeek = 2, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 11, Name = "Open Door", Description = "Open door community service", IsActive = true, ShowInAnalysis = false, DayOfWeek = 3, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 12, Name = "Soup Station", Description = "Community outreach and meal service", IsActive = true, ShowInAnalysis = false, DayOfWeek = 3, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 13, Name = "Choir", Description = "Choir rehearsal and practice", IsActive = true, ShowInAnalysis = false, DayOfWeek = 4, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 14, Name = "Youth Meeting", Description = "Weekly youth fellowship and activities", IsActive = true, ShowInAnalysis = true, DayOfWeek = 5, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 15, Name = "Torch", Description = "Saturday evening service", IsActive = true, ShowInAnalysis = true, DayOfWeek = 6, CreatedBy = "system", CreatedDateTime = seedDateTime }
            );
            
            // Seed ReminderCategories
            modelBuilder.Entity<ReminderCategory>().HasData(
                new ReminderCategory { Id = 1, Name = "None", ColorHex = "#9e9e9e", IsSystemCategory = true, SortOrder = 1, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ReminderCategory { Id = 2, Name = "Health & Safety", ColorHex = "#f44336", IsSystemCategory = true, SortOrder = 2, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ReminderCategory { Id = 3, Name = "Financial", ColorHex = "#4caf50", IsSystemCategory = true, SortOrder = 3, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ReminderCategory { Id = 4, Name = "Risk Assessments", ColorHex = "#ff9800", IsSystemCategory = true, SortOrder = 4, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new ReminderCategory { Id = 5, Name = "Technical", ColorHex = "#2196f3", IsSystemCategory = true, SortOrder = 5, CreatedBy = "system", CreatedDateTime = seedDateTime }
            );
            
            // Seed RiskAssessmentCategories
            var riskAssessmentSeedDateTime = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<RiskAssessmentCategory>().HasData(
                new RiskAssessmentCategory 
                { 
                    Id = 1, 
                    Name = "Safeguarding", 
                    Description = "Working with Children, Adults at Risk, Volunteers, DBS, Respect for Others", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 2, 
                    Name = "Community Outreach & Services", 
                    Description = "Soup Station protocols, entry/behavioral policies, food safety", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 3, 
                    Name = "Health & Safety - General", 
                    Description = "Perimeter, lone working, slips/trips/falls, working at height, personal safety, hazardous items, baptistry, general H&S", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 4, 
                    Name = "Emergency Procedures", 
                    Description = "Fire safety/alarms, evacuation, first aid/accident reporting, terrorist attack", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 5, 
                    Name = "Financial Compliance", 
                    Description = "Financial regulations, banking, finance risk, examiners, conflict of interest", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 6, 
                    Name = "Data & Information Governance", 
                    Description = "Data protection, retention & archive", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 7, 
                    Name = "Governance & Administration", 
                    Description = "Trustees, officers, safe environment, CCTV, music licence, digital/social media", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                },
                new RiskAssessmentCategory 
                { 
                    Id = 8, 
                    Name = "Employment & HR", 
                    Description = "Grievance, disciplinary, capability, complaints", 
                    CreatedBy = "system", 
                    CreatedDateTime = riskAssessmentSeedDateTime 
                }
            );
            
            // Seed RiskAssessments (8 initial assessments, one per category)
            var assessmentSeedDate = new DateTime(2026, 2, 18, 0, 0, 0, DateTimeKind.Utc);
            var today = assessmentSeedDate.Date;
            modelBuilder.Entity<RiskAssessment>().HasData(
                new RiskAssessment 
                { 
                    Id = 1, 
                    CategoryId = 1, 
                    Title = "Safeguarding Risk Assessment", 
                    Description = "Comprehensive safeguarding controls", 
                    ReviewInterval = 1, 
                    NextReviewDate = today.AddDays(30), 
                    Status = "Approved", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 2, 
                    CategoryId = 2, 
                    Title = "Community Outreach & Services Risk Assessment", 
                    ReviewInterval = 2, 
                    NextReviewDate = today.AddDays(60), 
                    Status = "Approved", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 3, 
                    CategoryId = 3, 
                    Title = "Health & Safety - General Risk Assessment", 
                    ReviewInterval = 1, 
                    NextReviewDate = today.AddDays(90), 
                    Status = "Approved", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 4, 
                    CategoryId = 4, 
                    Title = "Emergency Procedures Risk Assessment", 
                    ReviewInterval = 1, 
                    NextReviewDate = today.AddDays(120), 
                    Status = "Under Review", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 5, 
                    CategoryId = 5, 
                    Title = "Financial Compliance Risk Assessment", 
                    ReviewInterval = 3, 
                    NextReviewDate = today.AddDays(150), 
                    Status = "Under Review", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 6, 
                    CategoryId = 6, 
                    Title = "Data & Information Governance Risk Assessment", 
                    ReviewInterval = 2, 
                    NextReviewDate = today.AddDays(180), 
                    Status = "Under Review", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 7, 
                    CategoryId = 7, 
                    Title = "Governance & Administration Risk Assessment", 
                    ReviewInterval = 5, 
                    NextReviewDate = today.AddDays(210), 
                    Status = "Under Review", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                },
                new RiskAssessment 
                { 
                    Id = 8, 
                    CategoryId = 8, 
                    Title = "Employment & HR Risk Assessment", 
                    ReviewInterval = 3, 
                    NextReviewDate = today.AddDays(240), 
                    Status = "Under Review", 
                    CreatedBy = "system", 
                    CreatedDateTime = assessmentSeedDate 
                }
            );
        }
    }
}