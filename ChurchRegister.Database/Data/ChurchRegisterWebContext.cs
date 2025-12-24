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
        public DbSet<ChurchMemberType> ChurchMemberTypes { get; set; }
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
            ConfigureSeedData(modelBuilder);
        }

        private void ConfigureChurchMember(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChurchMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.EmailAddress).HasMaxLength(100);
                entity.Property(e => e.BankReference).HasMaxLength(100);
                
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

                entity.HasOne(d => d.ChurchMemberType)
                    .WithMany(p => p.ChurchMembers)
                    .HasForeignKey(d => d.ChurchMemberTypeId)
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
                entity.HasOne(d => d.ChurchMember)
                    .WithMany(p => p.DataProtection)
                    .HasForeignKey(d => d.ChurchMemberId)
                    .OnDelete(DeleteBehavior.Cascade);
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
                new ChurchMemberRoleTypes { Id = 8, Type = "Junior Church Leader", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );

            // Seed Districts
            modelBuilder.Entity<Districts>().HasData(
                new Districts { Id = 1, Name = "A", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 2, Name = "B", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 3, Name = "C", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 4, Name = "D", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 5, Name = "E", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 6, Name = "F", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Districts { Id = 7, Name = "G", CreatedBy = "system", CreatedDateTime = seedDateTime }
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

            // Seed Events
            modelBuilder.Entity<Events>().HasData(
                new Events { Id = 1, Name = "Sunday Morning Service", Description = "Weekly Sunday morning worship service", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 2, Name = "Sunday Evening Service", Description = "Weekly Sunday evening worship service", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 3, Name = "Sunday Morning Online", Description = "Online streaming of Sunday morning service", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 4, Name = "Bible Study", Description = "Midweek Bible study and prayer meeting", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 5, Name = "Tuesday Morning Service", Description = "Tuesday morning prayer and worship", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 6, Name = "Junior Church", Description = "Children's service during main worship", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 7, Name = "Soup Station", Description = "Community outreach and meal service", IsActive = true, ShowInAnalysis = false, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 8, Name = "Youth Meeting", Description = "Weekly youth fellowship and activities", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 9, Name = "Choir", Description = "Choir rehearsal and practice", IsActive = true, ShowInAnalysis = false, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 10, Name = "Men's Fellowship", Description = "Monthly men's fellowship meeting", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 11, Name = "Just A Thought", Description = "Midweek inspirational service", IsActive = true, ShowInAnalysis = true, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 12, Name = "Sunday Evening Call", Description = "Evening prayer call service", IsActive = true, ShowInAnalysis = false, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 13, Name = "Open Door", Description = "Open door community service", IsActive = true, ShowInAnalysis = false, CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 14, Name = "Torch", CreatedBy = "system", CreatedDateTime = seedDateTime },
                new Events { Id = 15, Name = "Coffee Corner", CreatedBy = "system", CreatedDateTime = seedDateTime }
            );
        }
    }
}