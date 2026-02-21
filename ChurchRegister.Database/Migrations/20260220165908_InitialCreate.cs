using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Addresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AddressLineOne = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AddressLineTwo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Town = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    County = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Postcode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Addresses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DateJoined = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccountStatus = table.Column<int>(type: "int", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRoleTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRoleTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContributionTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContributionTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnvelopeContributionBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BatchDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EnvelopeCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Submitted"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnvelopeContributionBatches", x => x.Id);
                    table.CheckConstraint("CK_EnvelopeContributionBatch_EnvelopeCount", "EnvelopeCount > 0");
                    table.CheckConstraint("CK_EnvelopeContributionBatch_TotalAmount", "TotalAmount >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ShowInAnalysis = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DayOfWeek = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HSBCBankCreditTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MoneyIn = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IsProcessed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HSBCBankCreditTransactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    RevokedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    RevokedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    ReplacedByToken = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReminderCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    IsSystemCategory = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RiskAssessmentCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAssessmentCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrainingCertificateTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingCertificateTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Attendance = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventAttendances_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reminders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssignedToUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Priority = table.Column<bool>(type: "bit", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CompletionNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompletedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CategoryId = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reminders", x => x.Id);
                    table.CheckConstraint("CK_Reminders_Status", "[Status] IN ('Pending', 'Completed')");
                    table.ForeignKey(
                        name: "FK_Reminders_AspNetUsers_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reminders_ReminderCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ReminderCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RiskAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ReviewInterval = table.Column<int>(type: "int", nullable: false),
                    LastReviewDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NextReviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RiskAssessmentCategoryId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAssessments", x => x.Id);
                    table.CheckConstraint("CK_RiskAssessments_ReviewInterval", "[ReviewInterval] IN (1, 2, 3, 5)");
                    table.CheckConstraint("CK_RiskAssessments_Status", "[Status] IN ('Under Review', 'Approved')");
                    table.ForeignKey(
                        name: "FK_RiskAssessments_RiskAssessmentCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "RiskAssessmentCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RiskAssessments_RiskAssessmentCategories_RiskAssessmentCategoryId",
                        column: x => x.RiskAssessmentCategoryId,
                        principalTable: "RiskAssessmentCategories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberContributions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TransactionRef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ContributionTypeId = table.Column<int>(type: "int", nullable: false),
                    HSBCBankCreditTransactionId = table.Column<int>(type: "int", nullable: true),
                    EnvelopeContributionBatchId = table.Column<int>(type: "int", nullable: true),
                    Deleted = table.Column<bool>(type: "bit", nullable: false),
                    ManualContribution = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberContributions", x => x.Id);
                    table.CheckConstraint("CK_ChurchMemberContributions_Amount", "Amount >= 0");
                    table.ForeignKey(
                        name: "FK_ChurchMemberContributions_ContributionTypes_ContributionTypeId",
                        column: x => x.ContributionTypeId,
                        principalTable: "ContributionTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChurchMemberContributions_EnvelopeContributionBatches_EnvelopeContributionBatchId",
                        column: x => x.EnvelopeContributionBatchId,
                        principalTable: "EnvelopeContributionBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChurchMemberContributions_HSBCBankCreditTransactions_HSBCBankCreditTransactionId",
                        column: x => x.HSBCBankCreditTransactionId,
                        principalTable: "HSBCBankCreditTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberDataProtection",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    AllowNameInCommunications = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    AllowHealthStatusInCommunications = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    AllowPhotoInCommunications = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    AllowPhotoInSocialMedia = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    GroupPhotos = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PermissionForMyChildren = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberDataProtection", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRegisterNumbers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Number = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Year = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRegisterNumbers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    ChurchMemberRoleTypeId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberRoles_ChurchMemberRoleTypes_ChurchMemberRoleTypeId",
                        column: x => x.ChurchMemberRoleTypeId,
                        principalTable: "ChurchMemberRoleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BankReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AddressId = table.Column<int>(type: "int", nullable: true),
                    ChurchMemberStatusId = table.Column<int>(type: "int", nullable: true),
                    DistrictId = table.Column<int>(type: "int", nullable: true),
                    DataProtectionId = table.Column<int>(type: "int", nullable: true),
                    MemberSince = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Baptised = table.Column<bool>(type: "bit", nullable: false),
                    GiftAid = table.Column<bool>(type: "bit", nullable: false),
                    PastoralCareRequired = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_Addresses_AddressId",
                        column: x => x.AddressId,
                        principalTable: "Addresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_ChurchMemberDataProtection_DataProtectionId",
                        column: x => x.DataProtectionId,
                        principalTable: "ChurchMemberDataProtection",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChurchMembers_ChurchMemberStatuses_ChurchMemberStatusId",
                        column: x => x.ChurchMemberStatusId,
                        principalTable: "ChurchMemberStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberTrainingCertificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Expires = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrainingCertificateTypeId = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberTrainingCertificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberTrainingCertificates_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChurchMemberTrainingCertificates_TrainingCertificateTypes_TrainingCertificateTypeId",
                        column: x => x.TrainingCertificateTypeId,
                        principalTable: "TrainingCertificateTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Districts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DeaconId = table.Column<int>(type: "int", nullable: true),
                    DistrictOfficerId = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Districts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Districts_ChurchMembers_DeaconId",
                        column: x => x.DeaconId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Districts_ChurchMembers_DistrictOfficerId",
                        column: x => x.DistrictOfficerId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RiskAssessmentApprovals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RiskAssessmentId = table.Column<int>(type: "int", nullable: false),
                    ApprovedByChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    ApprovedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAssessmentApprovals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskAssessmentApprovals_ChurchMembers_ApprovedByChurchMemberId",
                        column: x => x.ApprovedByChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RiskAssessmentApprovals_RiskAssessments_RiskAssessmentId",
                        column: x => x.RiskAssessmentId,
                        principalTable: "RiskAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ChurchMemberRoleTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Non-Member" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Member" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Deacon" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Auditor" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Secretary" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Treasurer" },
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Minister" },
                    { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Junior Church Leader" },
                    { 9, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "District Officer" }
                });

            migrationBuilder.InsertData(
                table: "ChurchMemberStatuses",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Active" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Expired" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "In Glory" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "InActive" }
                });

            migrationBuilder.InsertData(
                table: "ContributionTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Cash" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Transfer" }
                });

            migrationBuilder.InsertData(
                table: "Districts",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DeaconId", "DistrictOfficerId", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "A" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "B" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "C" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "D" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "E" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "F" },
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "G" },
                    { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "H" },
                    { 9, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "I" },
                    { 10, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "J" },
                    { 11, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "K" },
                    { 12, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, "L" }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DayOfWeek", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Online streaming of Sunday morning service", true, null, null, "Sunday Morning Online", true },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Weekly Sunday morning worship service", true, null, null, "Sunday Morning Service", true },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Children's service during main worship", true, null, null, "Junior Church", true },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Sunday fellowship gathering", true, null, null, "Coffee Corner", true },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Weekly Sunday evening worship service", true, null, null, "Sunday Evening Service", true }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DayOfWeek", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[] { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, "Evening prayer call service", true, null, null, "Sunday Evening Call" });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DayOfWeek", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1, "Midweek inspirational service", true, null, null, "Just A Thought", true },
                    { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1, "Monthly men's fellowship meeting", true, null, null, "Men's Fellowship", true },
                    { 9, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "Tuesday morning prayer and worship", true, null, null, "Tuesday Morning Service", true },
                    { 10, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "Midweek Bible study and prayer meeting", true, null, null, "Bible Study", true }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DayOfWeek", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 11, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, "Open door community service", true, null, null, "Open Door" },
                    { 12, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, "Community outreach and meal service", true, null, null, "Soup Station" },
                    { 13, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 4, "Choir rehearsal and practice", true, null, null, "Choir" }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "DayOfWeek", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 14, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 5, "Weekly youth fellowship and activities", true, null, null, "Youth Meeting", true },
                    { 15, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 6, "Saturday evening service", true, null, null, "Torch", true }
                });

            migrationBuilder.InsertData(
                table: "ReminderCategories",
                columns: new[] { "Id", "ColorHex", "CreatedBy", "CreatedDateTime", "IsSystemCategory", "ModifiedBy", "ModifiedDateTime", "Name", "SortOrder" },
                values: new object[,]
                {
                    { 1, "#9e9e9e", "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, null, "None", 1 },
                    { 2, "#f44336", "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, null, "Health & Safety", 2 },
                    { 3, "#4caf50", "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, null, "Financial", 3 },
                    { 4, "#ff9800", "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, null, "Risk Assessments", 4 },
                    { 5, "#2196f3", "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, null, null, "Technical", 5 }
                });

            migrationBuilder.InsertData(
                table: "RiskAssessmentCategories",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Working with Children, Adults at Risk, Volunteers, DBS, Respect for Others", null, null, "Safeguarding" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Soup Station protocols, entry/behavioral policies, food safety", null, null, "Community Outreach & Services" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Perimeter, lone working, slips/trips/falls, working at height, personal safety, hazardous items, baptistry, general H&S", null, null, "Health & Safety - General" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fire safety/alarms, evacuation, first aid/accident reporting, terrorist attack", null, null, "Emergency Procedures" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Financial regulations, banking, finance risk, examiners, conflict of interest", null, null, "Financial Compliance" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Data protection, retention & archive", null, null, "Data & Information Governance" },
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Trustees, officers, safe environment, CCTV, music licence, digital/social media", null, null, "Governance & Administration" },
                    { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Grievance, disciplinary, capability, complaints", null, null, "Employment & HR" }
                });

            migrationBuilder.InsertData(
                table: "TrainingCertificateTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "ModifiedBy", "ModifiedDateTime", "Status", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "DBS" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "Safeguarding Level 2" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "Safeguarding Level 3" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "Food Hygiene" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "First Aid" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Active", "Fire Marshal" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_ChurchMemberId",
                table: "ChurchMemberContributions",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_ContributionTypeId",
                table: "ChurchMemberContributions",
                column: "ContributionTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_Date",
                table: "ChurchMemberContributions",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_EnvelopeContributionBatchId",
                table: "ChurchMemberContributions",
                column: "EnvelopeContributionBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId_Unique",
                table: "ChurchMemberContributions",
                column: "HSBCBankCreditTransactionId",
                unique: true,
                filter: "[HSBCBankCreditTransactionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberDataProtection_ChurchMemberId",
                table: "ChurchMemberDataProtection",
                column: "ChurchMemberId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_ChurchMemberId",
                table: "ChurchMemberRegisterNumbers",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year",
                table: "ChurchMemberRegisterNumbers",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year_Number",
                table: "ChurchMemberRegisterNumbers",
                columns: new[] { "Year", "Number" });

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRoles_ChurchMemberId",
                table: "ChurchMemberRoles",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRoles_ChurchMemberRoleTypeId",
                table: "ChurchMemberRoles",
                column: "ChurchMemberRoleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_AddressId",
                table: "ChurchMembers",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_BankReference_Unique",
                table: "ChurchMembers",
                column: "BankReference",
                unique: true,
                filter: "[BankReference] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_ChurchMemberStatusId",
                table: "ChurchMembers",
                column: "ChurchMemberStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_DataProtectionId",
                table: "ChurchMembers",
                column: "DataProtectionId",
                unique: true,
                filter: "[DataProtectionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_DistrictId",
                table: "ChurchMembers",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberTrainingCertificates_ChurchMemberId",
                table: "ChurchMemberTrainingCertificates",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberTrainingCertificates_TrainingCertificateTypeId",
                table: "ChurchMemberTrainingCertificates",
                column: "TrainingCertificateTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_DeaconId",
                table: "Districts",
                column: "DeaconId");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_DistrictOfficerId",
                table: "Districts",
                column: "DistrictOfficerId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvelopeContributionBatch_BatchDate_Unique",
                table: "EnvelopeContributionBatches",
                column: "BatchDate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendance_EventId_Date",
                table: "EventAttendances",
                columns: new[] { "EventId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HSBCBankCreditTransactions_IsProcessed",
                table: "HSBCBankCreditTransactions",
                column: "IsProcessed");

            migrationBuilder.CreateIndex(
                name: "IX_HSBCBankCreditTransactions_Reference",
                table: "HSBCBankCreditTransactions",
                column: "Reference");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderCategories_Name_Unique",
                table: "ReminderCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReminderCategories_SortOrder",
                table: "ReminderCategories",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_AssignedToUserId",
                table: "Reminders",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_CategoryId",
                table: "Reminders",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_DueDate",
                table: "Reminders",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_Status",
                table: "Reminders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_Status_DueDate",
                table: "Reminders",
                columns: new[] { "Status", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessmentApprovals_ApprovedByChurchMemberId",
                table: "RiskAssessmentApprovals",
                column: "ApprovedByChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessmentApprovals_RiskAssessmentId_ApprovedByChurchMemberId_Unique",
                table: "RiskAssessmentApprovals",
                columns: new[] { "RiskAssessmentId", "ApprovedByChurchMemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessmentCategories_Name_Unique",
                table: "RiskAssessmentCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_CategoryId",
                table: "RiskAssessments",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_NextReviewDate",
                table: "RiskAssessments",
                column: "NextReviewDate");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_RiskAssessmentCategoryId",
                table: "RiskAssessments",
                column: "RiskAssessmentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_Status",
                table: "RiskAssessments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_Status_NextReviewDate",
                table: "RiskAssessments",
                columns: new[] { "Status", "NextReviewDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberContributions",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberDataProtection_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberDataProtection",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberRegisterNumbers_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberRegisterNumbers",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberRoles_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberRoles",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMembers_Districts_DistrictId",
                table: "ChurchMembers",
                column: "DistrictId",
                principalTable: "Districts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchMemberDataProtection_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberDataProtection");

            migrationBuilder.DropForeignKey(
                name: "FK_Districts_ChurchMembers_DeaconId",
                table: "Districts");

            migrationBuilder.DropForeignKey(
                name: "FK_Districts_ChurchMembers_DistrictOfficerId",
                table: "Districts");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "ChurchMemberContributions");

            migrationBuilder.DropTable(
                name: "ChurchMemberRegisterNumbers");

            migrationBuilder.DropTable(
                name: "ChurchMemberRoles");

            migrationBuilder.DropTable(
                name: "ChurchMemberTrainingCertificates");

            migrationBuilder.DropTable(
                name: "EventAttendances");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Reminders");

            migrationBuilder.DropTable(
                name: "RiskAssessmentApprovals");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "ContributionTypes");

            migrationBuilder.DropTable(
                name: "EnvelopeContributionBatches");

            migrationBuilder.DropTable(
                name: "HSBCBankCreditTransactions");

            migrationBuilder.DropTable(
                name: "ChurchMemberRoleTypes");

            migrationBuilder.DropTable(
                name: "TrainingCertificateTypes");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "ReminderCategories");

            migrationBuilder.DropTable(
                name: "RiskAssessments");

            migrationBuilder.DropTable(
                name: "RiskAssessmentCategories");

            migrationBuilder.DropTable(
                name: "ChurchMembers");

            migrationBuilder.DropTable(
                name: "Addresses");

            migrationBuilder.DropTable(
                name: "ChurchMemberDataProtection");

            migrationBuilder.DropTable(
                name: "ChurchMemberStatuses");

            migrationBuilder.DropTable(
                name: "Districts");
        }
    }
}
